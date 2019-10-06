(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],2:[function(require,module,exports){
/** @typedef {"Bleu_Creuse"| "Bleu_Deterre"| "Bleu_Enterre"| "Bleu_Roule"| 
    "Piege"| "Piege_Explosion"| "Radar"| "Rouge_Creuse"| "Rouge_Deterre"| "Rouge_Enterre"| "Rouge_Roule"} AnimationName */

/** @typedef {"Bras_Robot"|"Cristal"|"Cristal_2"|"Cristal_2_shadow"|"Cristal_3"|"Cristal_3_shadow"|"Hud_dessus_left"|
    "Hud_dessus_right"|"HUD_Piege_Off"|"HUD_Piege_Ok"|"HUD_Radar_Off"|"HUD_Radar_Ok"|"Piege"|"Piege_2"|"Radar"|"Radar_2"|"Terre"} ElementName */

const Tile = require("./tile");
const Coord = require("../src/Coord");

const OFFSET_X = 78  + Tile.SIZE / 2;
const OFFSET_Y = 154 + Tile.SIZE / 2;
const TOOLTIP_TEXT_PADDING = 5;
const MOUSE_OFFSET_X = 15;
const MOUSE_OFFSET_Y = 25;

module.exports = class GUI {

    /** @param {import("../src/Referee")} referee */
    constructor(referee) {

        this.referee = referee;

        /** @type {Object<string,PIXI.Sprite>} */
        this.elements = {};
        /** @type {Object<string,PIXI.AnimatedSprite>} */
        this.animations = {};

        this.width  = 1920;
        this.height = 1080;

        /** @type {Tile[]} */
        this.tiles = [];

        this.xMin = OFFSET_X;
        this.yMin = OFFSET_Y;
        this.xMax = OFFSET_X + this.gameGrid.width  * Tile.SIZE;
        this.yMax = OFFSET_Y + this.gameGrid.height * Tile.SIZE;
    }

    get gameGrid() {
        return this.referee.game.grid;
    }

    /** @param {ElementName} name */
    getElement(name) {
        return this.elements[name];
    }

    /** @param {AnimationName} name */
    getAnimation(name) {
        return this.animations[name];
    }

    get renderer() {
        return this.app.renderer;
    }

    async init() {
        this.app = new PIXI.Application({
            width: this.width,
            height: this.height,
            antialias: true
        });

        this.renderer.plugins.interaction.moveWhenInside = true;

        document.body.appendChild(this.app.view);

        const loader = new PIXI.Loader();
        loader.add("elems", "./assets/img/elems.json");
        
        await new Promise(resolve => loader.load(resolve));

        let elemTextures = loader.resources.elems.textures;

        for (let k in elemTextures) {
            let texture = elemTextures[k];
            this.elements[k] = new PIXI.Sprite(texture);
        }

        loader.add("sheet", "./assets/img/sprites.json");
        
        await new Promise(resolve => loader.load(resolve));

        let sheet = loader.resources.sheet.textures;

        /** @type {Object<string,PIXI.Texture[]} */
        let textureArrays = {};
        for (let k in sheet) {
            let key = k.replace(/\d/g, "");
            if (!textureArrays[key])
                textureArrays[key] = [];
            
            let texture = sheet[k];
            textureArrays[key].push(texture);
        }

        for (let key in textureArrays) {
            this.animations[key] = new PIXI.AnimatedSprite(textureArrays[key]);
        }

        loader.add("background", "./assets/img/Background.jpg");
        loader.add("hud_left", "./assets/img/Hud_left.png");
        loader.add("hud_top", "./assets/img/Hud_top.png");
        
        await new Promise(resolve => loader.load(resolve));

        this.background = new PIXI.Sprite(loader.resources.background.texture);
        this.hud_left   = new PIXI.Sprite(loader.resources.hud_left.texture);
        this.hud_top    = new PIXI.Sprite(loader.resources.hud_top.texture);

        this.tooltip = new PIXI.Graphics();
        this.tooltip.beginFill(0, .75);
        this.tooltip.drawRect(0, 0, 100, 120);
        this.tooltip.endFill();
        this.tooltip.zIndex = 10;
        this.tooltipText = new PIXI.Text("", { fontFamily : 'Arial', fontSize: 24, fill: 0xffffff, align: 'left' });
        this.tooltipText.position.set(TOOLTIP_TEXT_PADDING, TOOLTIP_TEXT_PADDING);
        this.tooltip.addChild(this.tooltipText);

        this.tooltip.alpha = 0;
        this.tooltipText.alpha = 0;

        this.app.stage.sortableChildren = true;
        this.app.stage.addChild(this.tooltip);

        this.setupStage();
    }

    setupStage() {
        this.app.stage.addChild(this.background, this.hud_left, this.hud_top);
        this.tileContainer = new PIXI.Container();
        this.tileContainer.position.set(OFFSET_X, OFFSET_Y);
        this.app.stage.addChild(this.tileContainer);

        for (let cell of this.referee.game.grid.cells) {
            this.addTile(cell);
        }

        this.background.alpha = 0.8;
        this.background.interactive = true;
        this.background.hitArea = new PIXI.Rectangle(0, 0, this.background.width, this.background.height);
        this.background.on("mouseover", event => {
            if (event.data.global.x < this.xMin || event.data.global.y < this.yMin ||
                event.data.global.x < this.xMax || event.data.global.y > this.yMax) {
                this.tooltip.alpha = 0;
                this.tooltipText.alpha = 0;
            } else {
                this.tooltip.alpha = 1;
                this.tooltipText.alpha = 1;
            }
        });
    }

    /** @param {import("../src/Cell")} cell */
    addTile(cell) {
        this.tiles.push(new Tile(this, cell));
    }

    get xLimit() {
        return this.referee.game.grid.width * Tile.SIZE + OFFSET_X - this.tooltip.width;
    }

    get yLimit() {
        return this.referee.game.grid.height * Tile.SIZE + OFFSET_Y - this.tooltip.height;
    }

    /**
     * @param {Tile} tile 
     * @param {number} x 
     * @param {number} y 
     */
    tileover(tile, x, y) {

        x += MOUSE_OFFSET_X;
        y += MOUSE_OFFSET_Y;

        this.tooltip.alpha = 1;
        this.tooltipText.alpha = 1;
        this.tooltipText.text = `x: ${tile.x}\ny: ${tile.y}\nore: ${tile.cell.ore}`;

        let radarResult = this.referee.game.grid.hasRadar(new Coord(tile.x, tile.y));
        if (radarResult) {
            this.tooltipText.text += `\nRADAR (${["blue", "red"][radarResult[0]]} player)`;
        } else {
            let trapResult = this.referee.game.grid.hasTrap(new Coord(tile.x, tile.y));

            if (trapResult)
                this.tooltipText.text += `\nTRAP (${["blue", "red"][trapResult[o]]} player)`;
        }

        this.tooltipText.calculateBounds();

        this.tooltip.clear();
        this.tooltip.beginFill(0, .75);
        this.tooltip.drawRect(0, 0, this.tooltipText.width + 2 * TOOLTIP_TEXT_PADDING, 
            this.tooltipText.height + 2 * TOOLTIP_TEXT_PADDING);
        this.tooltip.endFill();
        this.tooltip.calculateBounds();

        this.tooltip.pivot.set(x > this.xLimit ? this.tooltip.width  : 0, 0);
        this.tooltip.position.set(x, Math.min(y, this.yLimit));
    }

    updateAllCells() {
        this.tiles.forEach(tile => tile.update());
    }
}
},{"../src/Coord":10,"./tile":4}],3:[function(require,module,exports){
const GUI = require("./gui");
const Referee = require("../src/Referee");

window.onload = async () => {
    let referee = new Referee();

    let gui = new GUI(referee);

    await gui.init();

    // referee.start();
}
},{"../src/Referee":16,"./gui":2}],4:[function(require,module,exports){
const TILE_SIZE = 61;
const Coord = require("../src/Coord");

module.exports = class Tile {
    
    /**
     * @param {import("./gui")} gui
     * @param {import("../src/Cell")} cell
     */
    constructor(gui, cell) {
        this.gui = gui;
        this.cell = cell;
        this.gfx = new PIXI.Graphics();
        this.gui.tileContainer.addChild(this.gfx);


        this.gfx.position.set(this.x * TILE_SIZE, this.y * TILE_SIZE);
        this.gfx.interactive = true;
        this.gfx.hitArea = new PIXI.Rectangle(0, 0, TILE_SIZE, TILE_SIZE);
        this.gfx.on("mousemove", event => {
            this.gui.tileover(this, event.data.global.x, event.data.global.y);
        });
        this.gfx.pivot.set(TILE_SIZE / 2, TILE_SIZE / 2);

        this.update();
    }

    get x() { return this.cell.x }
    get y() { return this.cell.y }
    get game() { return this.gui.referee.game }

    clear() {
        this.gfx.clear();
    }

    drawHole() {

    }

    drawFrame() {
        this.gfx.lineStyle(1, 0);
        this.gfx.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
    }

    drawOre() {
        let sprite = this.gui.getElement("Cristal_2");
        
        this.gfx.beginTextureFill(sprite.texture);
        this.gfx.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
        this.gfx.endFill();
        this.gfx.angle = [0, 90, 180, 270][~~(Math.random() * 4)];
    }

    drawRadar() {
        this.gfx.beginTextureFill(this.gui.getElement("Radar"));
        this.gfx.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
        this.gfx.endFill();
    }

    update() {
        this.clear();
        this.drawFrame();

        // Hole changed
        if (this.cell.hole) {
            this.drawHole();
        }

        if (this.cell.ore) {
            this.drawOre();
        }

        // Radar appeared
        if (this.game.grid.hasRadar(new Coord(this.cell.x, this.cell.y))) {
            this.drawRadar();
        }

        // Radar BOOM
        if (this.lastCell && 
               !this.game.grid.hasRadar(new Coord(this.lastCell.x, this.lastCell.y)) && 
                this.game.grid.hasRadar(new Coord(this.cell.x, this.cell.y))) {
            // this.drawRadar();
        }
        
        this.lastCell = Object.assign({}, this.cell);
    }
}

module.exports.SIZE = TILE_SIZE;
},{"../src/Coord":10}],5:[function(require,module,exports){
const Item = require("./Item");

class Action {
    constructor() {
        this.isMove = false;
        this.isDig  = false;
        this.isRequest = false;

        this.item   = Item.NONE;
        
        /** @type {import("./Coord")} */
        this.target = null;
    }
}

Action.NONE = new Action();

Action.Dig  = class DigAction extends Action {

    /** @param {import("./Coord")} target */
    constructor(target) {
        super();
        this.target = target;
        this.isDig  = true;
    }
}

Action.Move = class MoveAction extends Action {

    /** @param {import("./Coord")} dist */
    constructor(dist) {
        super();
        this.dist = dist;
        this.isMove  = true;

        /** @type {import("./Coord")[]} */
        this.path = null;
    }
}

Action.Request = class RequestionAction extends Action {

    /** @param {number} item */
    constructor(item) {
        super();
        this.item = item;
        this.isRequest = true;
    }
}

module.exports = Action;
},{"./Item":13}],6:[function(require,module,exports){
const Item = require("./Item");
const Action = require("./Action");
const Constants = require("./Constants");

module.exports = class Agent {
    
    /**
     * Constructor
     * @param {number} id 
     * @param {import("./Player")} owner 
     * @param {import("./Coord")} pos 
     */
    constructor(id, owner, pos) {
        this.id = id;
        this.owner = owner;
        /** @type {import("./Coord")} */
        this.pos = null;
        this.action = Action.NONE;
        this.initialPos = pos;
        this.inventory = Item.NONE;
        this.message = "";
        this.respawnIn = 0;
        this.dead = false;
    }

    reset() {
        this.action = Action.NONE;
        this.message = "";
    }

    receiveOre() {
        this.inventory = Item.ORE;
    }

    factoryReset() {
        this.reset();
        this.pos = this.initialPos;
        this.inventory = Item.NONE;
        this.dead = false;
    }

    die() {
        this.dead = true;
        this.action = Action.NONE;
        this.respawnIn = Constants.AGENT_RESPAWN_TIME;
    }

    decrementRespawnTimer() {
        this.respawnIn--;
    }

    get shoulwRespawn() {
        return this.dead && this.respawnIn <= 0;
    }

}
},{"./Action":5,"./Constants":9,"./Item":13}],7:[function(require,module,exports){

class Cell {
    /**
     * Constructor
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.valid = true;
        this.accessToHQ = false;
        this.hole = false;
        /** @type {number} */
        this.ore = 0;
    }

    /** @param {number} amount */
    reduceOre(amount) {
        this.ore = Math.max(0, this.ore - amount);
    }

    incrementOre() {
        this.ore++;
    }

    equals(other) {
        return other instanceof Cell && other.x === this.x && other.y === this.y;
    }
}

let noCell = new Cell();
noCell.valid = false;
noCell.ore = 0;
noCell.x = -1;
noCell.y = -1;
Cell.NO_CELL = noCell;

module.exports = Cell;
},{}],8:[function(require,module,exports){
const PLAYER_WAIT_PATTERN = /^WAIT(?:\s+(?<message>.+))?\s*$/i;
const PLAYER_MOVE_PATTERN = /^MOVE\s+(?<x>-?\d+)\s+(?<y>-?\d+)(?:\s+(?<message>.+))?\s*$/i;
const PLAYER_REQUEST_PATTERN = /^REQUEST\s+(?<item>(?:TRAP|RADAR))(?:\s+(?<message>.+))?\s*$/i;
const PLAYER_INTERACT_PATTERN = /^(INTERACT|DIG)\s+(?<x>-?\d+)\s+(?<y>-?\d+)(?:\s+(?<message>.+))?\s*$/i;
// const EXPECTED = "DIG <x> <y> | REQUEST <item> | MOVE <x> <y> | WAIT";

const Action = require("./Action");
const Coord = require("./Coord");
const Item = require("./Item");

module.exports = class CommandManager {

    /**
     * 
     * @param {import("./Player")} player 
     * @param {string[]} lines 
     */
    static handleCommands(player, lines) {
        let i =0;
        for (let line of lines) {

            let agent = player.agents[i++];
            if (agent.dead) continue;

            let match = line.match(PLAYER_WAIT_PATTERN);

            if (match) {
                this.matchMessage(agent, match);
                continue;
            }

            match = line.match(PLAYER_MOVE_PATTERN);

            if (match) {
                let x = ~~match.groups.x;
                let y = ~~match.groups.y;

                agent.action = new Action.Move(new Coord(x, y));

                this.matchMessage(agent, match);
                continue;
            }

            match = line.match(PLAYER_INTERACT_PATTERN);

            if (match) {
                let x = ~~match.groups.x;
                let y = ~~match.groups.y;

                agent.action = new Action.Dig(new Coord(x, y));

                this.matchMessage(agent, match);
                continue;
            }

            match = line.match(PLAYER_REQUEST_PATTERN);

            if (match) {
                let item = Item[match.groups.item.toUpperCase()];

                agent.action = new Action.Request(item);

                this.matchMessage(agent, match);
                continue;
            }

            console.error(`Error: player#${player.index} has invalid input: ${line}.`);
        }
    }

    /**
     * 
     * @param {import("./Agent")} agent 
     * @param {RegExpMatchArray} match 
     */
    static matchMessage(agent, match) {
        agent.message = match.groups.message;
    }
}
},{"./Action":5,"./Coord":10,"./Item":13}],9:[function(require,module,exports){
const Coord = require("./Coord");

class Adjacency {
    /** @param {Coord[]} deltas */
    constructor(...deltas) {
        this.deltas = deltas;
    }
}

const FOUR_ADJACENCY  = new Adjacency(new Coord(-1, 0), new Coord(1, 0), new Coord(0, -1), new Coord(0, 1));
const EIGHT_ADJACENCY = new Adjacency(
    new Coord(-1, 0), new Coord(1, 0), new Coord(0, -1), new Coord(0, 1), new Coord(-1, -1),
    new Coord(1, -1), new Coord(-1, 1), new Coord(1, 1)
);

module.exports = {

    FOUR_ADJACENCY,
    EIGHT_ADJACENCY,
    ADJACENCY: FOUR_ADJACENCY,

    TYPE_NONE: -1,
    TYPE_MY_AGENT: 0,
    TYPE_FOE_AGENT: 1,
    TYPE_RADAR: 2,
    TYPE_TRAP: 3,
    TYPE_ORE: 4,

    AGENTS_MOVE_DISTANCE: 4,
    AGENTS_PER_PLAYER: 5,
    AGENT_INTERACT_RADIUS: 1,
    AGENT_RESPAWN_TIME: 999,
    MAP_CLUSTER_SIZE: 5,
    MAP_ORE_COEFF_X: 0.55,
    MAP_HEIGHT: 15,
    MAP_WIDTH: 30,
    MAP_CLUSTER_DISTRIBUTION_MAX: 0.064,
    MAP_CLUSTER_DISTRIBUTION_MIN: 0.032,
    MAP_ORE_IN_CELL_MAX: 3,
    MAP_ORE_IN_CELL_MIN: 1,
    RADAR_COOLDOWN: 5,
    RADAR_RANGE: 4,
    ROBOTS_CAN_OCCUPY_SAME_CELL: true,
    TRAP_CHAIN_REACTION: true,
    TRAP_FRIENDLY_FIRE: true,
    TRAP_COOLDOWN: 5,
    TRAP_RANGE: 1,
    EUCLIDEAN_RADAR: false,
    AGENTS_START_PACKED: true,
}
},{"./Coord":10}],10:[function(require,module,exports){
const PRIME = 31;
let Constants;

module.exports = class Coord {

    /**
     * Constructor
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        if (!Constants) {
           Constants = require("./Constants");
        }
        this.x = x;
        this.y = y;
    }

    /**
     * DistanceTo
     * @param {number} x 
     * @param {number} y 
     */
    euclideanTo(x, y) {
        return Math.sqrt(this.sqrEuclideanTo(x, y));
    }

    /**
     * SqrDistanceTo
     * @param {number} x 
     * @param {number} y 
     */
    sqrEuclideanTo(x, y) {
        return (x - this.x) ** 2 + (y - this.y) ** 2;
    }

    /**
     * Manhatten distance
     * @param {Coord|number} x 
     * @param {number} y 
     */
    manhattanTo(x, y) {
        if (x instanceof Coord) {
            return this.manhattanTo(x.x, x.y);
        } else {
            return Math.abs(x - this.x) + Math.abs(y - this.y);
        }
    }

    /**
     * Chebyshev distance
     * @param {Coord|number} x 
     * @param {number} y 
     */
    chebyshevTo(x, y) {
        if (x instanceof Coord) {
            return this.chebyshevTo(x.x, x.y);
        } else {
            return Math.max(Math.abs(x - this.x) + Math.abs(y - this.y));
        }
    }

    /**
     * Game distance
     * @param {Coord|number} x 
     * @param {number} y
     * @return {number}
     */
    distanceTo(x, y) {
        if (x instanceof Coord) {
            return this.distanceTo(x.x, x.y);
        } else {
            return Constants.ADJACENCY == Constants.FOUR_ADJACENCY ?
                   this.manhattanTo(x, y) : this.chebyshevTo(x, y);
        }
    }

    valueOf() {
        let result = PRIME + this.x;
        return PRIME * result + this.y;
    }

    /** @param {Coord} other */
    equals(other) {
        return this.valueOf() == other.valueOf();
    }

    toString() {
        return `(${this.x}, ${this.y})`;
    }
}
},{"./Constants":9}],11:[function(require,module,exports){
const Grid = require("./Grid");
const Action = require("./Action");
const Agent = require("./Agent");
const Constants = require("./Constants");
const Coord = require("./Coord");
const Item = require("./Item");
const { randomInt, interpolate, shuffle, getLargetSize } = require("../util/JavaFunctions");

module.exports = class Game {
    constructor() {
        this.trapsPlaced = 0;
        this.robotDestroyed = 0;
        this.oreDelivered = 0;

        /** @type {Grid} */
        this.grid = null;

        /** @type {import("./Agent")[]} */
        this.deadAgents = [];

        /** @type {import("./Player")[]} */
        this.players = [];
    }

    /**
     * @return {import("./Agent")[]}
     */
    get allAgents() {
        return [].concat(...this.players.map(p => p.agents));
    }

    convertActions() {
        for (let agent of this.allAgents) {
            let action = agent.action;

            if (action.isDig) {
                let cell = this.grid.get(action.target);
                if (!cell.valid || cell.accessToHQ) {
                    agent.action = new Action.Move(action.target);
                } else if (agent.pos.distanceTo(action.target) > Constants.AGENT_INTERACT_RADIUS) {
                    let closest = this.grid.getClosestTarget(agent.pos, this.grid.getNeighbours(action.target));
                    let target = closest[~~(Math.random() * closest.length)];
                    agent.action = new Action.Move(target);
                }
            } else if (action.isRequest) {
                if (!this.grid.get(agent.pos).accessToHQ) {
                    let closest = this.grid.getClosestTarget(agent.pos, this.grid.getHQAccesses());
                    let target = closest[~~(Math.random() * closest.length)];
                    agent.action = new Action.Move(target);
                }
            }

            if (action.isMove) {
                if (agent.pos.equals(action.target)) {
                    agent.action = Action.NONE;
                }
            }
        }
    }

    decrementCooldowns() {
        this.deadAgents.forEach(da => da.decrementRespawnTimer());
        this.players.forEach(p => p.decrementCooldowns());
    }

    /** @param {import("./Agent")} agent */
    destoryAgent(agent) {
        agent.die();
        this.deadAgents.push(agent);
        this.robotDestroyed++;
    }

    generateMap() {
        let grid = this.newMap();

        // Set up ore
        let cellCount = Constants.MAP_WIDTH * Constants.MAP_HEIGHT;
        let clustersMin = Math.max(1, ~~(cellCount * Constants.MAP_CLUSTER_DISTRIBUTION_MIN));
        let clustersMax = Math.max(clustersMin, ~~(cellCount * Constants.MAP_CLUSTER_DISTRIBUTION_MAX));
        let oreClusterCount = randomInt(clustersMin, clustersMax);

        let padding = {
            left: 3,
            right: 2,
            top: 2,
            bottom: 2
        };

        let tries = 0;
        // Magic number bruh
        while (oreClusterCount > 0 && tries < 1000) {

            let factor = Math.pow(Math.random(), Constants.MAP_ORE_COEFF_X);
            let x = interpolate(padding.left, Constants.MAP_WIDTH - padding.right, factor);
            let y = randomInt(padding.top, Constants.MAP_HEIGHT - padding.bottom);

            if (!grid.get(x, y).ore) {
                let clusterCenter = new Coord(x, y);
                for (let i = 0; i < Constants.MAP_CLUSTER_SIZE; i++) {
                    for (let j = 0; j < Constants.MAP_CLUSTER_SIZE; j++) {
                        x = clusterCenter.x + ~~(i - Constants.MAP_CLUSTER_SIZE / 2);
                        y = clusterCenter.y + ~~(j - Constants.MAP_CLUSTER_SIZE / 2);

                        let chances = clusterCenter.manhattanTo(x, y) * 2 + 1;
                        let hit = randomInt(chances);

                        if (!hit) {
                            let amount = randomInt(Constants.MAP_ORE_IN_CELL_MIN, Constants.MAP_ORE_IN_CELL_MAX + 1);
                            grid.get(x, y).ore = amount;
                        }
                    }
                }
                oreClusterCount--;
            }
            tries++;
        }

        return grid;
    }

    newMap() {
        let grid = new Grid(Constants.MAP_WIDTH, Constants.MAP_HEIGHT, this.players.length);

        for (let y = 0; y < Constants.MAP_HEIGHT; y++) {
            grid.get(0, y).accessToHQ = true;
        }
        return grid;
    }

    /**
     * @param {import("./Agent")[][]} teams 
     * @param {number} index 
     */
    getAllAgentsOfIndex(teams, index) {
        return teams.filter(team => team.length > index).map(team => team[index]);
    }

    getCurrentFrameData() {
    }

    agentToAgentFrameData() {

    }

    /** @param {import("./Player")} player */
    getCurrentFrameInfoFor(player) {
        let lines = [];
        let opponent = player.index == 1 ? this.players[0] : this.players[1];

        lines.push(`${player.ore} ${opponent.ore}`);

        for (let y = 0; y < this.grid.height; y++) {
            let row = [];
            for (let x = 0; x < this.grid.width; x++) {
                let c = this.grid.get(x, y);

                let oreValue = this.grid.isOreVisibleTo(x, y, player) ? c.ore : "?";
                row.push(`${oreValue} ${c.hole ? 1 : 0}`);
            }

            lines.push(row.join("\n"));
        }

        /** @type {Array<string>} */
        let entities = [];

        // <id> <type(owner)> <x> <y> <item>
        this.allAgents.forEach(agent => entities.push(this.agentToString(agent, player)));
        entities.push(...this.itemsToString(player, Item.RADAR));
        entities.push(...this.itemsToString(player, Item.TRAP));

        lines.push(`${entities.length} ${player.cooldowns[Item.RADAR]} ${player.cooldowns[Item.TRAP]}`);
        lines.push(...entities);

        return lines;
    }

    /** 
     * @param {import("./Player")} player 
     * @param {number} item 
     */
    itemsToString(player, item) {
        return [...this.grid.getItems(item, player)].map(pos => `${pos.id} ${item} ${pos.x} ${pos.y} ${item}`);
    }

    /**
     * @param {(value: (import("./Agent"))) => boolean} filter 
     */
    getFilteredTeams(filter) {
        return this.getTeamList().map(team => team.filter(filter));
    }

    getGlobalInfo() {
        return [`${Constants.MAP_WIDTH} ${Constants.MAP_HEIGHT}`];
    }

    getTeamList() {
        return this.players.map(p => p.agents);
    }

    init() {

    }

    /** @param {stirng} state */
    initGameState(state) {
        if (!state) {
            this.grid = this.generateMap();
            this.initPlayers();
        } else {
            console.error("NOPE");
        }
    }

    initPlayers() {
        let spaces = ~~(Constants.MAP_HEIGHT / 2);

        /** @type {number[]} */
        let available = [];

        for (let i = 0; i < spaces; i++)
            available.push(i);

        available = shuffle(available);
        for (let i = 0; i < spaces; i++) {
            let y = available.length ? available.shift() : randomInt(spaces);

            for (let player of this.players) {
                let pos = new Coord(0, y + 2 * (Constants.AGENTS_START_PACKED ? 0 : player.index));
                let agent = new Agent(Constants.AGENTS_PER_PLAYER * player.index + i, player, pos);
                player.addAgent(agent);
            }
        }
    }

    performGameUpdate() {
        this.convertActions();

        this.resolveTraps();
        this.resolveDigs();
        this.resolveRequests();

        this.decrementCooldowns();

        this.resolveMoves();
        this.resolveDelievers();
        this.respawnDeadAgents();
    }

    resetGameTurnData() {
        this.players.forEach(p => p.reset());
    }

    resolveDelivers() {
        this.allAgents
            .filter(agent => !agent.dead && this.grid.get(agent.pos).accessToHQ)
            .forEach(agent => {
                if (agent.inventory == Item.ORE) {
                    agent.owner.scoreOre();
                    agent.inventory = Item.NONE;

                    this.oreDelivered++;
                }
            });
    }

    resolveDigs() {
        /** @type {Map<Coord, Agent[][]>} */
        let digRequests = this.allAgents
            .map(agent => agent.action)
            .filter(action => action.isDig)
            .map(action => action.target)
            // Unique
            .reduce(
                /** @param {Coord[]} prev */
                (prev, curr) => {
                    if (!prev.some(c => curr.equals(c))) {
                        prev.push(curr);
                    }
                    return prev;
                }, [])
            .reduce(
                /** @param {Map<Coord, Agent[][]>} prev */
                (prev, curr) => {
                    prev.set(curr, this.getFilteredTeams(agent => 
                        agent.action.isDig && agent.action.target.equals(curr)));
                    return prev;
                }, new Map());

        for (let [pos, teams] of digRequests) {
            let cell = this.grid.get(pos);
            let maxAgentsInTeam = getLargetSize(teams);

            /** @type {Object<number, number[]>} */
            let burried = new {};

            teams
                .filter(team => team.length)
                .map(team => team[0])
                .forEach(agent => {
                    let destoryed = this.grid.destroyedRadar(pos, agent.owner);
                    // TODO: Emit some event
                });
            

            // Collect Ores
            for (let index = 0; index < maxAgentsInTeam; index++) {
                let currentDiggers = this.getAllAgentsOfIndex(teams, index);
                /** @type {Agent[]} */
                let oreCollectors = [];

                currentDiggers.forEach(agent => {
                    // TODO: Emit some event

                    if (agent.inventory != Item.ORE) {
                        oreCollectors.push(agent);
                    }
                    if (agent.inventory != Item.NONE) {
                        if (!burried[agent.owner.index]) 
                            burried[agent.owner.index] = [];
                        burried[agent.owner.index].push(agent.inventory);

                        agent.inventory = Item.NONE;
                    }
                    if (agent.inventory == Item.TRAP) {
                        this.trapsPlaced++;
                    }
                });

                // Drill hole
                if (!cell.hole) {
                    cell.hole = true;
                }
                if (cell.ore > 0) {
                    cell.reduceOre(oreCollectors.length);
                    oreCollectors.forEach(agent => {
                        agent.receiveOre();

                        // TODO: emit some event
                    });
                }
            }

            // Inset items
            for (let playerIndex in burried) {
                for (let item of burried[playerIndex]) {
                    if (item == Item.ORE) {
                        cell.incrementOre();
                    } else {
                        this.grid.insertItem(pos, item, this.players[playerIndex]);
                    }
                }
            }
        }        
    }

    getMoversByTeam() {
        return this.getFilteredTeams(agent => agent.action.isMove);
    }

    resolveMoves() {
        let movers = this.getMoversByTeam();

        for (let team of movers) {
            for (let agent of team) {
                let action = agent.action;

                let obstacles = Constants.ROBOTS_CAN_OCCUPY_SAME_CELL ? [] :
                    team.map(agent => agent.pos);

                let path = this.grid.findPath(agent.pos, action.target, obstacles);
                
                if (path.length) {
                    agent.pos = path[path.length - 1];
                }
            }
        }
    }

    /**
     * @param {Agent} a 
     * @param {Agent} b 
     */
    compareByInventorySpace(a, b) {
        let hasItemA = a.inventory != Item.NONE;
        let hasItemB = b.inventory != Item.NONE;
        if (hasItemA && hasItemB)
            return 1;
        if (!hasItemA && !hasItemB)
            return -1;
        return 0;
    }

    resolveRequests() {
        this.allAgents
            .filter(agent => agent.action.isRequest)
            .sort(this.compareByInventorySpace)
            .forEach(agent => {
                let item = agent.action.item;
                if (agent.owner.cooldowns[item] == 0) {
                    agent.owner.startCooldown(item);
                    agent.inventory = item;

                    // TODO: emit some event
                } else {
                    // Blabla
                }
            })
    }

    resolveTraps() {
        let triggeredTraps = this.allAgents
            .map(agent => agent.action)
            .filter(action => action.isDig)
            .filter(action => this.grid.hasTrap(action.target))
            .map(action => action.target);

        /** @type {Coord[]} */
        let deathZone = [];

        if (Constants.TRAP_CHAIN_REACTION) {
            deathZone = [].concat(triggeredTraps);
            /** @type {Coord[]} */
            let exploding = [].concat(triggeredTraps);

            while(exploding.length) {
                let trap = exploding.shift();

                this.grid.getCellsInRange(trap, Constants.TRAP_RANGE)
                    .forEach(c => {
                        if (!deathZone.some(d => d.equals(c)))
                            deathZone.push(c);

                        if (this.grid.hasTrap(c) && !triggeredTraps.some(t => t.equals(c))) {
                            exploding.push(c);
                            triggeredTraps.push(c);
                        }
                    });
            }
        } else {
            deathZone = [].concat(...triggeredTraps.map(coord => this.grid.getCellsInRange(coord, Constants.TRAP_RANGE)));
        }
        deathZone.forEach(coord => this.grid.removeTrap(coord));

        this.allAgents
            .filter(agent => !agent.dead && deathZone.some(coord => agent.pos.equals(coord)))
            .forEach(agent => this.destoryAgent(agent));

        for (let triggerPos of triggeredTraps) {
            // TODO: emit some events
        }
    }

    respawnDeadAgents() {
        this.deadAgents
            .filter(agent => agent.shoulwRespawn)
            .forEach(agent => {
                this.deadAgents.some((da, index, array) => {
                    if (agent == da) {
                        array.splice(index, 1);
                        return true;
                    }
                });

                agent.factoryReset();

                // TODO: emit some events
            });
    }

    /**
     * @param {import("./Agent")} agent 
     * @param {import("./Player")} player 
     */
    agentToString(agent, player) {
        return `${agent.id} ${player == agent.owner ? Constants.TYPE_MY_AGENT : Constants.TYPE_FOE_AGENT} ` + 
               `${agent.dead ? -1 : agent.pos.x} ${agent.dead ? -1 : agent.pos.y} ` + 
               `${player == agent.owner ? agent.inventory : Item.NONE}`;
    }

    gameOver() {
        if (!this.getRemainingOre())
            return true;
        
        let players = this.players;

        // Player with most ore is only player with live bots
        let playerWithMostOre = this.getPlayerWithMostOre();
        if (playerWithMostOre) {
            players = this.players.filter(player => player != playerWithMostOre);
        }
        
        // No bots left
        /** @type {Agent[]} */
        let agents = [].concat(...players.map(p => p.agents));

        return agents.every(agent => agent.dead);
    }

    getPlayerWithMostOre() {
        let most = 0;
        let result;

        for (let player of this.players) {
            if (!result || player.ore > most) {
                most = player.ore;
                result = player;
            } else if (player.ore == most) {
                return;
            }
        }
        return result;
    }

    getRemainingOre() {
        let remainingOre = 0;

        for (let c of this.grid.cells) {
            remainingOre += c.ore;
        }
        for (let player of this.players) {
            for (let agent of player.agents) {
                if (agent.inventory == Item.ORE) {
                    remainingOre++;
                }
            }
        }
        return remainingOre;
    }
}

},{"../util/JavaFunctions":17,"./Action":5,"./Agent":6,"./Constants":9,"./Coord":10,"./Grid":12,"./Item":13}],12:[function(require,module,exports){
const Coord = require("./Coord");
const Item = require("./Item");
const ItemCoord = require("./ItemCoord");
const PathNode = require("./PathNode");
const Constants = require("./Constants");
const Cell = require("./Cell");
const PriorityQueue = require("../util/PriorityQueue");

module.exports = class Grid {

    /**
     * Constructor
     * @param {number} width 
     * @param {number} height 
     * @param {number} playerCount 
     */
    constructor(width, height, playerCount) {
        this.width = width;
        this.height = height;
        
        /** @type {Cell[]} */
        this.cells = [];

        /** @type {Map<number, ItemCoord[][]>} */
        this.items = new Map();

        /** @type {ItemCoord[][]} */
        this.traps = [];
        /** @type {ItemCoord[][]} */
        this.radars = [];

        this.items.set(Item.TRAP,  this.traps);
        this.items.set(Item.RADAR, this.radars);

        for (let i = 0; i < playerCount; i++) {
            this.radars.push([]);
            this.traps.push([]);
        }

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.cells.push(new Cell(x, y));
            }
        }
    }

    /**
     * Get cell at (x, y) or of coord x
     * @param {number|Coord} x 
     * @param {number} y
     * @returns {Cell}
     */
    get(x, y) {
        if (x instanceof Coord) {
            return this.get(x.x, x.y);
        } else { 
            return this.cells.find(c => c.x === x && c.y === y) || Cell.NO_CELL;
        }
    }

    /** @param {import("./PathNode")} current */
    unrollPath(current) {
        let path = [];
        while (!current.isStart) {
            path.unshift(current.coord);
            current = current.prev;
        }
        return path;
    }

    /**
     * Path finding (A* with custom distance function)
     * @param {Coord} start 
     * @param {Coord} target 
     * @param {Coord[]} restricted 
     */
    findPath(start, target, restricted) {
        let queue = new PriorityQueue(this.byDistanceTo(target));
        /** @type {Coord[]} */
        let computed = new [];

        /** @type {PathNode[]} */
        let closest = [];
        let closestBy = 0;

        queue.add(new PathNode(start));
        computed.add(start);

        while(!queue.isEmpty()) {
            /** @type {PathNode} */
            let current = queue.poll();

            if (current.coord.equals(target)) {
                return this.unrollPath(current);
            } else {
                let dist = current.coord.distanceTo(target);
                if (!closest.length || closestBy > dist) {
                    closest = [current];
                    closestBy = dist;
                } else if (closest.length && closestBy === dist) {
                    closest.push(current);
                }
            }
            if (current.steps < Constants.AGENTS_MOVE_DISTANCE) {
                let neribours = this.getNeighbours(current.coord);
                for (let neigh of neribours) {
                    if (!restricted.some(r => neigh.equals(r)) && 
                        !computed.some(c => neigh.equals(c))) {
                        
                        queue.add(new PathNode(neigh, current));
                        computed.push(neigh);
                    }
                }
            }
        }
        if (!closest.length) {
            return [];
        }
        return this.unrollPath(closest[~~(Math.random() * closest.length)]);
    }

    /** @param {Coord} pos */
    getNeighbours(pos) {
        /** @type {Coord[]} */
        let neighs = [];
        for (let delta of Constants.ADJACENCY.deltas) {
            let n = new Coord(pos.x, + delta.x, pos.y + delta.y);
            if (this.get(n) != Cell.NO_CELL) {
                neighs.push(n);
            }
        }
        return neighs;
    }

    /** @param {Coord} target */
    byDistanceTo(target) {
        
        /** @param {Coord} coord */
        function dist(coord) {
            return coord.distanceTo(target);
        }

        return dist;
    }

    /**
     * @param {Coord} from 
     * @param {Coord[]} targets 
     */
    getClosestTarget(from, targets) {
        /** @type {Coord[]} */
        let closest = [];
        let closestBy = 0;
        for (let neigh of targets) {
            let dist = from.distanceTo(neigh);
            if (!closest.length || closestBy > dist) {
                closest = [neigh];
                closestBy = dist;
            } else if (closest.length && closestBy === dist) {
                closest.push(neigh);
            }
        }
        return closest;
    }

    /** @param {Coord} pos */
    hasTrap(pos) {
        for (let index in this.traps) {
            let trapList = this.traps[index];
            for (let trap of trapList) {
                if (trap.equals(pos))
                    return [index, trap];
            }
        }
    }

    /** @param {Coord} pos */
    removeTrap(pos) {
        this.traps.forEach(list => list.some((coord, index, array) => {
            if (coord.equals(pos)) {
                array.splice(index, 1);
                return true;
            }
        }));
    }

    /** @param {Coord} pos */
    hasRadar(pos) {
        for (let index in this.radars) {
            let radarList = this.radars[index];
            for (let radar of radarList) {
                if (radar.equals(pos))
                    return [~~index, radar];
            }
        }
    }

    /**
     * 
     * @param {Coord} pos 
     * @param {import("./Player")} destroyer 
     */
    destroyedRadar(pos, destroyer) {
        let destroyed = false;
        for (let i = 0; i < this.radars.length; i++) {
            if (i != destroyer.index) {
                destroyed |= this.radars[i].some((coord, index, array) => {
                    if (coord.equals(pos)) {
                        array.splice(index, 1);
                        return true;
                    }
                });
            }
        }
        return destroyed;
    }

    /**
     * 
     * @param {Coord} pos 
     * @param {number} item 
     * @param {import("./Player")} itemOwner 
     */
    insertItem(pos, item, itemOwner) {
        this.getItems(item, itemOwner).push(new ItemCoord(pos.x, pos.y));
    }

    getHQAccesses() {
        let coords = [];
        for (let y = 0; y < Constants.MAP_HEIGHT; y++) {
            coords.push(new Coord(0, y))
        }
        return coords;
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {import("./Player")} player 
     */
    isOreVisibleTo(x, y, player) {
        return this.radars[player.index].some(pos => Constants.EUCLIDEAN_RADAR ?
            pos.euclideanTo(x, y) <= Constants.RADAR_RANGE :
            pos.distanceTo(x, y)  <= Constants.RADAR_RANGE);
    }

    /**
     * 
     * @param {number} item 
     * @param {import("./Player")} player 
     */
    getItems(item, player) {
        return this.items.get(item)[player.index];
    }

    /**
     * @param {Coord} coord 
     * @param {number} range 
     */
    getCellsInRange(coord, range) {
        /** @type {Coord[]} */
        let result = [];
        /** @type {PathNode[]} */
        let queue = [];

        queue.push(new PathNode(coord));
        while(queue.length) {
            let e = queue.shift();
            result.push(e.coord);
            if (e.steps < range) {
                this.getNeighbours(e.coord).forEach(neigh => {
                    if (!result.some(c => c.equals(neigh))) {
                        queue.push(new PathNode(neigh, e));
                    }
                });
            }
        }

        return result;
    }
}
},{"../util/PriorityQueue":18,"./Cell":7,"./Constants":9,"./Coord":10,"./Item":13,"./ItemCoord":14,"./PathNode":15}],13:[function(require,module,exports){
const Constants = require("./Constants");

module.exports = {
    ORE:   Constants.TYPE_ORE,
    TRAP:  Constants.TYPE_TRAP,
    NONE:  Constants.TYPE_NONE,
    RADAR: Constants.TYPE_RADAR,
}

},{"./Constants":9}],14:[function(require,module,exports){
const Coord = require("./Coord");
const Constants = require("./Constants");
let instance = 0;

module.exports = class ItemCoord extends Coord {

    /** 
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        super(x, y);
        this.id = instance++ + Constants.AGENTS_PER_PLAYER * 2;
    }
}
},{"./Constants":9,"./Coord":10}],15:[function(require,module,exports){
const Coord = require("./Coord");

module.exports = class PathNode {

    /**
     * 
     * @param {Coord} coord 
     * @param {PathNode|undefined} prev 
     */
    constructor(coord, prev) {
        this.coord = coord;

        if (prev) {
            this.prev = prev;
            /** @type {number} */
            this.steps = prev.steps + 1;
        }
    }

    get isStart() {
        return !this.prev
    }
}
},{"./Coord":10}],16:[function(require,module,exports){
const { EventEmitter } = require("events");

const Game = require("./Game");
const CommandManager = require("./CommandManager");

module.exports = class Referee extends EventEmitter {

    constructor() {
        super();
        this.game = new Game();

        this.game.init();
        this.game.initGameState();

        this.loop = false;
        this.turns = 0;
        this.gap = 1000;
        this.maxTurns = 200;
    }

    async start() {
        if (this.game.players.length !== 2)
            return console.error(`There must be 2 players to start the game`);
        
        this.loop = true;

        while(this.loop) {
            await new Promise(resolve => setTimeout(() => resolve(this.gameTurn()), this.gap));
        }
    }

    async gameTurn() {
        this.game.resetGameTurnData();

        for (let player of this.game.players) {
            player.sendInputLine(...this.game.getCurrentFrameInfoFor(player));
            await player.execute();
        }

        this.handlePlayerCommands();

        this.game.performGameUpdate();

        if (this.game.gameOver()) {
            this.loop = false;
            this.emit("gameover");  
        }
        this.emit("turn");
    }

    handlePlayerCommands() {
        for (let player of this.game.players) {
            CommandManager.handleCommands(player, player.outputs);
        }
    }
}
},{"./CommandManager":8,"./Game":11,"events":1}],17:[function(require,module,exports){
module.exports = {

    /** 
     * @param {number} low 
     * @param {number} high
     * @returns {number}
     */
    randomInt: (low, high) => high ? 
        low + ~~(Math.random() * (high - low)) : 
        module.exports.randomInt(0, low),

    /**
     * @param {number} low 
     * @param {number} high
     * @param {number} factor
     */
    interpolate: (low, high, factor) => ~~(low + factor * (high - low)),

    /** 
     * @template T
     * @param {T[]} array
     * @return {T[]}
     */
    shuffle: array => {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    /**
     * @param {[][]} lists
     */
    getLargetSize: lists => {
        return lists.map(list => list.length).sort((a, b) => b - a)[0];
    }
}
},{}],18:[function(require,module,exports){
/**
 * @template T
 */
module.exports = class PriorityQueue {

    /** 
     * @param {((value: T) => number)} comparator 
     */
    constructor(comparator) {
        /** @type {{data: T, priority: number}[]} */
        this.items = [];
        this.comparator = comparator;
    }

    /** @param {number} item */
    add(item) {
        let elem = {
            data: item,
            priority: this.comparator ? this.comparator(item) : 1
        };
        let contain = false;

        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].priority > elem.priority) {
                this.items.splice(i, 0, elem);
                contain = true;
                break;
            }
        }

        if (!contain) {
            this.items.push(elem);
        }
    }

    poll() {
        return this.isEmpty() ? undefined : this.items.shift().data;
    }

    isEmpty() {
        return this.items.length;
    }
}
},{}]},{},[3]);
