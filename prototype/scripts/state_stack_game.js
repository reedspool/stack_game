GAME_STATE = (function () {

  var _globalState = null;

  /* Begin Stuff that should really be in a separate data/config file */

  var PLAYER_MOTION = {
    left: -1,
    right: 1
  };

  var LEVELS = {
    1: {
      rooms: {
        1: {
          value: CONFIG.COLORS.blank
        },
        2: {
          value: CONFIG.COLORS.blank
        },
        3: {
          value: CONFIG.COLORS.primary
        }
      },
      player: {
        room: 1,
        value: CONFIG.COLORS.player
      },

      // TODO: It's bad that condition is a function,
      // and worse that it uses private functions from this file
      // 
      condition: function (state) { 
        return _getRoomValue(1) == CONFIG.COLORS.primary;
              _getRoomValue(3) == CONFIG.COLORS.blank
      }
    }
  };

  // Brainstorming what levels would look like if built entirely thru concatenative language
  /* 
  var LEVELS_CODE = '
    [ # rooms
      /config/colors/primary 
      /config/colors/blank
      /config/colors/blank
    ]
    [ # player
      1
      /config/colors/player
    ] 
    [ # condition
      room1 /config/colors/primary eq?
      room3 /config/colors/blank eq?
      and
    ]
  '

  // Exploring levels with up and down. Tree?
  var LEVELS_WITH_SECOND_DIMENSION = {
    1: {
      1: {
        // Level above register is leaf of tree,
        // Interface?
        1: {
          registers: {
            1: CONFIG.COLORS.blank,
            2: CONFIG.COLORS.primary,
            3: CONFIG.COLORS.blank
          },
          initial: {
            register: 1,
            value: CONFIG.COLORS.player
          }
        }
      }
    }
  }

  */

  /* End Stuff that should really be in a separate data/config file */

  // Queries
  function _checkWinCondition() { return _globalState.condition(_state()); }
  function _getCurrentRoomValue () { return _getRoomValue(_currentPlayerRoom()); }
  function _currentPlayerValue () { return _globalState.player.value; }
  function _currentPlayerRoom() { return _globalState.player.room; }
  function _getRoomValue(room) { return _globalState.rooms[room].value; }
  function _state() { return UTIL.deepCopy(_globalState) }

  // Side effects
  function _blankCurrentRoomValue() { _setCurrentRoomValue(BLANK_VALUE) }
  function _blankPlayerValue() { _setCurrentPlayerValue(BLANK_VALUE) }
  function _setCurrentPlayerRoom(a) { _globalState.player.room = a; }
  function _setCurrentPlayerValue (a) { _globalState.player.value = a; }
  function _setCurrentRoomValue (a) { _setRoomValue(_currentPlayerRoom(), a); }
  function _setRoomValue(room, a) { _globalState.rooms[room].value = a; }
  function _setConditionSatisfied(satisfied) { _globalState.conditionSatisfied = satisfied}
  function _incrementMoves() { _globalState.moves++; }
  function _movePlayerInDirection (direction) {
    var motion = PLAYER_MOTION[direction];

    var newRoom = GAME_STATE.currentPlayerRoom() + motion;

    GAME_STATE.setCurrentPlayerRoom(newRoom)
  }
  function _setupLevel(level) {
    var original = LEVELS[level];

    var initial = {
      // Deep copy to protect original by stringifying and parsing
      // Will be unnecessary when level is from JSON
      rooms: UTIL.deepCopy(original.rooms),
      player: UTIL.deepCopy(original.player),

      // Can't Deep Copy because this is a function. Hmmm.
      condition: original.condition,

      // Additional information not included in template
      level: level,
      moves: 0,
      conditionSatisfied: false
    };

    _globalState = initial;
  }

  return {
    state: _state,
    setupLevel: _setupLevel,
    movePlayerInDirection: _movePlayerInDirection,
    checkWinCondition: _checkWinCondition,
    getCurrentRoomValue: _getCurrentRoomValue,
    currentPlayerValue: _currentPlayerValue,
    currentPlayerRoom: _currentPlayerRoom,
    getRoomValue: _getRoomValue,
    blankCurrentRoomValue: _blankCurrentRoomValue,
    blankPlayerValue: _blankPlayerValue,
    setCurrentPlayerRoom: _setCurrentPlayerRoom,
    setCurrentPlayerValue: _setCurrentPlayerValue,
    setCurrentRoomValue: _setCurrentRoomValue,
    setRoomValue: _setRoomValue,
    setConditionSatisfied: _setConditionSatisfied,
    incrementMoves: _incrementMoves,
  };
})()