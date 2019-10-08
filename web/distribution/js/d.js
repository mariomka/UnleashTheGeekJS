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
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":2,"timers":3}],4:[function(require,module,exports){
(function (setImmediate){
const Constants = require("../src/Constants");
const Referee = require("../src/Referee");
const Player = require("../src/Player");
const SIMULATIONS = 100000;

let p1 = new Player(), p2 = new Player();

const Grid = Array.from({ length: Constants.MAP_HEIGHT }).map(() => []);

for (let y = 0; y < Constants.MAP_HEIGHT; y++) {
    for (let x = 0; x < Constants.MAP_WIDTH; x++) {
        Grid[y].push(0);
    }
}

const referee = new Referee(p1, p2);

const TILE_SIZE = 40;

window.onload = async () => {

    let status = document.createElement("h1");
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");

    canvas.width  = canvas.style.width  = Constants.MAP_WIDTH  * TILE_SIZE;
    canvas.height = canvas.style.height = Constants.MAP_HEIGHT * TILE_SIZE;

    document.body.appendChild(status);
    document.body.appendChild(canvas);

    const simulate = i => {
        referee.reset();
        referee.grid.cells.forEach(c => Grid[c.y][c.x] += c.ore && 1);
    
        if (!(i % 1000)) {
            status.innerHTML = `Running Simulation ${i || 1}`;
            requestAnimationFrame(() => simulate(i + 1));
            return;
        }

        if (i < SIMULATIONS) {
            setImmediate(() =>simulate(i + 1));
            return;
        }

        console.log("Here's the grid if you want to do anything with it (window.grid)", Grid);
        window.grid = Grid;
    
        for (let y in Grid) {
            let row = Grid[y];
            for (let x in row) {
                let ore = row[x];
                let freq = ore / SIMULATIONS;
                let greyScale = ~~(500 * freq);
                let color = `rgb(${greyScale},${greyScale},${greyScale})`;
    
                ctx.fillStyle = color;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                ctx.strokeStyle = "2px black";
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    
                ctx.fillStyle = greyScale > 255 / 2 ? "black" : "white";
                ctx.textAlign = "center";
                ctx.font = "Arial 14px";
                ctx.fillText(freq.toFixed(4), x * TILE_SIZE + TILE_SIZE / 2, 
                    y * TILE_SIZE + TILE_SIZE / 2 + 7);
            }
        }
    }

    simulate(0);
}
}).call(this,require("timers").setImmediate)
},{"../src/Constants":9,"../src/Player":16,"../src/Referee":17,"timers":3}],5:[function(require,module,exports){
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
        this.pos = pos;
        this.action = Action.NONE;
        this.initialPos = pos.clone();
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

    clone() {
        return new Coord(this.x, this.y);
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
        
        for (let i = 0; i < Constants.AGENTS_PER_PLAYER; i++) {
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
        this.resolveDelivers();
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

},{"../util/JavaFunctions":18,"./Action":5,"./Agent":6,"./Constants":9,"./Coord":10,"./Grid":12,"./Item":13}],12:[function(require,module,exports){
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
},{"../util/PriorityQueue":19,"./Cell":7,"./Constants":9,"./Coord":10,"./Item":13,"./ItemCoord":14,"./PathNode":15}],13:[function(require,module,exports){
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
const Item = require("./Item");
const Constants = require("./Constants");
let index = 0;

module.exports = class Player {
    
    constructor() {

        this.index = index++;
        this.ore = 0;

        /** @type {import("./Agent")[]} */
        this.agents = [];

        /** @type {Object<number, number} */
        this.cooldowns = {};

        this.cooldowns[Item.TRAP]  = 0;
        this.cooldowns[Item.RADAR] = 0;

        /** @type {Object<number, number} */
        this.cooldownTimes = {};
        
        this.cooldownTimes[Item.TRAP]  = Constants.TRAP_COOLDOWN;
        this.cooldownTimes[Item.RADAR] = Constants.RADAR_COOLDOWN;

        /** @type {string[]} */
        this.inputs = [];
        /** @type {string[]} */
        this.outputs = [];
    }

    /** @param {import("./Agent")} agent */
    addAgent(agent) {
        this.agents.push(agent);
    }

    decrementCooldowns() {
        for (let k in this.cooldowns) {
            this.cooldowns[k] && this.cooldowns[k]--;
        }
    }

    /** @param {number} item */
    startCooldown(item) {
        this.cooldowns[item] = this.cooldownTimes[item];
    }

    get expectedOutputLines() {
        return this.agents.length;
    }

    reset() {
        this.agents.forEach(a => a.reset());
    }

    scoreOre() {
        this.ore++;
    }

    get score() {
        return this.ore;
    }

    /** @param {string} line */
    sendInputLine(line) {
        this.inputs.push(line);
    }

    execute() {

    }

}
},{"./Constants":9,"./Item":13}],17:[function(require,module,exports){
const { EventEmitter } = require("events");

const Game = require("./Game");
const CommandManager = require("./CommandManager");

module.exports = class Referee extends EventEmitter {

    /** @param {import("./Player")[]} players */
    constructor(...players) {
        super();
        this.players = players;
        this.gap = 1000;
        this.maxTurns = 200;
    }

    reset() {

        this.game = new Game();
        this.game.players = this.players;

        this.game.init();
        this.game.initGameState();

        this.loop = false;
        this.turns = 0;
    }

    get grid() { return this.game.grid }

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
},{"./CommandManager":8,"./Game":11,"events":1}],18:[function(require,module,exports){
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
},{}],19:[function(require,module,exports){
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
},{}]},{},[4]);
