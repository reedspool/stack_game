/*- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -~- -*/
/*
/* Driver
/*
/* Bind all the different parts of the game together
/*
/* Author: [Reed](https://github.com/reedspool)
/*
/*- -~- -*/
GAME = (function () { 

  function guiEvent(type, stuff) { 
    GAME_GUI.animationBus.push({
      type: type,
      state: GAME_STATE.state()
    })
  }

  function setupLevel(level) {
    level = level || 1;

    GAME_STATE.setupLevel(level);

    guiEvent('levelSetup')
  }

  function act(action) {
    switch(action.value) {
      case 'right':
      case 'left':
        _movePlayer(action)
        guiEvent('playerMove')
        break;
      case 'read':
        _read(action)
        guiEvent('playerRead')
        break;
      case 'write':
        _write(action)
        guiEvent('playerWrite')
        break;
      default:
        throw new Error('Tried to act, couldn\'t', action)
    }

    GAME_STATE.incrementMoves();

    if (GAME_STATE.checkWinCondition()) {
      GAME_STATE.setConditionSatisfied(true);
      guiEvent('levelWon')
    }
  }

  function _movePlayer(action) {
    GAME_STATE.movePlayerInDirection(action.value)
  }

  function _read(action) {
    GAME_STATE.setCurrentPlayerValue(GAME_STATE.getCurrentRoomValue());
  }

  function _write(action) {
    GAME_STATE.setCurrentRoomValue(GAME_STATE.currentPlayerValue());
  }

  return {
    setupLevel: setupLevel,
    act: act
  }
})();