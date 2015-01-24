LANG = (function () { 
  var executionsBus = new Bacon.Bus;
  var tokenizeBus = new Bacon.Bus;
  var wordBus = new Bacon.Bus;

  var words = wordBus.map(newWord);
  var tokens = tokenizeBus.map(tokenize);
  var lastTokenId = 0;
  var lastWordId = 0;
  var executions = executionsBus.map(executeWord);
  
  tokenizeBus.plug(words);
  executionsBus.plug(tokens);

  parseAnimationStream = tokens.map(function (d, i) { 
    return {
      type: 'parseWord',
      token: d   
    };
  });

  GUI.animationBus.plug(parseAnimationStream)


  var stack = (function (d, i) { 
    var _stack = [];


    return {
      push: [].push.bind(_stack),
      pop: [].pop.bind(_stack),
      // TODO: Make deeper copies of tokens instead of passing the actual stack
      // Only copying array container right now
      currentStack: _stack.slice.bind(_stack)
    }
  }());

  function newWord(input) {
    return {
      value: input,
      id: ++lastWordId,

      // Quack like a duck, for visual inspection only    
      __word: true
    }
  }

  function executeWord(t) { 
    if (t.type == 'number') {
      executeValue(t);
    } else if (t.type == 'operator') {
      executeOperator(t);
    } else if (t.type == 'action') {
      executeAction(t);
    }

    return t;
  }

  function executeValue(t) {
    stack.push(t)

    GUI.animationBus.push({
      type: 'pushValue',
      token: t
    })
  }

  function executeOperator(t) {
    // Take operatands off of stack.
    var a = stack.pop();
    var b = stack.pop();
    var result;

    // Binary operator implementations
    switch(t.value) {
    case '+':
     result = a.value + b.value;
     break;
    case '-':
     result = a.value - b.value;
     break;
    case '*':
     result = a.value * b.value;
     break;
    case '/':
     result = a.value / b.value;
     break;
    }

    if ( ! result ) throw new Error('meow')

    var resultToken = tokenize(newWord(result + ''));

    GUI.animationBus.push({
      type: 'executeOperator',
      token: t,
      operands: [a, b],
      result: resultToken
    })

    // Finally push new value back on stack;
    stack.push(resultToken);
  }

  function executeAction(token) {
    GAME.act(token);
  }

// Break this into more streams -> then it will be easy to read off animations from each stream
// 
// "You could have invented it yourself" http://stackoverflow.com/questions/1028250/what-is-functional-reactive-programming
  function tokenize(word) {
    // First match group is operators, second match group is values. Reserving a lot more than I'm implementing. See execute()
    // For game, reserving game tokens
    var reTokens = /(\+|\-|\/|\*|\x|\^)|(\d+(.\d*)?(e\d*)?)|(right|left|read|write)/i;
    
    var matchTokens = word.value.match(reTokens);
    
    var token = {
      type: 'BLANK_TOKEN_TYPE',
      value: 'BLANK_TOKEN_VALUE',
      id: ++lastTokenId,
      word: word,

      // Quack like a duck, for visual inspection only    
      __token: true
    }

    // Do nothing with words we don't understand
    if ( ! matchTokens ) return token;
    
    var operator = matchTokens[1];
    var number = matchTokens[2];
    var action = matchTokens[5];
    
    if (operator) {
      token.type = 'operator';
      token.value = operator;
    } else if (number) {
      token.type = 'number';
      token.value = parseFloat(number, 10);
    } else if (action) {
      token.type = 'action';
      token.value = action;
    }
    
    return token;
  }

  return {
    executions: executions,
    wordBus: wordBus,
    executionsBus: executionsBus,
    executeWord: executeWord,
    currentStack: stack.currentStack
  }

})()