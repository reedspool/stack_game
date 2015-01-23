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

  GAME_GUI.setup();

  // Rev up the Game
  GAME.setupLevel();


  function readInput(matchEntered) {

    var enteredValue = matchEntered[1] || '';

    return enteredValue;
  }

  function clearInput(matchEntered) {

    var leftOverValue = matchEntered[3] || '';

    // and clear only those values out at same time
    GUI.resetInputValue(leftOverValue);
  }

  // Read only values followed by spaces, capture the rest to put back
  var matchInput = /^((\S*\s+)+)*(\S*)$/;

  var wordsFromGame = GAME_GUI.wordsFromGame()

  var inputStream = GUI.textFieldValueStream()
                    .debounce(500)
                    .map(function (d) { return d.match(matchInput); })

  var words = inputStream
                    .map(readInput)
                    .map(function (d, i) { return d.split(/\s+/); })
                    .flatMap(Bacon.fromArray)
                    // No empty strings allowed
                    .filter(function (d) { return d; } )

  LANG.wordBus.plug(words);
  LANG.wordBus.plug(wordsFromGame)

  // Map each execution into the stack at that time 
  stackAtTimeOfExecution = LANG.executions
      .map(LANG.currentStack);

  stack = stackAtTimeOfExecution.flatMap(Bacon.fromArray)
            .map('.value');

  // Side effects
  stackAtTimeOfExecution.onValue(GUI.clearStackOutput);
  stack.onValue(GUI.printToken)
  words.onValue(GUI.printWord)
  wordsFromGame.onValue(GUI.printWord)
  // Clear the used up words. Alright, this should definitely be in GUI code now
  inputStream.onValue(clearInput)

});

