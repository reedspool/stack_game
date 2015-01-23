GAME = (function () { 
  var _currentState = null;
  /* Begin Stuff that should really be in a separate data/config file */
  
  var BLANK_VALUE = 'BLANK'

  var PLAYER_MOTION = {
    left: -1,
    right: 1
  };

  var LEVELS = {
    1: {
      rooms: {
        1: {
          value: BLANK_VALUE
        },
        2: {
          value: BLANK_VALUE
        },
        3: {
          value: '#b150ec'
        }
      },
      player: {
        room: 1
      },
      condition: function (state) { 
        return state.rooms[1].value == '#b150ec'
              && state.rooms[3].value == BLANK_VALUE
      },
      conditionSatisfied: false
    }
  };

  /* End Stuff that should really be in a separate data/config file */

  // Queries
  function _checkWinCondition() { return _currentState.condition(state()); }
  function _getCurrentRoomValue () { return _getRoomValue(_currentPlayerRoom()); }
  function _currentPlayerValue () { return _currentState.player.value; }
  function _currentPlayerRoom() { return _currentState.player.room; }
  function _getRoomValue(room) { return _currentState.rooms[room].value; }

  // Side effects
  function _blankCurrentRoomValue() { _setCurrentRoomValue(BLANK_VALUE) }
  function _blankPlayerValue() { _setCurrentPlayerValue(BLANK_VALUE) }
  function _setCurrentPlayerRoom(a) { _currentState.player.room = a; }
  function _setCurrentPlayerValue (a) { _currentState.player.value = a; }
  function _setCurrentRoomValue (a) { _setRoomValue(_currentPlayerRoom(), a); }
  function _setRoomValue(room, a) { _currentState.rooms[room].value = a; }
  function _setConditionSatisfied(satisfied) { _currentState.conditionSatisfied = satisfied}
  function _incrementMoves() { _currentState.moves++; }

  function setupLevel(level) {
    level = level || 1;

    var original = LEVELS[level];

    // Deep copy to protect original by stringifying and parsing
    // Will be unnecessary when level is from JSON
    var initial = {
      rooms: _deepCopy(original.rooms),
      player: _deepCopy(original.player),
      conditionSatisfied: original.conditionSatisfied,
      condition: original.condition,

      // Additional information not included in template
      level: level,
      moves: 0,

      // Debugging:
      original: original
    };

    _currentState = initial;

    // Finally, use the setup state to read everything;
    GAME_GUI.animationBus.push({
      type: 'levelSetup',
      state: state(),
      value: _getCurrentRoomValue(),
      room: _currentPlayerRoom()
    });
  }

  function act(action) {
    switch(action.value) {
      case 'right':
      case 'left':
        _movePlayer(action)
        break;
      case 'read':
        _read(action)
        break;
      case 'write':
        _write(action)
        break;
      default:
        throw new Error('Tried to act, couldn\'t', action)
    }

    _incrementMoves();
    _setConditionSatisfied(_checkWinCondition());
  }

  function _movePlayer(action) {
    var motion = PLAYER_MOTION[action.value];

    var newRoom = _currentPlayerRoom() + motion;

    GAME_GUI.animationBus.push({
      type: 'playerMove',
      room: newRoom
    })

    _setCurrentPlayerRoom(newRoom)
  }

  function _read(action) {
    GAME_GUI.animationBus.push({
      type: 'playerRead',
      value: _getCurrentRoomValue(),
      state: state(),
      room: _currentPlayerRoom()
    });

    _setCurrentPlayerValue(_getCurrentRoomValue());
    _blankCurrentRoomValue();
  }

  function _write(action) {
    GAME_GUI.animationBus.push({
      type: 'playerWrite',
      state: state(),
      value: _currentPlayerValue(),
      room: _currentPlayerRoom()
    })

    _setCurrentRoomValue(_currentPlayerValue());
    _blankPlayerValue();
  }

  function state() {
    return _deepCopy(_currentState);
  }

  function _deepCopy(o) {
    return JSON.parse(JSON.stringify(o))
  }

  return {
    setupLevel: setupLevel,
    act: act,
    state: state
  }
})();