GUI = (function () {
  var $input;
  var $output;
  var $stackOutput;
  var textFieldValue;
  var svg;
  var width = 590;
  var height = 303;
  
  var animationBus = new Bacon.Bus;

  var durationWordExecution = 700;
  var numFrames = 12;
  var durationFrame = durationWordExecution / numFrames;

  var stackValueTokens = [];
  var yStack = d3.scale.linear()
                .domain([0, stackValueTokens.length])
                .range([15, 250])
  var xStack = 150

  animationBus.log();

  var utility = {
    randInt: function (max) { return ~~(Math.random() * max); },
  }

  sprites = (function() {
    var _sprites = {};
    var _wordBeginTimes = {};

    var lastSpriteId = 0;
    var endLastWordAnimation = 0;

    function add(d, sprite) {
      _sprites[d] = sprite;

      sprite.__id = ++lastSpriteId;

      sprite.selection = d3.select(sprite.element)

      return sprite;
    };
    
    function get(d) { return _sprites[d]; };
    function tokenId(d) { return 'token-' + d.id; }
    function wordId(d) { return 'word-' + d.id; }
    function makeToken(token) { 
      var selection = svg.append('text')
                    .datum(token)
                    .attr({
                      x: -50,
                      y: -50,
                      fill: 'rgb(0,0,0)'
                    })
                    .text(token.value);

      // wordBeginTime is same format as Date.now(), millis since epoch
      var wordBeginTime = _wordBeginTimes[wordId(token.word)];

      if ( ! wordBeginTime ) {
        // Figure out the time to begin this word.

        // This shit just went DOWN homie
        var time = Date.now();

        // Factor in: When last word thingy is scheduled
        //    the time this came in
        //    if the last word thingy was scheduled before, this is easy, it's now

        wordBeginTime = endLastWordAnimation > time
                        ? endLastWordAnimation + durationWordExecution
                        : time;

        endLastWordAnimation = Math.max(wordBeginTime + durationWordExecution, endLastWordAnimation);

        _wordBeginTimes[wordId(token.word)] = wordBeginTime;
      } 

      var tokenSprite = {
        element: selection.node(),

        transition: selection.transition(),

        delayToFrame: function (frame, word) {
          var paramWordBeginTime = word && _wordBeginTimes[wordId(word)];
          var time = paramWordBeginTime || wordBeginTime;
          var frameBeginning = time + (durationFrame * frame);
          var now = Date.now();

          return Math.max(frameBeginning - now, 0);
        },
        frameDurations: function (frames) {
          return durationFrame * frames;
        }

        // Delete if no errors arise immediately
        // id: tokenId(token)
      }

      return add(tokenId(token), tokenSprite); 
    }
    function getToken(d, i) { return get(tokenId(d)); }

    return {
      add: add,
      makeToken: makeToken,
      get: get,
      getToken: getToken,

      // Testing
      _sprites: _sprites
    }
  })()

  function setup() {
    $input = $('.input');
    $output = $('.output');
    $stackOutput = $('.stackOutput');

    svg = d3.select('#playground')
            .attr('height', height)
            .attr('width', width)

    textFieldValue = Bacon.UI.textFieldValue($input)
  }

  animationBus.filter(function (d, i) {
      return d.type == 'parseWord';
    })
    .onValue(function (d) { 
      var sprite = sprites.makeToken(d.token)

      var delay = sprite.delayToFrame(0);
      var duration = sprite.frameDurations(1);

      sprite.selection
          .attr({
            x: -50,
            y: 50,
            fill: 'rgb(34, 222, 86)'
          })
          .transition()
          .delay(delay)
          .duration(duration)
            .attr({
              x: 350,
              y: 250
            })
            .attr('fill', function (d, i) { 
              return d.type == 'operator'
                      ? 'rgb(34, 222, 86)'
                      : 'rgb(222, 34, 86)'; });
    })


  function pushValueToken(token, word) {
    stackValueTokens.unshift(token);
    var sprite = sprites.getToken(token);

    updateStack(word)
      
  }

  function updateStack(word) {

    yStack.domain([0, stackValueTokens.length])

    stackValueTokens.forEach(function (token, i) {
      var sprite = sprites.getToken(token)
      var delay = sprite.delayToFrame(4, word);
      var duration = sprite.frameDurations(3); 

      sprite.selection
        .transition()
        .delay(delay)
        .duration(duration)
          .attr('x', xStack)
          .attr('y', yStack(i))
    })
  }

  function popValueToken(token, word) {
    var pop = stackValueTokens.shift();
    if (pop !== token) throw new Error('GUI Stack did not match program stack')
    updateStack(word);
  }

  animationBus.filter(function (d, i) {
      return d.type == 'pushValue';
    })
    .onValue(function (d) { pushValueToken(d.token) })

  animationBus.filter(function (d, i) {
      return d.type == 'executeOperator';
    })
    .onValue(function (d) { 
      var operatorSprite = sprites.getToken(d.token);
      var aOperand = d.operands[0];
      var aSprite = sprites.getToken(aOperand);
      var bOperand = d.operands[1];
      var bSprite = sprites.getToken(bOperand);

      var operatorDelay = operatorSprite.delayToFrame(0);
      var operatorDuration = operatorSprite.frameDurations(4);

      var aDelay = aSprite.delayToFrame(6, d.token.word);
      var aDuration = aSprite.frameDurations(1);

      var bDelay = bSprite.delayToFrame(6, d.token.word);
      var bDuration = bSprite.frameDurations(1);

      // Binary operator implementations
      switch(d.token.value) {
      case '+':
      case '-':
      case '*':
      case '/':

        operatorSprite.selection
            .transition()
            .delay(operatorDelay)
            .duration(operatorDuration)
              .attr('x', 250)
              .attr('y', 250)

        trashToken(d.token)

        // This should probably be another sprite
        var line = svg.selectAll('.line').data([1])
        
        line.enter()
          .append('rect')
            .attr('class', 'line')            
            .attr({
              x: 220,
              y: 270,
              width: 200,
              height: 8,
              fill: 'rgba(35,255,35, 0)'
            })
        line.transition()
              .delay(operatorDelay)
              .duration(operatorDuration)
                .attr( 'fill', 'rgba(35,255,35, 1)')
                .transition()
                  .duration(durationFrame)
                    .attr( 'fill', 'rgba(35,255,35, 0)')

        aSprite.selection
          .transition()
          .delay(aDelay)
          .duration(aDuration)
            .attr({
              x: 270,
              y: 250
            })

        popValueToken(aOperand, d.token.word)
        trashToken(aOperand, d.token.word)

        bSprite.selection
          .transition()
          .delay(bDelay)
          .duration(bDuration)
            .attr({
              x: 270,
              y: 230
            })


        popValueToken(bOperand, d.token.word)
        trashToken(bOperand, d.token.word)
                
        break;
      }

      if (d.result) {
        if(d.result.value == '+') debugger; /* TESTING - Delete me */
        // TODO: This sucks...
    
        var sprite = sprites.makeToken(d.result);
        var resultAppear = sprite.delayToFrame(8, d.token.word);

        sprite.selection
            .attr({
              x: 270,
              y: 295,
              fill: 'rgba(222, 34, 86, 0)'
            })
            .transition()
            .ease('bounce')
            .delay(sprite.delayToFrame(0, d.token.word))
            .duration(sprite.frameDurations(7))
            .attr('fill', 'rgba(222, 34, 86, 1)')
            
    
        d3.timer(function () {
          pushValueToken(d.result, d.token.word)

          // Don't fire timer again
          return true;
        }, resultAppear)        
      }
    });

function trashToken(token, word) { 
    var sprite = sprites.getToken(token);

    var delay = sprite.delayToFrame(12, word);
    var duration = sprite.frameDurations(1);

    sprite
      .selection
      .transition()
      .delay(delay)
      .duration(duration)
        .attr({
          x: 500,
          y: 600
        })
  }

  animationBus.filter(function (d, i) {
      return d.type == 'trashToken';
    })
    .onValue(function (d) { trashToken(d.token); });

  function textFieldValueStream() {
    return textFieldValue;
  }

  function resetInputValue(value) {
    $input.val(value);
  }

  function clearStackOutput() {
    $stackOutput.empty()
  }

  function printWord(d) {
    $output.append(makeWordjQuery(d))
  }

  function printToken(d) {
    $stackOutput.prepend(makeTokenjQuery(d))
                    .prepend($('<br>'))
  }

  function makeTokenjQuery(text) { 
    return $('<a href=""></a>').text(text)
  }

  function makeWordjQuery(text) {
    return $('<strong></strong>').text(text)
              .append(' ');
  }

  return {
    setup: setup,
    resetInputValue: resetInputValue,
    animationBus: animationBus,
    printToken: printToken,
    printWord: printWord,
    textFieldValueStream: textFieldValueStream,
    clearStackOutput: clearStackOutput
  }
})()

