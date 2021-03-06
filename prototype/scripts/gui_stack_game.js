GAME_GUI = (function () {
  var selectSvg = '#viewport';
  var svg;
  var selectPlayer = '.S-player';
  var player;
  var selectRooms = '.S-room';
  var rooms;
  var width = 600;
  var height = 400;

  var duration = 350;
  var delay = 0;


  var X_ROOMS = [50,200,350];
  var BLANK_FILL = 'white';
  
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

  var sprites = (function() {
    var _sprites = {};

    var lastSpriteId = 0;

    function add(d, sprite) {
      _sprites[d] = sprite;

      sprite.__id = ++lastSpriteId;

      sprite.selection = d3.select(sprite.element)

      return sprite;
    };
    
    function get(d) { return _sprites[d]; };
    function tokenId(d) { return 'token-' + d.id; }
    function wordId(d) { return 'word-' + d.id; }
    // Maybe time for a factory?
    function makePlayer(player) {
      return add('player', {

      })
    }
    function getPlayer() {
      return get('player');
    }

    return {
      add: add,
      makePlayer: makePlayer,
      get: get,
      getPlayer: getPlayer,

      // Testing
      _sprites: _sprites
    }
  })()

  function setup() {
    svg = d3.select(selectSvg)
            .attr('height', height)
            .attr('width', width)

    player = d3.select(selectPlayer)
    sprites.makePlayer();


    rooms = svg.selectAll(selectRooms);

  }

  function wordsFromGame() {
    return $(document).asEventStream('keyup')
          .map('.keyCode')
          .map(function (code) {
            switch(code) {
              case 37: // LEFT
                return 'left'
              case 39: // RIGHT
                return 'right'
              case 90: // Z
                return 'read'
              case 88: // X
                return 'write'
              default:
                return '';
            }
          })
          .filter(function (d) { 
            return d;
          })
  }

  function register(what) {
    return animationBus.filter(function (d) { return d.type == what; })
  }

  function colorFromValue(value) {
    return  value == 'BLANK' ? BLANK_FILL : value;
  }

  register('levelSetup')
    .onValue(function (evt) { 
      var state = evt.state;

      // Flare
      rooms.transition()
        .duration(500)
          .select('rect')
        .attr('stroke-width', 10)
        .attr('fill', function (d, i) { 
          var value = state.rooms[i + 1].value;

          return colorFromValue(value);
        })
          .transition()
            .duration(500)
            .attr('stroke-width', 0)
            
    })

  register('playerRead')
    .onValue(function (evt) {
      var state = evt.state;
      var room = state.player.room;
      var value = state.player.value;

      rooms
        .transition()
        .delay(delay)
        .duration(duration)
          .select('rect')
          .attr('fill', function (d, i) { 
            return colorFromValue(state.rooms[i + 1].value);
          })

      player
        .transition()
        .delay(delay)
        .duration(duration)
          .select('rect')
          .attr('stroke', value)
    })

  register('playerWrite')
    .onValue(function (evt) {
      var state = evt.state;
      var room = state.player.room;

      rooms
        .transition()
        .delay(delay)
          .duration(duration)
          .select('rect')
          .attr('fill', function (d, i) { 
            return colorFromValue(state.rooms[i + 1].value);
          })
    })


  register('playerMove')
    .onValue(function (evt) {
      var state = evt.state;
      var room = state.player.room

      player
        .transition()
        .delay(delay)
        .duration(duration)
          .select('rect')
          .attr('x', X_ROOMS[room - 1])
    })

  return {
    setup: setup,
    animationBus: animationBus,
    wordsFromGame: wordsFromGame
  }
})()

