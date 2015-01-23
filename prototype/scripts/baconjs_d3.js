/*- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -*/
/*
/* Playing with BaconJS and D3 by making/animating a Stack based Concatenative Language
/* 
/*
/* Author: [Reed](https://github.com/reedspool)
/*
/*- -~- -*/
$(function () {
  // Rev up the GUI
  GUI.setup();

  // BAD: Buried Side effects
  // Need a "switch"? No... we actually need to listen to two sides of this
  // Maybe two different .match()'s
  function readAndClearTextInput(matchEntered) {

    var enteredValue = matchEntered[1] || '';
    var leftOverValue = matchEntered[3] || '';

    // and clear only those values out at same time
    GUI.resetInputValue(leftOverValue);

    return enteredValue;
  }

  // Read only values followed by spaces, capture the rest to put back
  var matchInput = /^((\S*\s+)+)*(\S*)$/;

  // Warning: Global vars for testing bacon
  words = GUI.textFieldValueStream()
                    .debounce(500)
                    .map(function (d) { return d.match(matchInput); })
                    // BAD: Buried Side effects
                    .map(readAndClearTextInput)
                    .map(function (d, i) { return d.split(/\s+/); })
                    .flatMap(Bacon.fromArray)
                    // No empty strings allowed
                    .filter(function (d) { return d; } )

  LANG.wordBus.plug(words);

  // Map each execution into the stack at that time 
  stackAtTimeOfExecution = LANG.executions
      .map(LANG.currentStack)

  stack = stackAtTimeOfExecution.flatMapLatest(Bacon.fromArray)
            .map('.value')

  stackAtTimeOfExecution.onValue(GUI.clearStackOutput);
  stack.onValue(GUI.printToken)
  words.onValue(GUI.printWord)

});

