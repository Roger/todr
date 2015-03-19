webpackJsonp([0],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(3);
	var Morearty = __webpack_require__(7);

	var List = React.createFactory(__webpack_require__(4).List);
	var History = React.createFactory(__webpack_require__(5));

	var stores = __webpack_require__(6);

	var ROM = React.DOM;

	// require('./style.less');


	var App = React.createClass({
	  displayname: 'app',
	  mixins: [Morearty.Mixin],
	  render: function() {
	    var binding = this.getDefaultBinding();
	    return ROM.div({className: "container"}, [
	      History({key: "history", binding: binding}),
	      List({key: "list", binding: binding})
	    ]);
	  }
	});

	var Bootstrap = React.createFactory(stores.Ctx.bootstrap(App));
	React.render(Bootstrap(), document.body);


/***/ },
/* 2 */,
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(9);


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(3);
	var Morearty = __webpack_require__(7);
	var ROM = React.DOM;
	var Input = React.createFactory(Morearty.DOM.input);
	var stores = __webpack_require__(6);
	var actions = stores.actions;


	var Item = React.createClass({
	  displayName: 'Item',
	  mixins: [Morearty.Mixin],
	  focus: function() {
	    var ctx = this.getMoreartyContext();

	    if(this.props.selected) {
	      var dom = this.refs.input.getDOMNode();
	      dom.focus();
	      dom.setSelectionRange(dom.value.length, dom.value.length);
	    }
	  },
	  componentDidMount: function() {
	    this.focus();
	  },
	  componentDidUpdate: function(prevProps, prevState) {
	    if(prevProps.selected !== this.props.selected)
	      this.focus();
	  },
	  // selected it's not a binding.. so we should check by hand if it's changed
	  // maybe i can also store the selected attribute on the selected item..
	  shouldComponentUpdateOverride: function (shouldComponentUpdate, nextProps) {
	    return shouldComponentUpdate() ||
	      (this.props && nextProps && this.props.selected !== nextProps.selected);
	  },
	  onKeyDown: function(event) {
	    var key = event.key;
	    if(key === "Enter") {
	      actions.add("");
	    } else if(key === "ArrowUp") {
	      actions.prev();
	      event.preventDefault();
	    } else if(key === "ArrowDown") {
	      actions.next();
	      event.preventDefault();
	    } else if(key === "Backspace" || key === "Delete") {
	      var binding = this.getDefaultBinding();
	      var item = binding.get();

	      if(item.get("val") === "") {
	        key === "Backspace" ? actions.prev() : actions.next();
	        actions.remove(item.get("id"));
	      }
	    }
	  },
	  onFocus: function(event) {
	    var binding = this.getDefaultBinding();
	    actions.select(binding.get("id"));
	  },
	  onPaste: function(event) {
	    var binding = this.getDefaultBinding();

	    event.clipboardData.items[0].getAsString(function(string) {
	      var strings = string.trim().split("\n");
	      var first = strings.shift();
	      binding.set("val", binding.get("val") + first); 
	      strings.map(function(val) {
	        actions.add(val);
	      });
	    });
	    event.preventDefault();
	  },
	  render: function() {
	    var binding = this.getDefaultBinding();
	    var item = binding.get();

	    return Input({
	      ref: "input",
	      onPaste: this.onPaste,
	      onFocus: this.onFocus,
	      onKeyDown: this.onKeyDown,
	      onChange: Morearty.Callback.set(binding, 'val'),
	      value: item.get("val")
	    });
	  }
	});
	var ItemFactory = React.createFactory(Item);

	var List = React.createClass({
	  displayName: 'List',
	  mixins: [Morearty.Mixin],
	  onAdd: function(event) {
	    event.preventDefault();
	    actions.add("", true);
	  },
	  render: function() {
	    var binding = this.getDefaultBinding();
	    var selected = binding.get('selected');
	    var itemsBinding = binding.sub('items');
	    var items = itemsBinding.get();

	    var list = items.map(function(item, i) {
	      var itemBinding = itemsBinding.sub(i);
	      var id = item.get('id');

	      return ROM.li({key: id}, ItemFactory({
	        key: id,
	        selected: selected === id,
	        binding: itemBinding,
	        onKeyPress: this.onKeyPress
	      }));
	    }.bind(this));
	    return ROM.div(null, [
	      ROM.ul({key: "list"}, list.toArray()),
	      ROM.a({key: "link", href: "#", onClick: this.onAdd}, "Add new task!")
	    ]);
	  }
	});


	module.exports.List = List;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(3);
	var Morearty = __webpack_require__(7);

	var ROM = React.DOM;

	var History = React.createClass({
	  displayname: 'History',
	  mixins: [Morearty.Mixin],

	  componentWillMount: function() {
	    var binding = this.getDefaultBinding().sub('items');
	    Morearty.History.init(binding);
	  },
	  render: function() {
	    var binding = this.getDefaultBinding().sub('items');

	    return ROM.div(null, [
	      ROM.a({key: "undo", href:"#", onClick: function() {
	        Morearty.History.undo(binding)}
	      }, "Undo"),
	      " - ",
	      ROM.a({key: "redo", href: "#", onClick: function() {
	        Morearty.History.redo(binding)}
	      }, "Redo")
	    ]);
	  }
	});

	module.exports = History;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var React = __webpack_require__(3);
	var Morearty = __webpack_require__(7);
	var Reflux = __webpack_require__(11);
	var Immutable = __webpack_require__(33);
	var uuid = __webpack_require__(34);

	var NOW_SHOWING = Object.freeze({ALL: 'all', ACTIVE: 'active', COMPLETED: 'completed'});

	var state = {
	  selected: null,
	  items: []
	};

	var Ctx = Morearty.createContext({
	  initialState: state,
	  initialMetaState: {},
	  options: {}
	});

	Reflux.StoreMethods.getMoreartyContext = function() {
	  return Ctx;
	};


	var ItemsActions = Reflux.createActions([
	  'add',
	  'update',
	  'remove',
	  'select',
	  'next',
	  'prev'
	]);


	var ItemsStore = Reflux.createStore({
	  listenables: ItemsActions,

	  init: function() {
	    this.rootBinding = this.getMoreartyContext().getBinding();
	    this.itemsBinding = this.rootBinding.sub('items');
	  },

	  findIndex: function(id) {
	    return this.itemsBinding.get().findIndex(function(item) {
	      return item.get('id') === id;
	    });
	  },

	  onAdd: function (item, last) {
	    var selectedIdx;
	    if(last) {
	      selectedIdx = this.itemsBinding.get().count();
	    } else {
	      var selected = this.rootBinding.get("selected")
	      selectedIdx = this.findIndex(selected);
	    }

	    var id = uuid.v4();
	    this.itemsBinding.update(function (items) {
	      var newItem = Immutable.Map({id: id, val: item});
	      if(selectedIdx !== -1) {
	        return items.splice(selectedIdx+1, 0, newItem);
	      } else {
	        return items.push(newItem);
	      }
	    });
	    this.rootBinding.set('selected', id);
	  },

	  onUpdate: function (item) {
	    var itemIndex = this.findIndex(item.id);
	    this.itemsBinding.set(itemIndex, Immutable.Map(item));
	  },

	  onRemove: function (id) {
	    var itemIndex = this.findIndex(id);
	    var itemBinding = this.itemsBinding.sub(itemIndex);
	    this.itemsBinding.delete(itemIndex);
	  },

	  onSelect: function(id) {
	    this.rootBinding.set('selected', id);
	  },
	  onNext: function() {
	    var selected = this.rootBinding.get("selected")
	    var selectedIdx = this.findIndex(selected);
	    // Loop
	    if(this.itemsBinding.get().count() === selectedIdx + 1)
	      selectedIdx = -1;
	    var newSelected = this.itemsBinding.get(selectedIdx + 1);
	    this.rootBinding.set('selected', newSelected.get('id'));
	  },
	  onPrev: function() {
	    var selected = this.rootBinding.get("selected")
	    var selectedIdx = this.findIndex(selected);
	    var newSelected = this.itemsBinding.get(selectedIdx - 1);
	    this.rootBinding.set('selected', newSelected.get('id'));
	  }
	});

	module.exports.Ctx = Ctx;
	module.exports.actions = ItemsActions;
	module.exports.store = ItemsStore;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(10);


/***/ },
/* 8 */,
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactWithAddons
	 */

	/**
	 * This module exists purely in the open source project, and is meant as a way
	 * to create a separate standalone build of React. This build has "addons", or
	 * functionality we've built and think might be useful but doesn't have a good
	 * place to live inside React core.
	 */

	'use strict';

	var LinkedStateMixin = __webpack_require__(35);
	var React = __webpack_require__(8);
	var ReactComponentWithPureRenderMixin =
	  __webpack_require__(36);
	var ReactCSSTransitionGroup = __webpack_require__(37);
	var ReactFragment = __webpack_require__(38);
	var ReactTransitionGroup = __webpack_require__(39);
	var ReactUpdates = __webpack_require__(40);

	var cx = __webpack_require__(41);
	var cloneWithProps = __webpack_require__(42);
	var update = __webpack_require__(43);

	React.addons = {
	  CSSTransitionGroup: ReactCSSTransitionGroup,
	  LinkedStateMixin: LinkedStateMixin,
	  PureRenderMixin: ReactComponentWithPureRenderMixin,
	  TransitionGroup: ReactTransitionGroup,

	  batchedUpdates: ReactUpdates.batchedUpdates,
	  classSet: cx,
	  cloneWithProps: cloneWithProps,
	  createFragment: ReactFragment.create,
	  update: update
	};

	if ("production" !== process.env.NODE_ENV) {
	  React.addons.Perf = __webpack_require__(44);
	  React.addons.TestUtils = __webpack_require__(45);
	}

	module.exports = React;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(46)))

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @name Morearty
	 * @namespace
	 * @classdesc Morearty main module. Exposes [createContext]{@link Morearty.createContext} function.
	 */
	var Imm      = __webpack_require__(33);
	var React    = __webpack_require__(2);
	var Util     = __webpack_require__(47);
	var Binding  = __webpack_require__(48);
	var History  = __webpack_require__(49);
	var Callback = __webpack_require__(50);
	var DOM      = __webpack_require__(51);

	var MERGE_STRATEGY = Object.freeze({
	  OVERWRITE: 'overwrite',
	  OVERWRITE_EMPTY: 'overwrite-empty',
	  MERGE_PRESERVE: 'merge-preserve',
	  MERGE_REPLACE: 'merge-replace'
	});

	var getBinding, bindingChanged, observedBindingsChanged, stateChanged;

	getBinding = function (props, key) {
	  var binding = props.binding;
	  return key ? binding[key] : binding;
	};

	bindingChanged = function (context, currentBinding) {
	  return (context._stateChanged && currentBinding.isChanged(context._previousState)) ||
	         (context._metaChanged && context._metaBinding.sub(currentBinding.getPath()).isChanged(context._previousMetaState));
	};

	observedBindingsChanged = function (self) {
	  return self.observedBindings &&
	      !!Util.find(self.observedBindings, function (binding) {
	        return bindingChanged(self.getMoreartyContext(), binding);
	      });
	};

	stateChanged = function (self, currentBinding, previousBinding) {
	  var observedChanged = observedBindingsChanged(self);
	  if (!currentBinding && !observedChanged) {
	    return false;
	  } else {
	    if (observedChanged) {
	      return true;
	    } else {
	      var context = self.getMoreartyContext();
	      if (currentBinding instanceof Binding) {
	        return currentBinding !== previousBinding || bindingChanged(context, currentBinding);
	      } else {
	        if (context._stateChanged || context._metaChanged) {
	          var keys = Object.keys(currentBinding);
	          return !!Util.find(keys, function (key) {
	            var binding = currentBinding[key];
	            return binding && (binding !== previousBinding[key] || bindingChanged(context, binding));
	          });
	        } else {
	          return false;
	        }
	      }
	    }
	  }
	};

	var merge = function (mergeStrategy, defaultState, stateBinding) {
	  var tx = stateBinding.atomically();

	  if (typeof mergeStrategy === 'function') {
	    tx = tx.update(function (currentState) {
	      return mergeStrategy(currentState, defaultState);
	    });
	  } else {
	    switch (mergeStrategy) {
	      case MERGE_STRATEGY.OVERWRITE:
	        tx = tx.set(defaultState);
	        break;
	      case MERGE_STRATEGY.OVERWRITE_EMPTY:
	        tx = tx.update(function (currentState) {
	          var empty = Util.undefinedOrNull(currentState) ||
	            (currentState instanceof Imm.Iterable && currentState.isEmpty());
	          return empty ? defaultState : currentState;
	        });
	        break;
	      case MERGE_STRATEGY.MERGE_PRESERVE:
	        tx = tx.merge(true, defaultState);
	        break;
	      case MERGE_STRATEGY.MERGE_REPLACE:
	        tx = tx.merge(false, defaultState);
	        break;
	      default:
	        throw new Error('Invalid merge strategy: ' + mergeStrategy);
	    }
	  }

	  tx.commit({ notify: false });
	};

	var getRenderRoutine = function (self) {
	  var requestAnimationFrame = (typeof window !== 'undefined') && window.requestAnimationFrame;
	  var fallback = function (f) { setTimeout(f, 1000 / 60); };

	  if (self._options.requestAnimationFrameEnabled) {
	    if (requestAnimationFrame) return requestAnimationFrame;
	    else {
	      console.warn('Morearty: requestAnimationFrame is not available, will render in setTimeout');
	      return fallback;
	    }
	  } else {
	    return fallback;
	  }
	};

	/** Morearty context constructor.
	 * @param {Binding} binding state binding
	 * @param {Binding} metaBinding meta state binding
	 * @param {Object} options options
	 * @public
	 * @class Context
	 * @classdesc Represents Morearty context.
	 * <p>Exposed modules:
	 * <ul>
	 *   <li>[Util]{@link Util};</li>
	 *   <li>[Binding]{@link Binding};</li>
	 *   <li>[History]{@link History};</li>
	 *   <li>[Callback]{@link Callback};</li>
	 *   <li>[DOM]{@link DOM}.</li>
	 * </ul> */
	var Context = function (binding, metaBinding, options) {
	  /** @private */
	  this._initialMetaState = metaBinding.get();
	  /** @private */
	  this._previousMetaState = null;
	  /** @private */
	  this._metaBinding = metaBinding;
	  /** @protected
	   * @ignore */
	  this._metaChanged = false;

	  /** @private */
	  this._initialState = binding.get();
	  /** @protected
	   * @ignore */
	  this._previousState = null;
	  /** @private */
	  this._stateBinding = binding;
	  /** @protected
	   * @ignore */
	  this._stateChanged = false;

	  /** @private */
	  this._options = options;

	  /** @private */
	  this._renderQueued = false;
	  /** @private */
	  this._fullUpdateQueued = false;
	  /** @protected
	   * @ignore */
	  this._fullUpdateInProgress = false;
	};

	Context.prototype = Object.freeze( /** @lends Context.prototype */ {
	  /** Get state binding.
	   * @return {Binding} state binding
	   * @see Binding */
	  getBinding: function () {
	    return this._stateBinding;
	  },

	  /** Get meta binding.
	   * @return {Binding} meta binding
	   * @see Binding */
	  getMetaBinding: function () {
	    return this._metaBinding;
	  },

	  /** Get current state.
	   * @return {Immutable.Map} current state */
	  getCurrentState: function () {
	    return this.getBinding().get();
	  },

	  /** Get previous state (before last render).
	   * @return {Immutable.Map} previous state */
	  getPreviousState: function () {
	    return this._previousState;
	  },

	  /** Get current meta state.
	   * @returns {Immutable.Map} current meta state */
	  getCurrentMeta: function () {
	    var metaBinding = this.getMetaBinding();
	    return metaBinding ? metaBinding.get() : undefined;
	  },

	  /** Get previous meta state (before last render).
	   * @return {Immutable.Map} previous meta state */
	  getPreviousMeta: function () {
	    return this._previousMetaState;
	  },

	  /** Create a copy of this context sharing same bindings and options.
	   * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	   * @returns {Context} */
	  copy: function (subpath) {
	    return new Context(this._stateBinding.sub(subpath), this._metaBinding.sub(subpath), this._options);
	  },

	  /** Revert to initial state.
	   * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	   * @param {Object} [options] options object
	   * @param {Boolean} [options.notify=true] should listeners be notified
	   * @param {Boolean} [options.resetMeta=true] should meta state be reverted */
	  resetState: function (subpath, options) {
	    var args = Util.resolveArgs(
	      arguments,
	      function (x) { return Util.canRepresentSubpath(x) ? 'subpath' : null; }, '?options'
	    );

	    var pathAsArray = args.subpath ? Binding.asArrayPath(args.subpath) : [];

	    var tx = this.getBinding().atomically();
	    tx.set(pathAsArray, this._initialState.getIn(pathAsArray));

	    var effectiveOptions = args.options || {};
	    if (effectiveOptions.resetMeta !== false) {
	      tx.set(this.getMetaBinding(), pathAsArray, this._initialMetaState.getIn(pathAsArray));
	    }

	    tx.commit({ notify: effectiveOptions.notify });
	  },

	  /** Replace whole state with new value.
	   * @param {Immutable.Map} newState new state
	   * @param {Immutable.Map} [newMetaState] new meta state
	   * @param {Object} [options] options object
	   * @param {Boolean} [options.notify=true] should listeners be notified */
	  replaceState: function (newState, newMetaState, options) {
	    var args = Util.resolveArgs(
	      arguments,
	      'newState', function (x) { return x instanceof Imm.Map ? 'newMetaState' : null; }, '?options'
	    );

	    var effectiveOptions = args.options || {};

	    var tx = this.getBinding().atomically();
	    tx.set(newState);

	    if (args.newMetaState) tx.set(this.getMetaBinding(), args.newMetaState);

	    tx.commit({ notify: effectiveOptions.notify });
	  },

	  /** Check if binding value was changed on last re-render.
	   * @param {Binding} binding binding
	   * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	   * @param {Function} [compare] compare function, '===' for primitives / Immutable.is for collections by default */
	  isChanged: function (binding, subpath, compare) {
	    var args = Util.resolveArgs(
	      arguments,
	      'binding', function (x) { return Util.canRepresentSubpath(x) ? 'subpath' : null; }, '?compare'
	    );

	    return args.binding.sub(args.subpath).isChanged(this._previousState, args.compare || Imm.is);
	  },

	  /** Initialize rendering.
	   * @param {*} rootComp root application component */
	  init: function (rootComp) {
	    var self = this;
	    var stop = false;
	    var renderQueue = [];

	    var transitionState = function () {
	      var stateChanged, metaChanged;

	      if (renderQueue.length === 1) {
	        var singleFrame = renderQueue[0];

	        stateChanged = singleFrame.stateChanged;
	        metaChanged = singleFrame.metaChanged;

	        if (stateChanged) self._previousState = singleFrame.previousState;
	        if (metaChanged) self._previousMetaState = singleFrame.previousMetaState;
	      } else {
	        var elderStateChangedFrame = Util.find(renderQueue, function (q) { return q.stateChanged; });
	        var elderMetaChangedFrame = Util.find(renderQueue, function (q) { return q.metaChanged; });

	        stateChanged = !!elderStateChangedFrame;
	        metaChanged = !!elderMetaChangedFrame;

	        if (stateChanged) self._previousState = elderStateChangedFrame.previousState;
	        if (metaChanged) self._previousMetaState = elderMetaChangedFrame.previousMetaState;
	      }

	      self._stateChanged = stateChanged;
	      self._metaChanged = metaChanged;

	      renderQueue = [];
	    };

	    var catchingRenderErrors = function (f) {
	      try {
	        if (rootComp.isMounted()) {
	          f();
	        }
	      } catch (e) {
	        if (self._options.stopOnRenderError) {
	          stop = true;
	        }

	        console.error('Morearty: render error. ' + (stop ? 'Exiting.' : 'Continuing.'));
	        console.error('Error details: %s', e.message, e.stack);
	      }
	    };

	    var render = function () {
	      transitionState();

	      self._renderQueued = false;

	      catchingRenderErrors(function () {
	        if (self._fullUpdateQueued) {
	          self._fullUpdateInProgress = true;
	          rootComp.forceUpdate(function () {
	            self._fullUpdateQueued = false;
	            self._fullUpdateInProgress = false;
	          });
	        } else {
	          rootComp.forceUpdate();
	        }
	      });
	    };

	    if (!self._options.renderOnce) {
	      var renderRoutine = getRenderRoutine(self);

	      var listenerId = self._stateBinding.addListener(function (changes) {
	        if (stop) {
	          self._stateBinding.removeListener(listenerId);
	        } else {
	          var stateChanged = changes.isValueChanged(), metaChanged = changes.isMetaChanged();

	          if (stateChanged || metaChanged) {
	            renderQueue.push({
	              stateChanged: stateChanged,
	              metaChanged: metaChanged,
	              previousState: (stateChanged || null) && changes.getPreviousBackingValue(),
	              previousMetaState: (metaChanged || null) && changes.getPreviousBackingMeta()
	            });

	            if (!self._renderQueued) {
	              self._renderQueued = true;
	              renderRoutine(render);
	            }
	          }
	        }
	      });
	    }

	    catchingRenderErrors(rootComp.forceUpdate.bind(rootComp));
	  },

	  /** Queue full update on next render. */
	  queueFullUpdate: function () {
	    this._fullUpdateQueued = true;
	  },

	  /** Create Morearty bootstrap component ready for rendering.
	   * @param {*} rootComp root application component
	   * @param {Object} [reactContext] custom React context (will be enriched with Morearty-specific data)
	   * @return {*} Morearty bootstrap component */
	  bootstrap: function (rootComp, reactContext) {
	    var ctx = this;

	    var effectiveReactContext = reactContext || {};
	    effectiveReactContext.morearty = ctx;

	    return React.createClass({
	      displayName: 'Bootstrap',

	      childContextTypes: {
	        morearty: React.PropTypes.instanceOf(Context).isRequired
	      },

	      getChildContext: function () {
	        return effectiveReactContext;
	      },

	      componentWillMount: function () {
	        ctx.init(this);
	      },

	      render: function () {
	        return React.createFactory(rootComp)({ binding: ctx.getBinding() });
	      }
	    });
	  }

	});

	module.exports = {

	  /** Binding module.
	   * @memberOf Morearty
	   * @see Binding */
	  Binding: Binding,

	  /** History module.
	   * @memberOf Morearty
	   * @see History */
	  History: History,

	  /** Util module.
	   * @memberOf Morearty
	   * @see Util */
	  Util: Util,

	  /** Callback module.
	   * @memberOf Morearty
	   * @see Callback */
	  Callback: Callback,

	  /** DOM module.
	   * @memberOf Morearty
	   * @see DOM */
	  DOM: DOM,

	  /** Merge strategy.
	   * <p>Describes how existing state should be merged with component's default state on mount. Predefined strategies:
	   * <ul>
	   *   <li>OVERWRITE - overwrite current state with default state;</li>
	   *   <li>OVERWRITE_EMPTY - overwrite current state with default state only if current state is null or empty collection;</li>
	   *   <li>MERGE_PRESERVE - deep merge current state into default state;</li>
	   *   <li>MERGE_REPLACE - deep merge default state into current state.</li>
	   * </ul> */
	  MergeStrategy: MERGE_STRATEGY,

	  /** Morearty mixin.
	   * @memberOf Morearty
	   * @namespace
	   * @classdesc Mixin */
	  Mixin: {
	     contextTypes: {
	       morearty: React.PropTypes.instanceOf(Context).isRequired
	     },

	    /** Get Morearty context.
	     * @returns {Context} */
	    getMoreartyContext: function () {
	      return this.context.morearty;
	    },

	    /** Get component state binding. Returns binding specified in component's binding attribute.
	     * @param {String} [name] binding name (can only be used with multi-binding state)
	     * @return {Binding|Object} component state binding */
	    getBinding: function (name) {
	      return getBinding(this.props, name);
	    },

	    /** Get default component state binding. Use this to get component's binding.
	     * <p>Default binding is single binding for single-binding components or
	     * binding with key 'default' for multi-binding components.
	     * This method allows smooth migration from single to multi-binding components, e.g. you start with:
	     * <pre><code>{ binding: foo }</code></pre>
	     * or
	     * <pre><code>{ binding: { default: foo } }</code></pre>
	     * or even
	     * <pre><code>{ binding: { any: foo } }</code></pre>
	     * and add more bindings later:
	     * <pre><code>{ binding: { default: foo, aux: auxiliary } }</code></pre>
	     * This way code changes stay minimal.
	     * @return {Binding} default component state binding */
	    getDefaultBinding: function () {
	      var binding = getBinding(this.props);
	      if (binding instanceof Binding) {
	        return binding;
	      } else if (typeof binding === 'object') {
	        var keys = Object.keys(binding);
	        return keys.length === 1 ? binding[keys[0]] : binding['default'];
	      }
	    },

	    /** Get component previous state value.
	     * @param {String} [name] binding name (can only be used with multi-binding state)
	     * @return {Binding} previous component state value */
	    getPreviousState: function (name) {
	      var ctx = this.getMoreartyContext();
	      return getBinding(this.props, name).withBackingValue(ctx._previousState).get();
	    },

	    /** Consider specified binding for changes when rendering. Registering same binding twice has no effect.
	     * @param {Binding} binding
	     * @param {Function} [cb] optional callback receiving binding value
	     * @return {*} undefined if cb argument is ommitted, cb invocation result otherwise */
	    observeBinding: function (binding, cb) {
	      if (!this.observedBindings) {
	        this.observedBindings = [];
	      }

	      var bindingPath = binding.getPath();
	      if (!Util.find(this.observedBindings, function (b) { return b.getPath() === bindingPath; })) {
	        this.observedBindings.push(binding);
	      }

	      return cb ? cb(binding.get()) : undefined;
	    },

	    componentWillMount: function () {
	      if (typeof this.getDefaultState === 'function') {
	        var ctx = this.getMoreartyContext();
	        var defaultState = this.getDefaultState();
	        if (defaultState) {
	          var binding = getBinding(this.props);
	          var mergeStrategy =
	            typeof this.getMergeStrategy === 'function' ? this.getMergeStrategy() : MERGE_STRATEGY.MERGE_PRESERVE;

	          var immutableInstance = defaultState instanceof Imm.Iterable;

	          if (binding instanceof Binding) {
	            var effectiveDefaultState = immutableInstance ? defaultState : defaultState['default'];
	            merge.call(ctx, mergeStrategy, effectiveDefaultState, binding);
	          } else {
	            var keys = Object.keys(binding);
	            var defaultKey = keys.length === 1 ? keys[0] : 'default';
	            var effectiveMergeStrategy = typeof mergeStrategy === 'string' ? mergeStrategy : mergeStrategy[defaultKey];

	            if (immutableInstance) {
	              merge.call(ctx, effectiveMergeStrategy, defaultState, binding[defaultKey]);
	            } else {
	              keys.forEach(function (key) {
	                if (defaultState[key]) {
	                  merge.call(ctx, effectiveMergeStrategy, defaultState[key], binding[key]);
	                }
	              });
	            }
	          }
	        }
	      }
	    },

	    shouldComponentUpdate: function (nextProps, nextState) {
	      var self = this;
	      var ctx = self.getMoreartyContext();
	      var shouldComponentUpdate = function () {
	        if (ctx._fullUpdateInProgress) {
	          return true;
	        } else {
	          return stateChanged(self, getBinding(nextProps), getBinding(self.props));
	        }
	      };

	      var shouldComponentUpdateOverride = self.shouldComponentUpdateOverride;
	      return shouldComponentUpdateOverride ?
	        shouldComponentUpdateOverride(shouldComponentUpdate, nextProps, nextState) :
	        shouldComponentUpdate();
	    },

	    /** Add binding listener. Listener will be automatically removed on unmount
	     * if this.shouldRemoveListeners() returns true.
	     * @param {Binding} [binding] binding to attach listener to, default binding if omitted
	     * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	     * @param {Function} cb function receiving changes descriptor
	     * @return {String} listener id */
	    addBindingListener: function (binding, subpath, cb) {
	      var args = Util.resolveArgs(
	        arguments,
	        function (x) { return x instanceof Binding ? 'binding' : null; },
	        function (x) { return Util.canRepresentSubpath(x) ? 'subpath' : null; },
	        'cb'
	      );

	      var defaultBinding = this.getDefaultBinding();

	      if (defaultBinding) {
	        var effectiveBinding = args.binding || defaultBinding;
	        var listenerId = effectiveBinding.addListener(args.subpath, args.cb);
	        defaultBinding.meta().atomically()
	          .update('listeners', function (listeners) {
	            return listeners ? listeners.push(listenerId) : Imm.List.of(listenerId);
	          })
	          .commit({ notify: false });

	        return listenerId;
	      } else {
	        console.warn('Morearty: cannot attach binding listener to a component without default binding');
	      }
	    },

	    componentWillUnmount: function () {
	      if (typeof this.shouldRemoveListeners === 'function' && this.shouldRemoveListeners()) {
	        var binding = this.getDefaultBinding();
	        if (binding) {
	          var listenersBinding = binding.meta('listeners');
	          var listeners = listenersBinding.get();
	          if (listeners) {
	            listeners.forEach(binding.removeListener.bind(binding));
	            listenersBinding.atomically().remove().commit({notify: false});
	          }
	        }
	      }
	    }
	  },

	  /** Create Morearty context.
	   * @param {Object} [spec] spec object
	   * @param {Immutable.Map|Object} [spec.initialState={}] initial state
	   * @param {Immutable.Map|Object} [spec.initialMetaState={}] initial meta-state
	   * @param {Object} [spec.options={}] options object
	   * @param {Boolean} [spec.options.requestAnimationFrameEnabled=true] enable rendering in requestAnimationFrame
	   * @param {Boolean} [spec.options.renderOnce=false]
	   *                  ensure render is executed only once (useful for server-side rendering to save resources),
	   *                  any further state updates are ignored
	   * @param {Boolean} [spec.options.stopOnRenderError=false] stop on errors during render
	   * @return {Context}
	   * @memberOf Morearty */
	  createContext: function (spec) {
	    var initialState, initialMetaState, options;
	    if (arguments.length <= 1) {
	      var effectiveSpec = spec || {};
	      initialState = effectiveSpec.initialState;
	      initialMetaState = effectiveSpec.initialMetaState;
	      options = effectiveSpec.options;
	    } else {
	      console.warn(
	        'Passing multiple arguments to createContext is deprecated. Use single object form instead.'
	      );

	      initialState = arguments[0];
	      initialMetaState = arguments[1];
	      options = arguments[2];
	    }

	    var ensureImmutable = function (state) {
	      return state instanceof Imm.Iterable ? state : Imm.fromJS(state);
	    };

	    var state = ensureImmutable(initialState || {});
	    var metaState = ensureImmutable(initialMetaState || {});

	    var metaBinding = Binding.init(metaState);
	    var binding = Binding.init(state, metaBinding);

	    var effectiveOptions = options || {};
	    return new Context(binding, metaBinding, {
	      requestAnimationFrameEnabled: effectiveOptions.requestAnimationFrameEnabled !== false,
	      renderOnce: effectiveOptions.renderOnce || false,
	      stopOnRenderError: effectiveOptions.stopOnRenderError || false
	    });
	  }

	};



/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(52);


/***/ },
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */,
/* 21 */,
/* 22 */,
/* 23 */,
/* 24 */,
/* 25 */,
/* 26 */,
/* 27 */,
/* 28 */,
/* 29 */,
/* 30 */,
/* 31 */,
/* 32 */,
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 *  Copyright (c) 2014-2015, Facebook, Inc.
	 *  All rights reserved.
	 *
	 *  This source code is licensed under the BSD-style license found in the
	 *  LICENSE file in the root directory of this source tree. An additional grant
	 *  of patent rights can be found in the PATENTS file in the same directory.
	 */
	(function (global, factory) {
	  true ? module.exports = factory() :
	  typeof define === 'function' && define.amd ? define(factory) :
	  global.Immutable = factory()
	}(this, function () { 'use strict';var SLICE$0 = Array.prototype.slice;

	  function createClass(ctor, superClass) {
	    if (superClass) {
	      ctor.prototype = Object.create(superClass.prototype);
	    }
	    ctor.prototype.constructor = ctor;
	  }

	  // Used for setting prototype methods that IE8 chokes on.
	  var DELETE = 'delete';

	  // Constants describing the size of trie nodes.
	  var SHIFT = 5; // Resulted in best performance after ______?
	  var SIZE = 1 << SHIFT;
	  var MASK = SIZE - 1;

	  // A consistent shared value representing "not set" which equals nothing other
	  // than itself, and nothing that could be provided externally.
	  var NOT_SET = {};

	  // Boolean references, Rough equivalent of `bool &`.
	  var CHANGE_LENGTH = { value: false };
	  var DID_ALTER = { value: false };

	  function MakeRef(ref) {
	    ref.value = false;
	    return ref;
	  }

	  function SetRef(ref) {
	    ref && (ref.value = true);
	  }

	  // A function which returns a value representing an "owner" for transient writes
	  // to tries. The return value will only ever equal itself, and will not equal
	  // the return of any subsequent call of this function.
	  function OwnerID() {}

	  // http://jsperf.com/copy-array-inline
	  function arrCopy(arr, offset) {
	    offset = offset || 0;
	    var len = Math.max(0, arr.length - offset);
	    var newArr = new Array(len);
	    for (var ii = 0; ii < len; ii++) {
	      newArr[ii] = arr[ii + offset];
	    }
	    return newArr;
	  }

	  function ensureSize(iter) {
	    if (iter.size === undefined) {
	      iter.size = iter.__iterate(returnTrue);
	    }
	    return iter.size;
	  }

	  function wrapIndex(iter, index) {
	    return index >= 0 ? (+index) : ensureSize(iter) + (+index);
	  }

	  function returnTrue() {
	    return true;
	  }

	  function wholeSlice(begin, end, size) {
	    return (begin === 0 || (size !== undefined && begin <= -size)) &&
	      (end === undefined || (size !== undefined && end >= size));
	  }

	  function resolveBegin(begin, size) {
	    return resolveIndex(begin, size, 0);
	  }

	  function resolveEnd(end, size) {
	    return resolveIndex(end, size, size);
	  }

	  function resolveIndex(index, size, defaultIndex) {
	    return index === undefined ?
	      defaultIndex :
	      index < 0 ?
	        Math.max(0, size + index) :
	        size === undefined ?
	          index :
	          Math.min(size, index);
	  }

	  function Iterable(value) {
	      return isIterable(value) ? value : Seq(value);
	    }


	  createClass(KeyedIterable, Iterable);
	    function KeyedIterable(value) {
	      return isKeyed(value) ? value : KeyedSeq(value);
	    }


	  createClass(IndexedIterable, Iterable);
	    function IndexedIterable(value) {
	      return isIndexed(value) ? value : IndexedSeq(value);
	    }


	  createClass(SetIterable, Iterable);
	    function SetIterable(value) {
	      return isIterable(value) && !isAssociative(value) ? value : SetSeq(value);
	    }



	  function isIterable(maybeIterable) {
	    return !!(maybeIterable && maybeIterable[IS_ITERABLE_SENTINEL]);
	  }

	  function isKeyed(maybeKeyed) {
	    return !!(maybeKeyed && maybeKeyed[IS_KEYED_SENTINEL]);
	  }

	  function isIndexed(maybeIndexed) {
	    return !!(maybeIndexed && maybeIndexed[IS_INDEXED_SENTINEL]);
	  }

	  function isAssociative(maybeAssociative) {
	    return isKeyed(maybeAssociative) || isIndexed(maybeAssociative);
	  }

	  function isOrdered(maybeOrdered) {
	    return !!(maybeOrdered && maybeOrdered[IS_ORDERED_SENTINEL]);
	  }

	  Iterable.isIterable = isIterable;
	  Iterable.isKeyed = isKeyed;
	  Iterable.isIndexed = isIndexed;
	  Iterable.isAssociative = isAssociative;
	  Iterable.isOrdered = isOrdered;

	  Iterable.Keyed = KeyedIterable;
	  Iterable.Indexed = IndexedIterable;
	  Iterable.Set = SetIterable;


	  var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
	  var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
	  var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
	  var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

	  /* global Symbol */

	  var ITERATE_KEYS = 0;
	  var ITERATE_VALUES = 1;
	  var ITERATE_ENTRIES = 2;

	  var REAL_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
	  var FAUX_ITERATOR_SYMBOL = '@@iterator';

	  var ITERATOR_SYMBOL = REAL_ITERATOR_SYMBOL || FAUX_ITERATOR_SYMBOL;


	  function src_Iterator__Iterator(next) {
	      this.next = next;
	    }

	    src_Iterator__Iterator.prototype.toString = function() {
	      return '[Iterator]';
	    };


	  src_Iterator__Iterator.KEYS = ITERATE_KEYS;
	  src_Iterator__Iterator.VALUES = ITERATE_VALUES;
	  src_Iterator__Iterator.ENTRIES = ITERATE_ENTRIES;

	  src_Iterator__Iterator.prototype.inspect =
	  src_Iterator__Iterator.prototype.toSource = function () { return this.toString(); }
	  src_Iterator__Iterator.prototype[ITERATOR_SYMBOL] = function () {
	    return this;
	  };


	  function iteratorValue(type, k, v, iteratorResult) {
	    var value = type === 0 ? k : type === 1 ? v : [k, v];
	    iteratorResult ? (iteratorResult.value = value) : (iteratorResult = {
	      value: value, done: false
	    });
	    return iteratorResult;
	  }

	  function iteratorDone() {
	    return { value: undefined, done: true };
	  }

	  function hasIterator(maybeIterable) {
	    return !!getIteratorFn(maybeIterable);
	  }

	  function isIterator(maybeIterator) {
	    return maybeIterator && typeof maybeIterator.next === 'function';
	  }

	  function getIterator(iterable) {
	    var iteratorFn = getIteratorFn(iterable);
	    return iteratorFn && iteratorFn.call(iterable);
	  }

	  function getIteratorFn(iterable) {
	    var iteratorFn = iterable && (
	      (REAL_ITERATOR_SYMBOL && iterable[REAL_ITERATOR_SYMBOL]) ||
	      iterable[FAUX_ITERATOR_SYMBOL]
	    );
	    if (typeof iteratorFn === 'function') {
	      return iteratorFn;
	    }
	  }

	  function isArrayLike(value) {
	    return value && typeof value.length === 'number';
	  }

	  createClass(Seq, Iterable);
	    function Seq(value) {
	      return value === null || value === undefined ? emptySequence() :
	        isIterable(value) ? value.toSeq() : seqFromValue(value);
	    }

	    Seq.of = function(/*...values*/) {
	      return Seq(arguments);
	    };

	    Seq.prototype.toSeq = function() {
	      return this;
	    };

	    Seq.prototype.toString = function() {
	      return this.__toString('Seq {', '}');
	    };

	    Seq.prototype.cacheResult = function() {
	      if (!this._cache && this.__iterateUncached) {
	        this._cache = this.entrySeq().toArray();
	        this.size = this._cache.length;
	      }
	      return this;
	    };

	    // abstract __iterateUncached(fn, reverse)

	    Seq.prototype.__iterate = function(fn, reverse) {
	      return seqIterate(this, fn, reverse, true);
	    };

	    // abstract __iteratorUncached(type, reverse)

	    Seq.prototype.__iterator = function(type, reverse) {
	      return seqIterator(this, type, reverse, true);
	    };



	  createClass(KeyedSeq, Seq);
	    function KeyedSeq(value) {
	      return value === null || value === undefined ?
	        emptySequence().toKeyedSeq() :
	        isIterable(value) ?
	          (isKeyed(value) ? value.toSeq() : value.fromEntrySeq()) :
	          keyedSeqFromValue(value);
	    }

	    KeyedSeq.prototype.toKeyedSeq = function() {
	      return this;
	    };



	  createClass(IndexedSeq, Seq);
	    function IndexedSeq(value) {
	      return value === null || value === undefined ? emptySequence() :
	        !isIterable(value) ? indexedSeqFromValue(value) :
	        isKeyed(value) ? value.entrySeq() : value.toIndexedSeq();
	    }

	    IndexedSeq.of = function(/*...values*/) {
	      return IndexedSeq(arguments);
	    };

	    IndexedSeq.prototype.toIndexedSeq = function() {
	      return this;
	    };

	    IndexedSeq.prototype.toString = function() {
	      return this.__toString('Seq [', ']');
	    };

	    IndexedSeq.prototype.__iterate = function(fn, reverse) {
	      return seqIterate(this, fn, reverse, false);
	    };

	    IndexedSeq.prototype.__iterator = function(type, reverse) {
	      return seqIterator(this, type, reverse, false);
	    };



	  createClass(SetSeq, Seq);
	    function SetSeq(value) {
	      return (
	        value === null || value === undefined ? emptySequence() :
	        !isIterable(value) ? indexedSeqFromValue(value) :
	        isKeyed(value) ? value.entrySeq() : value
	      ).toSetSeq();
	    }

	    SetSeq.of = function(/*...values*/) {
	      return SetSeq(arguments);
	    };

	    SetSeq.prototype.toSetSeq = function() {
	      return this;
	    };



	  Seq.isSeq = isSeq;
	  Seq.Keyed = KeyedSeq;
	  Seq.Set = SetSeq;
	  Seq.Indexed = IndexedSeq;

	  var IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@';

	  Seq.prototype[IS_SEQ_SENTINEL] = true;



	  // #pragma Root Sequences

	  createClass(ArraySeq, IndexedSeq);
	    function ArraySeq(array) {
	      this._array = array;
	      this.size = array.length;
	    }

	    ArraySeq.prototype.get = function(index, notSetValue) {
	      return this.has(index) ? this._array[wrapIndex(this, index)] : notSetValue;
	    };

	    ArraySeq.prototype.__iterate = function(fn, reverse) {
	      var array = this._array;
	      var maxIndex = array.length - 1;
	      for (var ii = 0; ii <= maxIndex; ii++) {
	        if (fn(array[reverse ? maxIndex - ii : ii], ii, this) === false) {
	          return ii + 1;
	        }
	      }
	      return ii;
	    };

	    ArraySeq.prototype.__iterator = function(type, reverse) {
	      var array = this._array;
	      var maxIndex = array.length - 1;
	      var ii = 0;
	      return new src_Iterator__Iterator(function() 
	        {return ii > maxIndex ?
	          iteratorDone() :
	          iteratorValue(type, ii, array[reverse ? maxIndex - ii++ : ii++])}
	      );
	    };



	  createClass(ObjectSeq, KeyedSeq);
	    function ObjectSeq(object) {
	      var keys = Object.keys(object);
	      this._object = object;
	      this._keys = keys;
	      this.size = keys.length;
	    }

	    ObjectSeq.prototype.get = function(key, notSetValue) {
	      if (notSetValue !== undefined && !this.has(key)) {
	        return notSetValue;
	      }
	      return this._object[key];
	    };

	    ObjectSeq.prototype.has = function(key) {
	      return this._object.hasOwnProperty(key);
	    };

	    ObjectSeq.prototype.__iterate = function(fn, reverse) {
	      var object = this._object;
	      var keys = this._keys;
	      var maxIndex = keys.length - 1;
	      for (var ii = 0; ii <= maxIndex; ii++) {
	        var key = keys[reverse ? maxIndex - ii : ii];
	        if (fn(object[key], key, this) === false) {
	          return ii + 1;
	        }
	      }
	      return ii;
	    };

	    ObjectSeq.prototype.__iterator = function(type, reverse) {
	      var object = this._object;
	      var keys = this._keys;
	      var maxIndex = keys.length - 1;
	      var ii = 0;
	      return new src_Iterator__Iterator(function()  {
	        var key = keys[reverse ? maxIndex - ii : ii];
	        return ii++ > maxIndex ?
	          iteratorDone() :
	          iteratorValue(type, key, object[key]);
	      });
	    };

	  ObjectSeq.prototype[IS_ORDERED_SENTINEL] = true;


	  createClass(IterableSeq, IndexedSeq);
	    function IterableSeq(iterable) {
	      this._iterable = iterable;
	      this.size = iterable.length || iterable.size;
	    }

	    IterableSeq.prototype.__iterateUncached = function(fn, reverse) {
	      if (reverse) {
	        return this.cacheResult().__iterate(fn, reverse);
	      }
	      var iterable = this._iterable;
	      var iterator = getIterator(iterable);
	      var iterations = 0;
	      if (isIterator(iterator)) {
	        var step;
	        while (!(step = iterator.next()).done) {
	          if (fn(step.value, iterations++, this) === false) {
	            break;
	          }
	        }
	      }
	      return iterations;
	    };

	    IterableSeq.prototype.__iteratorUncached = function(type, reverse) {
	      if (reverse) {
	        return this.cacheResult().__iterator(type, reverse);
	      }
	      var iterable = this._iterable;
	      var iterator = getIterator(iterable);
	      if (!isIterator(iterator)) {
	        return new src_Iterator__Iterator(iteratorDone);
	      }
	      var iterations = 0;
	      return new src_Iterator__Iterator(function()  {
	        var step = iterator.next();
	        return step.done ? step : iteratorValue(type, iterations++, step.value);
	      });
	    };



	  createClass(IteratorSeq, IndexedSeq);
	    function IteratorSeq(iterator) {
	      this._iterator = iterator;
	      this._iteratorCache = [];
	    }

	    IteratorSeq.prototype.__iterateUncached = function(fn, reverse) {
	      if (reverse) {
	        return this.cacheResult().__iterate(fn, reverse);
	      }
	      var iterator = this._iterator;
	      var cache = this._iteratorCache;
	      var iterations = 0;
	      while (iterations < cache.length) {
	        if (fn(cache[iterations], iterations++, this) === false) {
	          return iterations;
	        }
	      }
	      var step;
	      while (!(step = iterator.next()).done) {
	        var val = step.value;
	        cache[iterations] = val;
	        if (fn(val, iterations++, this) === false) {
	          break;
	        }
	      }
	      return iterations;
	    };

	    IteratorSeq.prototype.__iteratorUncached = function(type, reverse) {
	      if (reverse) {
	        return this.cacheResult().__iterator(type, reverse);
	      }
	      var iterator = this._iterator;
	      var cache = this._iteratorCache;
	      var iterations = 0;
	      return new src_Iterator__Iterator(function()  {
	        if (iterations >= cache.length) {
	          var step = iterator.next();
	          if (step.done) {
	            return step;
	          }
	          cache[iterations] = step.value;
	        }
	        return iteratorValue(type, iterations, cache[iterations++]);
	      });
	    };




	  // # pragma Helper functions

	  function isSeq(maybeSeq) {
	    return !!(maybeSeq && maybeSeq[IS_SEQ_SENTINEL]);
	  }

	  var EMPTY_SEQ;

	  function emptySequence() {
	    return EMPTY_SEQ || (EMPTY_SEQ = new ArraySeq([]));
	  }

	  function keyedSeqFromValue(value) {
	    var seq =
	      Array.isArray(value) ? new ArraySeq(value).fromEntrySeq() :
	      isIterator(value) ? new IteratorSeq(value).fromEntrySeq() :
	      hasIterator(value) ? new IterableSeq(value).fromEntrySeq() :
	      typeof value === 'object' ? new ObjectSeq(value) :
	      undefined;
	    if (!seq) {
	      throw new TypeError(
	        'Expected Array or iterable object of [k, v] entries, '+
	        'or keyed object: ' + value
	      );
	    }
	    return seq;
	  }

	  function indexedSeqFromValue(value) {
	    var seq = maybeIndexedSeqFromValue(value);
	    if (!seq) {
	      throw new TypeError(
	        'Expected Array or iterable object of values: ' + value
	      );
	    }
	    return seq;
	  }

	  function seqFromValue(value) {
	    var seq = maybeIndexedSeqFromValue(value) ||
	      (typeof value === 'object' && new ObjectSeq(value));
	    if (!seq) {
	      throw new TypeError(
	        'Expected Array or iterable object of values, or keyed object: ' + value
	      );
	    }
	    return seq;
	  }

	  function maybeIndexedSeqFromValue(value) {
	    return (
	      isArrayLike(value) ? new ArraySeq(value) :
	      isIterator(value) ? new IteratorSeq(value) :
	      hasIterator(value) ? new IterableSeq(value) :
	      undefined
	    );
	  }

	  function seqIterate(seq, fn, reverse, useKeys) {
	    var cache = seq._cache;
	    if (cache) {
	      var maxIndex = cache.length - 1;
	      for (var ii = 0; ii <= maxIndex; ii++) {
	        var entry = cache[reverse ? maxIndex - ii : ii];
	        if (fn(entry[1], useKeys ? entry[0] : ii, seq) === false) {
	          return ii + 1;
	        }
	      }
	      return ii;
	    }
	    return seq.__iterateUncached(fn, reverse);
	  }

	  function seqIterator(seq, type, reverse, useKeys) {
	    var cache = seq._cache;
	    if (cache) {
	      var maxIndex = cache.length - 1;
	      var ii = 0;
	      return new src_Iterator__Iterator(function()  {
	        var entry = cache[reverse ? maxIndex - ii : ii];
	        return ii++ > maxIndex ?
	          iteratorDone() :
	          iteratorValue(type, useKeys ? entry[0] : ii - 1, entry[1]);
	      });
	    }
	    return seq.__iteratorUncached(type, reverse);
	  }

	  createClass(Collection, Iterable);
	    function Collection() {
	      throw TypeError('Abstract');
	    }


	  createClass(KeyedCollection, Collection);function KeyedCollection() {}

	  createClass(IndexedCollection, Collection);function IndexedCollection() {}

	  createClass(SetCollection, Collection);function SetCollection() {}


	  Collection.Keyed = KeyedCollection;
	  Collection.Indexed = IndexedCollection;
	  Collection.Set = SetCollection;

	  /**
	   * An extension of the "same-value" algorithm as [described for use by ES6 Map
	   * and Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Key_equality)
	   *
	   * NaN is considered the same as NaN, however -0 and 0 are considered the same
	   * value, which is different from the algorithm described by
	   * [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).
	   *
	   * This is extended further to allow Objects to describe the values they
	   * represent, by way of `valueOf` or `equals` (and `hashCode`).
	   *
	   * Note: because of this extension, the key equality of Immutable.Map and the
	   * value equality of Immutable.Set will differ from ES6 Map and Set.
	   *
	   * ### Defining custom values
	   *
	   * The easiest way to describe the value an object represents is by implementing
	   * `valueOf`. For example, `Date` represents a value by returning a unix
	   * timestamp for `valueOf`:
	   *
	   *     var date1 = new Date(1234567890000); // Fri Feb 13 2009 ...
	   *     var date2 = new Date(1234567890000);
	   *     date1.valueOf(); // 1234567890000
	   *     assert( date1 !== date2 );
	   *     assert( Immutable.is( date1, date2 ) );
	   *
	   * Note: overriding `valueOf` may have other implications if you use this object
	   * where JavaScript expects a primitive, such as implicit string coercion.
	   *
	   * For more complex types, especially collections, implementing `valueOf` may
	   * not be performant. An alternative is to implement `equals` and `hashCode`.
	   *
	   * `equals` takes another object, presumably of similar type, and returns true
	   * if the it is equal. Equality is symmetrical, so the same result should be
	   * returned if this and the argument are flipped.
	   *
	   *     assert( a.equals(b) === b.equals(a) );
	   *
	   * `hashCode` returns a 32bit integer number representing the object which will
	   * be used to determine how to store the value object in a Map or Set. You must
	   * provide both or neither methods, one must not exist without the other.
	   *
	   * Also, an important relationship between these methods must be upheld: if two
	   * values are equal, they *must* return the same hashCode. If the values are not
	   * equal, they might have the same hashCode; this is called a hash collision,
	   * and while undesirable for performance reasons, it is acceptable.
	   *
	   *     if (a.equals(b)) {
	   *       assert( a.hashCode() === b.hashCode() );
	   *     }
	   *
	   * All Immutable collections implement `equals` and `hashCode`.
	   *
	   */
	  function is(valueA, valueB) {
	    if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
	      return true;
	    }
	    if (!valueA || !valueB) {
	      return false;
	    }
	    if (typeof valueA.valueOf === 'function' &&
	        typeof valueB.valueOf === 'function') {
	      valueA = valueA.valueOf();
	      valueB = valueB.valueOf();
	    }
	    return typeof valueA.equals === 'function' &&
	      typeof valueB.equals === 'function' ?
	        valueA.equals(valueB) :
	        valueA === valueB || (valueA !== valueA && valueB !== valueB);
	  }

	  function fromJS(json, converter) {
	    return converter ?
	      fromJSWith(converter, json, '', {'': json}) :
	      fromJSDefault(json);
	  }

	  function fromJSWith(converter, json, key, parentJSON) {
	    if (Array.isArray(json)) {
	      return converter.call(parentJSON, key, IndexedSeq(json).map(function(v, k)  {return fromJSWith(converter, v, k, json)}));
	    }
	    if (isPlainObj(json)) {
	      return converter.call(parentJSON, key, KeyedSeq(json).map(function(v, k)  {return fromJSWith(converter, v, k, json)}));
	    }
	    return json;
	  }

	  function fromJSDefault(json) {
	    if (Array.isArray(json)) {
	      return IndexedSeq(json).map(fromJSDefault).toList();
	    }
	    if (isPlainObj(json)) {
	      return KeyedSeq(json).map(fromJSDefault).toMap();
	    }
	    return json;
	  }

	  function isPlainObj(value) {
	    return value && (value.constructor === Object || value.constructor === undefined);
	  }

	  var src_Math__imul =
	    typeof Math.imul === 'function' && Math.imul(0xffffffff, 2) === -2 ?
	    Math.imul :
	    function src_Math__imul(a, b) {
	      a = a | 0; // int
	      b = b | 0; // int
	      var c = a & 0xffff;
	      var d = b & 0xffff;
	      // Shift by 0 fixes the sign on the high part.
	      return (c * d) + ((((a >>> 16) * d + c * (b >>> 16)) << 16) >>> 0) | 0; // int
	    };

	  // v8 has an optimization for storing 31-bit signed numbers.
	  // Values which have either 00 or 11 as the high order bits qualify.
	  // This function drops the highest order bit in a signed number, maintaining
	  // the sign bit.
	  function smi(i32) {
	    return ((i32 >>> 1) & 0x40000000) | (i32 & 0xBFFFFFFF);
	  }

	  function hash(o) {
	    if (o === false || o === null || o === undefined) {
	      return 0;
	    }
	    if (typeof o.valueOf === 'function') {
	      o = o.valueOf();
	      if (o === false || o === null || o === undefined) {
	        return 0;
	      }
	    }
	    if (o === true) {
	      return 1;
	    }
	    var type = typeof o;
	    if (type === 'number') {
	      var h = o | 0;
	      if (h !== o) {
	        h ^= o * 0xFFFFFFFF;
	      }
	      while (o > 0xFFFFFFFF) {
	        o /= 0xFFFFFFFF;
	        h ^= o;
	      }
	      return smi(h);
	    }
	    if (type === 'string') {
	      return o.length > STRING_HASH_CACHE_MIN_STRLEN ? cachedHashString(o) : hashString(o);
	    }
	    if (typeof o.hashCode === 'function') {
	      return o.hashCode();
	    }
	    return hashJSObj(o);
	  }

	  function cachedHashString(string) {
	    var hash = stringHashCache[string];
	    if (hash === undefined) {
	      hash = hashString(string);
	      if (STRING_HASH_CACHE_SIZE === STRING_HASH_CACHE_MAX_SIZE) {
	        STRING_HASH_CACHE_SIZE = 0;
	        stringHashCache = {};
	      }
	      STRING_HASH_CACHE_SIZE++;
	      stringHashCache[string] = hash;
	    }
	    return hash;
	  }

	  // http://jsperf.com/hashing-strings
	  function hashString(string) {
	    // This is the hash from JVM
	    // The hash code for a string is computed as
	    // s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
	    // where s[i] is the ith character of the string and n is the length of
	    // the string. We "mod" the result to make it between 0 (inclusive) and 2^31
	    // (exclusive) by dropping high bits.
	    var hash = 0;
	    for (var ii = 0; ii < string.length; ii++) {
	      hash = 31 * hash + string.charCodeAt(ii) | 0;
	    }
	    return smi(hash);
	  }

	  function hashJSObj(obj) {
	    var hash = weakMap && weakMap.get(obj);
	    if (hash) return hash;

	    hash = obj[UID_HASH_KEY];
	    if (hash) return hash;

	    if (!canDefineProperty) {
	      hash = obj.propertyIsEnumerable && obj.propertyIsEnumerable[UID_HASH_KEY];
	      if (hash) return hash;

	      hash = getIENodeHash(obj);
	      if (hash) return hash;
	    }

	    if (Object.isExtensible && !Object.isExtensible(obj)) {
	      throw new Error('Non-extensible objects are not allowed as keys.');
	    }

	    hash = ++objHashUID;
	    if (objHashUID & 0x40000000) {
	      objHashUID = 0;
	    }

	    if (weakMap) {
	      weakMap.set(obj, hash);
	    } else if (canDefineProperty) {
	      Object.defineProperty(obj, UID_HASH_KEY, {
	        'enumerable': false,
	        'configurable': false,
	        'writable': false,
	        'value': hash
	      });
	    } else if (obj.propertyIsEnumerable &&
	               obj.propertyIsEnumerable === obj.constructor.prototype.propertyIsEnumerable) {
	      // Since we can't define a non-enumerable property on the object
	      // we'll hijack one of the less-used non-enumerable properties to
	      // save our hash on it. Since this is a function it will not show up in
	      // `JSON.stringify` which is what we want.
	      obj.propertyIsEnumerable = function() {
	        return this.constructor.prototype.propertyIsEnumerable.apply(this, arguments);
	      };
	      obj.propertyIsEnumerable[UID_HASH_KEY] = hash;
	    } else if (obj.nodeType) {
	      // At this point we couldn't get the IE `uniqueID` to use as a hash
	      // and we couldn't use a non-enumerable property to exploit the
	      // dontEnum bug so we simply add the `UID_HASH_KEY` on the node
	      // itself.
	      obj[UID_HASH_KEY] = hash;
	    } else {
	      throw new Error('Unable to set a non-enumerable property on object.');
	    }

	    return hash;
	  }

	  // True if Object.defineProperty works as expected. IE8 fails this test.
	  var canDefineProperty = (function() {
	    try {
	      Object.defineProperty({}, '@', {});
	      return true;
	    } catch (e) {
	      return false;
	    }
	  }());

	  // IE has a `uniqueID` property on DOM nodes. We can construct the hash from it
	  // and avoid memory leaks from the IE cloneNode bug.
	  function getIENodeHash(node) {
	    if (node && node.nodeType > 0) {
	      switch (node.nodeType) {
	        case 1: // Element
	          return node.uniqueID;
	        case 9: // Document
	          return node.documentElement && node.documentElement.uniqueID;
	      }
	    }
	  }

	  // If possible, use a WeakMap.
	  var weakMap = typeof WeakMap === 'function' && new WeakMap();

	  var objHashUID = 0;

	  var UID_HASH_KEY = '__immutablehash__';
	  if (typeof Symbol === 'function') {
	    UID_HASH_KEY = Symbol(UID_HASH_KEY);
	  }

	  var STRING_HASH_CACHE_MIN_STRLEN = 16;
	  var STRING_HASH_CACHE_MAX_SIZE = 255;
	  var STRING_HASH_CACHE_SIZE = 0;
	  var stringHashCache = {};

	  function invariant(condition, error) {
	    if (!condition) throw new Error(error);
	  }

	  function assertNotInfinite(size) {
	    invariant(
	      size !== Infinity,
	      'Cannot perform this action with an infinite size.'
	    );
	  }

	  createClass(ToKeyedSequence, KeyedSeq);
	    function ToKeyedSequence(indexed, useKeys) {
	      this._iter = indexed;
	      this._useKeys = useKeys;
	      this.size = indexed.size;
	    }

	    ToKeyedSequence.prototype.get = function(key, notSetValue) {
	      return this._iter.get(key, notSetValue);
	    };

	    ToKeyedSequence.prototype.has = function(key) {
	      return this._iter.has(key);
	    };

	    ToKeyedSequence.prototype.valueSeq = function() {
	      return this._iter.valueSeq();
	    };

	    ToKeyedSequence.prototype.reverse = function() {var this$0 = this;
	      var reversedSequence = reverseFactory(this, true);
	      if (!this._useKeys) {
	        reversedSequence.valueSeq = function()  {return this$0._iter.toSeq().reverse()};
	      }
	      return reversedSequence;
	    };

	    ToKeyedSequence.prototype.map = function(mapper, context) {var this$0 = this;
	      var mappedSequence = mapFactory(this, mapper, context);
	      if (!this._useKeys) {
	        mappedSequence.valueSeq = function()  {return this$0._iter.toSeq().map(mapper, context)};
	      }
	      return mappedSequence;
	    };

	    ToKeyedSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      var ii;
	      return this._iter.__iterate(
	        this._useKeys ?
	          function(v, k)  {return fn(v, k, this$0)} :
	          ((ii = reverse ? resolveSize(this) : 0),
	            function(v ) {return fn(v, reverse ? --ii : ii++, this$0)}),
	        reverse
	      );
	    };

	    ToKeyedSequence.prototype.__iterator = function(type, reverse) {
	      if (this._useKeys) {
	        return this._iter.__iterator(type, reverse);
	      }
	      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
	      var ii = reverse ? resolveSize(this) : 0;
	      return new src_Iterator__Iterator(function()  {
	        var step = iterator.next();
	        return step.done ? step :
	          iteratorValue(type, reverse ? --ii : ii++, step.value, step);
	      });
	    };

	  ToKeyedSequence.prototype[IS_ORDERED_SENTINEL] = true;


	  createClass(ToIndexedSequence, IndexedSeq);
	    function ToIndexedSequence(iter) {
	      this._iter = iter;
	      this.size = iter.size;
	    }

	    ToIndexedSequence.prototype.contains = function(value) {
	      return this._iter.contains(value);
	    };

	    ToIndexedSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      var iterations = 0;
	      return this._iter.__iterate(function(v ) {return fn(v, iterations++, this$0)}, reverse);
	    };

	    ToIndexedSequence.prototype.__iterator = function(type, reverse) {
	      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
	      var iterations = 0;
	      return new src_Iterator__Iterator(function()  {
	        var step = iterator.next();
	        return step.done ? step :
	          iteratorValue(type, iterations++, step.value, step)
	      });
	    };



	  createClass(ToSetSequence, SetSeq);
	    function ToSetSequence(iter) {
	      this._iter = iter;
	      this.size = iter.size;
	    }

	    ToSetSequence.prototype.has = function(key) {
	      return this._iter.contains(key);
	    };

	    ToSetSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      return this._iter.__iterate(function(v ) {return fn(v, v, this$0)}, reverse);
	    };

	    ToSetSequence.prototype.__iterator = function(type, reverse) {
	      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
	      return new src_Iterator__Iterator(function()  {
	        var step = iterator.next();
	        return step.done ? step :
	          iteratorValue(type, step.value, step.value, step);
	      });
	    };



	  createClass(FromEntriesSequence, KeyedSeq);
	    function FromEntriesSequence(entries) {
	      this._iter = entries;
	      this.size = entries.size;
	    }

	    FromEntriesSequence.prototype.entrySeq = function() {
	      return this._iter.toSeq();
	    };

	    FromEntriesSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      return this._iter.__iterate(function(entry ) {
	        // Check if entry exists first so array access doesn't throw for holes
	        // in the parent iteration.
	        if (entry) {
	          validateEntry(entry);
	          return fn(entry[1], entry[0], this$0);
	        }
	      }, reverse);
	    };

	    FromEntriesSequence.prototype.__iterator = function(type, reverse) {
	      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
	      return new src_Iterator__Iterator(function()  {
	        while (true) {
	          var step = iterator.next();
	          if (step.done) {
	            return step;
	          }
	          var entry = step.value;
	          // Check if entry exists first so array access doesn't throw for holes
	          // in the parent iteration.
	          if (entry) {
	            validateEntry(entry);
	            return type === ITERATE_ENTRIES ? step :
	              iteratorValue(type, entry[0], entry[1], step);
	          }
	        }
	      });
	    };


	  ToIndexedSequence.prototype.cacheResult =
	  ToKeyedSequence.prototype.cacheResult =
	  ToSetSequence.prototype.cacheResult =
	  FromEntriesSequence.prototype.cacheResult =
	    cacheResultThrough;


	  function flipFactory(iterable) {
	    var flipSequence = makeSequence(iterable);
	    flipSequence._iter = iterable;
	    flipSequence.size = iterable.size;
	    flipSequence.flip = function()  {return iterable};
	    flipSequence.reverse = function () {
	      var reversedSequence = iterable.reverse.apply(this); // super.reverse()
	      reversedSequence.flip = function()  {return iterable.reverse()};
	      return reversedSequence;
	    };
	    flipSequence.has = function(key ) {return iterable.contains(key)};
	    flipSequence.contains = function(key ) {return iterable.has(key)};
	    flipSequence.cacheResult = cacheResultThrough;
	    flipSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
	      return iterable.__iterate(function(v, k)  {return fn(k, v, this$0) !== false}, reverse);
	    }
	    flipSequence.__iteratorUncached = function(type, reverse) {
	      if (type === ITERATE_ENTRIES) {
	        var iterator = iterable.__iterator(type, reverse);
	        return new src_Iterator__Iterator(function()  {
	          var step = iterator.next();
	          if (!step.done) {
	            var k = step.value[0];
	            step.value[0] = step.value[1];
	            step.value[1] = k;
	          }
	          return step;
	        });
	      }
	      return iterable.__iterator(
	        type === ITERATE_VALUES ? ITERATE_KEYS : ITERATE_VALUES,
	        reverse
	      );
	    }
	    return flipSequence;
	  }


	  function mapFactory(iterable, mapper, context) {
	    var mappedSequence = makeSequence(iterable);
	    mappedSequence.size = iterable.size;
	    mappedSequence.has = function(key ) {return iterable.has(key)};
	    mappedSequence.get = function(key, notSetValue)  {
	      var v = iterable.get(key, NOT_SET);
	      return v === NOT_SET ?
	        notSetValue :
	        mapper.call(context, v, key, iterable);
	    };
	    mappedSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
	      return iterable.__iterate(
	        function(v, k, c)  {return fn(mapper.call(context, v, k, c), k, this$0) !== false},
	        reverse
	      );
	    }
	    mappedSequence.__iteratorUncached = function (type, reverse) {
	      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
	      return new src_Iterator__Iterator(function()  {
	        var step = iterator.next();
	        if (step.done) {
	          return step;
	        }
	        var entry = step.value;
	        var key = entry[0];
	        return iteratorValue(
	          type,
	          key,
	          mapper.call(context, entry[1], key, iterable),
	          step
	        );
	      });
	    }
	    return mappedSequence;
	  }


	  function reverseFactory(iterable, useKeys) {
	    var reversedSequence = makeSequence(iterable);
	    reversedSequence._iter = iterable;
	    reversedSequence.size = iterable.size;
	    reversedSequence.reverse = function()  {return iterable};
	    if (iterable.flip) {
	      reversedSequence.flip = function () {
	        var flipSequence = flipFactory(iterable);
	        flipSequence.reverse = function()  {return iterable.flip()};
	        return flipSequence;
	      };
	    }
	    reversedSequence.get = function(key, notSetValue) 
	      {return iterable.get(useKeys ? key : -1 - key, notSetValue)};
	    reversedSequence.has = function(key )
	      {return iterable.has(useKeys ? key : -1 - key)};
	    reversedSequence.contains = function(value ) {return iterable.contains(value)};
	    reversedSequence.cacheResult = cacheResultThrough;
	    reversedSequence.__iterate = function (fn, reverse) {var this$0 = this;
	      return iterable.__iterate(function(v, k)  {return fn(v, k, this$0)}, !reverse);
	    };
	    reversedSequence.__iterator =
	      function(type, reverse)  {return iterable.__iterator(type, !reverse)};
	    return reversedSequence;
	  }


	  function filterFactory(iterable, predicate, context, useKeys) {
	    var filterSequence = makeSequence(iterable);
	    if (useKeys) {
	      filterSequence.has = function(key ) {
	        var v = iterable.get(key, NOT_SET);
	        return v !== NOT_SET && !!predicate.call(context, v, key, iterable);
	      };
	      filterSequence.get = function(key, notSetValue)  {
	        var v = iterable.get(key, NOT_SET);
	        return v !== NOT_SET && predicate.call(context, v, key, iterable) ?
	          v : notSetValue;
	      };
	    }
	    filterSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
	      var iterations = 0;
	      iterable.__iterate(function(v, k, c)  {
	        if (predicate.call(context, v, k, c)) {
	          iterations++;
	          return fn(v, useKeys ? k : iterations - 1, this$0);
	        }
	      }, reverse);
	      return iterations;
	    };
	    filterSequence.__iteratorUncached = function (type, reverse) {
	      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
	      var iterations = 0;
	      return new src_Iterator__Iterator(function()  {
	        while (true) {
	          var step = iterator.next();
	          if (step.done) {
	            return step;
	          }
	          var entry = step.value;
	          var key = entry[0];
	          var value = entry[1];
	          if (predicate.call(context, value, key, iterable)) {
	            return iteratorValue(type, useKeys ? key : iterations++, value, step);
	          }
	        }
	      });
	    }
	    return filterSequence;
	  }


	  function countByFactory(iterable, grouper, context) {
	    var groups = src_Map__Map().asMutable();
	    iterable.__iterate(function(v, k)  {
	      groups.update(
	        grouper.call(context, v, k, iterable),
	        0,
	        function(a ) {return a + 1}
	      );
	    });
	    return groups.asImmutable();
	  }


	  function groupByFactory(iterable, grouper, context) {
	    var isKeyedIter = isKeyed(iterable);
	    var groups = (isOrdered(iterable) ? OrderedMap() : src_Map__Map()).asMutable();
	    iterable.__iterate(function(v, k)  {
	      groups.update(
	        grouper.call(context, v, k, iterable),
	        function(a ) {return (a = a || [], a.push(isKeyedIter ? [k, v] : v), a)}
	      );
	    });
	    var coerce = iterableClass(iterable);
	    return groups.map(function(arr ) {return reify(iterable, coerce(arr))});
	  }


	  function sliceFactory(iterable, begin, end, useKeys) {
	    var originalSize = iterable.size;

	    if (wholeSlice(begin, end, originalSize)) {
	      return iterable;
	    }

	    var resolvedBegin = resolveBegin(begin, originalSize);
	    var resolvedEnd = resolveEnd(end, originalSize);

	    // begin or end will be NaN if they were provided as negative numbers and
	    // this iterable's size is unknown. In that case, cache first so there is
	    // a known size.
	    if (resolvedBegin !== resolvedBegin || resolvedEnd !== resolvedEnd) {
	      return sliceFactory(iterable.toSeq().cacheResult(), begin, end, useKeys);
	    }

	    var sliceSize = resolvedEnd - resolvedBegin;
	    if (sliceSize < 0) {
	      sliceSize = 0;
	    }

	    var sliceSeq = makeSequence(iterable);

	    sliceSeq.size = sliceSize === 0 ? sliceSize : iterable.size && sliceSize || undefined;

	    if (!useKeys && isSeq(iterable) && sliceSize >= 0) {
	      sliceSeq.get = function (index, notSetValue) {
	        index = wrapIndex(this, index);
	        return index >= 0 && index < sliceSize ?
	          iterable.get(index + resolvedBegin, notSetValue) :
	          notSetValue;
	      }
	    }

	    sliceSeq.__iterateUncached = function(fn, reverse) {var this$0 = this;
	      if (sliceSize === 0) {
	        return 0;
	      }
	      if (reverse) {
	        return this.cacheResult().__iterate(fn, reverse);
	      }
	      var skipped = 0;
	      var isSkipping = true;
	      var iterations = 0;
	      iterable.__iterate(function(v, k)  {
	        if (!(isSkipping && (isSkipping = skipped++ < resolvedBegin))) {
	          iterations++;
	          return fn(v, useKeys ? k : iterations - 1, this$0) !== false &&
	                 iterations !== sliceSize;
	        }
	      });
	      return iterations;
	    };

	    sliceSeq.__iteratorUncached = function(type, reverse) {
	      if (sliceSize && reverse) {
	        return this.cacheResult().__iterator(type, reverse);
	      }
	      // Don't bother instantiating parent iterator if taking 0.
	      var iterator = sliceSize && iterable.__iterator(type, reverse);
	      var skipped = 0;
	      var iterations = 0;
	      return new src_Iterator__Iterator(function()  {
	        while (skipped++ !== resolvedBegin) {
	          iterator.next();
	        }
	        if (++iterations > sliceSize) {
	          return iteratorDone();
	        }
	        var step = iterator.next();
	        if (useKeys || type === ITERATE_VALUES) {
	          return step;
	        } else if (type === ITERATE_KEYS) {
	          return iteratorValue(type, iterations - 1, undefined, step);
	        } else {
	          return iteratorValue(type, iterations - 1, step.value[1], step);
	        }
	      });
	    }

	    return sliceSeq;
	  }


	  function takeWhileFactory(iterable, predicate, context) {
	    var takeSequence = makeSequence(iterable);
	    takeSequence.__iterateUncached = function(fn, reverse) {var this$0 = this;
	      if (reverse) {
	        return this.cacheResult().__iterate(fn, reverse);
	      }
	      var iterations = 0;
	      iterable.__iterate(function(v, k, c) 
	        {return predicate.call(context, v, k, c) && ++iterations && fn(v, k, this$0)}
	      );
	      return iterations;
	    };
	    takeSequence.__iteratorUncached = function(type, reverse) {var this$0 = this;
	      if (reverse) {
	        return this.cacheResult().__iterator(type, reverse);
	      }
	      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
	      var iterating = true;
	      return new src_Iterator__Iterator(function()  {
	        if (!iterating) {
	          return iteratorDone();
	        }
	        var step = iterator.next();
	        if (step.done) {
	          return step;
	        }
	        var entry = step.value;
	        var k = entry[0];
	        var v = entry[1];
	        if (!predicate.call(context, v, k, this$0)) {
	          iterating = false;
	          return iteratorDone();
	        }
	        return type === ITERATE_ENTRIES ? step :
	          iteratorValue(type, k, v, step);
	      });
	    };
	    return takeSequence;
	  }


	  function skipWhileFactory(iterable, predicate, context, useKeys) {
	    var skipSequence = makeSequence(iterable);
	    skipSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
	      if (reverse) {
	        return this.cacheResult().__iterate(fn, reverse);
	      }
	      var isSkipping = true;
	      var iterations = 0;
	      iterable.__iterate(function(v, k, c)  {
	        if (!(isSkipping && (isSkipping = predicate.call(context, v, k, c)))) {
	          iterations++;
	          return fn(v, useKeys ? k : iterations - 1, this$0);
	        }
	      });
	      return iterations;
	    };
	    skipSequence.__iteratorUncached = function(type, reverse) {var this$0 = this;
	      if (reverse) {
	        return this.cacheResult().__iterator(type, reverse);
	      }
	      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
	      var skipping = true;
	      var iterations = 0;
	      return new src_Iterator__Iterator(function()  {
	        var step, k, v;
	        do {
	          step = iterator.next();
	          if (step.done) {
	            if (useKeys || type === ITERATE_VALUES) {
	              return step;
	            } else if (type === ITERATE_KEYS) {
	              return iteratorValue(type, iterations++, undefined, step);
	            } else {
	              return iteratorValue(type, iterations++, step.value[1], step);
	            }
	          }
	          var entry = step.value;
	          k = entry[0];
	          v = entry[1];
	          skipping && (skipping = predicate.call(context, v, k, this$0));
	        } while (skipping);
	        return type === ITERATE_ENTRIES ? step :
	          iteratorValue(type, k, v, step);
	      });
	    };
	    return skipSequence;
	  }


	  function concatFactory(iterable, values) {
	    var isKeyedIterable = isKeyed(iterable);
	    var iters = [iterable].concat(values).map(function(v ) {
	      if (!isIterable(v)) {
	        v = isKeyedIterable ?
	          keyedSeqFromValue(v) :
	          indexedSeqFromValue(Array.isArray(v) ? v : [v]);
	      } else if (isKeyedIterable) {
	        v = KeyedIterable(v);
	      }
	      return v;
	    }).filter(function(v ) {return v.size !== 0});

	    if (iters.length === 0) {
	      return iterable;
	    }

	    if (iters.length === 1) {
	      var singleton = iters[0];
	      if (singleton === iterable ||
	          isKeyedIterable && isKeyed(singleton) ||
	          isIndexed(iterable) && isIndexed(singleton)) {
	        return singleton;
	      }
	    }

	    var concatSeq = new ArraySeq(iters);
	    if (isKeyedIterable) {
	      concatSeq = concatSeq.toKeyedSeq();
	    } else if (!isIndexed(iterable)) {
	      concatSeq = concatSeq.toSetSeq();
	    }
	    concatSeq = concatSeq.flatten(true);
	    concatSeq.size = iters.reduce(
	      function(sum, seq)  {
	        if (sum !== undefined) {
	          var size = seq.size;
	          if (size !== undefined) {
	            return sum + size;
	          }
	        }
	      },
	      0
	    );
	    return concatSeq;
	  }


	  function flattenFactory(iterable, depth, useKeys) {
	    var flatSequence = makeSequence(iterable);
	    flatSequence.__iterateUncached = function(fn, reverse) {
	      var iterations = 0;
	      var stopped = false;
	      function flatDeep(iter, currentDepth) {var this$0 = this;
	        iter.__iterate(function(v, k)  {
	          if ((!depth || currentDepth < depth) && isIterable(v)) {
	            flatDeep(v, currentDepth + 1);
	          } else if (fn(v, useKeys ? k : iterations++, this$0) === false) {
	            stopped = true;
	          }
	          return !stopped;
	        }, reverse);
	      }
	      flatDeep(iterable, 0);
	      return iterations;
	    }
	    flatSequence.__iteratorUncached = function(type, reverse) {
	      var iterator = iterable.__iterator(type, reverse);
	      var stack = [];
	      var iterations = 0;
	      return new src_Iterator__Iterator(function()  {
	        while (iterator) {
	          var step = iterator.next();
	          if (step.done !== false) {
	            iterator = stack.pop();
	            continue;
	          }
	          var v = step.value;
	          if (type === ITERATE_ENTRIES) {
	            v = v[1];
	          }
	          if ((!depth || stack.length < depth) && isIterable(v)) {
	            stack.push(iterator);
	            iterator = v.__iterator(type, reverse);
	          } else {
	            return useKeys ? step : iteratorValue(type, iterations++, v, step);
	          }
	        }
	        return iteratorDone();
	      });
	    }
	    return flatSequence;
	  }


	  function flatMapFactory(iterable, mapper, context) {
	    var coerce = iterableClass(iterable);
	    return iterable.toSeq().map(
	      function(v, k)  {return coerce(mapper.call(context, v, k, iterable))}
	    ).flatten(true);
	  }


	  function interposeFactory(iterable, separator) {
	    var interposedSequence = makeSequence(iterable);
	    interposedSequence.size = iterable.size && iterable.size * 2 -1;
	    interposedSequence.__iterateUncached = function(fn, reverse) {var this$0 = this;
	      var iterations = 0;
	      iterable.__iterate(function(v, k) 
	        {return (!iterations || fn(separator, iterations++, this$0) !== false) &&
	        fn(v, iterations++, this$0) !== false},
	        reverse
	      );
	      return iterations;
	    };
	    interposedSequence.__iteratorUncached = function(type, reverse) {
	      var iterator = iterable.__iterator(ITERATE_VALUES, reverse);
	      var iterations = 0;
	      var step;
	      return new src_Iterator__Iterator(function()  {
	        if (!step || iterations % 2) {
	          step = iterator.next();
	          if (step.done) {
	            return step;
	          }
	        }
	        return iterations % 2 ?
	          iteratorValue(type, iterations++, separator) :
	          iteratorValue(type, iterations++, step.value, step);
	      });
	    };
	    return interposedSequence;
	  }


	  function sortFactory(iterable, comparator, mapper) {
	    if (!comparator) {
	      comparator = defaultComparator;
	    }
	    var isKeyedIterable = isKeyed(iterable);
	    var index = 0;
	    var entries = iterable.toSeq().map(
	      function(v, k)  {return [k, v, index++, mapper ? mapper(v, k, iterable) : v]}
	    ).toArray();
	    entries.sort(function(a, b)  {return comparator(a[3], b[3]) || a[2] - b[2]}).forEach(
	      isKeyedIterable ?
	      function(v, i)  { entries[i].length = 2; } :
	      function(v, i)  { entries[i] = v[1]; }
	    );
	    return isKeyedIterable ? KeyedSeq(entries) :
	      isIndexed(iterable) ? IndexedSeq(entries) :
	      SetSeq(entries);
	  }


	  function maxFactory(iterable, comparator, mapper) {
	    if (!comparator) {
	      comparator = defaultComparator;
	    }
	    if (mapper) {
	      var entry = iterable.toSeq()
	        .map(function(v, k)  {return [v, mapper(v, k, iterable)]})
	        .reduce(function(a, b)  {return maxCompare(comparator, a[1], b[1]) ? b : a});
	      return entry && entry[0];
	    } else {
	      return iterable.reduce(function(a, b)  {return maxCompare(comparator, a, b) ? b : a});
	    }
	  }

	  function maxCompare(comparator, a, b) {
	    var comp = comparator(b, a);
	    // b is considered the new max if the comparator declares them equal, but
	    // they are not equal and b is in fact a nullish value.
	    return (comp === 0 && b !== a && (b === undefined || b === null || b !== b)) || comp > 0;
	  }


	  function zipWithFactory(keyIter, zipper, iters) {
	    var zipSequence = makeSequence(keyIter);
	    zipSequence.size = new ArraySeq(iters).map(function(i ) {return i.size}).min();
	    // Note: this a generic base implementation of __iterate in terms of
	    // __iterator which may be more generically useful in the future.
	    zipSequence.__iterate = function(fn, reverse) {
	      /* generic:
	      var iterator = this.__iterator(ITERATE_ENTRIES, reverse);
	      var step;
	      var iterations = 0;
	      while (!(step = iterator.next()).done) {
	        iterations++;
	        if (fn(step.value[1], step.value[0], this) === false) {
	          break;
	        }
	      }
	      return iterations;
	      */
	      // indexed:
	      var iterator = this.__iterator(ITERATE_VALUES, reverse);
	      var step;
	      var iterations = 0;
	      while (!(step = iterator.next()).done) {
	        if (fn(step.value, iterations++, this) === false) {
	          break;
	        }
	      }
	      return iterations;
	    };
	    zipSequence.__iteratorUncached = function(type, reverse) {
	      var iterators = iters.map(function(i )
	        {return (i = Iterable(i), getIterator(reverse ? i.reverse() : i))}
	      );
	      var iterations = 0;
	      var isDone = false;
	      return new src_Iterator__Iterator(function()  {
	        var steps;
	        if (!isDone) {
	          steps = iterators.map(function(i ) {return i.next()});
	          isDone = steps.some(function(s ) {return s.done});
	        }
	        if (isDone) {
	          return iteratorDone();
	        }
	        return iteratorValue(
	          type,
	          iterations++,
	          zipper.apply(null, steps.map(function(s ) {return s.value}))
	        );
	      });
	    };
	    return zipSequence
	  }


	  // #pragma Helper Functions

	  function reify(iter, seq) {
	    return isSeq(iter) ? seq : iter.constructor(seq);
	  }

	  function validateEntry(entry) {
	    if (entry !== Object(entry)) {
	      throw new TypeError('Expected [K, V] tuple: ' + entry);
	    }
	  }

	  function resolveSize(iter) {
	    assertNotInfinite(iter.size);
	    return ensureSize(iter);
	  }

	  function iterableClass(iterable) {
	    return isKeyed(iterable) ? KeyedIterable :
	      isIndexed(iterable) ? IndexedIterable :
	      SetIterable;
	  }

	  function makeSequence(iterable) {
	    return Object.create(
	      (
	        isKeyed(iterable) ? KeyedSeq :
	        isIndexed(iterable) ? IndexedSeq :
	        SetSeq
	      ).prototype
	    );
	  }

	  function cacheResultThrough() {
	    if (this._iter.cacheResult) {
	      this._iter.cacheResult();
	      this.size = this._iter.size;
	      return this;
	    } else {
	      return Seq.prototype.cacheResult.call(this);
	    }
	  }

	  function defaultComparator(a, b) {
	    return a > b ? 1 : a < b ? -1 : 0;
	  }

	  function forceIterator(keyPath) {
	    var iter = getIterator(keyPath);
	    if (!iter) {
	      // Array might not be iterable in this environment, so we need a fallback
	      // to our wrapped type.
	      if (!isArrayLike(keyPath)) {
	        throw new TypeError('Expected iterable or array-like: ' + keyPath);
	      }
	      iter = getIterator(Iterable(keyPath));
	    }
	    return iter;
	  }

	  createClass(src_Map__Map, KeyedCollection);

	    // @pragma Construction

	    function src_Map__Map(value) {
	      return value === null || value === undefined ? emptyMap() :
	        isMap(value) ? value :
	        emptyMap().withMutations(function(map ) {
	          var iter = KeyedIterable(value);
	          assertNotInfinite(iter.size);
	          iter.forEach(function(v, k)  {return map.set(k, v)});
	        });
	    }

	    src_Map__Map.prototype.toString = function() {
	      return this.__toString('Map {', '}');
	    };

	    // @pragma Access

	    src_Map__Map.prototype.get = function(k, notSetValue) {
	      return this._root ?
	        this._root.get(0, undefined, k, notSetValue) :
	        notSetValue;
	    };

	    // @pragma Modification

	    src_Map__Map.prototype.set = function(k, v) {
	      return updateMap(this, k, v);
	    };

	    src_Map__Map.prototype.setIn = function(keyPath, v) {
	      return this.updateIn(keyPath, NOT_SET, function()  {return v});
	    };

	    src_Map__Map.prototype.remove = function(k) {
	      return updateMap(this, k, NOT_SET);
	    };

	    src_Map__Map.prototype.deleteIn = function(keyPath) {
	      return this.updateIn(keyPath, function()  {return NOT_SET});
	    };

	    src_Map__Map.prototype.update = function(k, notSetValue, updater) {
	      return arguments.length === 1 ?
	        k(this) :
	        this.updateIn([k], notSetValue, updater);
	    };

	    src_Map__Map.prototype.updateIn = function(keyPath, notSetValue, updater) {
	      if (!updater) {
	        updater = notSetValue;
	        notSetValue = undefined;
	      }
	      var updatedValue = updateInDeepMap(
	        this,
	        forceIterator(keyPath),
	        notSetValue,
	        updater
	      );
	      return updatedValue === NOT_SET ? undefined : updatedValue;
	    };

	    src_Map__Map.prototype.clear = function() {
	      if (this.size === 0) {
	        return this;
	      }
	      if (this.__ownerID) {
	        this.size = 0;
	        this._root = null;
	        this.__hash = undefined;
	        this.__altered = true;
	        return this;
	      }
	      return emptyMap();
	    };

	    // @pragma Composition

	    src_Map__Map.prototype.merge = function(/*...iters*/) {
	      return mergeIntoMapWith(this, undefined, arguments);
	    };

	    src_Map__Map.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
	      return mergeIntoMapWith(this, merger, iters);
	    };

	    src_Map__Map.prototype.mergeIn = function(keyPath) {var iters = SLICE$0.call(arguments, 1);
	      return this.updateIn(keyPath, emptyMap(), function(m ) {return m.merge.apply(m, iters)});
	    };

	    src_Map__Map.prototype.mergeDeep = function(/*...iters*/) {
	      return mergeIntoMapWith(this, deepMerger(undefined), arguments);
	    };

	    src_Map__Map.prototype.mergeDeepWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
	      return mergeIntoMapWith(this, deepMerger(merger), iters);
	    };

	    src_Map__Map.prototype.mergeDeepIn = function(keyPath) {var iters = SLICE$0.call(arguments, 1);
	      return this.updateIn(keyPath, emptyMap(), function(m ) {return m.mergeDeep.apply(m, iters)});
	    };

	    src_Map__Map.prototype.sort = function(comparator) {
	      // Late binding
	      return OrderedMap(sortFactory(this, comparator));
	    };

	    src_Map__Map.prototype.sortBy = function(mapper, comparator) {
	      // Late binding
	      return OrderedMap(sortFactory(this, comparator, mapper));
	    };

	    // @pragma Mutability

	    src_Map__Map.prototype.withMutations = function(fn) {
	      var mutable = this.asMutable();
	      fn(mutable);
	      return mutable.wasAltered() ? mutable.__ensureOwner(this.__ownerID) : this;
	    };

	    src_Map__Map.prototype.asMutable = function() {
	      return this.__ownerID ? this : this.__ensureOwner(new OwnerID());
	    };

	    src_Map__Map.prototype.asImmutable = function() {
	      return this.__ensureOwner();
	    };

	    src_Map__Map.prototype.wasAltered = function() {
	      return this.__altered;
	    };

	    src_Map__Map.prototype.__iterator = function(type, reverse) {
	      return new MapIterator(this, type, reverse);
	    };

	    src_Map__Map.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      var iterations = 0;
	      this._root && this._root.iterate(function(entry ) {
	        iterations++;
	        return fn(entry[1], entry[0], this$0);
	      }, reverse);
	      return iterations;
	    };

	    src_Map__Map.prototype.__ensureOwner = function(ownerID) {
	      if (ownerID === this.__ownerID) {
	        return this;
	      }
	      if (!ownerID) {
	        this.__ownerID = ownerID;
	        this.__altered = false;
	        return this;
	      }
	      return makeMap(this.size, this._root, ownerID, this.__hash);
	    };


	  function isMap(maybeMap) {
	    return !!(maybeMap && maybeMap[IS_MAP_SENTINEL]);
	  }

	  src_Map__Map.isMap = isMap;

	  var IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';

	  var MapPrototype = src_Map__Map.prototype;
	  MapPrototype[IS_MAP_SENTINEL] = true;
	  MapPrototype[DELETE] = MapPrototype.remove;
	  MapPrototype.removeIn = MapPrototype.deleteIn;


	  // #pragma Trie Nodes



	    function ArrayMapNode(ownerID, entries) {
	      this.ownerID = ownerID;
	      this.entries = entries;
	    }

	    ArrayMapNode.prototype.get = function(shift, keyHash, key, notSetValue) {
	      var entries = this.entries;
	      for (var ii = 0, len = entries.length; ii < len; ii++) {
	        if (is(key, entries[ii][0])) {
	          return entries[ii][1];
	        }
	      }
	      return notSetValue;
	    };

	    ArrayMapNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
	      var removed = value === NOT_SET;

	      var entries = this.entries;
	      var idx = 0;
	      for (var len = entries.length; idx < len; idx++) {
	        if (is(key, entries[idx][0])) {
	          break;
	        }
	      }
	      var exists = idx < len;

	      if (exists ? entries[idx][1] === value : removed) {
	        return this;
	      }

	      SetRef(didAlter);
	      (removed || !exists) && SetRef(didChangeSize);

	      if (removed && entries.length === 1) {
	        return; // undefined
	      }

	      if (!exists && !removed && entries.length >= MAX_ARRAY_MAP_SIZE) {
	        return createNodes(ownerID, entries, key, value);
	      }

	      var isEditable = ownerID && ownerID === this.ownerID;
	      var newEntries = isEditable ? entries : arrCopy(entries);

	      if (exists) {
	        if (removed) {
	          idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop());
	        } else {
	          newEntries[idx] = [key, value];
	        }
	      } else {
	        newEntries.push([key, value]);
	      }

	      if (isEditable) {
	        this.entries = newEntries;
	        return this;
	      }

	      return new ArrayMapNode(ownerID, newEntries);
	    };




	    function BitmapIndexedNode(ownerID, bitmap, nodes) {
	      this.ownerID = ownerID;
	      this.bitmap = bitmap;
	      this.nodes = nodes;
	    }

	    BitmapIndexedNode.prototype.get = function(shift, keyHash, key, notSetValue) {
	      if (keyHash === undefined) {
	        keyHash = hash(key);
	      }
	      var bit = (1 << ((shift === 0 ? keyHash : keyHash >>> shift) & MASK));
	      var bitmap = this.bitmap;
	      return (bitmap & bit) === 0 ? notSetValue :
	        this.nodes[popCount(bitmap & (bit - 1))].get(shift + SHIFT, keyHash, key, notSetValue);
	    };

	    BitmapIndexedNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
	      if (keyHash === undefined) {
	        keyHash = hash(key);
	      }
	      var keyHashFrag = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
	      var bit = 1 << keyHashFrag;
	      var bitmap = this.bitmap;
	      var exists = (bitmap & bit) !== 0;

	      if (!exists && value === NOT_SET) {
	        return this;
	      }

	      var idx = popCount(bitmap & (bit - 1));
	      var nodes = this.nodes;
	      var node = exists ? nodes[idx] : undefined;
	      var newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter);

	      if (newNode === node) {
	        return this;
	      }

	      if (!exists && newNode && nodes.length >= MAX_BITMAP_INDEXED_SIZE) {
	        return expandNodes(ownerID, nodes, bitmap, keyHashFrag, newNode);
	      }

	      if (exists && !newNode && nodes.length === 2 && isLeafNode(nodes[idx ^ 1])) {
	        return nodes[idx ^ 1];
	      }

	      if (exists && newNode && nodes.length === 1 && isLeafNode(newNode)) {
	        return newNode;
	      }

	      var isEditable = ownerID && ownerID === this.ownerID;
	      var newBitmap = exists ? newNode ? bitmap : bitmap ^ bit : bitmap | bit;
	      var newNodes = exists ? newNode ?
	        setIn(nodes, idx, newNode, isEditable) :
	        spliceOut(nodes, idx, isEditable) :
	        spliceIn(nodes, idx, newNode, isEditable);

	      if (isEditable) {
	        this.bitmap = newBitmap;
	        this.nodes = newNodes;
	        return this;
	      }

	      return new BitmapIndexedNode(ownerID, newBitmap, newNodes);
	    };




	    function HashArrayMapNode(ownerID, count, nodes) {
	      this.ownerID = ownerID;
	      this.count = count;
	      this.nodes = nodes;
	    }

	    HashArrayMapNode.prototype.get = function(shift, keyHash, key, notSetValue) {
	      if (keyHash === undefined) {
	        keyHash = hash(key);
	      }
	      var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
	      var node = this.nodes[idx];
	      return node ? node.get(shift + SHIFT, keyHash, key, notSetValue) : notSetValue;
	    };

	    HashArrayMapNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
	      if (keyHash === undefined) {
	        keyHash = hash(key);
	      }
	      var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
	      var removed = value === NOT_SET;
	      var nodes = this.nodes;
	      var node = nodes[idx];

	      if (removed && !node) {
	        return this;
	      }

	      var newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter);
	      if (newNode === node) {
	        return this;
	      }

	      var newCount = this.count;
	      if (!node) {
	        newCount++;
	      } else if (!newNode) {
	        newCount--;
	        if (newCount < MIN_HASH_ARRAY_MAP_SIZE) {
	          return packNodes(ownerID, nodes, newCount, idx);
	        }
	      }

	      var isEditable = ownerID && ownerID === this.ownerID;
	      var newNodes = setIn(nodes, idx, newNode, isEditable);

	      if (isEditable) {
	        this.count = newCount;
	        this.nodes = newNodes;
	        return this;
	      }

	      return new HashArrayMapNode(ownerID, newCount, newNodes);
	    };




	    function HashCollisionNode(ownerID, keyHash, entries) {
	      this.ownerID = ownerID;
	      this.keyHash = keyHash;
	      this.entries = entries;
	    }

	    HashCollisionNode.prototype.get = function(shift, keyHash, key, notSetValue) {
	      var entries = this.entries;
	      for (var ii = 0, len = entries.length; ii < len; ii++) {
	        if (is(key, entries[ii][0])) {
	          return entries[ii][1];
	        }
	      }
	      return notSetValue;
	    };

	    HashCollisionNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
	      if (keyHash === undefined) {
	        keyHash = hash(key);
	      }

	      var removed = value === NOT_SET;

	      if (keyHash !== this.keyHash) {
	        if (removed) {
	          return this;
	        }
	        SetRef(didAlter);
	        SetRef(didChangeSize);
	        return mergeIntoNode(this, ownerID, shift, keyHash, [key, value]);
	      }

	      var entries = this.entries;
	      var idx = 0;
	      for (var len = entries.length; idx < len; idx++) {
	        if (is(key, entries[idx][0])) {
	          break;
	        }
	      }
	      var exists = idx < len;

	      if (exists ? entries[idx][1] === value : removed) {
	        return this;
	      }

	      SetRef(didAlter);
	      (removed || !exists) && SetRef(didChangeSize);

	      if (removed && len === 2) {
	        return new ValueNode(ownerID, this.keyHash, entries[idx ^ 1]);
	      }

	      var isEditable = ownerID && ownerID === this.ownerID;
	      var newEntries = isEditable ? entries : arrCopy(entries);

	      if (exists) {
	        if (removed) {
	          idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop());
	        } else {
	          newEntries[idx] = [key, value];
	        }
	      } else {
	        newEntries.push([key, value]);
	      }

	      if (isEditable) {
	        this.entries = newEntries;
	        return this;
	      }

	      return new HashCollisionNode(ownerID, this.keyHash, newEntries);
	    };




	    function ValueNode(ownerID, keyHash, entry) {
	      this.ownerID = ownerID;
	      this.keyHash = keyHash;
	      this.entry = entry;
	    }

	    ValueNode.prototype.get = function(shift, keyHash, key, notSetValue) {
	      return is(key, this.entry[0]) ? this.entry[1] : notSetValue;
	    };

	    ValueNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
	      var removed = value === NOT_SET;
	      var keyMatch = is(key, this.entry[0]);
	      if (keyMatch ? value === this.entry[1] : removed) {
	        return this;
	      }

	      SetRef(didAlter);

	      if (removed) {
	        SetRef(didChangeSize);
	        return; // undefined
	      }

	      if (keyMatch) {
	        if (ownerID && ownerID === this.ownerID) {
	          this.entry[1] = value;
	          return this;
	        }
	        return new ValueNode(ownerID, this.keyHash, [key, value]);
	      }

	      SetRef(didChangeSize);
	      return mergeIntoNode(this, ownerID, shift, hash(key), [key, value]);
	    };



	  // #pragma Iterators

	  ArrayMapNode.prototype.iterate =
	  HashCollisionNode.prototype.iterate = function (fn, reverse) {
	    var entries = this.entries;
	    for (var ii = 0, maxIndex = entries.length - 1; ii <= maxIndex; ii++) {
	      if (fn(entries[reverse ? maxIndex - ii : ii]) === false) {
	        return false;
	      }
	    }
	  }

	  BitmapIndexedNode.prototype.iterate =
	  HashArrayMapNode.prototype.iterate = function (fn, reverse) {
	    var nodes = this.nodes;
	    for (var ii = 0, maxIndex = nodes.length - 1; ii <= maxIndex; ii++) {
	      var node = nodes[reverse ? maxIndex - ii : ii];
	      if (node && node.iterate(fn, reverse) === false) {
	        return false;
	      }
	    }
	  }

	  ValueNode.prototype.iterate = function (fn, reverse) {
	    return fn(this.entry);
	  }

	  createClass(MapIterator, src_Iterator__Iterator);

	    function MapIterator(map, type, reverse) {
	      this._type = type;
	      this._reverse = reverse;
	      this._stack = map._root && mapIteratorFrame(map._root);
	    }

	    MapIterator.prototype.next = function() {
	      var type = this._type;
	      var stack = this._stack;
	      while (stack) {
	        var node = stack.node;
	        var index = stack.index++;
	        var maxIndex;
	        if (node.entry) {
	          if (index === 0) {
	            return mapIteratorValue(type, node.entry);
	          }
	        } else if (node.entries) {
	          maxIndex = node.entries.length - 1;
	          if (index <= maxIndex) {
	            return mapIteratorValue(type, node.entries[this._reverse ? maxIndex - index : index]);
	          }
	        } else {
	          maxIndex = node.nodes.length - 1;
	          if (index <= maxIndex) {
	            var subNode = node.nodes[this._reverse ? maxIndex - index : index];
	            if (subNode) {
	              if (subNode.entry) {
	                return mapIteratorValue(type, subNode.entry);
	              }
	              stack = this._stack = mapIteratorFrame(subNode, stack);
	            }
	            continue;
	          }
	        }
	        stack = this._stack = this._stack.__prev;
	      }
	      return iteratorDone();
	    };


	  function mapIteratorValue(type, entry) {
	    return iteratorValue(type, entry[0], entry[1]);
	  }

	  function mapIteratorFrame(node, prev) {
	    return {
	      node: node,
	      index: 0,
	      __prev: prev
	    };
	  }

	  function makeMap(size, root, ownerID, hash) {
	    var map = Object.create(MapPrototype);
	    map.size = size;
	    map._root = root;
	    map.__ownerID = ownerID;
	    map.__hash = hash;
	    map.__altered = false;
	    return map;
	  }

	  var EMPTY_MAP;
	  function emptyMap() {
	    return EMPTY_MAP || (EMPTY_MAP = makeMap(0));
	  }

	  function updateMap(map, k, v) {
	    var newRoot;
	    var newSize;
	    if (!map._root) {
	      if (v === NOT_SET) {
	        return map;
	      }
	      newSize = 1;
	      newRoot = new ArrayMapNode(map.__ownerID, [[k, v]]);
	    } else {
	      var didChangeSize = MakeRef(CHANGE_LENGTH);
	      var didAlter = MakeRef(DID_ALTER);
	      newRoot = updateNode(map._root, map.__ownerID, 0, undefined, k, v, didChangeSize, didAlter);
	      if (!didAlter.value) {
	        return map;
	      }
	      newSize = map.size + (didChangeSize.value ? v === NOT_SET ? -1 : 1 : 0);
	    }
	    if (map.__ownerID) {
	      map.size = newSize;
	      map._root = newRoot;
	      map.__hash = undefined;
	      map.__altered = true;
	      return map;
	    }
	    return newRoot ? makeMap(newSize, newRoot) : emptyMap();
	  }

	  function updateNode(node, ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
	    if (!node) {
	      if (value === NOT_SET) {
	        return node;
	      }
	      SetRef(didAlter);
	      SetRef(didChangeSize);
	      return new ValueNode(ownerID, keyHash, [key, value]);
	    }
	    return node.update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter);
	  }

	  function isLeafNode(node) {
	    return node.constructor === ValueNode || node.constructor === HashCollisionNode;
	  }

	  function mergeIntoNode(node, ownerID, shift, keyHash, entry) {
	    if (node.keyHash === keyHash) {
	      return new HashCollisionNode(ownerID, keyHash, [node.entry, entry]);
	    }

	    var idx1 = (shift === 0 ? node.keyHash : node.keyHash >>> shift) & MASK;
	    var idx2 = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;

	    var newNode;
	    var nodes = idx1 === idx2 ?
	      [mergeIntoNode(node, ownerID, shift + SHIFT, keyHash, entry)] :
	      ((newNode = new ValueNode(ownerID, keyHash, entry)), idx1 < idx2 ? [node, newNode] : [newNode, node]);

	    return new BitmapIndexedNode(ownerID, (1 << idx1) | (1 << idx2), nodes);
	  }

	  function createNodes(ownerID, entries, key, value) {
	    if (!ownerID) {
	      ownerID = new OwnerID();
	    }
	    var node = new ValueNode(ownerID, hash(key), [key, value]);
	    for (var ii = 0; ii < entries.length; ii++) {
	      var entry = entries[ii];
	      node = node.update(ownerID, 0, undefined, entry[0], entry[1]);
	    }
	    return node;
	  }

	  function packNodes(ownerID, nodes, count, excluding) {
	    var bitmap = 0;
	    var packedII = 0;
	    var packedNodes = new Array(count);
	    for (var ii = 0, bit = 1, len = nodes.length; ii < len; ii++, bit <<= 1) {
	      var node = nodes[ii];
	      if (node !== undefined && ii !== excluding) {
	        bitmap |= bit;
	        packedNodes[packedII++] = node;
	      }
	    }
	    return new BitmapIndexedNode(ownerID, bitmap, packedNodes);
	  }

	  function expandNodes(ownerID, nodes, bitmap, including, node) {
	    var count = 0;
	    var expandedNodes = new Array(SIZE);
	    for (var ii = 0; bitmap !== 0; ii++, bitmap >>>= 1) {
	      expandedNodes[ii] = bitmap & 1 ? nodes[count++] : undefined;
	    }
	    expandedNodes[including] = node;
	    return new HashArrayMapNode(ownerID, count + 1, expandedNodes);
	  }

	  function mergeIntoMapWith(map, merger, iterables) {
	    var iters = [];
	    for (var ii = 0; ii < iterables.length; ii++) {
	      var value = iterables[ii];
	      var iter = KeyedIterable(value);
	      if (!isIterable(value)) {
	        iter = iter.map(function(v ) {return fromJS(v)});
	      }
	      iters.push(iter);
	    }
	    return mergeIntoCollectionWith(map, merger, iters);
	  }

	  function deepMerger(merger) {
	    return function(existing, value) 
	      {return existing && existing.mergeDeepWith && isIterable(value) ?
	        existing.mergeDeepWith(merger, value) :
	        merger ? merger(existing, value) : value};
	  }

	  function mergeIntoCollectionWith(collection, merger, iters) {
	    iters = iters.filter(function(x ) {return x.size !== 0});
	    if (iters.length === 0) {
	      return collection;
	    }
	    if (collection.size === 0 && iters.length === 1) {
	      return collection.constructor(iters[0]);
	    }
	    return collection.withMutations(function(collection ) {
	      var mergeIntoMap = merger ?
	        function(value, key)  {
	          collection.update(key, NOT_SET, function(existing )
	            {return existing === NOT_SET ? value : merger(existing, value)}
	          );
	        } :
	        function(value, key)  {
	          collection.set(key, value);
	        }
	      for (var ii = 0; ii < iters.length; ii++) {
	        iters[ii].forEach(mergeIntoMap);
	      }
	    });
	  }

	  function updateInDeepMap(existing, keyPathIter, notSetValue, updater) {
	    var isNotSet = existing === NOT_SET;
	    var step = keyPathIter.next();
	    if (step.done) {
	      var existingValue = isNotSet ? notSetValue : existing;
	      var newValue = updater(existingValue);
	      return newValue === existingValue ? existing : newValue;
	    }
	    invariant(
	      isNotSet || (existing && existing.set),
	      'invalid keyPath'
	    );
	    var key = step.value;
	    var nextExisting = isNotSet ? NOT_SET : existing.get(key, NOT_SET);
	    var nextUpdated = updateInDeepMap(
	      nextExisting,
	      keyPathIter,
	      notSetValue,
	      updater
	    );
	    return nextUpdated === nextExisting ? existing :
	      nextUpdated === NOT_SET ? existing.remove(key) :
	      (isNotSet ? emptyMap() : existing).set(key, nextUpdated);
	  }

	  function popCount(x) {
	    x = x - ((x >> 1) & 0x55555555);
	    x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
	    x = (x + (x >> 4)) & 0x0f0f0f0f;
	    x = x + (x >> 8);
	    x = x + (x >> 16);
	    return x & 0x7f;
	  }

	  function setIn(array, idx, val, canEdit) {
	    var newArray = canEdit ? array : arrCopy(array);
	    newArray[idx] = val;
	    return newArray;
	  }

	  function spliceIn(array, idx, val, canEdit) {
	    var newLen = array.length + 1;
	    if (canEdit && idx + 1 === newLen) {
	      array[idx] = val;
	      return array;
	    }
	    var newArray = new Array(newLen);
	    var after = 0;
	    for (var ii = 0; ii < newLen; ii++) {
	      if (ii === idx) {
	        newArray[ii] = val;
	        after = -1;
	      } else {
	        newArray[ii] = array[ii + after];
	      }
	    }
	    return newArray;
	  }

	  function spliceOut(array, idx, canEdit) {
	    var newLen = array.length - 1;
	    if (canEdit && idx === newLen) {
	      array.pop();
	      return array;
	    }
	    var newArray = new Array(newLen);
	    var after = 0;
	    for (var ii = 0; ii < newLen; ii++) {
	      if (ii === idx) {
	        after = 1;
	      }
	      newArray[ii] = array[ii + after];
	    }
	    return newArray;
	  }

	  var MAX_ARRAY_MAP_SIZE = SIZE / 4;
	  var MAX_BITMAP_INDEXED_SIZE = SIZE / 2;
	  var MIN_HASH_ARRAY_MAP_SIZE = SIZE / 4;

	  createClass(List, IndexedCollection);

	    // @pragma Construction

	    function List(value) {
	      var empty = emptyList();
	      if (value === null || value === undefined) {
	        return empty;
	      }
	      if (isList(value)) {
	        return value;
	      }
	      var iter = IndexedIterable(value);
	      var size = iter.size;
	      if (size === 0) {
	        return empty;
	      }
	      assertNotInfinite(size);
	      if (size > 0 && size < SIZE) {
	        return makeList(0, size, SHIFT, null, new VNode(iter.toArray()));
	      }
	      return empty.withMutations(function(list ) {
	        list.setSize(size);
	        iter.forEach(function(v, i)  {return list.set(i, v)});
	      });
	    }

	    List.of = function(/*...values*/) {
	      return this(arguments);
	    };

	    List.prototype.toString = function() {
	      return this.__toString('List [', ']');
	    };

	    // @pragma Access

	    List.prototype.get = function(index, notSetValue) {
	      index = wrapIndex(this, index);
	      if (index < 0 || index >= this.size) {
	        return notSetValue;
	      }
	      index += this._origin;
	      var node = listNodeFor(this, index);
	      return node && node.array[index & MASK];
	    };

	    // @pragma Modification

	    List.prototype.set = function(index, value) {
	      return updateList(this, index, value);
	    };

	    List.prototype.remove = function(index) {
	      return !this.has(index) ? this :
	        index === 0 ? this.shift() :
	        index === this.size - 1 ? this.pop() :
	        this.splice(index, 1);
	    };

	    List.prototype.clear = function() {
	      if (this.size === 0) {
	        return this;
	      }
	      if (this.__ownerID) {
	        this.size = this._origin = this._capacity = 0;
	        this._level = SHIFT;
	        this._root = this._tail = null;
	        this.__hash = undefined;
	        this.__altered = true;
	        return this;
	      }
	      return emptyList();
	    };

	    List.prototype.push = function(/*...values*/) {
	      var values = arguments;
	      var oldSize = this.size;
	      return this.withMutations(function(list ) {
	        setListBounds(list, 0, oldSize + values.length);
	        for (var ii = 0; ii < values.length; ii++) {
	          list.set(oldSize + ii, values[ii]);
	        }
	      });
	    };

	    List.prototype.pop = function() {
	      return setListBounds(this, 0, -1);
	    };

	    List.prototype.unshift = function(/*...values*/) {
	      var values = arguments;
	      return this.withMutations(function(list ) {
	        setListBounds(list, -values.length);
	        for (var ii = 0; ii < values.length; ii++) {
	          list.set(ii, values[ii]);
	        }
	      });
	    };

	    List.prototype.shift = function() {
	      return setListBounds(this, 1);
	    };

	    // @pragma Composition

	    List.prototype.merge = function(/*...iters*/) {
	      return mergeIntoListWith(this, undefined, arguments);
	    };

	    List.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
	      return mergeIntoListWith(this, merger, iters);
	    };

	    List.prototype.mergeDeep = function(/*...iters*/) {
	      return mergeIntoListWith(this, deepMerger(undefined), arguments);
	    };

	    List.prototype.mergeDeepWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
	      return mergeIntoListWith(this, deepMerger(merger), iters);
	    };

	    List.prototype.setSize = function(size) {
	      return setListBounds(this, 0, size);
	    };

	    // @pragma Iteration

	    List.prototype.slice = function(begin, end) {
	      var size = this.size;
	      if (wholeSlice(begin, end, size)) {
	        return this;
	      }
	      return setListBounds(
	        this,
	        resolveBegin(begin, size),
	        resolveEnd(end, size)
	      );
	    };

	    List.prototype.__iterator = function(type, reverse) {
	      var index = 0;
	      var values = iterateList(this, reverse);
	      return new src_Iterator__Iterator(function()  {
	        var value = values();
	        return value === DONE ?
	          iteratorDone() :
	          iteratorValue(type, index++, value);
	      });
	    };

	    List.prototype.__iterate = function(fn, reverse) {
	      var index = 0;
	      var values = iterateList(this, reverse);
	      var value;
	      while ((value = values()) !== DONE) {
	        if (fn(value, index++, this) === false) {
	          break;
	        }
	      }
	      return index;
	    };

	    List.prototype.__ensureOwner = function(ownerID) {
	      if (ownerID === this.__ownerID) {
	        return this;
	      }
	      if (!ownerID) {
	        this.__ownerID = ownerID;
	        return this;
	      }
	      return makeList(this._origin, this._capacity, this._level, this._root, this._tail, ownerID, this.__hash);
	    };


	  function isList(maybeList) {
	    return !!(maybeList && maybeList[IS_LIST_SENTINEL]);
	  }

	  List.isList = isList;

	  var IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';

	  var ListPrototype = List.prototype;
	  ListPrototype[IS_LIST_SENTINEL] = true;
	  ListPrototype[DELETE] = ListPrototype.remove;
	  ListPrototype.setIn = MapPrototype.setIn;
	  ListPrototype.deleteIn =
	  ListPrototype.removeIn = MapPrototype.removeIn;
	  ListPrototype.update = MapPrototype.update;
	  ListPrototype.updateIn = MapPrototype.updateIn;
	  ListPrototype.mergeIn = MapPrototype.mergeIn;
	  ListPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
	  ListPrototype.withMutations = MapPrototype.withMutations;
	  ListPrototype.asMutable = MapPrototype.asMutable;
	  ListPrototype.asImmutable = MapPrototype.asImmutable;
	  ListPrototype.wasAltered = MapPrototype.wasAltered;



	    function VNode(array, ownerID) {
	      this.array = array;
	      this.ownerID = ownerID;
	    }

	    // TODO: seems like these methods are very similar

	    VNode.prototype.removeBefore = function(ownerID, level, index) {
	      if (index === level ? 1 << level : 0 || this.array.length === 0) {
	        return this;
	      }
	      var originIndex = (index >>> level) & MASK;
	      if (originIndex >= this.array.length) {
	        return new VNode([], ownerID);
	      }
	      var removingFirst = originIndex === 0;
	      var newChild;
	      if (level > 0) {
	        var oldChild = this.array[originIndex];
	        newChild = oldChild && oldChild.removeBefore(ownerID, level - SHIFT, index);
	        if (newChild === oldChild && removingFirst) {
	          return this;
	        }
	      }
	      if (removingFirst && !newChild) {
	        return this;
	      }
	      var editable = editableVNode(this, ownerID);
	      if (!removingFirst) {
	        for (var ii = 0; ii < originIndex; ii++) {
	          editable.array[ii] = undefined;
	        }
	      }
	      if (newChild) {
	        editable.array[originIndex] = newChild;
	      }
	      return editable;
	    };

	    VNode.prototype.removeAfter = function(ownerID, level, index) {
	      if (index === level ? 1 << level : 0 || this.array.length === 0) {
	        return this;
	      }
	      var sizeIndex = ((index - 1) >>> level) & MASK;
	      if (sizeIndex >= this.array.length) {
	        return this;
	      }
	      var removingLast = sizeIndex === this.array.length - 1;
	      var newChild;
	      if (level > 0) {
	        var oldChild = this.array[sizeIndex];
	        newChild = oldChild && oldChild.removeAfter(ownerID, level - SHIFT, index);
	        if (newChild === oldChild && removingLast) {
	          return this;
	        }
	      }
	      if (removingLast && !newChild) {
	        return this;
	      }
	      var editable = editableVNode(this, ownerID);
	      if (!removingLast) {
	        editable.array.pop();
	      }
	      if (newChild) {
	        editable.array[sizeIndex] = newChild;
	      }
	      return editable;
	    };



	  var DONE = {};

	  function iterateList(list, reverse) {
	    var left = list._origin;
	    var right = list._capacity;
	    var tailPos = getTailOffset(right);
	    var tail = list._tail;

	    return iterateNodeOrLeaf(list._root, list._level, 0);

	    function iterateNodeOrLeaf(node, level, offset) {
	      return level === 0 ?
	        iterateLeaf(node, offset) :
	        iterateNode(node, level, offset);
	    }

	    function iterateLeaf(node, offset) {
	      var array = offset === tailPos ? tail && tail.array : node && node.array;
	      var from = offset > left ? 0 : left - offset;
	      var to = right - offset;
	      if (to > SIZE) {
	        to = SIZE;
	      }
	      return function()  {
	        if (from === to) {
	          return DONE;
	        }
	        var idx = reverse ? --to : from++;
	        return array && array[idx];
	      };
	    }

	    function iterateNode(node, level, offset) {
	      var values;
	      var array = node && node.array;
	      var from = offset > left ? 0 : (left - offset) >> level;
	      var to = ((right - offset) >> level) + 1;
	      if (to > SIZE) {
	        to = SIZE;
	      }
	      return function()  {
	        do {
	          if (values) {
	            var value = values();
	            if (value !== DONE) {
	              return value;
	            }
	            values = null;
	          }
	          if (from === to) {
	            return DONE;
	          }
	          var idx = reverse ? --to : from++;
	          values = iterateNodeOrLeaf(
	            array && array[idx], level - SHIFT, offset + (idx << level)
	          );
	        } while (true);
	      };
	    }
	  }

	  function makeList(origin, capacity, level, root, tail, ownerID, hash) {
	    var list = Object.create(ListPrototype);
	    list.size = capacity - origin;
	    list._origin = origin;
	    list._capacity = capacity;
	    list._level = level;
	    list._root = root;
	    list._tail = tail;
	    list.__ownerID = ownerID;
	    list.__hash = hash;
	    list.__altered = false;
	    return list;
	  }

	  var EMPTY_LIST;
	  function emptyList() {
	    return EMPTY_LIST || (EMPTY_LIST = makeList(0, 0, SHIFT));
	  }

	  function updateList(list, index, value) {
	    index = wrapIndex(list, index);

	    if (index >= list.size || index < 0) {
	      return list.withMutations(function(list ) {
	        index < 0 ?
	          setListBounds(list, index).set(0, value) :
	          setListBounds(list, 0, index + 1).set(index, value)
	      });
	    }

	    index += list._origin;

	    var newTail = list._tail;
	    var newRoot = list._root;
	    var didAlter = MakeRef(DID_ALTER);
	    if (index >= getTailOffset(list._capacity)) {
	      newTail = updateVNode(newTail, list.__ownerID, 0, index, value, didAlter);
	    } else {
	      newRoot = updateVNode(newRoot, list.__ownerID, list._level, index, value, didAlter);
	    }

	    if (!didAlter.value) {
	      return list;
	    }

	    if (list.__ownerID) {
	      list._root = newRoot;
	      list._tail = newTail;
	      list.__hash = undefined;
	      list.__altered = true;
	      return list;
	    }
	    return makeList(list._origin, list._capacity, list._level, newRoot, newTail);
	  }

	  function updateVNode(node, ownerID, level, index, value, didAlter) {
	    var idx = (index >>> level) & MASK;
	    var nodeHas = node && idx < node.array.length;
	    if (!nodeHas && value === undefined) {
	      return node;
	    }

	    var newNode;

	    if (level > 0) {
	      var lowerNode = node && node.array[idx];
	      var newLowerNode = updateVNode(lowerNode, ownerID, level - SHIFT, index, value, didAlter);
	      if (newLowerNode === lowerNode) {
	        return node;
	      }
	      newNode = editableVNode(node, ownerID);
	      newNode.array[idx] = newLowerNode;
	      return newNode;
	    }

	    if (nodeHas && node.array[idx] === value) {
	      return node;
	    }

	    SetRef(didAlter);

	    newNode = editableVNode(node, ownerID);
	    if (value === undefined && idx === newNode.array.length - 1) {
	      newNode.array.pop();
	    } else {
	      newNode.array[idx] = value;
	    }
	    return newNode;
	  }

	  function editableVNode(node, ownerID) {
	    if (ownerID && node && ownerID === node.ownerID) {
	      return node;
	    }
	    return new VNode(node ? node.array.slice() : [], ownerID);
	  }

	  function listNodeFor(list, rawIndex) {
	    if (rawIndex >= getTailOffset(list._capacity)) {
	      return list._tail;
	    }
	    if (rawIndex < 1 << (list._level + SHIFT)) {
	      var node = list._root;
	      var level = list._level;
	      while (node && level > 0) {
	        node = node.array[(rawIndex >>> level) & MASK];
	        level -= SHIFT;
	      }
	      return node;
	    }
	  }

	  function setListBounds(list, begin, end) {
	    var owner = list.__ownerID || new OwnerID();
	    var oldOrigin = list._origin;
	    var oldCapacity = list._capacity;
	    var newOrigin = oldOrigin + begin;
	    var newCapacity = end === undefined ? oldCapacity : end < 0 ? oldCapacity + end : oldOrigin + end;
	    if (newOrigin === oldOrigin && newCapacity === oldCapacity) {
	      return list;
	    }

	    // If it's going to end after it starts, it's empty.
	    if (newOrigin >= newCapacity) {
	      return list.clear();
	    }

	    var newLevel = list._level;
	    var newRoot = list._root;

	    // New origin might require creating a higher root.
	    var offsetShift = 0;
	    while (newOrigin + offsetShift < 0) {
	      newRoot = new VNode(newRoot && newRoot.array.length ? [undefined, newRoot] : [], owner);
	      newLevel += SHIFT;
	      offsetShift += 1 << newLevel;
	    }
	    if (offsetShift) {
	      newOrigin += offsetShift;
	      oldOrigin += offsetShift;
	      newCapacity += offsetShift;
	      oldCapacity += offsetShift;
	    }

	    var oldTailOffset = getTailOffset(oldCapacity);
	    var newTailOffset = getTailOffset(newCapacity);

	    // New size might require creating a higher root.
	    while (newTailOffset >= 1 << (newLevel + SHIFT)) {
	      newRoot = new VNode(newRoot && newRoot.array.length ? [newRoot] : [], owner);
	      newLevel += SHIFT;
	    }

	    // Locate or create the new tail.
	    var oldTail = list._tail;
	    var newTail = newTailOffset < oldTailOffset ?
	      listNodeFor(list, newCapacity - 1) :
	      newTailOffset > oldTailOffset ? new VNode([], owner) : oldTail;

	    // Merge Tail into tree.
	    if (oldTail && newTailOffset > oldTailOffset && newOrigin < oldCapacity && oldTail.array.length) {
	      newRoot = editableVNode(newRoot, owner);
	      var node = newRoot;
	      for (var level = newLevel; level > SHIFT; level -= SHIFT) {
	        var idx = (oldTailOffset >>> level) & MASK;
	        node = node.array[idx] = editableVNode(node.array[idx], owner);
	      }
	      node.array[(oldTailOffset >>> SHIFT) & MASK] = oldTail;
	    }

	    // If the size has been reduced, there's a chance the tail needs to be trimmed.
	    if (newCapacity < oldCapacity) {
	      newTail = newTail && newTail.removeAfter(owner, 0, newCapacity);
	    }

	    // If the new origin is within the tail, then we do not need a root.
	    if (newOrigin >= newTailOffset) {
	      newOrigin -= newTailOffset;
	      newCapacity -= newTailOffset;
	      newLevel = SHIFT;
	      newRoot = null;
	      newTail = newTail && newTail.removeBefore(owner, 0, newOrigin);

	    // Otherwise, if the root has been trimmed, garbage collect.
	    } else if (newOrigin > oldOrigin || newTailOffset < oldTailOffset) {
	      offsetShift = 0;

	      // Identify the new top root node of the subtree of the old root.
	      while (newRoot) {
	        var beginIndex = (newOrigin >>> newLevel) & MASK;
	        if (beginIndex !== (newTailOffset >>> newLevel) & MASK) {
	          break;
	        }
	        if (beginIndex) {
	          offsetShift += (1 << newLevel) * beginIndex;
	        }
	        newLevel -= SHIFT;
	        newRoot = newRoot.array[beginIndex];
	      }

	      // Trim the new sides of the new root.
	      if (newRoot && newOrigin > oldOrigin) {
	        newRoot = newRoot.removeBefore(owner, newLevel, newOrigin - offsetShift);
	      }
	      if (newRoot && newTailOffset < oldTailOffset) {
	        newRoot = newRoot.removeAfter(owner, newLevel, newTailOffset - offsetShift);
	      }
	      if (offsetShift) {
	        newOrigin -= offsetShift;
	        newCapacity -= offsetShift;
	      }
	    }

	    if (list.__ownerID) {
	      list.size = newCapacity - newOrigin;
	      list._origin = newOrigin;
	      list._capacity = newCapacity;
	      list._level = newLevel;
	      list._root = newRoot;
	      list._tail = newTail;
	      list.__hash = undefined;
	      list.__altered = true;
	      return list;
	    }
	    return makeList(newOrigin, newCapacity, newLevel, newRoot, newTail);
	  }

	  function mergeIntoListWith(list, merger, iterables) {
	    var iters = [];
	    var maxSize = 0;
	    for (var ii = 0; ii < iterables.length; ii++) {
	      var value = iterables[ii];
	      var iter = IndexedIterable(value);
	      if (iter.size > maxSize) {
	        maxSize = iter.size;
	      }
	      if (!isIterable(value)) {
	        iter = iter.map(function(v ) {return fromJS(v)});
	      }
	      iters.push(iter);
	    }
	    if (maxSize > list.size) {
	      list = list.setSize(maxSize);
	    }
	    return mergeIntoCollectionWith(list, merger, iters);
	  }

	  function getTailOffset(size) {
	    return size < SIZE ? 0 : (((size - 1) >>> SHIFT) << SHIFT);
	  }

	  createClass(OrderedMap, src_Map__Map);

	    // @pragma Construction

	    function OrderedMap(value) {
	      return value === null || value === undefined ? emptyOrderedMap() :
	        isOrderedMap(value) ? value :
	        emptyOrderedMap().withMutations(function(map ) {
	          var iter = KeyedIterable(value);
	          assertNotInfinite(iter.size);
	          iter.forEach(function(v, k)  {return map.set(k, v)});
	        });
	    }

	    OrderedMap.of = function(/*...values*/) {
	      return this(arguments);
	    };

	    OrderedMap.prototype.toString = function() {
	      return this.__toString('OrderedMap {', '}');
	    };

	    // @pragma Access

	    OrderedMap.prototype.get = function(k, notSetValue) {
	      var index = this._map.get(k);
	      return index !== undefined ? this._list.get(index)[1] : notSetValue;
	    };

	    // @pragma Modification

	    OrderedMap.prototype.clear = function() {
	      if (this.size === 0) {
	        return this;
	      }
	      if (this.__ownerID) {
	        this.size = 0;
	        this._map.clear();
	        this._list.clear();
	        return this;
	      }
	      return emptyOrderedMap();
	    };

	    OrderedMap.prototype.set = function(k, v) {
	      return updateOrderedMap(this, k, v);
	    };

	    OrderedMap.prototype.remove = function(k) {
	      return updateOrderedMap(this, k, NOT_SET);
	    };

	    OrderedMap.prototype.wasAltered = function() {
	      return this._map.wasAltered() || this._list.wasAltered();
	    };

	    OrderedMap.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      return this._list.__iterate(
	        function(entry ) {return entry && fn(entry[1], entry[0], this$0)},
	        reverse
	      );
	    };

	    OrderedMap.prototype.__iterator = function(type, reverse) {
	      return this._list.fromEntrySeq().__iterator(type, reverse);
	    };

	    OrderedMap.prototype.__ensureOwner = function(ownerID) {
	      if (ownerID === this.__ownerID) {
	        return this;
	      }
	      var newMap = this._map.__ensureOwner(ownerID);
	      var newList = this._list.__ensureOwner(ownerID);
	      if (!ownerID) {
	        this.__ownerID = ownerID;
	        this._map = newMap;
	        this._list = newList;
	        return this;
	      }
	      return makeOrderedMap(newMap, newList, ownerID, this.__hash);
	    };


	  function isOrderedMap(maybeOrderedMap) {
	    return isMap(maybeOrderedMap) && isOrdered(maybeOrderedMap);
	  }

	  OrderedMap.isOrderedMap = isOrderedMap;

	  OrderedMap.prototype[IS_ORDERED_SENTINEL] = true;
	  OrderedMap.prototype[DELETE] = OrderedMap.prototype.remove;



	  function makeOrderedMap(map, list, ownerID, hash) {
	    var omap = Object.create(OrderedMap.prototype);
	    omap.size = map ? map.size : 0;
	    omap._map = map;
	    omap._list = list;
	    omap.__ownerID = ownerID;
	    omap.__hash = hash;
	    return omap;
	  }

	  var EMPTY_ORDERED_MAP;
	  function emptyOrderedMap() {
	    return EMPTY_ORDERED_MAP || (EMPTY_ORDERED_MAP = makeOrderedMap(emptyMap(), emptyList()));
	  }

	  function updateOrderedMap(omap, k, v) {
	    var map = omap._map;
	    var list = omap._list;
	    var i = map.get(k);
	    var has = i !== undefined;
	    var newMap;
	    var newList;
	    if (v === NOT_SET) { // removed
	      if (!has) {
	        return omap;
	      }
	      if (list.size >= SIZE && list.size >= map.size * 2) {
	        newList = list.filter(function(entry, idx)  {return entry !== undefined && i !== idx});
	        newMap = newList.toKeyedSeq().map(function(entry ) {return entry[0]}).flip().toMap();
	        if (omap.__ownerID) {
	          newMap.__ownerID = newList.__ownerID = omap.__ownerID;
	        }
	      } else {
	        newMap = map.remove(k);
	        newList = i === list.size - 1 ? list.pop() : list.set(i, undefined);
	      }
	    } else {
	      if (has) {
	        if (v === list.get(i)[1]) {
	          return omap;
	        }
	        newMap = map;
	        newList = list.set(i, [k, v]);
	      } else {
	        newMap = map.set(k, list.size);
	        newList = list.set(list.size, [k, v]);
	      }
	    }
	    if (omap.__ownerID) {
	      omap.size = newMap.size;
	      omap._map = newMap;
	      omap._list = newList;
	      omap.__hash = undefined;
	      return omap;
	    }
	    return makeOrderedMap(newMap, newList);
	  }

	  createClass(Stack, IndexedCollection);

	    // @pragma Construction

	    function Stack(value) {
	      return value === null || value === undefined ? emptyStack() :
	        isStack(value) ? value :
	        emptyStack().unshiftAll(value);
	    }

	    Stack.of = function(/*...values*/) {
	      return this(arguments);
	    };

	    Stack.prototype.toString = function() {
	      return this.__toString('Stack [', ']');
	    };

	    // @pragma Access

	    Stack.prototype.get = function(index, notSetValue) {
	      var head = this._head;
	      index = wrapIndex(this, index);
	      while (head && index--) {
	        head = head.next;
	      }
	      return head ? head.value : notSetValue;
	    };

	    Stack.prototype.peek = function() {
	      return this._head && this._head.value;
	    };

	    // @pragma Modification

	    Stack.prototype.push = function(/*...values*/) {
	      if (arguments.length === 0) {
	        return this;
	      }
	      var newSize = this.size + arguments.length;
	      var head = this._head;
	      for (var ii = arguments.length - 1; ii >= 0; ii--) {
	        head = {
	          value: arguments[ii],
	          next: head
	        };
	      }
	      if (this.__ownerID) {
	        this.size = newSize;
	        this._head = head;
	        this.__hash = undefined;
	        this.__altered = true;
	        return this;
	      }
	      return makeStack(newSize, head);
	    };

	    Stack.prototype.pushAll = function(iter) {
	      iter = IndexedIterable(iter);
	      if (iter.size === 0) {
	        return this;
	      }
	      assertNotInfinite(iter.size);
	      var newSize = this.size;
	      var head = this._head;
	      iter.reverse().forEach(function(value ) {
	        newSize++;
	        head = {
	          value: value,
	          next: head
	        };
	      });
	      if (this.__ownerID) {
	        this.size = newSize;
	        this._head = head;
	        this.__hash = undefined;
	        this.__altered = true;
	        return this;
	      }
	      return makeStack(newSize, head);
	    };

	    Stack.prototype.pop = function() {
	      return this.slice(1);
	    };

	    Stack.prototype.unshift = function(/*...values*/) {
	      return this.push.apply(this, arguments);
	    };

	    Stack.prototype.unshiftAll = function(iter) {
	      return this.pushAll(iter);
	    };

	    Stack.prototype.shift = function() {
	      return this.pop.apply(this, arguments);
	    };

	    Stack.prototype.clear = function() {
	      if (this.size === 0) {
	        return this;
	      }
	      if (this.__ownerID) {
	        this.size = 0;
	        this._head = undefined;
	        this.__hash = undefined;
	        this.__altered = true;
	        return this;
	      }
	      return emptyStack();
	    };

	    Stack.prototype.slice = function(begin, end) {
	      if (wholeSlice(begin, end, this.size)) {
	        return this;
	      }
	      var resolvedBegin = resolveBegin(begin, this.size);
	      var resolvedEnd = resolveEnd(end, this.size);
	      if (resolvedEnd !== this.size) {
	        // super.slice(begin, end);
	        return IndexedCollection.prototype.slice.call(this, begin, end);
	      }
	      var newSize = this.size - resolvedBegin;
	      var head = this._head;
	      while (resolvedBegin--) {
	        head = head.next;
	      }
	      if (this.__ownerID) {
	        this.size = newSize;
	        this._head = head;
	        this.__hash = undefined;
	        this.__altered = true;
	        return this;
	      }
	      return makeStack(newSize, head);
	    };

	    // @pragma Mutability

	    Stack.prototype.__ensureOwner = function(ownerID) {
	      if (ownerID === this.__ownerID) {
	        return this;
	      }
	      if (!ownerID) {
	        this.__ownerID = ownerID;
	        this.__altered = false;
	        return this;
	      }
	      return makeStack(this.size, this._head, ownerID, this.__hash);
	    };

	    // @pragma Iteration

	    Stack.prototype.__iterate = function(fn, reverse) {
	      if (reverse) {
	        return this.reverse().__iterate(fn);
	      }
	      var iterations = 0;
	      var node = this._head;
	      while (node) {
	        if (fn(node.value, iterations++, this) === false) {
	          break;
	        }
	        node = node.next;
	      }
	      return iterations;
	    };

	    Stack.prototype.__iterator = function(type, reverse) {
	      if (reverse) {
	        return this.reverse().__iterator(type);
	      }
	      var iterations = 0;
	      var node = this._head;
	      return new src_Iterator__Iterator(function()  {
	        if (node) {
	          var value = node.value;
	          node = node.next;
	          return iteratorValue(type, iterations++, value);
	        }
	        return iteratorDone();
	      });
	    };


	  function isStack(maybeStack) {
	    return !!(maybeStack && maybeStack[IS_STACK_SENTINEL]);
	  }

	  Stack.isStack = isStack;

	  var IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';

	  var StackPrototype = Stack.prototype;
	  StackPrototype[IS_STACK_SENTINEL] = true;
	  StackPrototype.withMutations = MapPrototype.withMutations;
	  StackPrototype.asMutable = MapPrototype.asMutable;
	  StackPrototype.asImmutable = MapPrototype.asImmutable;
	  StackPrototype.wasAltered = MapPrototype.wasAltered;


	  function makeStack(size, head, ownerID, hash) {
	    var map = Object.create(StackPrototype);
	    map.size = size;
	    map._head = head;
	    map.__ownerID = ownerID;
	    map.__hash = hash;
	    map.__altered = false;
	    return map;
	  }

	  var EMPTY_STACK;
	  function emptyStack() {
	    return EMPTY_STACK || (EMPTY_STACK = makeStack(0));
	  }

	  createClass(src_Set__Set, SetCollection);

	    // @pragma Construction

	    function src_Set__Set(value) {
	      return value === null || value === undefined ? emptySet() :
	        isSet(value) ? value :
	        emptySet().withMutations(function(set ) {
	          var iter = SetIterable(value);
	          assertNotInfinite(iter.size);
	          iter.forEach(function(v ) {return set.add(v)});
	        });
	    }

	    src_Set__Set.of = function(/*...values*/) {
	      return this(arguments);
	    };

	    src_Set__Set.fromKeys = function(value) {
	      return this(KeyedIterable(value).keySeq());
	    };

	    src_Set__Set.prototype.toString = function() {
	      return this.__toString('Set {', '}');
	    };

	    // @pragma Access

	    src_Set__Set.prototype.has = function(value) {
	      return this._map.has(value);
	    };

	    // @pragma Modification

	    src_Set__Set.prototype.add = function(value) {
	      return updateSet(this, this._map.set(value, true));
	    };

	    src_Set__Set.prototype.remove = function(value) {
	      return updateSet(this, this._map.remove(value));
	    };

	    src_Set__Set.prototype.clear = function() {
	      return updateSet(this, this._map.clear());
	    };

	    // @pragma Composition

	    src_Set__Set.prototype.union = function() {var iters = SLICE$0.call(arguments, 0);
	      iters = iters.filter(function(x ) {return x.size !== 0});
	      if (iters.length === 0) {
	        return this;
	      }
	      if (this.size === 0 && iters.length === 1) {
	        return this.constructor(iters[0]);
	      }
	      return this.withMutations(function(set ) {
	        for (var ii = 0; ii < iters.length; ii++) {
	          SetIterable(iters[ii]).forEach(function(value ) {return set.add(value)});
	        }
	      });
	    };

	    src_Set__Set.prototype.intersect = function() {var iters = SLICE$0.call(arguments, 0);
	      if (iters.length === 0) {
	        return this;
	      }
	      iters = iters.map(function(iter ) {return SetIterable(iter)});
	      var originalSet = this;
	      return this.withMutations(function(set ) {
	        originalSet.forEach(function(value ) {
	          if (!iters.every(function(iter ) {return iter.contains(value)})) {
	            set.remove(value);
	          }
	        });
	      });
	    };

	    src_Set__Set.prototype.subtract = function() {var iters = SLICE$0.call(arguments, 0);
	      if (iters.length === 0) {
	        return this;
	      }
	      iters = iters.map(function(iter ) {return SetIterable(iter)});
	      var originalSet = this;
	      return this.withMutations(function(set ) {
	        originalSet.forEach(function(value ) {
	          if (iters.some(function(iter ) {return iter.contains(value)})) {
	            set.remove(value);
	          }
	        });
	      });
	    };

	    src_Set__Set.prototype.merge = function() {
	      return this.union.apply(this, arguments);
	    };

	    src_Set__Set.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
	      return this.union.apply(this, iters);
	    };

	    src_Set__Set.prototype.sort = function(comparator) {
	      // Late binding
	      return OrderedSet(sortFactory(this, comparator));
	    };

	    src_Set__Set.prototype.sortBy = function(mapper, comparator) {
	      // Late binding
	      return OrderedSet(sortFactory(this, comparator, mapper));
	    };

	    src_Set__Set.prototype.wasAltered = function() {
	      return this._map.wasAltered();
	    };

	    src_Set__Set.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      return this._map.__iterate(function(_, k)  {return fn(k, k, this$0)}, reverse);
	    };

	    src_Set__Set.prototype.__iterator = function(type, reverse) {
	      return this._map.map(function(_, k)  {return k}).__iterator(type, reverse);
	    };

	    src_Set__Set.prototype.__ensureOwner = function(ownerID) {
	      if (ownerID === this.__ownerID) {
	        return this;
	      }
	      var newMap = this._map.__ensureOwner(ownerID);
	      if (!ownerID) {
	        this.__ownerID = ownerID;
	        this._map = newMap;
	        return this;
	      }
	      return this.__make(newMap, ownerID);
	    };


	  function isSet(maybeSet) {
	    return !!(maybeSet && maybeSet[IS_SET_SENTINEL]);
	  }

	  src_Set__Set.isSet = isSet;

	  var IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';

	  var SetPrototype = src_Set__Set.prototype;
	  SetPrototype[IS_SET_SENTINEL] = true;
	  SetPrototype[DELETE] = SetPrototype.remove;
	  SetPrototype.mergeDeep = SetPrototype.merge;
	  SetPrototype.mergeDeepWith = SetPrototype.mergeWith;
	  SetPrototype.withMutations = MapPrototype.withMutations;
	  SetPrototype.asMutable = MapPrototype.asMutable;
	  SetPrototype.asImmutable = MapPrototype.asImmutable;

	  SetPrototype.__empty = emptySet;
	  SetPrototype.__make = makeSet;

	  function updateSet(set, newMap) {
	    if (set.__ownerID) {
	      set.size = newMap.size;
	      set._map = newMap;
	      return set;
	    }
	    return newMap === set._map ? set :
	      newMap.size === 0 ? set.__empty() :
	      set.__make(newMap);
	  }

	  function makeSet(map, ownerID) {
	    var set = Object.create(SetPrototype);
	    set.size = map ? map.size : 0;
	    set._map = map;
	    set.__ownerID = ownerID;
	    return set;
	  }

	  var EMPTY_SET;
	  function emptySet() {
	    return EMPTY_SET || (EMPTY_SET = makeSet(emptyMap()));
	  }

	  createClass(OrderedSet, src_Set__Set);

	    // @pragma Construction

	    function OrderedSet(value) {
	      return value === null || value === undefined ? emptyOrderedSet() :
	        isOrderedSet(value) ? value :
	        emptyOrderedSet().withMutations(function(set ) {
	          var iter = SetIterable(value);
	          assertNotInfinite(iter.size);
	          iter.forEach(function(v ) {return set.add(v)});
	        });
	    }

	    OrderedSet.of = function(/*...values*/) {
	      return this(arguments);
	    };

	    OrderedSet.fromKeys = function(value) {
	      return this(KeyedIterable(value).keySeq());
	    };

	    OrderedSet.prototype.toString = function() {
	      return this.__toString('OrderedSet {', '}');
	    };


	  function isOrderedSet(maybeOrderedSet) {
	    return isSet(maybeOrderedSet) && isOrdered(maybeOrderedSet);
	  }

	  OrderedSet.isOrderedSet = isOrderedSet;

	  var OrderedSetPrototype = OrderedSet.prototype;
	  OrderedSetPrototype[IS_ORDERED_SENTINEL] = true;

	  OrderedSetPrototype.__empty = emptyOrderedSet;
	  OrderedSetPrototype.__make = makeOrderedSet;

	  function makeOrderedSet(map, ownerID) {
	    var set = Object.create(OrderedSetPrototype);
	    set.size = map ? map.size : 0;
	    set._map = map;
	    set.__ownerID = ownerID;
	    return set;
	  }

	  var EMPTY_ORDERED_SET;
	  function emptyOrderedSet() {
	    return EMPTY_ORDERED_SET || (EMPTY_ORDERED_SET = makeOrderedSet(emptyOrderedMap()));
	  }

	  createClass(Record, KeyedCollection);

	    function Record(defaultValues, name) {
	      var RecordType = function Record(values) {
	        if (!(this instanceof RecordType)) {
	          return new RecordType(values);
	        }
	        this._map = src_Map__Map(values);
	      };

	      var keys = Object.keys(defaultValues);

	      var RecordTypePrototype = RecordType.prototype = Object.create(RecordPrototype);
	      RecordTypePrototype.constructor = RecordType;
	      name && (RecordTypePrototype._name = name);
	      RecordTypePrototype._defaultValues = defaultValues;
	      RecordTypePrototype._keys = keys;
	      RecordTypePrototype.size = keys.length;

	      try {
	        keys.forEach(function(key ) {
	          Object.defineProperty(RecordType.prototype, key, {
	            get: function() {
	              return this.get(key);
	            },
	            set: function(value) {
	              invariant(this.__ownerID, 'Cannot set on an immutable record.');
	              this.set(key, value);
	            }
	          });
	        });
	      } catch (error) {
	        // Object.defineProperty failed. Probably IE8.
	      }

	      return RecordType;
	    }

	    Record.prototype.toString = function() {
	      return this.__toString(recordName(this) + ' {', '}');
	    };

	    // @pragma Access

	    Record.prototype.has = function(k) {
	      return this._defaultValues.hasOwnProperty(k);
	    };

	    Record.prototype.get = function(k, notSetValue) {
	      if (!this.has(k)) {
	        return notSetValue;
	      }
	      var defaultVal = this._defaultValues[k];
	      return this._map ? this._map.get(k, defaultVal) : defaultVal;
	    };

	    // @pragma Modification

	    Record.prototype.clear = function() {
	      if (this.__ownerID) {
	        this._map && this._map.clear();
	        return this;
	      }
	      var SuperRecord = Object.getPrototypeOf(this).constructor;
	      return SuperRecord._empty || (SuperRecord._empty = makeRecord(this, emptyMap()));
	    };

	    Record.prototype.set = function(k, v) {
	      if (!this.has(k)) {
	        throw new Error('Cannot set unknown key "' + k + '" on ' + recordName(this));
	      }
	      var newMap = this._map && this._map.set(k, v);
	      if (this.__ownerID || newMap === this._map) {
	        return this;
	      }
	      return makeRecord(this, newMap);
	    };

	    Record.prototype.remove = function(k) {
	      if (!this.has(k)) {
	        return this;
	      }
	      var newMap = this._map && this._map.remove(k);
	      if (this.__ownerID || newMap === this._map) {
	        return this;
	      }
	      return makeRecord(this, newMap);
	    };

	    Record.prototype.wasAltered = function() {
	      return this._map.wasAltered();
	    };

	    Record.prototype.__iterator = function(type, reverse) {var this$0 = this;
	      return KeyedIterable(this._defaultValues).map(function(_, k)  {return this$0.get(k)}).__iterator(type, reverse);
	    };

	    Record.prototype.__iterate = function(fn, reverse) {var this$0 = this;
	      return KeyedIterable(this._defaultValues).map(function(_, k)  {return this$0.get(k)}).__iterate(fn, reverse);
	    };

	    Record.prototype.__ensureOwner = function(ownerID) {
	      if (ownerID === this.__ownerID) {
	        return this;
	      }
	      var newMap = this._map && this._map.__ensureOwner(ownerID);
	      if (!ownerID) {
	        this.__ownerID = ownerID;
	        this._map = newMap;
	        return this;
	      }
	      return makeRecord(this, newMap, ownerID);
	    };


	  var RecordPrototype = Record.prototype;
	  RecordPrototype[DELETE] = RecordPrototype.remove;
	  RecordPrototype.deleteIn =
	  RecordPrototype.removeIn = MapPrototype.removeIn;
	  RecordPrototype.merge = MapPrototype.merge;
	  RecordPrototype.mergeWith = MapPrototype.mergeWith;
	  RecordPrototype.mergeIn = MapPrototype.mergeIn;
	  RecordPrototype.mergeDeep = MapPrototype.mergeDeep;
	  RecordPrototype.mergeDeepWith = MapPrototype.mergeDeepWith;
	  RecordPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
	  RecordPrototype.setIn = MapPrototype.setIn;
	  RecordPrototype.update = MapPrototype.update;
	  RecordPrototype.updateIn = MapPrototype.updateIn;
	  RecordPrototype.withMutations = MapPrototype.withMutations;
	  RecordPrototype.asMutable = MapPrototype.asMutable;
	  RecordPrototype.asImmutable = MapPrototype.asImmutable;


	  function makeRecord(likeRecord, map, ownerID) {
	    var record = Object.create(Object.getPrototypeOf(likeRecord));
	    record._map = map;
	    record.__ownerID = ownerID;
	    return record;
	  }

	  function recordName(record) {
	    return record._name || record.constructor.name;
	  }

	  function deepEqual(a, b) {
	    if (a === b) {
	      return true;
	    }

	    if (
	      !isIterable(b) ||
	      a.size !== undefined && b.size !== undefined && a.size !== b.size ||
	      a.__hash !== undefined && b.__hash !== undefined && a.__hash !== b.__hash ||
	      isKeyed(a) !== isKeyed(b) ||
	      isIndexed(a) !== isIndexed(b) ||
	      isOrdered(a) !== isOrdered(b)
	    ) {
	      return false;
	    }

	    if (a.size === 0 && b.size === 0) {
	      return true;
	    }

	    var notAssociative = !isAssociative(a);

	    if (isOrdered(a)) {
	      var entries = a.entries();
	      return b.every(function(v, k)  {
	        var entry = entries.next().value;
	        return entry && is(entry[1], v) && (notAssociative || is(entry[0], k));
	      }) && entries.next().done;
	    }

	    var flipped = false;

	    if (a.size === undefined) {
	      if (b.size === undefined) {
	        a.cacheResult();
	      } else {
	        flipped = true;
	        var _ = a;
	        a = b;
	        b = _;
	      }
	    }

	    var allEqual = true;
	    var bSize = b.__iterate(function(v, k)  {
	      if (notAssociative ? !a.has(v) :
	          flipped ? !is(v, a.get(k, NOT_SET)) : !is(a.get(k, NOT_SET), v)) {
	        allEqual = false;
	        return false;
	      }
	    });

	    return allEqual && a.size === bSize;
	  }

	  createClass(Range, IndexedSeq);

	    function Range(start, end, step) {
	      if (!(this instanceof Range)) {
	        return new Range(start, end, step);
	      }
	      invariant(step !== 0, 'Cannot step a Range by 0');
	      start = start || 0;
	      if (end === undefined) {
	        end = Infinity;
	      }
	      step = step === undefined ? 1 : Math.abs(step);
	      if (end < start) {
	        step = -step;
	      }
	      this._start = start;
	      this._end = end;
	      this._step = step;
	      this.size = Math.max(0, Math.ceil((end - start) / step - 1) + 1);
	      if (this.size === 0) {
	        if (EMPTY_RANGE) {
	          return EMPTY_RANGE;
	        }
	        EMPTY_RANGE = this;
	      }
	    }

	    Range.prototype.toString = function() {
	      if (this.size === 0) {
	        return 'Range []';
	      }
	      return 'Range [ ' +
	        this._start + '...' + this._end +
	        (this._step > 1 ? ' by ' + this._step : '') +
	      ' ]';
	    };

	    Range.prototype.get = function(index, notSetValue) {
	      return this.has(index) ?
	        this._start + wrapIndex(this, index) * this._step :
	        notSetValue;
	    };

	    Range.prototype.contains = function(searchValue) {
	      var possibleIndex = (searchValue - this._start) / this._step;
	      return possibleIndex >= 0 &&
	        possibleIndex < this.size &&
	        possibleIndex === Math.floor(possibleIndex);
	    };

	    Range.prototype.slice = function(begin, end) {
	      if (wholeSlice(begin, end, this.size)) {
	        return this;
	      }
	      begin = resolveBegin(begin, this.size);
	      end = resolveEnd(end, this.size);
	      if (end <= begin) {
	        return new Range(0, 0);
	      }
	      return new Range(this.get(begin, this._end), this.get(end, this._end), this._step);
	    };

	    Range.prototype.indexOf = function(searchValue) {
	      var offsetValue = searchValue - this._start;
	      if (offsetValue % this._step === 0) {
	        var index = offsetValue / this._step;
	        if (index >= 0 && index < this.size) {
	          return index
	        }
	      }
	      return -1;
	    };

	    Range.prototype.lastIndexOf = function(searchValue) {
	      return this.indexOf(searchValue);
	    };

	    Range.prototype.__iterate = function(fn, reverse) {
	      var maxIndex = this.size - 1;
	      var step = this._step;
	      var value = reverse ? this._start + maxIndex * step : this._start;
	      for (var ii = 0; ii <= maxIndex; ii++) {
	        if (fn(value, ii, this) === false) {
	          return ii + 1;
	        }
	        value += reverse ? -step : step;
	      }
	      return ii;
	    };

	    Range.prototype.__iterator = function(type, reverse) {
	      var maxIndex = this.size - 1;
	      var step = this._step;
	      var value = reverse ? this._start + maxIndex * step : this._start;
	      var ii = 0;
	      return new src_Iterator__Iterator(function()  {
	        var v = value;
	        value += reverse ? -step : step;
	        return ii > maxIndex ? iteratorDone() : iteratorValue(type, ii++, v);
	      });
	    };

	    Range.prototype.equals = function(other) {
	      return other instanceof Range ?
	        this._start === other._start &&
	        this._end === other._end &&
	        this._step === other._step :
	        deepEqual(this, other);
	    };


	  var EMPTY_RANGE;

	  createClass(Repeat, IndexedSeq);

	    function Repeat(value, times) {
	      if (!(this instanceof Repeat)) {
	        return new Repeat(value, times);
	      }
	      this._value = value;
	      this.size = times === undefined ? Infinity : Math.max(0, times);
	      if (this.size === 0) {
	        if (EMPTY_REPEAT) {
	          return EMPTY_REPEAT;
	        }
	        EMPTY_REPEAT = this;
	      }
	    }

	    Repeat.prototype.toString = function() {
	      if (this.size === 0) {
	        return 'Repeat []';
	      }
	      return 'Repeat [ ' + this._value + ' ' + this.size + ' times ]';
	    };

	    Repeat.prototype.get = function(index, notSetValue) {
	      return this.has(index) ? this._value : notSetValue;
	    };

	    Repeat.prototype.contains = function(searchValue) {
	      return is(this._value, searchValue);
	    };

	    Repeat.prototype.slice = function(begin, end) {
	      var size = this.size;
	      return wholeSlice(begin, end, size) ? this :
	        new Repeat(this._value, resolveEnd(end, size) - resolveBegin(begin, size));
	    };

	    Repeat.prototype.reverse = function() {
	      return this;
	    };

	    Repeat.prototype.indexOf = function(searchValue) {
	      if (is(this._value, searchValue)) {
	        return 0;
	      }
	      return -1;
	    };

	    Repeat.prototype.lastIndexOf = function(searchValue) {
	      if (is(this._value, searchValue)) {
	        return this.size;
	      }
	      return -1;
	    };

	    Repeat.prototype.__iterate = function(fn, reverse) {
	      for (var ii = 0; ii < this.size; ii++) {
	        if (fn(this._value, ii, this) === false) {
	          return ii + 1;
	        }
	      }
	      return ii;
	    };

	    Repeat.prototype.__iterator = function(type, reverse) {var this$0 = this;
	      var ii = 0;
	      return new src_Iterator__Iterator(function() 
	        {return ii < this$0.size ? iteratorValue(type, ii++, this$0._value) : iteratorDone()}
	      );
	    };

	    Repeat.prototype.equals = function(other) {
	      return other instanceof Repeat ?
	        is(this._value, other._value) :
	        deepEqual(other);
	    };


	  var EMPTY_REPEAT;

	  /**
	   * Contributes additional methods to a constructor
	   */
	  function mixin(ctor, methods) {
	    var keyCopier = function(key ) { ctor.prototype[key] = methods[key]; };
	    Object.keys(methods).forEach(keyCopier);
	    Object.getOwnPropertySymbols &&
	      Object.getOwnPropertySymbols(methods).forEach(keyCopier);
	    return ctor;
	  }

	  Iterable.Iterator = src_Iterator__Iterator;

	  mixin(Iterable, {

	    // ### Conversion to other types

	    toArray: function() {
	      assertNotInfinite(this.size);
	      var array = new Array(this.size || 0);
	      this.valueSeq().__iterate(function(v, i)  { array[i] = v; });
	      return array;
	    },

	    toIndexedSeq: function() {
	      return new ToIndexedSequence(this);
	    },

	    toJS: function() {
	      return this.toSeq().map(
	        function(value ) {return value && typeof value.toJS === 'function' ? value.toJS() : value}
	      ).__toJS();
	    },

	    toJSON: function() {
	      return this.toSeq().map(
	        function(value ) {return value && typeof value.toJSON === 'function' ? value.toJSON() : value}
	      ).__toJS();
	    },

	    toKeyedSeq: function() {
	      return new ToKeyedSequence(this, true);
	    },

	    toMap: function() {
	      // Use Late Binding here to solve the circular dependency.
	      return src_Map__Map(this.toKeyedSeq());
	    },

	    toObject: function() {
	      assertNotInfinite(this.size);
	      var object = {};
	      this.__iterate(function(v, k)  { object[k] = v; });
	      return object;
	    },

	    toOrderedMap: function() {
	      // Use Late Binding here to solve the circular dependency.
	      return OrderedMap(this.toKeyedSeq());
	    },

	    toOrderedSet: function() {
	      // Use Late Binding here to solve the circular dependency.
	      return OrderedSet(isKeyed(this) ? this.valueSeq() : this);
	    },

	    toSet: function() {
	      // Use Late Binding here to solve the circular dependency.
	      return src_Set__Set(isKeyed(this) ? this.valueSeq() : this);
	    },

	    toSetSeq: function() {
	      return new ToSetSequence(this);
	    },

	    toSeq: function() {
	      return isIndexed(this) ? this.toIndexedSeq() :
	        isKeyed(this) ? this.toKeyedSeq() :
	        this.toSetSeq();
	    },

	    toStack: function() {
	      // Use Late Binding here to solve the circular dependency.
	      return Stack(isKeyed(this) ? this.valueSeq() : this);
	    },

	    toList: function() {
	      // Use Late Binding here to solve the circular dependency.
	      return List(isKeyed(this) ? this.valueSeq() : this);
	    },


	    // ### Common JavaScript methods and properties

	    toString: function() {
	      return '[Iterable]';
	    },

	    __toString: function(head, tail) {
	      if (this.size === 0) {
	        return head + tail;
	      }
	      return head + ' ' + this.toSeq().map(this.__toStringMapper).join(', ') + ' ' + tail;
	    },


	    // ### ES6 Collection methods (ES6 Array and Map)

	    concat: function() {var values = SLICE$0.call(arguments, 0);
	      return reify(this, concatFactory(this, values));
	    },

	    contains: function(searchValue) {
	      return this.some(function(value ) {return is(value, searchValue)});
	    },

	    entries: function() {
	      return this.__iterator(ITERATE_ENTRIES);
	    },

	    every: function(predicate, context) {
	      assertNotInfinite(this.size);
	      var returnValue = true;
	      this.__iterate(function(v, k, c)  {
	        if (!predicate.call(context, v, k, c)) {
	          returnValue = false;
	          return false;
	        }
	      });
	      return returnValue;
	    },

	    filter: function(predicate, context) {
	      return reify(this, filterFactory(this, predicate, context, true));
	    },

	    find: function(predicate, context, notSetValue) {
	      var entry = this.findEntry(predicate, context);
	      return entry ? entry[1] : notSetValue;
	    },

	    findEntry: function(predicate, context) {
	      var found;
	      this.__iterate(function(v, k, c)  {
	        if (predicate.call(context, v, k, c)) {
	          found = [k, v];
	          return false;
	        }
	      });
	      return found;
	    },

	    findLastEntry: function(predicate, context) {
	      return this.toSeq().reverse().findEntry(predicate, context);
	    },

	    forEach: function(sideEffect, context) {
	      assertNotInfinite(this.size);
	      return this.__iterate(context ? sideEffect.bind(context) : sideEffect);
	    },

	    join: function(separator) {
	      assertNotInfinite(this.size);
	      separator = separator !== undefined ? '' + separator : ',';
	      var joined = '';
	      var isFirst = true;
	      this.__iterate(function(v ) {
	        isFirst ? (isFirst = false) : (joined += separator);
	        joined += v !== null && v !== undefined ? v.toString() : '';
	      });
	      return joined;
	    },

	    keys: function() {
	      return this.__iterator(ITERATE_KEYS);
	    },

	    map: function(mapper, context) {
	      return reify(this, mapFactory(this, mapper, context));
	    },

	    reduce: function(reducer, initialReduction, context) {
	      assertNotInfinite(this.size);
	      var reduction;
	      var useFirst;
	      if (arguments.length < 2) {
	        useFirst = true;
	      } else {
	        reduction = initialReduction;
	      }
	      this.__iterate(function(v, k, c)  {
	        if (useFirst) {
	          useFirst = false;
	          reduction = v;
	        } else {
	          reduction = reducer.call(context, reduction, v, k, c);
	        }
	      });
	      return reduction;
	    },

	    reduceRight: function(reducer, initialReduction, context) {
	      var reversed = this.toKeyedSeq().reverse();
	      return reversed.reduce.apply(reversed, arguments);
	    },

	    reverse: function() {
	      return reify(this, reverseFactory(this, true));
	    },

	    slice: function(begin, end) {
	      return reify(this, sliceFactory(this, begin, end, true));
	    },

	    some: function(predicate, context) {
	      return !this.every(not(predicate), context);
	    },

	    sort: function(comparator) {
	      return reify(this, sortFactory(this, comparator));
	    },

	    values: function() {
	      return this.__iterator(ITERATE_VALUES);
	    },


	    // ### More sequential methods

	    butLast: function() {
	      return this.slice(0, -1);
	    },

	    isEmpty: function() {
	      return this.size !== undefined ? this.size === 0 : !this.some(function()  {return true});
	    },

	    count: function(predicate, context) {
	      return ensureSize(
	        predicate ? this.toSeq().filter(predicate, context) : this
	      );
	    },

	    countBy: function(grouper, context) {
	      return countByFactory(this, grouper, context);
	    },

	    equals: function(other) {
	      return deepEqual(this, other);
	    },

	    entrySeq: function() {
	      var iterable = this;
	      if (iterable._cache) {
	        // We cache as an entries array, so we can just return the cache!
	        return new ArraySeq(iterable._cache);
	      }
	      var entriesSequence = iterable.toSeq().map(entryMapper).toIndexedSeq();
	      entriesSequence.fromEntrySeq = function()  {return iterable.toSeq()};
	      return entriesSequence;
	    },

	    filterNot: function(predicate, context) {
	      return this.filter(not(predicate), context);
	    },

	    findLast: function(predicate, context, notSetValue) {
	      return this.toKeyedSeq().reverse().find(predicate, context, notSetValue);
	    },

	    first: function() {
	      return this.find(returnTrue);
	    },

	    flatMap: function(mapper, context) {
	      return reify(this, flatMapFactory(this, mapper, context));
	    },

	    flatten: function(depth) {
	      return reify(this, flattenFactory(this, depth, true));
	    },

	    fromEntrySeq: function() {
	      return new FromEntriesSequence(this);
	    },

	    get: function(searchKey, notSetValue) {
	      return this.find(function(_, key)  {return is(key, searchKey)}, undefined, notSetValue);
	    },

	    getIn: function(searchKeyPath, notSetValue) {
	      var nested = this;
	      // Note: in an ES6 environment, we would prefer:
	      // for (var key of searchKeyPath) {
	      var iter = forceIterator(searchKeyPath);
	      var step;
	      while (!(step = iter.next()).done) {
	        var key = step.value;
	        nested = nested && nested.get ? nested.get(key, NOT_SET) : NOT_SET;
	        if (nested === NOT_SET) {
	          return notSetValue;
	        }
	      }
	      return nested;
	    },

	    groupBy: function(grouper, context) {
	      return groupByFactory(this, grouper, context);
	    },

	    has: function(searchKey) {
	      return this.get(searchKey, NOT_SET) !== NOT_SET;
	    },

	    hasIn: function(searchKeyPath) {
	      return this.getIn(searchKeyPath, NOT_SET) !== NOT_SET;
	    },

	    isSubset: function(iter) {
	      iter = typeof iter.contains === 'function' ? iter : Iterable(iter);
	      return this.every(function(value ) {return iter.contains(value)});
	    },

	    isSuperset: function(iter) {
	      return iter.isSubset(this);
	    },

	    keySeq: function() {
	      return this.toSeq().map(keyMapper).toIndexedSeq();
	    },

	    last: function() {
	      return this.toSeq().reverse().first();
	    },

	    max: function(comparator) {
	      return maxFactory(this, comparator);
	    },

	    maxBy: function(mapper, comparator) {
	      return maxFactory(this, comparator, mapper);
	    },

	    min: function(comparator) {
	      return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator);
	    },

	    minBy: function(mapper, comparator) {
	      return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator, mapper);
	    },

	    rest: function() {
	      return this.slice(1);
	    },

	    skip: function(amount) {
	      return this.slice(Math.max(0, amount));
	    },

	    skipLast: function(amount) {
	      return reify(this, this.toSeq().reverse().skip(amount).reverse());
	    },

	    skipWhile: function(predicate, context) {
	      return reify(this, skipWhileFactory(this, predicate, context, true));
	    },

	    skipUntil: function(predicate, context) {
	      return this.skipWhile(not(predicate), context);
	    },

	    sortBy: function(mapper, comparator) {
	      return reify(this, sortFactory(this, comparator, mapper));
	    },

	    take: function(amount) {
	      return this.slice(0, Math.max(0, amount));
	    },

	    takeLast: function(amount) {
	      return reify(this, this.toSeq().reverse().take(amount).reverse());
	    },

	    takeWhile: function(predicate, context) {
	      return reify(this, takeWhileFactory(this, predicate, context));
	    },

	    takeUntil: function(predicate, context) {
	      return this.takeWhile(not(predicate), context);
	    },

	    valueSeq: function() {
	      return this.toIndexedSeq();
	    },


	    // ### Hashable Object

	    hashCode: function() {
	      return this.__hash || (this.__hash = hashIterable(this));
	    },


	    // ### Internal

	    // abstract __iterate(fn, reverse)

	    // abstract __iterator(type, reverse)
	  });

	  // var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
	  // var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
	  // var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
	  // var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

	  var IterablePrototype = Iterable.prototype;
	  IterablePrototype[IS_ITERABLE_SENTINEL] = true;
	  IterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.values;
	  IterablePrototype.__toJS = IterablePrototype.toArray;
	  IterablePrototype.__toStringMapper = quoteString;
	  IterablePrototype.inspect =
	  IterablePrototype.toSource = function() { return this.toString(); };
	  IterablePrototype.chain = IterablePrototype.flatMap;

	  // Temporary warning about using length
	  (function () {
	    try {
	      Object.defineProperty(IterablePrototype, 'length', {
	        get: function () {
	          if (!Iterable.noLengthWarning) {
	            var stack;
	            try {
	              throw new Error();
	            } catch (error) {
	              stack = error.stack;
	            }
	            if (stack.indexOf('_wrapObject') === -1) {
	              console && console.warn && console.warn(
	                'iterable.length has been deprecated, '+
	                'use iterable.size or iterable.count(). '+
	                'This warning will become a silent error in a future version. ' +
	                stack
	              );
	              return this.size;
	            }
	          }
	        }
	      });
	    } catch (e) {}
	  })();



	  mixin(KeyedIterable, {

	    // ### More sequential methods

	    flip: function() {
	      return reify(this, flipFactory(this));
	    },

	    findKey: function(predicate, context) {
	      var entry = this.findEntry(predicate, context);
	      return entry && entry[0];
	    },

	    findLastKey: function(predicate, context) {
	      return this.toSeq().reverse().findKey(predicate, context);
	    },

	    keyOf: function(searchValue) {
	      return this.findKey(function(value ) {return is(value, searchValue)});
	    },

	    lastKeyOf: function(searchValue) {
	      return this.findLastKey(function(value ) {return is(value, searchValue)});
	    },

	    mapEntries: function(mapper, context) {var this$0 = this;
	      var iterations = 0;
	      return reify(this,
	        this.toSeq().map(
	          function(v, k)  {return mapper.call(context, [k, v], iterations++, this$0)}
	        ).fromEntrySeq()
	      );
	    },

	    mapKeys: function(mapper, context) {var this$0 = this;
	      return reify(this,
	        this.toSeq().flip().map(
	          function(k, v)  {return mapper.call(context, k, v, this$0)}
	        ).flip()
	      );
	    },

	  });

	  var KeyedIterablePrototype = KeyedIterable.prototype;
	  KeyedIterablePrototype[IS_KEYED_SENTINEL] = true;
	  KeyedIterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.entries;
	  KeyedIterablePrototype.__toJS = IterablePrototype.toObject;
	  KeyedIterablePrototype.__toStringMapper = function(v, k)  {return k + ': ' + quoteString(v)};



	  mixin(IndexedIterable, {

	    // ### Conversion to other types

	    toKeyedSeq: function() {
	      return new ToKeyedSequence(this, false);
	    },


	    // ### ES6 Collection methods (ES6 Array and Map)

	    filter: function(predicate, context) {
	      return reify(this, filterFactory(this, predicate, context, false));
	    },

	    findIndex: function(predicate, context) {
	      var entry = this.findEntry(predicate, context);
	      return entry ? entry[0] : -1;
	    },

	    indexOf: function(searchValue) {
	      var key = this.toKeyedSeq().keyOf(searchValue);
	      return key === undefined ? -1 : key;
	    },

	    lastIndexOf: function(searchValue) {
	      return this.toSeq().reverse().indexOf(searchValue);
	    },

	    reverse: function() {
	      return reify(this, reverseFactory(this, false));
	    },

	    slice: function(begin, end) {
	      return reify(this, sliceFactory(this, begin, end, false));
	    },

	    splice: function(index, removeNum /*, ...values*/) {
	      var numArgs = arguments.length;
	      removeNum = Math.max(removeNum | 0, 0);
	      if (numArgs === 0 || (numArgs === 2 && !removeNum)) {
	        return this;
	      }
	      index = resolveBegin(index, this.size);
	      var spliced = this.slice(0, index);
	      return reify(
	        this,
	        numArgs === 1 ?
	          spliced :
	          spliced.concat(arrCopy(arguments, 2), this.slice(index + removeNum))
	      );
	    },


	    // ### More collection methods

	    findLastIndex: function(predicate, context) {
	      var key = this.toKeyedSeq().findLastKey(predicate, context);
	      return key === undefined ? -1 : key;
	    },

	    first: function() {
	      return this.get(0);
	    },

	    flatten: function(depth) {
	      return reify(this, flattenFactory(this, depth, false));
	    },

	    get: function(index, notSetValue) {
	      index = wrapIndex(this, index);
	      return (index < 0 || (this.size === Infinity ||
	          (this.size !== undefined && index > this.size))) ?
	        notSetValue :
	        this.find(function(_, key)  {return key === index}, undefined, notSetValue);
	    },

	    has: function(index) {
	      index = wrapIndex(this, index);
	      return index >= 0 && (this.size !== undefined ?
	        this.size === Infinity || index < this.size :
	        this.indexOf(index) !== -1
	      );
	    },

	    interpose: function(separator) {
	      return reify(this, interposeFactory(this, separator));
	    },

	    interleave: function(/*...iterables*/) {
	      var iterables = [this].concat(arrCopy(arguments));
	      var zipped = zipWithFactory(this.toSeq(), IndexedSeq.of, iterables);
	      var interleaved = zipped.flatten(true);
	      if (zipped.size) {
	        interleaved.size = zipped.size * iterables.length;
	      }
	      return reify(this, interleaved);
	    },

	    last: function() {
	      return this.get(-1);
	    },

	    skipWhile: function(predicate, context) {
	      return reify(this, skipWhileFactory(this, predicate, context, false));
	    },

	    zip: function(/*, ...iterables */) {
	      var iterables = [this].concat(arrCopy(arguments));
	      return reify(this, zipWithFactory(this, defaultZipper, iterables));
	    },

	    zipWith: function(zipper/*, ...iterables */) {
	      var iterables = arrCopy(arguments);
	      iterables[0] = this;
	      return reify(this, zipWithFactory(this, zipper, iterables));
	    },

	  });

	  IndexedIterable.prototype[IS_INDEXED_SENTINEL] = true;
	  IndexedIterable.prototype[IS_ORDERED_SENTINEL] = true;



	  mixin(SetIterable, {

	    // ### ES6 Collection methods (ES6 Array and Map)

	    get: function(value, notSetValue) {
	      return this.has(value) ? value : notSetValue;
	    },

	    contains: function(value) {
	      return this.has(value);
	    },


	    // ### More sequential methods

	    keySeq: function() {
	      return this.valueSeq();
	    },

	  });

	  SetIterable.prototype.has = IterablePrototype.contains;


	  // Mixin subclasses

	  mixin(KeyedSeq, KeyedIterable.prototype);
	  mixin(IndexedSeq, IndexedIterable.prototype);
	  mixin(SetSeq, SetIterable.prototype);

	  mixin(KeyedCollection, KeyedIterable.prototype);
	  mixin(IndexedCollection, IndexedIterable.prototype);
	  mixin(SetCollection, SetIterable.prototype);


	  // #pragma Helper functions

	  function keyMapper(v, k) {
	    return k;
	  }

	  function entryMapper(v, k) {
	    return [k, v];
	  }

	  function not(predicate) {
	    return function() {
	      return !predicate.apply(this, arguments);
	    }
	  }

	  function neg(predicate) {
	    return function() {
	      return -predicate.apply(this, arguments);
	    }
	  }

	  function quoteString(value) {
	    return typeof value === 'string' ? JSON.stringify(value) : value;
	  }

	  function defaultZipper() {
	    return arrCopy(arguments);
	  }

	  function defaultNegComparator(a, b) {
	    return a < b ? 1 : a > b ? -1 : 0;
	  }

	  function hashIterable(iterable) {
	    if (iterable.size === Infinity) {
	      return 0;
	    }
	    var ordered = isOrdered(iterable);
	    var keyed = isKeyed(iterable);
	    var h = ordered ? 1 : 0;
	    var size = iterable.__iterate(
	      keyed ?
	        ordered ?
	          function(v, k)  { h = 31 * h + hashMerge(hash(v), hash(k)) | 0; } :
	          function(v, k)  { h = h + hashMerge(hash(v), hash(k)) | 0; } :
	        ordered ?
	          function(v ) { h = 31 * h + hash(v) | 0; } :
	          function(v ) { h = h + hash(v) | 0; }
	    );
	    return murmurHashOfSize(size, h);
	  }

	  function murmurHashOfSize(size, h) {
	    h = src_Math__imul(h, 0xCC9E2D51);
	    h = src_Math__imul(h << 15 | h >>> -15, 0x1B873593);
	    h = src_Math__imul(h << 13 | h >>> -13, 5);
	    h = (h + 0xE6546B64 | 0) ^ size;
	    h = src_Math__imul(h ^ h >>> 16, 0x85EBCA6B);
	    h = src_Math__imul(h ^ h >>> 13, 0xC2B2AE35);
	    h = smi(h ^ h >>> 16);
	    return h;
	  }

	  function hashMerge(a, b) {
	    return a ^ b + 0x9E3779B9 + (a << 6) + (a >> 2) | 0; // int
	  }

	  var Immutable = {

	    Iterable: Iterable,

	    Seq: Seq,
	    Collection: Collection,
	    Map: src_Map__Map,
	    OrderedMap: OrderedMap,
	    List: List,
	    Stack: Stack,
	    Set: src_Set__Set,
	    OrderedSet: OrderedSet,

	    Record: Record,
	    Range: Range,
	    Repeat: Repeat,

	    is: is,
	    fromJS: fromJS,

	  };

	  return Immutable;

	}));

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;//     uuid.js
	//
	//     Copyright (c) 2010-2012 Robert Kieffer
	//     MIT License - http://opensource.org/licenses/mit-license.php

	(function() {
	  var _global = this;

	  // Unique ID creation requires a high quality random # generator.  We feature
	  // detect to determine the best RNG source, normalizing to a function that
	  // returns 128-bits of randomness, since that's what's usually required
	  var _rng;

	  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
	  //
	  // Moderately fast, high quality
	  if (typeof(_global.require) == 'function') {
	    try {
	      var _rb = _global.require('crypto').randomBytes;
	      _rng = _rb && function() {return _rb(16);};
	    } catch(e) {}
	  }

	  if (!_rng && _global.crypto && crypto.getRandomValues) {
	    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
	    //
	    // Moderately fast, high quality
	    var _rnds8 = new Uint8Array(16);
	    _rng = function whatwgRNG() {
	      crypto.getRandomValues(_rnds8);
	      return _rnds8;
	    };
	  }

	  if (!_rng) {
	    // Math.random()-based (RNG)
	    //
	    // If all else fails, use Math.random().  It's fast, but is of unspecified
	    // quality.
	    var  _rnds = new Array(16);
	    _rng = function() {
	      for (var i = 0, r; i < 16; i++) {
	        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
	        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
	      }

	      return _rnds;
	    };
	  }

	  // Buffer class to use
	  var BufferClass = typeof(_global.Buffer) == 'function' ? _global.Buffer : Array;

	  // Maps for number <-> hex string conversion
	  var _byteToHex = [];
	  var _hexToByte = {};
	  for (var i = 0; i < 256; i++) {
	    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
	    _hexToByte[_byteToHex[i]] = i;
	  }

	  // **`parse()` - Parse a UUID into it's component bytes**
	  function parse(s, buf, offset) {
	    var i = (buf && offset) || 0, ii = 0;

	    buf = buf || [];
	    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
	      if (ii < 16) { // Don't overflow!
	        buf[i + ii++] = _hexToByte[oct];
	      }
	    });

	    // Zero out remaining bytes if string was short
	    while (ii < 16) {
	      buf[i + ii++] = 0;
	    }

	    return buf;
	  }

	  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
	  function unparse(buf, offset) {
	    var i = offset || 0, bth = _byteToHex;
	    return  bth[buf[i++]] + bth[buf[i++]] +
	            bth[buf[i++]] + bth[buf[i++]] + '-' +
	            bth[buf[i++]] + bth[buf[i++]] + '-' +
	            bth[buf[i++]] + bth[buf[i++]] + '-' +
	            bth[buf[i++]] + bth[buf[i++]] + '-' +
	            bth[buf[i++]] + bth[buf[i++]] +
	            bth[buf[i++]] + bth[buf[i++]] +
	            bth[buf[i++]] + bth[buf[i++]];
	  }

	  // **`v1()` - Generate time-based UUID**
	  //
	  // Inspired by https://github.com/LiosK/UUID.js
	  // and http://docs.python.org/library/uuid.html

	  // random #'s we need to init node and clockseq
	  var _seedBytes = _rng();

	  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
	  var _nodeId = [
	    _seedBytes[0] | 0x01,
	    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
	  ];

	  // Per 4.2.2, randomize (14 bit) clockseq
	  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

	  // Previous uuid creation time
	  var _lastMSecs = 0, _lastNSecs = 0;

	  // See https://github.com/broofa/node-uuid for API details
	  function v1(options, buf, offset) {
	    var i = buf && offset || 0;
	    var b = buf || [];

	    options = options || {};

	    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

	    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
	    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
	    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
	    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
	    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

	    // Per 4.2.1.2, use count of uuid's generated during the current clock
	    // cycle to simulate higher resolution clock
	    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

	    // Time since last uuid creation (in msecs)
	    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

	    // Per 4.2.1.2, Bump clockseq on clock regression
	    if (dt < 0 && options.clockseq == null) {
	      clockseq = clockseq + 1 & 0x3fff;
	    }

	    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
	    // time interval
	    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
	      nsecs = 0;
	    }

	    // Per 4.2.1.2 Throw error if too many uuids are requested
	    if (nsecs >= 10000) {
	      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
	    }

	    _lastMSecs = msecs;
	    _lastNSecs = nsecs;
	    _clockseq = clockseq;

	    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
	    msecs += 12219292800000;

	    // `time_low`
	    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
	    b[i++] = tl >>> 24 & 0xff;
	    b[i++] = tl >>> 16 & 0xff;
	    b[i++] = tl >>> 8 & 0xff;
	    b[i++] = tl & 0xff;

	    // `time_mid`
	    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
	    b[i++] = tmh >>> 8 & 0xff;
	    b[i++] = tmh & 0xff;

	    // `time_high_and_version`
	    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
	    b[i++] = tmh >>> 16 & 0xff;

	    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
	    b[i++] = clockseq >>> 8 | 0x80;

	    // `clock_seq_low`
	    b[i++] = clockseq & 0xff;

	    // `node`
	    var node = options.node || _nodeId;
	    for (var n = 0; n < 6; n++) {
	      b[i + n] = node[n];
	    }

	    return buf ? buf : unparse(b);
	  }

	  // **`v4()` - Generate random UUID**

	  // See https://github.com/broofa/node-uuid for API details
	  function v4(options, buf, offset) {
	    // Deprecated - 'format' argument, as supported in v1.2
	    var i = buf && offset || 0;

	    if (typeof(options) == 'string') {
	      buf = options == 'binary' ? new BufferClass(16) : null;
	      options = null;
	    }
	    options = options || {};

	    var rnds = options.random || (options.rng || _rng)();

	    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
	    rnds[6] = (rnds[6] & 0x0f) | 0x40;
	    rnds[8] = (rnds[8] & 0x3f) | 0x80;

	    // Copy bytes to buffer, if provided
	    if (buf) {
	      for (var ii = 0; ii < 16; ii++) {
	        buf[i + ii] = rnds[ii];
	      }
	    }

	    return buf || unparse(rnds);
	  }

	  // Export public API
	  var uuid = v4;
	  uuid.v1 = v1;
	  uuid.v4 = v4;
	  uuid.parse = parse;
	  uuid.unparse = unparse;
	  uuid.BufferClass = BufferClass;

	  if (typeof(module) != 'undefined' && module.exports) {
	    // Publish as node.js module
	    module.exports = uuid;
	  } else  if (true) {
	    // Publish as AMD module
	    !(__WEBPACK_AMD_DEFINE_RESULT__ = function() {return uuid;}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	 

	  } else {
	    // Publish as global (in browsers)
	    var _previousRoot = _global.uuid;

	    // **`noConflict()` - (browser only) to reset global 'uuid' var**
	    uuid.noConflict = function() {
	      _global.uuid = _previousRoot;
	      return uuid;
	    };

	    _global.uuid = uuid;
	  }
	}).call(this);


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule LinkedStateMixin
	 * @typechecks static-only
	 */

	'use strict';

	var ReactLink = __webpack_require__(114);
	var ReactStateSetters = __webpack_require__(115);

	/**
	 * A simple mixin around ReactLink.forState().
	 */
	var LinkedStateMixin = {
	  /**
	   * Create a ReactLink that's linked to part of this component's state. The
	   * ReactLink will have the current value of this.state[key] and will call
	   * setState() when a change is requested.
	   *
	   * @param {string} key state key to update. Note: you may want to use keyOf()
	   * if you're using Google Closure Compiler advanced mode.
	   * @return {ReactLink} ReactLink instance linking to the state.
	   */
	  linkState: function(key) {
	    return new ReactLink(
	      this.state[key],
	      ReactStateSetters.createStateKeySetter(this, key)
	    );
	  }
	};

	module.exports = LinkedStateMixin;


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	* @providesModule ReactComponentWithPureRenderMixin
	*/

	'use strict';

	var shallowEqual = __webpack_require__(116);

	/**
	 * If your React component's render function is "pure", e.g. it will render the
	 * same result given the same props and state, provide this Mixin for a
	 * considerable performance boost.
	 *
	 * Most React components have pure render functions.
	 *
	 * Example:
	 *
	 *   var ReactComponentWithPureRenderMixin =
	 *     require('ReactComponentWithPureRenderMixin');
	 *   React.createClass({
	 *     mixins: [ReactComponentWithPureRenderMixin],
	 *
	 *     render: function() {
	 *       return <div className={this.props.className}>foo</div>;
	 *     }
	 *   });
	 *
	 * Note: This only checks shallow equality for props and state. If these contain
	 * complex data structures this mixin may have false-negatives for deeper
	 * differences. Only mixin to components which have simple props and state, or
	 * use `forceUpdate()` when you know deep data structures have changed.
	 */
	var ReactComponentWithPureRenderMixin = {
	  shouldComponentUpdate: function(nextProps, nextState) {
	    return !shallowEqual(this.props, nextProps) ||
	           !shallowEqual(this.state, nextState);
	  }
	};

	module.exports = ReactComponentWithPureRenderMixin;


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @typechecks
	 * @providesModule ReactCSSTransitionGroup
	 */

	'use strict';

	var React = __webpack_require__(8);

	var assign = __webpack_require__(29);

	var ReactTransitionGroup = React.createFactory(
	  __webpack_require__(39)
	);
	var ReactCSSTransitionGroupChild = React.createFactory(
	  __webpack_require__(117)
	);

	var ReactCSSTransitionGroup = React.createClass({
	  displayName: 'ReactCSSTransitionGroup',

	  propTypes: {
	    transitionName: React.PropTypes.string.isRequired,
	    transitionAppear: React.PropTypes.bool,
	    transitionEnter: React.PropTypes.bool,
	    transitionLeave: React.PropTypes.bool
	  },

	  getDefaultProps: function() {
	    return {
	      transitionAppear: false,
	      transitionEnter: true,
	      transitionLeave: true
	    };
	  },

	  _wrapChild: function(child) {
	    // We need to provide this childFactory so that
	    // ReactCSSTransitionGroupChild can receive updates to name, enter, and
	    // leave while it is leaving.
	    return ReactCSSTransitionGroupChild(
	      {
	        name: this.props.transitionName,
	        appear: this.props.transitionAppear,
	        enter: this.props.transitionEnter,
	        leave: this.props.transitionLeave
	      },
	      child
	    );
	  },

	  render: function() {
	    return (
	      ReactTransitionGroup(
	        assign({}, this.props, {childFactory: this._wrapChild})
	      )
	    );
	  }
	});

	module.exports = ReactCSSTransitionGroup;


/***/ },
/* 38 */,
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactTransitionGroup
	 */

	'use strict';

	var React = __webpack_require__(8);
	var ReactTransitionChildMapping = __webpack_require__(118);

	var assign = __webpack_require__(29);
	var cloneWithProps = __webpack_require__(42);
	var emptyFunction = __webpack_require__(110);

	var ReactTransitionGroup = React.createClass({
	  displayName: 'ReactTransitionGroup',

	  propTypes: {
	    component: React.PropTypes.any,
	    childFactory: React.PropTypes.func
	  },

	  getDefaultProps: function() {
	    return {
	      component: 'span',
	      childFactory: emptyFunction.thatReturnsArgument
	    };
	  },

	  getInitialState: function() {
	    return {
	      children: ReactTransitionChildMapping.getChildMapping(this.props.children)
	    };
	  },

	  componentWillMount: function() {
	    this.currentlyTransitioningKeys = {};
	    this.keysToEnter = [];
	    this.keysToLeave = [];
	  },

	  componentDidMount: function() {
	    var initialChildMapping = this.state.children;
	    for (var key in initialChildMapping) {
	      if (initialChildMapping[key]) {
	        this.performAppear(key);
	      }
	    }
	  },

	  componentWillReceiveProps: function(nextProps) {
	    var nextChildMapping = ReactTransitionChildMapping.getChildMapping(
	      nextProps.children
	    );
	    var prevChildMapping = this.state.children;

	    this.setState({
	      children: ReactTransitionChildMapping.mergeChildMappings(
	        prevChildMapping,
	        nextChildMapping
	      )
	    });

	    var key;

	    for (key in nextChildMapping) {
	      var hasPrev = prevChildMapping && prevChildMapping.hasOwnProperty(key);
	      if (nextChildMapping[key] && !hasPrev &&
	          !this.currentlyTransitioningKeys[key]) {
	        this.keysToEnter.push(key);
	      }
	    }

	    for (key in prevChildMapping) {
	      var hasNext = nextChildMapping && nextChildMapping.hasOwnProperty(key);
	      if (prevChildMapping[key] && !hasNext &&
	          !this.currentlyTransitioningKeys[key]) {
	        this.keysToLeave.push(key);
	      }
	    }

	    // If we want to someday check for reordering, we could do it here.
	  },

	  componentDidUpdate: function() {
	    var keysToEnter = this.keysToEnter;
	    this.keysToEnter = [];
	    keysToEnter.forEach(this.performEnter);

	    var keysToLeave = this.keysToLeave;
	    this.keysToLeave = [];
	    keysToLeave.forEach(this.performLeave);
	  },

	  performAppear: function(key) {
	    this.currentlyTransitioningKeys[key] = true;

	    var component = this.refs[key];

	    if (component.componentWillAppear) {
	      component.componentWillAppear(
	        this._handleDoneAppearing.bind(this, key)
	      );
	    } else {
	      this._handleDoneAppearing(key);
	    }
	  },

	  _handleDoneAppearing: function(key) {
	    var component = this.refs[key];
	    if (component.componentDidAppear) {
	      component.componentDidAppear();
	    }

	    delete this.currentlyTransitioningKeys[key];

	    var currentChildMapping = ReactTransitionChildMapping.getChildMapping(
	      this.props.children
	    );

	    if (!currentChildMapping || !currentChildMapping.hasOwnProperty(key)) {
	      // This was removed before it had fully appeared. Remove it.
	      this.performLeave(key);
	    }
	  },

	  performEnter: function(key) {
	    this.currentlyTransitioningKeys[key] = true;

	    var component = this.refs[key];

	    if (component.componentWillEnter) {
	      component.componentWillEnter(
	        this._handleDoneEntering.bind(this, key)
	      );
	    } else {
	      this._handleDoneEntering(key);
	    }
	  },

	  _handleDoneEntering: function(key) {
	    var component = this.refs[key];
	    if (component.componentDidEnter) {
	      component.componentDidEnter();
	    }

	    delete this.currentlyTransitioningKeys[key];

	    var currentChildMapping = ReactTransitionChildMapping.getChildMapping(
	      this.props.children
	    );

	    if (!currentChildMapping || !currentChildMapping.hasOwnProperty(key)) {
	      // This was removed before it had fully entered. Remove it.
	      this.performLeave(key);
	    }
	  },

	  performLeave: function(key) {
	    this.currentlyTransitioningKeys[key] = true;

	    var component = this.refs[key];
	    if (component.componentWillLeave) {
	      component.componentWillLeave(this._handleDoneLeaving.bind(this, key));
	    } else {
	      // Note that this is somewhat dangerous b/c it calls setState()
	      // again, effectively mutating the component before all the work
	      // is done.
	      this._handleDoneLeaving(key);
	    }
	  },

	  _handleDoneLeaving: function(key) {
	    var component = this.refs[key];

	    if (component.componentDidLeave) {
	      component.componentDidLeave();
	    }

	    delete this.currentlyTransitioningKeys[key];

	    var currentChildMapping = ReactTransitionChildMapping.getChildMapping(
	      this.props.children
	    );

	    if (currentChildMapping && currentChildMapping.hasOwnProperty(key)) {
	      // This entered again before it fully left. Add it again.
	      this.performEnter(key);
	    } else {
	      var newChildren = assign({}, this.state.children);
	      delete newChildren[key];
	      this.setState({children: newChildren});
	    }
	  },

	  render: function() {
	    // TODO: we could get rid of the need for the wrapper node
	    // by cloning a single child
	    var childrenToRender = [];
	    for (var key in this.state.children) {
	      var child = this.state.children[key];
	      if (child) {
	        // You may need to apply reactive updates to a child as it is leaving.
	        // The normal React way to do it won't work since the child will have
	        // already been removed. In case you need this behavior you can provide
	        // a childFactory function to wrap every child, even the ones that are
	        // leaving.
	        childrenToRender.push(cloneWithProps(
	          this.props.childFactory(child),
	          {ref: key, key: key}
	        ));
	      }
	    }
	    return React.createElement(
	      this.props.component,
	      this.props,
	      childrenToRender
	    );
	  }
	});

	module.exports = ReactTransitionGroup;


/***/ },
/* 40 */,
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule cx
	 */

	/**
	 * This function is used to mark string literals representing CSS class names
	 * so that they can be transformed statically. This allows for modularization
	 * and minification of CSS class names.
	 *
	 * In static_upstream, this function is actually implemented, but it should
	 * eventually be replaced with something more descriptive, and the transform
	 * that is used in the main stack should be ported for use elsewhere.
	 *
	 * @param string|object className to modularize, or an object of key/values.
	 *                      In the object case, the values are conditions that
	 *                      determine if the className keys should be included.
	 * @param [string ...]  Variable list of classNames in the string case.
	 * @return string       Renderable space-separated CSS className.
	 */

	'use strict';
	var warning = __webpack_require__(57);

	var warned = false;

	function cx(classNames) {
	  if ("production" !== process.env.NODE_ENV) {
	    ("production" !== process.env.NODE_ENV ? warning(
	      warned,
	      'React.addons.classSet will be deprecated in a future version. See ' +
	      'http://fb.me/react-addons-classset'
	    ) : null);
	    warned = true;
	  }

	  if (typeof classNames == 'object') {
	    return Object.keys(classNames).filter(function(className) {
	      return classNames[className];
	    }).join(' ');
	  } else {
	    return Array.prototype.join.call(arguments, ' ');
	  }
	}

	module.exports = cx;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(46)))

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @typechecks static-only
	 * @providesModule cloneWithProps
	 */

	'use strict';

	var ReactElement = __webpack_require__(18);
	var ReactPropTransferer = __webpack_require__(121);

	var keyOf = __webpack_require__(65);
	var warning = __webpack_require__(57);

	var CHILDREN_PROP = keyOf({children: null});

	/**
	 * Sometimes you want to change the props of a child passed to you. Usually
	 * this is to add a CSS class.
	 *
	 * @param {ReactElement} child child element you'd like to clone
	 * @param {object} props props you'd like to modify. className and style will be
	 * merged automatically.
	 * @return {ReactElement} a clone of child with props merged in.
	 */
	function cloneWithProps(child, props) {
	  if ("production" !== process.env.NODE_ENV) {
	    ("production" !== process.env.NODE_ENV ? warning(
	      !child.ref,
	      'You are calling cloneWithProps() on a child with a ref. This is ' +
	      'dangerous because you\'re creating a new child which will not be ' +
	      'added as a ref to its parent.'
	    ) : null);
	  }

	  var newProps = ReactPropTransferer.mergeProps(props, child.props);

	  // Use `child.props.children` if it is provided.
	  if (!newProps.hasOwnProperty(CHILDREN_PROP) &&
	      child.props.hasOwnProperty(CHILDREN_PROP)) {
	    newProps.children = child.props.children;
	  }

	  // The current API doesn't retain _owner and _context, which is why this
	  // doesn't use ReactElement.cloneAndReplaceProps.
	  return ReactElement.createElement(child.type, newProps);
	}

	module.exports = cloneWithProps;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(46)))

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule update
	 */

	'use strict';

	var assign = __webpack_require__(29);
	var keyOf = __webpack_require__(65);
	var invariant = __webpack_require__(54);

	function shallowCopy(x) {
	  if (Array.isArray(x)) {
	    return x.concat();
	  } else if (x && typeof x === 'object') {
	    return assign(new x.constructor(), x);
	  } else {
	    return x;
	  }
	}

	var COMMAND_PUSH = keyOf({$push: null});
	var COMMAND_UNSHIFT = keyOf({$unshift: null});
	var COMMAND_SPLICE = keyOf({$splice: null});
	var COMMAND_SET = keyOf({$set: null});
	var COMMAND_MERGE = keyOf({$merge: null});
	var COMMAND_APPLY = keyOf({$apply: null});

	var ALL_COMMANDS_LIST = [
	  COMMAND_PUSH,
	  COMMAND_UNSHIFT,
	  COMMAND_SPLICE,
	  COMMAND_SET,
	  COMMAND_MERGE,
	  COMMAND_APPLY
	];

	var ALL_COMMANDS_SET = {};

	ALL_COMMANDS_LIST.forEach(function(command) {
	  ALL_COMMANDS_SET[command] = true;
	});

	function invariantArrayCase(value, spec, command) {
	  ("production" !== process.env.NODE_ENV ? invariant(
	    Array.isArray(value),
	    'update(): expected target of %s to be an array; got %s.',
	    command,
	    value
	  ) : invariant(Array.isArray(value)));
	  var specValue = spec[command];
	  ("production" !== process.env.NODE_ENV ? invariant(
	    Array.isArray(specValue),
	    'update(): expected spec of %s to be an array; got %s. ' +
	    'Did you forget to wrap your parameter in an array?',
	    command,
	    specValue
	  ) : invariant(Array.isArray(specValue)));
	}

	function update(value, spec) {
	  ("production" !== process.env.NODE_ENV ? invariant(
	    typeof spec === 'object',
	    'update(): You provided a key path to update() that did not contain one ' +
	    'of %s. Did you forget to include {%s: ...}?',
	    ALL_COMMANDS_LIST.join(', '),
	    COMMAND_SET
	  ) : invariant(typeof spec === 'object'));

	  if (spec.hasOwnProperty(COMMAND_SET)) {
	    ("production" !== process.env.NODE_ENV ? invariant(
	      Object.keys(spec).length === 1,
	      'Cannot have more than one key in an object with %s',
	      COMMAND_SET
	    ) : invariant(Object.keys(spec).length === 1));

	    return spec[COMMAND_SET];
	  }

	  var nextValue = shallowCopy(value);

	  if (spec.hasOwnProperty(COMMAND_MERGE)) {
	    var mergeObj = spec[COMMAND_MERGE];
	    ("production" !== process.env.NODE_ENV ? invariant(
	      mergeObj && typeof mergeObj === 'object',
	      'update(): %s expects a spec of type \'object\'; got %s',
	      COMMAND_MERGE,
	      mergeObj
	    ) : invariant(mergeObj && typeof mergeObj === 'object'));
	    ("production" !== process.env.NODE_ENV ? invariant(
	      nextValue && typeof nextValue === 'object',
	      'update(): %s expects a target of type \'object\'; got %s',
	      COMMAND_MERGE,
	      nextValue
	    ) : invariant(nextValue && typeof nextValue === 'object'));
	    assign(nextValue, spec[COMMAND_MERGE]);
	  }

	  if (spec.hasOwnProperty(COMMAND_PUSH)) {
	    invariantArrayCase(value, spec, COMMAND_PUSH);
	    spec[COMMAND_PUSH].forEach(function(item) {
	      nextValue.push(item);
	    });
	  }

	  if (spec.hasOwnProperty(COMMAND_UNSHIFT)) {
	    invariantArrayCase(value, spec, COMMAND_UNSHIFT);
	    spec[COMMAND_UNSHIFT].forEach(function(item) {
	      nextValue.unshift(item);
	    });
	  }

	  if (spec.hasOwnProperty(COMMAND_SPLICE)) {
	    ("production" !== process.env.NODE_ENV ? invariant(
	      Array.isArray(value),
	      'Expected %s target to be an array; got %s',
	      COMMAND_SPLICE,
	      value
	    ) : invariant(Array.isArray(value)));
	    ("production" !== process.env.NODE_ENV ? invariant(
	      Array.isArray(spec[COMMAND_SPLICE]),
	      'update(): expected spec of %s to be an array of arrays; got %s. ' +
	      'Did you forget to wrap your parameters in an array?',
	      COMMAND_SPLICE,
	      spec[COMMAND_SPLICE]
	    ) : invariant(Array.isArray(spec[COMMAND_SPLICE])));
	    spec[COMMAND_SPLICE].forEach(function(args) {
	      ("production" !== process.env.NODE_ENV ? invariant(
	        Array.isArray(args),
	        'update(): expected spec of %s to be an array of arrays; got %s. ' +
	        'Did you forget to wrap your parameters in an array?',
	        COMMAND_SPLICE,
	        spec[COMMAND_SPLICE]
	      ) : invariant(Array.isArray(args)));
	      nextValue.splice.apply(nextValue, args);
	    });
	  }

	  if (spec.hasOwnProperty(COMMAND_APPLY)) {
	    ("production" !== process.env.NODE_ENV ? invariant(
	      typeof spec[COMMAND_APPLY] === 'function',
	      'update(): expected spec of %s to be a function; got %s.',
	      COMMAND_APPLY,
	      spec[COMMAND_APPLY]
	    ) : invariant(typeof spec[COMMAND_APPLY] === 'function'));
	    nextValue = spec[COMMAND_APPLY](nextValue);
	  }

	  for (var k in spec) {
	    if (!(ALL_COMMANDS_SET.hasOwnProperty(k) && ALL_COMMANDS_SET[k])) {
	      nextValue[k] = update(value[k], spec[k]);
	    }
	  }

	  return nextValue;
	}

	module.exports = update;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(46)))

/***/ },
/* 44 */,
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactTestUtils
	 */

	'use strict';

	var EventConstants = __webpack_require__(53);
	var EventPluginHub = __webpack_require__(124);
	var EventPropagators = __webpack_require__(125);
	var React = __webpack_require__(8);
	var ReactElement = __webpack_require__(18);
	var ReactEmptyComponent = __webpack_require__(103);
	var ReactBrowserEventEmitter = __webpack_require__(102);
	var ReactCompositeComponent = __webpack_require__(126);
	var ReactInstanceHandles = __webpack_require__(23);
	var ReactInstanceMap = __webpack_require__(60);
	var ReactMount = __webpack_require__(24);
	var ReactUpdates = __webpack_require__(40);
	var SyntheticEvent = __webpack_require__(127);

	var assign = __webpack_require__(29);

	var topLevelTypes = EventConstants.topLevelTypes;

	function Event(suffix) {}

	/**
	 * @class ReactTestUtils
	 */

	/**
	 * Todo: Support the entire DOM.scry query syntax. For now, these simple
	 * utilities will suffice for testing purposes.
	 * @lends ReactTestUtils
	 */
	var ReactTestUtils = {
	  renderIntoDocument: function(instance) {
	    var div = document.createElement('div');
	    // None of our tests actually require attaching the container to the
	    // DOM, and doing so creates a mess that we rely on test isolation to
	    // clean up, so we're going to stop honoring the name of this method
	    // (and probably rename it eventually) if no problems arise.
	    // document.documentElement.appendChild(div);
	    return React.render(instance, div);
	  },

	  isElement: function(element) {
	    return ReactElement.isValidElement(element);
	  },

	  isElementOfType: function(inst, convenienceConstructor) {
	    return (
	      ReactElement.isValidElement(inst) &&
	      inst.type === convenienceConstructor
	    );
	  },

	  isDOMComponent: function(inst) {
	    // TODO: Fix this heuristic. It's just here because composites can currently
	    // pretend to be DOM components.
	    return !!(inst && inst.tagName && inst.getDOMNode);
	  },

	  isDOMComponentElement: function(inst) {
	    return !!(inst &&
	              ReactElement.isValidElement(inst) &&
	              !!inst.tagName);
	  },

	  isCompositeComponent: function(inst) {
	    return typeof inst.render === 'function' &&
	           typeof inst.setState === 'function';
	  },

	  isCompositeComponentWithType: function(inst, type) {
	    return !!(ReactTestUtils.isCompositeComponent(inst) &&
	             (inst.constructor === type));
	  },

	  isCompositeComponentElement: function(inst) {
	    if (!ReactElement.isValidElement(inst)) {
	      return false;
	    }
	    // We check the prototype of the type that will get mounted, not the
	    // instance itself. This is a future proof way of duck typing.
	    var prototype = inst.type.prototype;
	    return (
	      typeof prototype.render === 'function' &&
	      typeof prototype.setState === 'function'
	    );
	  },

	  isCompositeComponentElementWithType: function(inst, type) {
	    return !!(ReactTestUtils.isCompositeComponentElement(inst) &&
	             (inst.constructor === type));
	  },

	  getRenderedChildOfCompositeComponent: function(inst) {
	    if (!ReactTestUtils.isCompositeComponent(inst)) {
	      return null;
	    }
	    var internalInstance = ReactInstanceMap.get(inst);
	    return internalInstance._renderedComponent.getPublicInstance();
	  },

	  findAllInRenderedTree: function(inst, test) {
	    if (!inst) {
	      return [];
	    }
	    var ret = test(inst) ? [inst] : [];
	    if (ReactTestUtils.isDOMComponent(inst)) {
	      var internalInstance = ReactInstanceMap.get(inst);
	      var renderedChildren = internalInstance
	        ._renderedComponent
	        ._renderedChildren;
	      var key;
	      for (key in renderedChildren) {
	        if (!renderedChildren.hasOwnProperty(key)) {
	          continue;
	        }
	        if (!renderedChildren[key].getPublicInstance) {
	          continue;
	        }
	        ret = ret.concat(
	          ReactTestUtils.findAllInRenderedTree(
	            renderedChildren[key].getPublicInstance(),
	            test
	          )
	        );
	      }
	    } else if (ReactTestUtils.isCompositeComponent(inst)) {
	      ret = ret.concat(
	        ReactTestUtils.findAllInRenderedTree(
	          ReactTestUtils.getRenderedChildOfCompositeComponent(inst),
	          test
	        )
	      );
	    }
	    return ret;
	  },

	  /**
	   * Finds all instance of components in the rendered tree that are DOM
	   * components with the class name matching `className`.
	   * @return an array of all the matches.
	   */
	  scryRenderedDOMComponentsWithClass: function(root, className) {
	    return ReactTestUtils.findAllInRenderedTree(root, function(inst) {
	      var instClassName = inst.props.className;
	      return ReactTestUtils.isDOMComponent(inst) && (
	        (instClassName && (' ' + instClassName + ' ').indexOf(' ' + className + ' ') !== -1)
	      );
	    });
	  },

	  /**
	   * Like scryRenderedDOMComponentsWithClass but expects there to be one result,
	   * and returns that one result, or throws exception if there is any other
	   * number of matches besides one.
	   * @return {!ReactDOMComponent} The one match.
	   */
	  findRenderedDOMComponentWithClass: function(root, className) {
	    var all =
	      ReactTestUtils.scryRenderedDOMComponentsWithClass(root, className);
	    if (all.length !== 1) {
	      throw new Error('Did not find exactly one match ' +
	        '(found: ' + all.length + ') for class:' + className
	      );
	    }
	    return all[0];
	  },


	  /**
	   * Finds all instance of components in the rendered tree that are DOM
	   * components with the tag name matching `tagName`.
	   * @return an array of all the matches.
	   */
	  scryRenderedDOMComponentsWithTag: function(root, tagName) {
	    return ReactTestUtils.findAllInRenderedTree(root, function(inst) {
	      return ReactTestUtils.isDOMComponent(inst) &&
	            inst.tagName === tagName.toUpperCase();
	    });
	  },

	  /**
	   * Like scryRenderedDOMComponentsWithTag but expects there to be one result,
	   * and returns that one result, or throws exception if there is any other
	   * number of matches besides one.
	   * @return {!ReactDOMComponent} The one match.
	   */
	  findRenderedDOMComponentWithTag: function(root, tagName) {
	    var all = ReactTestUtils.scryRenderedDOMComponentsWithTag(root, tagName);
	    if (all.length !== 1) {
	      throw new Error('Did not find exactly one match for tag:' + tagName);
	    }
	    return all[0];
	  },


	  /**
	   * Finds all instances of components with type equal to `componentType`.
	   * @return an array of all the matches.
	   */
	  scryRenderedComponentsWithType: function(root, componentType) {
	    return ReactTestUtils.findAllInRenderedTree(root, function(inst) {
	      return ReactTestUtils.isCompositeComponentWithType(
	        inst,
	        componentType
	      );
	    });
	  },

	  /**
	   * Same as `scryRenderedComponentsWithType` but expects there to be one result
	   * and returns that one result, or throws exception if there is any other
	   * number of matches besides one.
	   * @return {!ReactComponent} The one match.
	   */
	  findRenderedComponentWithType: function(root, componentType) {
	    var all = ReactTestUtils.scryRenderedComponentsWithType(
	      root,
	      componentType
	    );
	    if (all.length !== 1) {
	      throw new Error(
	        'Did not find exactly one match for componentType:' + componentType
	      );
	    }
	    return all[0];
	  },

	  /**
	   * Pass a mocked component module to this method to augment it with
	   * useful methods that allow it to be used as a dummy React component.
	   * Instead of rendering as usual, the component will become a simple
	   * <div> containing any provided children.
	   *
	   * @param {object} module the mock function object exported from a
	   *                        module that defines the component to be mocked
	   * @param {?string} mockTagName optional dummy root tag name to return
	   *                              from render method (overrides
	   *                              module.mockTagName if provided)
	   * @return {object} the ReactTestUtils object (for chaining)
	   */
	  mockComponent: function(module, mockTagName) {
	    mockTagName = mockTagName || module.mockTagName || "div";

	    module.prototype.render.mockImplementation(function() {
	      return React.createElement(
	        mockTagName,
	        null,
	        this.props.children
	      );
	    });

	    return this;
	  },

	  /**
	   * Simulates a top level event being dispatched from a raw event that occured
	   * on an `Element` node.
	   * @param topLevelType {Object} A type from `EventConstants.topLevelTypes`
	   * @param {!Element} node The dom to simulate an event occurring on.
	   * @param {?Event} fakeNativeEvent Fake native event to use in SyntheticEvent.
	   */
	  simulateNativeEventOnNode: function(topLevelType, node, fakeNativeEvent) {
	    fakeNativeEvent.target = node;
	    ReactBrowserEventEmitter.ReactEventListener.dispatchEvent(
	      topLevelType,
	      fakeNativeEvent
	    );
	  },

	  /**
	   * Simulates a top level event being dispatched from a raw event that occured
	   * on the `ReactDOMComponent` `comp`.
	   * @param topLevelType {Object} A type from `EventConstants.topLevelTypes`.
	   * @param comp {!ReactDOMComponent}
	   * @param {?Event} fakeNativeEvent Fake native event to use in SyntheticEvent.
	   */
	  simulateNativeEventOnDOMComponent: function(
	      topLevelType,
	      comp,
	      fakeNativeEvent) {
	    ReactTestUtils.simulateNativeEventOnNode(
	      topLevelType,
	      comp.getDOMNode(),
	      fakeNativeEvent
	    );
	  },

	  nativeTouchData: function(x, y) {
	    return {
	      touches: [
	        {pageX: x, pageY: y}
	      ]
	    };
	  },

	  createRenderer: function() {
	    return new ReactShallowRenderer();
	  },

	  Simulate: null,
	  SimulateNative: {}
	};

	/**
	 * @class ReactShallowRenderer
	 */
	var ReactShallowRenderer = function() {
	  this._instance = null;
	};

	ReactShallowRenderer.prototype.getRenderOutput = function() {
	  return (
	    (this._instance && this._instance._renderedComponent &&
	     this._instance._renderedComponent._renderedOutput)
	    || null
	  );
	};

	var NoopInternalComponent = function(element) {
	  this._renderedOutput = element;
	  this._currentElement = element === null || element === false ?
	    ReactEmptyComponent.emptyElement :
	    element;
	};

	NoopInternalComponent.prototype = {

	  mountComponent: function() {
	  },

	  receiveComponent: function(element) {
	    this._renderedOutput = element;
	    this._currentElement = element === null || element === false ?
	      ReactEmptyComponent.emptyElement :
	      element;
	  },

	  unmountComponent: function() {
	  }

	};

	var ShallowComponentWrapper = function() { };
	assign(
	  ShallowComponentWrapper.prototype,
	  ReactCompositeComponent.Mixin, {
	    _instantiateReactComponent: function(element) {
	      return new NoopInternalComponent(element);
	    },
	    _replaceNodeWithMarkupByID: function() {},
	    _renderValidatedComponent:
	      ReactCompositeComponent.Mixin.
	        _renderValidatedComponentWithoutOwnerOrContext
	  }
	);

	ReactShallowRenderer.prototype.render = function(element, context) {
	  var transaction = ReactUpdates.ReactReconcileTransaction.getPooled();
	  this._render(element, transaction, context);
	  ReactUpdates.ReactReconcileTransaction.release(transaction);
	};

	ReactShallowRenderer.prototype.unmount = function() {
	  if (this._instance) {
	    this._instance.unmountComponent();
	  }
	};

	ReactShallowRenderer.prototype._render = function(element, transaction, context) {
	  if (!this._instance) {
	    var rootID = ReactInstanceHandles.createReactRootID();
	    var instance = new ShallowComponentWrapper(element.type);
	    instance.construct(element);

	    instance.mountComponent(rootID, transaction, context);

	    this._instance = instance;
	  } else {
	    this._instance.receiveComponent(element, transaction, context);
	  }
	};

	/**
	 * Exports:
	 *
	 * - `ReactTestUtils.Simulate.click(Element/ReactDOMComponent)`
	 * - `ReactTestUtils.Simulate.mouseMove(Element/ReactDOMComponent)`
	 * - `ReactTestUtils.Simulate.change(Element/ReactDOMComponent)`
	 * - ... (All keys from event plugin `eventTypes` objects)
	 */
	function makeSimulator(eventType) {
	  return function(domComponentOrNode, eventData) {
	    var node;
	    if (ReactTestUtils.isDOMComponent(domComponentOrNode)) {
	      node = domComponentOrNode.getDOMNode();
	    } else if (domComponentOrNode.tagName) {
	      node = domComponentOrNode;
	    }

	    var fakeNativeEvent = new Event();
	    fakeNativeEvent.target = node;
	    // We don't use SyntheticEvent.getPooled in order to not have to worry about
	    // properly destroying any properties assigned from `eventData` upon release
	    var event = new SyntheticEvent(
	      ReactBrowserEventEmitter.eventNameDispatchConfigs[eventType],
	      ReactMount.getID(node),
	      fakeNativeEvent
	    );
	    assign(event, eventData);
	    EventPropagators.accumulateTwoPhaseDispatches(event);

	    ReactUpdates.batchedUpdates(function() {
	      EventPluginHub.enqueueEvents(event);
	      EventPluginHub.processEventQueue();
	    });
	  };
	}

	function buildSimulators() {
	  ReactTestUtils.Simulate = {};

	  var eventType;
	  for (eventType in ReactBrowserEventEmitter.eventNameDispatchConfigs) {
	    /**
	     * @param {!Element || ReactDOMComponent} domComponentOrNode
	     * @param {?object} eventData Fake event data to use in SyntheticEvent.
	     */
	    ReactTestUtils.Simulate[eventType] = makeSimulator(eventType);
	  }
	}

	// Rebuild ReactTestUtils.Simulate whenever event plugins are injected
	var oldInjectEventPluginOrder = EventPluginHub.injection.injectEventPluginOrder;
	EventPluginHub.injection.injectEventPluginOrder = function() {
	  oldInjectEventPluginOrder.apply(this, arguments);
	  buildSimulators();
	};
	var oldInjectEventPlugins = EventPluginHub.injection.injectEventPluginsByName;
	EventPluginHub.injection.injectEventPluginsByName = function() {
	  oldInjectEventPlugins.apply(this, arguments);
	  buildSimulators();
	};

	buildSimulators();

	/**
	 * Exports:
	 *
	 * - `ReactTestUtils.SimulateNative.click(Element/ReactDOMComponent)`
	 * - `ReactTestUtils.SimulateNative.mouseMove(Element/ReactDOMComponent)`
	 * - `ReactTestUtils.SimulateNative.mouseIn/ReactDOMComponent)`
	 * - `ReactTestUtils.SimulateNative.mouseOut(Element/ReactDOMComponent)`
	 * - ... (All keys from `EventConstants.topLevelTypes`)
	 *
	 * Note: Top level event types are a subset of the entire set of handler types
	 * (which include a broader set of "synthetic" events). For example, onDragDone
	 * is a synthetic event. Except when testing an event plugin or React's event
	 * handling code specifically, you probably want to use ReactTestUtils.Simulate
	 * to dispatch synthetic events.
	 */

	function makeNativeSimulator(eventType) {
	  return function(domComponentOrNode, nativeEventData) {
	    var fakeNativeEvent = new Event(eventType);
	    assign(fakeNativeEvent, nativeEventData);
	    if (ReactTestUtils.isDOMComponent(domComponentOrNode)) {
	      ReactTestUtils.simulateNativeEventOnDOMComponent(
	        eventType,
	        domComponentOrNode,
	        fakeNativeEvent
	      );
	    } else if (!!domComponentOrNode.tagName) {
	      // Will allow on actual dom nodes.
	      ReactTestUtils.simulateNativeEventOnNode(
	        eventType,
	        domComponentOrNode,
	        fakeNativeEvent
	      );
	    }
	  };
	}

	var eventType;
	for (eventType in topLevelTypes) {
	  // Event type is stored as 'topClick' - we transform that to 'click'
	  var convenienceName = eventType.indexOf('top') === 0 ?
	    eventType.charAt(3).toLowerCase() + eventType.substr(4) : eventType;
	  /**
	   * @param {!Element || ReactDOMComponent} domComponentOrNode
	   * @param {?Event} nativeEventData Fake native event to use in SyntheticEvent.
	   */
	  ReactTestUtils.SimulateNative[convenienceName] =
	    makeNativeSimulator(eventType);
	}

	module.exports = ReactTestUtils;


/***/ },
/* 46 */,
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @name Util
	 * @namespace
	 * @classdesc Miscellaneous util functions.
	 */

	/* ---------------- */
	/* Private helpers. */
	/* ---------------- */

	// resolveArgs

	var isRequired, findTurningPoint, prepare;

	isRequired = function (spec) {
	  return typeof spec === 'string' && spec.charAt(0) !== '?';
	};

	findTurningPoint = function (arr, pred) {
	  var first = pred(arr[0]);
	  for (var i = 1; i < arr.length; i++) {
	    if (pred(arr[i]) !== first) return i;
	  }
	  return null;
	};

	prepare = function (arr, splitAt) {
	  return arr.slice(splitAt).reverse().concat(arr.slice(0, splitAt));
	};

	module.exports = {

	  /** Identity function. Returns its first argument.
	   * @param {*} x argument to return
	   * @return {*} its first argument
	   * @memberOf Util */
	  identity: function (x) {
	    return x;
	  },

	  /** 'Not' function returning logical not of its argument.
	   * @param {*} x argument
	   * @returns {*} !x
	   * @memberOf Util */
	  not: function (x) {
	    return !x;
	  },

	  /** Create constant function (always returning x).
	   * @param {*} x constant function return value
	   * @return {Function} function always returning x
	   * @memberOf Util */
	  constantly: function (x) {
	    return function () { return x; };
	  },

	  /** Execute function asynchronously.
	   * @param {Function} f function */
	  async: function (f) {
	    setTimeout(f, 0);
	  },

	  /** Execute function f, then function cont. If f returns a promise, cont is executed when the promise resolves.
	   * @param {Function} f function to execute first
	   * @param {Function} cont function to execute after f
	   * @memberOf Util */
	  afterComplete: function (f, cont) {
	    var result = f();
	    if (result && typeof result.always === 'function') {
	      result.always(cont);
	    } else {
	      cont();
	    }
	  },

	  /** Check if argument is undefined or null.
	   * @param {*} x argument to check
	   * @returns {Boolean}
	   * @memberOf Util */
	  undefinedOrNull: function (x) {
	    return x === undefined || x === null;
	  },

	  /** Get values of object properties.
	   * @param {Object} obj object
	   * @return {Array} object's properties values
	   * @memberOf Util */
	  getPropertyValues: function (obj) {
	    return Object.keys(obj).map(function (key) { return obj[key]; });
	  },

	  /** Find array element satisfying the predicate.
	   * @param {Array} arr array
	   * @param {Function} pred predicate accepting current value, index, original array
	   * @return {*} found value or null
	   * @memberOf Util */
	  find: function (arr, pred) {
	    for (var i = 0; i < arr.length; i++) {
	      var value = arr[i];
	      if (pred(value, i, arr)) {
	        return value;
	      }
	    }
	    return null;
	  },

	  /** Resolve arguments. Acceptable spec formats:
	   * <ul>
	   *   <li>'foo' - required argument 'foo';</li>
	   *   <li>'?foo' - optional argument 'foo';</li>
	   *   <li>function (arg) { return arg instanceof MyClass ? 'foo' : null; } - checked optional argument.</li>
	   * </ul>
	   * Specs can only switch optional flag once in the list. This invariant isn't checked by the method,
	   * its violation will produce indeterminate results.
	   * <p>Optional arguments are matched in order, left to right. Provide check function if you need to allow to skip
	   * one optional argument and use sebsequent optional arguments instead.
	   * <p>Returned arguments descriptor contains argument names mapped to resolved values.
	   * @param {Array} args arguments 'array'
	   * @param {*} var_args arguments specs as a var-args list or array, see method description
	   * @returns {Object} arguments descriptor object
	   * @memberOf Util */
	  resolveArgs: function (args, var_args) {
	    var result = {};
	    if (arguments.length > 1) {
	      var specs = Array.isArray(var_args) ? var_args : Array.prototype.slice.call(arguments, 1);
	      var preparedSpecs, preparedArgs;
	      var turningPoint;

	      if (isRequired(specs[0]) || !(turningPoint = findTurningPoint(specs, isRequired))) {
	        preparedSpecs = specs;
	        preparedArgs = args;
	      } else {
	        var effectiveArgs = Array.isArray(args) ? args : Array.prototype.slice.call(args);
	        preparedSpecs = prepare(specs, turningPoint);
	        preparedArgs = prepare(effectiveArgs, effectiveArgs.length - (specs.length - turningPoint));
	      }

	      for (var specIndex = 0, argIndex = 0;
	           specIndex < preparedSpecs.length && argIndex < preparedArgs.length; specIndex++) {
	        var spec = preparedSpecs[specIndex], arg = preparedArgs[argIndex];
	        if (isRequired(spec)) {
	          result[spec] = arg;
	          argIndex++;
	        } else {
	          var name = typeof spec === 'function' ? spec(arg) : (spec.charAt(0) !== '?' ? spec : spec.substring(1));
	          if (name || arg === undefined) {
	            result[name] = arg;
	            argIndex++;
	          }
	        }
	      }
	    }

	    return result;
	  },

	  /** Check if argument can be valid binding subpath.
	   * @param {*} x
	   * @returns {Boolean}
	   * @memberOf Util */
	  canRepresentSubpath: function (x) {
	    var type = typeof x;
	    return type === 'string' || type === 'number' || Array.isArray(x);
	  },

	  /** ES6 Object.assign.
	   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign */
	  assign: function (target, firstSource) {
	    if (target === undefined || target === null) {
	      throw new TypeError('Cannot convert first argument to object');
	    }

	    var to = Object(target);

	    var hasPendingException = false;
	    var pendingException;

	    for (var i = 1; i < arguments.length; i++) {
	      var nextSource = arguments[i];
	      if (nextSource === undefined || nextSource === null)
	        continue;

	      var keysArray = Object.keys(Object(nextSource));
	      for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
	        var nextKey = keysArray[nextIndex];
	        try {
	          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
	          if (desc !== undefined && desc.enumerable)
	            to[nextKey] = nextSource[nextKey];
	        } catch (e) {
	          if (!hasPendingException) {
	            hasPendingException = true;
	            pendingException = e;
	          }
	        }
	      }

	      if (hasPendingException)
	        throw pendingException;
	    }
	    return to;
	  }

	};


/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	var Imm = __webpack_require__(33);
	var Util = __webpack_require__(47);
	var ChangesDescriptor = __webpack_require__(128);

	/* ---------------- */
	/* Private helpers. */
	/* ---------------- */

	var UNSET_VALUE = {};

	var getBackingValue, setBackingValue;

	getBackingValue = function (binding) {
	  return binding._sharedInternals.backingValue;
	};

	setBackingValue = function (binding, newBackingValue) {
	  binding._sharedInternals.backingValue = newBackingValue;
	};

	var EMPTY_PATH, PATH_SEPARATOR, META_NODE, getPathElements, joinPaths, getMetaPath, getValueAtPath;

	EMPTY_PATH = [];
	PATH_SEPARATOR = '.';
	META_NODE = '__meta__';

	getPathElements = function (path) {
	  return path ? path.split(PATH_SEPARATOR) : [];
	};

	joinPaths = function (path1, path2) {
	  return path1.length === 0 ? path2 :
	    (path2.length === 0 ? path1 : path1.concat(path2));
	};

	getMetaPath = function (subpath, key) {
	  return joinPaths(subpath, [META_NODE, key]);
	};

	getValueAtPath = function (backingValue, path) {
	  return backingValue && path.length > 0 ? backingValue.getIn(path) : backingValue;
	};

	var asArrayPath, asStringPath;

	asArrayPath = function (path) {
	  return typeof path === 'string' ?
	    getPathElements(path) :
	    (Util.undefinedOrNull(path) ? [] : path);
	};

	asStringPath = function (path) {
	  switch (typeof path) {
	    case 'string':
	      return path;
	    case 'number':
	      return path.toString();
	    default:
	      return Util.undefinedOrNull(path) ? '' : path.join(PATH_SEPARATOR);
	  }
	};

	var setOrUpdate, updateValue, removeValue, merge, clear;

	setOrUpdate = function (rootValue, effectivePath, f) {
	  return rootValue.updateIn(effectivePath, UNSET_VALUE, function (value) {
	    return value === UNSET_VALUE ? f() : f(value);
	  });
	};

	updateValue = function (self, subpath, f) {
	  var effectivePath = joinPaths(self._path, subpath);
	  var newBackingValue = setOrUpdate(getBackingValue(self), effectivePath, f);
	  setBackingValue(self, newBackingValue);
	  return effectivePath;
	};

	removeValue = function (self, subpath) {
	  var effectivePath = joinPaths(self._path, subpath);
	  var backingValue = getBackingValue(self);

	  var len = effectivePath.length;
	  switch (len) {
	    case 0:
	      throw new Error('Cannot delete root value');
	    default:
	      var pathTo = effectivePath.slice(0, len - 1);
	      if (backingValue.has(pathTo[0]) || len === 1) {
	        var newBackingValue = backingValue.updateIn(pathTo, function (coll) {
	          var key = effectivePath[len - 1];
	          if (coll instanceof Imm.List) {
	            return coll.splice(key, 1);
	          } else {
	            return coll && coll.remove(key);
	          }
	        });

	        setBackingValue(self, newBackingValue);
	      }

	      return pathTo;
	  }
	};

	merge = function (preserve, newValue, value) {
	  if (Util.undefinedOrNull(value)) {
	    return newValue;
	  } else {
	    if (value instanceof Imm.Iterable && newValue instanceof Imm.Iterable) {
	      return preserve ? newValue.mergeDeep(value) : value.mergeDeep(newValue);
	    } else {
	      return preserve ? value : newValue;
	    }
	  }
	};

	clear = function (value) {
	  return value instanceof Imm.Iterable ? value.clear() : null;
	};

	var notifySamePathListeners, notifyGlobalListeners, startsWith, isPathAffected, notifyNonGlobalListeners, notifyAllListeners;

	notifySamePathListeners =
	  function (self, samePathListeners, listenerPath, path, previousBackingValue, previousMeta) {
	    if (previousBackingValue || previousMeta) {
	      Util.getPropertyValues(samePathListeners).forEach(function (listenerDescriptor) {
	        if (!listenerDescriptor.disabled) {
	          var listenerPathAsArray = asArrayPath(listenerPath);
	          var currentBackingValue = getBackingValue(self);

	          var valueChanged = !!previousBackingValue &&
	            currentBackingValue.getIn(listenerPathAsArray) !== previousBackingValue.getIn(listenerPathAsArray);
	          var metaChanged = !!previousMeta;

	          if (valueChanged || metaChanged) {
	            listenerDescriptor.cb(
	              new ChangesDescriptor(
	                path, listenerPathAsArray, valueChanged, previousBackingValue, previousMeta
	              )
	            );
	          }
	        }
	      });
	    }
	  };

	notifyGlobalListeners = function (self, path, previousBackingValue, previousMeta) {
	  var listeners = self._sharedInternals.listeners;
	  var globalListeners = listeners[''];
	  if (globalListeners) {
	    notifySamePathListeners(
	      self, globalListeners, EMPTY_PATH, path, previousBackingValue, previousMeta);
	  }
	};

	startsWith = function (s1, s2) {
	  return s1.indexOf(s2) === 0;
	};

	isPathAffected = function (listenerPath, changedPath) {
	  return startsWith(changedPath, listenerPath) || startsWith(listenerPath, changedPath);
	};

	notifyNonGlobalListeners = function (self, path, previousBackingValue, previousMeta) {
	  var listeners = self._sharedInternals.listeners;
	  Object.keys(listeners).filter(Util.identity).forEach(function (listenerPath) {
	    if (isPathAffected(listenerPath, asStringPath(path))) {
	      notifySamePathListeners(
	        self, listeners[listenerPath], listenerPath, path, previousBackingValue, previousMeta);
	    }
	  });
	};

	notifyAllListeners = function (self, path, previousBackingValue, previousMeta) {
	  notifyGlobalListeners(self, path, previousBackingValue, previousMeta);
	  notifyNonGlobalListeners(self, path, previousBackingValue, previousMeta);
	};

	var linkMeta, unlinkMeta;

	linkMeta = function (self, metaBinding) {
	  self._sharedInternals.metaBindingListenerId = metaBinding.addListener(function (changes) {
	    var metaNodePath = changes.getPath();
	    var changedPath = metaNodePath.slice(0, metaNodePath.length - 1);
	    var previousMeta = changes.isValueChanged() ? changes.getPreviousValue() : getBackingValue(metaBinding);

	    notifyAllListeners(self, changedPath, null, previousMeta);
	  });
	};

	unlinkMeta = function (self, metaBinding) {
	  var removed = metaBinding.removeListener(self._sharedInternals.metaBindingListenerId);
	  self._sharedInternals.metaBinding = null;
	  self._sharedInternals.metaBindingListenerId = null;
	  return removed;
	};

	var findSamePathListeners, setListenerDisabled;

	findSamePathListeners = function (self, listenerId) {
	  return Util.find(
	    Util.getPropertyValues(self._sharedInternals.listeners),
	    function (samePathListeners) { return !!samePathListeners[listenerId]; }
	  );
	};

	setListenerDisabled = function (self, listenerId, disabled) {
	  var samePathListeners = findSamePathListeners(self, listenerId);
	  if (samePathListeners) {
	    samePathListeners[listenerId].disabled = disabled;
	  }
	};

	var update, delete_;

	update = function (self, subpath, f) {
	  var previousBackingValue = getBackingValue(self);
	  var affectedPath = updateValue(self, asArrayPath(subpath), f);
	  notifyAllListeners(self, affectedPath, previousBackingValue, null);
	};

	delete_ = function (self, subpath) {
	  var previousBackingValue = getBackingValue(self);
	  var affectedPath = removeValue(self, asArrayPath(subpath));
	  notifyAllListeners(self, affectedPath, previousBackingValue, null);
	};

	/** Binding constructor.
	 * @param {String[]} [path] binding path, empty array if omitted
	 * @param {Object} [sharedInternals] shared relative bindings internals:
	 * <ul>
	 *   <li>backingValue - backing value;</li>
	 *   <li>metaBinding - meta binding;</li>
	 *   <li>metaBindingListenerId - meta binding listener id;</li>
	 *   <li>regCount - registration count (used for listener id generation);</li>
	 *   <li>listeners - change listeners;</li>
	 *   <li>cache - bindings cache.</li>
	 * </ul>
	 * @public
	 * @class Binding
	 * @classdesc Wraps immutable collection. Provides convenient read-write access to nested values.
	 * Allows to create sub-bindings (or views) narrowed to a subpath and sharing the same backing value.
	 * Changes to these bindings are mutually visible.
	 * <p>Terminology:
	 * <ul>
	 *   <li>
	 *     (sub)path - path to a value within nested associative data structure, example: 'path.t.0.some.value';
	 *   </li>
	 *   <li>
	 *     backing value - value shared by all bindings created using [sub]{@link Binding#sub} method.
	 *   </li>
	 * </ul>
	 * <p>Features:
	 * <ul>
	 *   <li>can create sub-bindings sharing same backing value. Sub-binding can only modify values down its subpath;</li>
	 *   <li>allows to conveniently modify nested values: assign, update with a function, remove, and so on;</li>
	 *   <li>can attach change listeners to a specific subpath;</li>
	 *   <li>can perform multiple changes atomically in respect of listener notification.</li>
	 * </ul>
	 * @see Binding.init */
	var Binding = function (path, sharedInternals) {
	  /** @private */
	  this._path = path || EMPTY_PATH;

	  /** @protected
	   * @ignore */
	  this._sharedInternals = sharedInternals || {};

	  if (Util.undefinedOrNull(this._sharedInternals.regCount)) {
	    this._sharedInternals.regCount = 0;
	  }

	  if (!this._sharedInternals.listeners) {
	    this._sharedInternals.listeners = {};
	  }

	  if (!this._sharedInternals.cache) {
	    this._sharedInternals.cache = {};
	  }
	};

	/* --------------- */
	/* Static helpers. */
	/* --------------- */

	/** Create new binding with empty listeners set.
	 * @param {Immutable.Map} backingValue backing value
	 * @param {Binding} [metaBinding] meta binding
	 * @return {Binding} fresh binding instance */
	Binding.init = function (backingValue, metaBinding) {
	  var binding = new Binding(EMPTY_PATH, {
	    backingValue: backingValue,
	    metaBinding: metaBinding
	  });

	  if (metaBinding) {
	    linkMeta(binding, metaBinding);
	  }

	  return binding;
	};

	/** Convert string path to array path.
	 * @param {String} pathAsString path as string
	 * @return {Array} path as an array */
	Binding.asArrayPath = function (pathAsString) {
	  return asArrayPath(pathAsString);
	};

	/** Convert array path to string path.
	 * @param {String[]} pathAsAnArray path as an array
	 * @return {String} path as a string */
	Binding.asStringPath = function (pathAsAnArray) {
	  return asStringPath(pathAsAnArray);
	};

	/** Meta node name.
	 * @type {String} */
	Binding.META_NODE = META_NODE;

	/** @lends Binding.prototype */
	var bindingPrototype = {

	  /** Get binding path.
	   * @returns {Array} binding path */
	  getPath: function () {
	    return this._path;
	  },

	  /** Update backing value.
	   * @param {Immutable.Map} newBackingValue new backing value
	   * @return {Binding} new binding instance, original is unaffected */
	  withBackingValue: function (newBackingValue) {
	    var newSharedInternals = {};
	    Util.assign(newSharedInternals, this._sharedInternals);
	    newSharedInternals.backingValue = newBackingValue;
	    return new Binding(this._path, newSharedInternals);
	  },

	  /** Check if binding value is changed in alternative backing value.
	   * @param {Immutable.Map} alternativeBackingValue alternative backing value
	   * @param {Function} [compare] alternative compare function, does reference equality check if omitted */
	  isChanged: function (alternativeBackingValue, compare) {
	    var value = this.get();
	    var alternativeValue = alternativeBackingValue ? alternativeBackingValue.getIn(this._path) : undefined;
	    return compare ?
	        !compare(value, alternativeValue) :
	        !(value === alternativeValue || (Util.undefinedOrNull(value) && Util.undefinedOrNull(alternativeValue)));
	  },

	  /** Check if this and supplied binding are relatives (i.e. share same backing value).
	   * @param {Binding} otherBinding potential relative
	   * @return {Boolean} */
	  isRelative: function (otherBinding) {
	    return this._sharedInternals === otherBinding._sharedInternals &&
	      this._sharedInternals.backingValue === otherBinding._sharedInternals.backingValue;
	  },

	  /** Get binding's meta binding.
	   * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers;
	   *                                 b.meta('path') is equivalent to b.meta().sub('path')
	   * @returns {Binding} meta binding or undefined */
	  meta: function (subpath) {
	    if (!this._sharedInternals.metaBinding) {
	      var metaBinding = Binding.init(Imm.Map());
	      linkMeta(this, metaBinding);
	      this._sharedInternals.metaBinding = metaBinding;
	    }

	    var effectiveSubpath = subpath ? joinPaths([META_NODE], asArrayPath(subpath)) : [META_NODE];
	    var thisPath = this.getPath();
	    var absolutePath = thisPath.length > 0 ? joinPaths(thisPath, effectiveSubpath) : effectiveSubpath;
	    return this._sharedInternals.metaBinding.sub(absolutePath);
	  },

	  /** Unlink this binding's meta binding, removing change listener and making them totally independent.
	   * May be used to prevent memory leaks when appropriate.
	   * @return {Boolean} true if binding's meta binding was unlinked */
	  unlinkMeta: function () {
	    var metaBinding = this._sharedInternals.metaBinding;
	    return metaBinding ? unlinkMeta(this, metaBinding) : false;
	  },

	  /** Get binding value.
	   * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	   * @return {*} value at path or null */
	  get: function (subpath) {
	    return getValueAtPath(getBackingValue(this), joinPaths(this._path, asArrayPath(subpath)));
	  },

	  /** Convert to JS representation.
	   * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	   * @return {*} JS representation of data at subpath */
	  toJS: function (subpath) {
	    var value = this.sub(subpath).get();
	    return value instanceof Imm.Iterable ? value.toJS() : value;
	  },

	  /** Bind to subpath. Both bindings share the same backing value. Changes are mutually visible.
	   * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	   * @return {Binding} new binding instance, original is unaffected */
	  sub: function (subpath) {
	    var pathAsArray = asArrayPath(subpath);
	    var absolutePath = joinPaths(this._path, pathAsArray);
	    if (absolutePath.length > 0) {
	      var absolutePathAsString = asStringPath(absolutePath);
	      var cached = this._sharedInternals.cache[absolutePathAsString];

	      if (cached) {
	        return cached;
	      } else {
	        var subBinding = new Binding(absolutePath, this._sharedInternals);
	        this._sharedInternals.cache[absolutePathAsString] = subBinding;
	        return subBinding;
	      }
	    } else {
	      return this;
	    }
	  },

	  /** Update binding value.
	   * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	   * @param {Function} f update function
	   * @return {Binding} this binding */
	  update: function (subpath, f) {
	    var args = Util.resolveArgs(arguments, '?subpath', 'f');
	    update(this, args.subpath, args.f);
	    return this;
	  },

	  /** Set binding value.
	   * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	   * @param {*} newValue new value
	   * @return {Binding} this binding */
	  set: function (subpath, newValue) {
	    var args = Util.resolveArgs(arguments, '?subpath', 'newValue');
	    update(this, args.subpath, Util.constantly(args.newValue));
	    return this;
	  },

	  /** Delete value.
	   * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	   * @return {Binding} this binding */
	  remove: function (subpath) {
	    delete_(this, subpath);
	    return this;
	  },

	  /** Deep merge values.
	   * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	   * @param {Boolean} [preserve=false] preserve existing values when merging
	   * @param {*} newValue new value
	   * @return {Binding} this binding */
	  merge: function (subpath, preserve, newValue) {
	    var args = Util.resolveArgs(
	      arguments,
	      function (x) { return Util.canRepresentSubpath(x) ? 'subpath' : null; },
	      '?preserve',
	      'newValue'
	    );
	    update(this, args.subpath, merge.bind(null, args.preserve, args.newValue));
	    return this;
	  },

	  /** Clear nested collection. Does '.clear()' on Immutable values, nullifies otherwise.
	   * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	   * @return {Binding} this binding */
	  clear: function (subpath) {
	    var subpathAsArray = asArrayPath(subpath);
	    if (!Util.undefinedOrNull(this.get(subpathAsArray))) {
	      update(this, subpathAsArray, clear);
	    }
	    return this;
	  },

	  /** Add change listener.
	   * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	   * @param {Function} cb function receiving changes descriptor
	   * @return {String} unique id which should be used to un-register the listener
	   * @see ChangesDescriptor */
	  addListener: function (subpath, cb) {
	    var args = Util.resolveArgs(
	      arguments, function (x) { return Util.canRepresentSubpath(x) ? 'subpath' : null; }, 'cb'
	    );

	    var listenerId = 'reg' + this._sharedInternals.regCount++;
	    var pathAsString = asStringPath(joinPaths(this._path, asArrayPath(args.subpath || '')));
	    var samePathListeners = this._sharedInternals.listeners[pathAsString];
	    var listenerDescriptor = { cb: args.cb, disabled: false };
	    if (samePathListeners) {
	      samePathListeners[listenerId] = listenerDescriptor;
	    } else {
	      var listeners = {};
	      listeners[listenerId] = listenerDescriptor;
	      this._sharedInternals.listeners[pathAsString] = listeners;
	    }
	    return listenerId;
	  },

	  /** Enable listener.
	   * @param {String} listenerId listener id
	   * @return {Binding} this binding */
	  enableListener: function (listenerId) {
	    setListenerDisabled(this, listenerId, false);
	    return this;
	  },

	  /** Disable listener.
	   * @param {String} listenerId listener id
	   * @return {Binding} this binding */
	  disableListener: function (listenerId) {
	    setListenerDisabled(this, listenerId, true);
	    return this;
	  },

	  /** Execute function with listener temporarily disabled. Correctly handles functions returning promises.
	   * @param {String} listenerId listener id
	   * @param {Function} f function to execute
	   * @return {Binding} this binding */
	  withDisabledListener: function (listenerId, f) {
	    var samePathListeners = findSamePathListeners(this, listenerId);
	    if (samePathListeners) {
	      var descriptor = samePathListeners[listenerId];
	      descriptor.disabled = true;
	      Util.afterComplete(f, function () { descriptor.disabled = false; });
	    } else {
	      f();
	    }
	    return this;
	  },

	  /** Un-register the listener.
	   * @param {String} listenerId listener id
	   * @return {Boolean} true if listener removed successfully, false otherwise */
	  removeListener: function (listenerId) {
	    var samePathListeners = findSamePathListeners(this, listenerId);
	    return samePathListeners ? delete samePathListeners[listenerId] : false;
	  },

	  /** Create transaction context.
	   * @return {TransactionContext} transaction context */
	  atomically: function () {
	    return new TransactionContext(this);
	  }

	};

	bindingPrototype['delete'] = bindingPrototype.remove;

	Binding.prototype = Object.freeze(bindingPrototype);

	/** Transaction context constructor.
	 * @param {Binding} binding binding
	 * @param {Function[]} [updates] queued updates
	 * @param {Function[]} [removals] queued removals
	 * @public
	 * @class TransactionContext
	 * @classdesc Transaction context. */
	var TransactionContext = function (binding, updates, removals) {
	  /** @private */
	  this._binding = binding;
	  /** @private */
	  this._updates = updates || [];
	  /** @private */
	  this._deletions = removals || [];
	  /** @private */
	  this._committed = false;

	  /** @private */
	  this._hasChanges = false;
	  /** @private */
	  this._hasMetaChanges = false;
	};

	TransactionContext.prototype = (function () {

	  var registerUpdate, hasChanges;

	  registerUpdate = function (self, binding) {
	    if (!self._hasChanges) {
	      self._hasChanges = binding.isRelative(self._binding);
	    }

	    if (!self._hasMetaChanges) {
	      self._hasMetaChanges = !binding.isRelative(self._binding);
	    }
	  };

	  hasChanges = function (self) {
	    return self._hasChanges || self._hasMetaChanges;
	  };

	  var addUpdate, addDeletion, areSiblings, filterRedundantPaths, commitSilently;

	  addUpdate = function (self, binding, update, subpath) {
	    registerUpdate(self, binding);
	    self._updates.push({ binding: binding, update: update, subpath: subpath });
	  };

	  addDeletion = function (self, binding, subpath) {
	    registerUpdate(self, binding);
	    self._deletions.push({ binding: binding, subpath: subpath });
	  };

	  areSiblings = function (path1, path2) {
	    var path1Length = path1.length, path2Length = path2.length;
	    return path1Length === path2Length &&
	      (path1Length === 1 || path1[path1Length - 2] === path2[path1Length - 2]);
	  };

	  filterRedundantPaths = function (affectedPaths) {
	    if (affectedPaths.length < 2) {
	      return affectedPaths;
	    } else {
	      var sortedPaths = affectedPaths.sort();
	      var previousPath = sortedPaths[0], previousPathAsString = asStringPath(previousPath);
	      var result = [previousPath];
	      for (var i = 1; i < sortedPaths.length; i++) {
	        var currentPath = sortedPaths[i], currentPathAsString = asStringPath(currentPath);
	        if (!startsWith(currentPathAsString, previousPathAsString)) {
	          if (areSiblings(currentPath, previousPath)) {
	            var commonParentPath = currentPath.slice(0, currentPath.length - 1);
	            result.pop();
	            result.push(commonParentPath);
	            previousPath = commonParentPath;
	            previousPathAsString = asStringPath(commonParentPath);
	          } else {
	            result.push(currentPath);
	            previousPath = currentPath;
	            previousPathAsString = currentPathAsString;
	          }
	        }
	      }
	      return result;
	    }
	  };

	  commitSilently = function (self) {
	    if (!self._committed) {
	      var updatedPaths = self._updates.map(function (o) { return updateValue(o.binding, o.subpath, o.update); });
	      var removedPaths = self._deletions.map(function (o) { return removeValue(o.binding, o.subpath); });
	      self._committed = true;
	      return joinPaths(updatedPaths, removedPaths);
	    } else {
	      throw new Error('Transaction already committed');
	    }
	  };

	  /** @lends TransactionContext.prototype */
	  var transactionContextPrototype = {

	    /** Update binding value.
	     * @param {Binding} [binding] binding to apply update to
	     * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	     * @param {Function} f update function
	     * @return {TransactionContext} updated transaction */
	    update: function (binding, subpath, f) {
	      var args = Util.resolveArgs(
	        arguments,
	        function (x) { return x instanceof Binding ? 'binding' : null; }, '?subpath', 'f'
	      );
	      addUpdate(this, args.binding || this._binding, args.f, asArrayPath(args.subpath));
	      return this;
	    },

	    /** Set binding value.
	     * @param {Binding} [binding] binding to apply update to
	     * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	     * @param {*} newValue new value
	     * @return {TransactionContext} updated transaction context */
	    set: function (binding, subpath, newValue) {
	      var args = Util.resolveArgs(
	        arguments,
	        function (x) { return x instanceof Binding ? 'binding' : null; }, '?subpath', 'newValue'
	      );
	      return this.update(args.binding, args.subpath, Util.constantly(args.newValue));
	    },

	    /** Remove value.
	     * @param {Binding} [binding] binding to apply update to
	     * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	     * @return {TransactionContext} updated transaction context */
	    remove: function (binding, subpath) {
	      var args = Util.resolveArgs(
	        arguments,
	        function (x) { return x instanceof Binding ? 'binding' : null; }, '?subpath'
	      );
	      addDeletion(this, args.binding || this._binding, asArrayPath(args.subpath));
	      return this;
	    },

	    /** Deep merge values.
	     * @param {Binding} [binding] binding to apply update to
	     * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	     * @param {Boolean} [preserve=false] preserve existing values when merging
	     * @param {*} newValue new value
	     * @return {TransactionContext} updated transaction context */
	    merge: function (binding, subpath, preserve, newValue) {
	      var args = Util.resolveArgs(
	        arguments,
	        function (x) { return x instanceof Binding ? 'binding' : null; },
	        function (x) { return Util.canRepresentSubpath(x) ? 'subpath' : null; },
	        function (x) { return typeof x === 'boolean' ? 'preserve' : null; },
	        'newValue'
	      );
	      return this.update(args.binding, args.subpath, merge.bind(null, args.preserve, args.newValue));
	    },

	    /** Clear collection or nullify nested value.
	     * @param {Binding} [binding] binding to apply update to
	     * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	     * @return {TransactionContext} updated transaction context */
	    clear: function (binding, subpath) {
	      var args = Util.resolveArgs(
	        arguments,
	        function (x) { return x instanceof Binding ? 'binding' : null; }, '?subpath'
	      );
	      addUpdate(this, args.binding || this._binding, clear, asArrayPath(args.subpath));
	      return this;
	    },

	    /** Commit transaction (write changes and notify listeners).
	     * @param {Object} [options] options object
	     * @param {Boolean} [options.notify=true] should listeners be notified
	     * @return {String[]} array of affected paths */
	    commit: function (options) {
	      if (hasChanges(this)) {
	        var effectiveOptions = options || {};
	        var binding = this._binding;

	        var previousBackingValue = null, previousMetaValue = null;
	        if (effectiveOptions.notify !== false) {
	          if (this._hasChanges) previousBackingValue = getBackingValue(binding);
	          if (this._hasMetaChanges) previousMetaValue = getBackingValue(binding.meta());
	        }

	        var affectedPaths = commitSilently(this);

	        if (effectiveOptions.notify !== false) {
	          var filteredPaths = filterRedundantPaths(affectedPaths);
	          notifyGlobalListeners(binding, filteredPaths[0], previousBackingValue, previousMetaValue);
	          filteredPaths.forEach(function (path) {
	            notifyNonGlobalListeners(binding, path, previousBackingValue, previousMetaValue);
	          });
	        }

	        return affectedPaths;

	      } else {
	        return [];
	      }
	    }

	  };

	  transactionContextPrototype['delete'] = transactionContextPrototype.remove;

	  return Object.freeze(transactionContextPrototype);
	})();


	module.exports = Binding;


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	var Imm = __webpack_require__(33);
	var Binding = __webpack_require__(48);

	var getHistoryBinding, initHistory, clearHistory, destroyHistory, listenForChanges, revertToStep, revert;

	getHistoryBinding = function (binding) {
	  return binding.meta('history');
	};

	initHistory = function (historyBinding) {
	  historyBinding.set(Imm.fromJS({ listenerId: null, undo: [], redo: [] }));
	};

	clearHistory = function (historyBinding) {
	  var listenerId = historyBinding.get('listenerId');
	  historyBinding.withDisabledListener(listenerId, function () {
	    historyBinding.atomically()
	      .set('undo', Imm.List.of())
	      .set('redo', Imm.List.of())
	      .commit();
	  });
	};

	destroyHistory = function (binding, notify) {
	  var historyBinding = getHistoryBinding(binding);
	  var listenerId = historyBinding.get('listenerId');
	  binding.removeListener(listenerId);
	  historyBinding.atomically().set(null).commit({ notify: notify });
	};

	listenForChanges = function (binding, historyBinding) {
	  var listenerId = binding.addListener([], function (changes) {
	    if (changes.isValueChanged()) {
	      historyBinding.atomically().update(function (history) {
	        var path = changes.getPath();
	        var previousValue = changes.getPreviousValue(), newValue = binding.get();
	        return history
	          .update('undo', function (undo) {
	            var pathAsArray = Binding.asArrayPath(path);
	            return undo && undo.unshift(Imm.Map({
	              newValue: pathAsArray.length ? newValue.getIn(pathAsArray) : newValue,
	              oldValue: pathAsArray.length ? previousValue && previousValue.getIn(pathAsArray) : previousValue,
	              path: path
	            }));
	          })
	          .set('redo', Imm.List.of());
	      }).commit({ notify: false });
	    }
	  });

	  historyBinding.atomically().set('listenerId', listenerId).commit({ notify: false });
	};

	revertToStep = function (path, value, listenerId, binding) {
	  binding.withDisabledListener(listenerId, function () {
	    binding.set(path, value);
	  });
	};

	revert = function (binding, fromBinding, toBinding, listenerId, valueProperty) {
	  var from = fromBinding.get();
	  if (!from.isEmpty()) {
	    var step = from.get(0);

	    fromBinding.atomically()
	      .remove(0)
	      .update(toBinding, function (to) {
	        return to.unshift(step);
	      })
	      .commit({ notify: false });

	    revertToStep(step.get('path'), step.get(valueProperty), listenerId, binding);
	    return true;
	  } else {
	    return false;
	  }
	};


	/**
	 * @name History
	 * @namespace
	 * @classdesc Undo/redo history handling.
	 */
	var History = {

	  /** Init history.
	   * @param {Binding} binding binding
	   * @memberOf History */
	  init: function (binding) {
	    var historyBinding = getHistoryBinding(binding);
	    initHistory(historyBinding);
	    listenForChanges(binding, historyBinding);
	  },

	  /** Clear history.
	   * @param {Binding} binding binding
	   * @memberOf History */
	  clear: function (binding) {
	    var historyBinding = getHistoryBinding(binding);
	    clearHistory(historyBinding);
	  },

	  /** Clear history and shutdown listener.
	   * @param {Binding} binding history binding
	   * @param {Object} [options] options object
	   * @param {Boolean} [options.notify=true] should listeners be notified
	   * @memberOf History */
	  destroy: function (binding, options) {
	    var effectiveOptions = options || {};
	    destroyHistory(binding, effectiveOptions.notify);
	  },

	  /** Check if history has undo information.
	   * @param {Binding} binding binding
	   * @returns {Boolean}
	   * @memberOf History */
	  hasUndo: function (binding) {
	    var historyBinding = getHistoryBinding(binding);
	    var undo = historyBinding.get('undo');
	    return !!undo && !undo.isEmpty();
	  },

	  /** Check if history has redo information.
	   * @param {Binding} binding binding
	   * @returns {Boolean}
	   * @memberOf History */
	  hasRedo: function (binding) {
	    var historyBinding = getHistoryBinding(binding);
	    var redo = historyBinding.get('redo');
	    return !!redo && !redo.isEmpty();
	  },

	  /** Revert to previous state.
	   * @param {Binding} binding binding
	   * @returns {Boolean} true, if binding has undo information
	   * @memberOf History */
	  undo: function (binding) {
	    var historyBinding = getHistoryBinding(binding);
	    var listenerId = historyBinding.get('listenerId');
	    var undoBinding = historyBinding.sub('undo');
	    var redoBinding = historyBinding.sub('redo');
	    return revert(binding, undoBinding, redoBinding, listenerId, 'oldValue');
	  },

	  /** Revert to next state.
	   * @param {Binding} binding binding
	   * @returns {Boolean} true, if binding has redo information
	   * @memberOf History */
	  redo: function (binding) {
	    var historyBinding = getHistoryBinding(binding);
	    var listenerId = historyBinding.get('listenerId');
	    var undoBinding = historyBinding.sub('undo');
	    var redoBinding = historyBinding.sub('redo');
	    return revert(binding, redoBinding, undoBinding, listenerId, 'newValue');
	  }

	};

	module.exports = History;


/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @name Callback
	 * @namespace
	 * @classdesc Miscellaneous callback util functions.
	 */
	var Util = __webpack_require__(47);

	module.exports = {

	  /** Create callback used to set binding value on an event.
	   * @param {Binding} binding binding
	   * @param {String|Array} [subpath] subpath as a dot-separated string or an array of strings and numbers
	   * @param {Function} [f] value transformer
	   * @returns {Function} callback
	   * @memberOf Callback */
	  set: function (binding, subpath, f) {
	    var args = Util.resolveArgs(
	      arguments,
	      'binding', function (x) { return Util.canRepresentSubpath(x) ? 'subpath' : null; }, '?f'
	    );

	    return function (event) {
	      var value = event.target.value;
	      binding.set(args.subpath, args.f ? args.f(value) : value);
	    };
	  },

	  /** Create callback used to delete binding value on an event.
	   * @param {Binding} binding binding
	   * @param {String|String[]} [subpath] subpath as a dot-separated string or an array of strings and numbers
	   * @param {Function} [pred] predicate
	   * @returns {Function} callback
	   * @memberOf Callback */
	  remove: function (binding, subpath, pred) {
	    var args = Util.resolveArgs(
	      arguments,
	      'binding', function (x) { return Util.canRepresentSubpath(x) ? 'subpath' : null; }, '?pred'
	    );

	    return function (event) {
	      var value = event.target.value;
	      if (!args.pred || args.pred(value)) {
	        binding.remove(args.subpath);
	      }
	    };
	  },

	  /** Create callback invoked when specified key combination is pressed.
	   * @param {Function} cb callback
	   * @param {String|Array} key key
	   * @param {Boolean} [shiftKey] shift key flag
	   * @param {Boolean} [ctrlKey] ctrl key flag
	   * @returns {Function} callback
	   * @memberOf Callback */
	  onKey: function (cb, key, shiftKey, ctrlKey) {
	    var effectiveShiftKey = shiftKey || false;
	    var effectiveCtrlKey = ctrlKey || false;
	    return function (event) {
	      var keyMatched = typeof key === 'string' ?
	        event.key === key :
	        Util.find(key, function (k) { return k === event.key; });

	      if (keyMatched && event.shiftKey === effectiveShiftKey && event.ctrlKey === effectiveCtrlKey) {
	        cb(event);
	      }
	    };
	  },

	  /** Create callback invoked when enter key is pressed.
	   * @param {Function} cb callback
	   * @returns {Function} callback
	   * @memberOf Callback */
	  onEnter: function (cb) {
	    return this.onKey(cb, 'Enter');
	  },

	  /** Create callback invoked when escape key is pressed.
	   * @param {Function} cb callback
	   * @returns {Function} callback
	   * @memberOf Callback */
	  onEscape: function (cb) {
	    return this.onKey(cb, 'Escape');
	  }

	};

	module.exports['delete'] = module.exports.remove;


/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	var Util  = __webpack_require__(47);
	var React = __webpack_require__(2);

	var _ = (function() {
	  if (React) return React.DOM;
	  else {
	    throw new Error('Morearty: global variable React not found');
	  }
	})();

	var wrapComponent = function (comp, displayName) {
	  return React.createClass({

	    displayName: displayName,

	    getInitialState: function () {
	      return { value: this.props.value };
	    },

	    onChange: function (event) {
	      var handler = this.props.onChange;
	      if (handler) {
	        handler(event);
	        this.setState({ value: event.target.value });
	      }
	    },

	    componentWillReceiveProps: function (newProps) {
	      this.setState({ value: newProps.value });
	    },

	    render: function () {
	      var props = Util.assign({}, this.props, {
	        value: this.state.value,
	        onChange: this.onChange,
	        children: this.props.children
	      });
	      return comp(props);
	    }

	  });
	};

	/**
	 * @name DOM
	 * @namespace
	 * @classdesc DOM module. Exposes requestAnimationFrame-friendly wrappers around input, textarea, and option.
	 */
	var DOM = {

	  input: wrapComponent(_.input, 'input'),

	  textarea: wrapComponent(_.textarea, 'textarea'),

	  option: wrapComponent(_.option, 'option')

	};

	module.exports = DOM;


/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	exports.ActionMethods = __webpack_require__(129);

	exports.ListenerMethods = __webpack_require__(130);

	exports.PublisherMethods = __webpack_require__(131);

	exports.StoreMethods = __webpack_require__(132);

	exports.createAction = __webpack_require__(133);

	exports.createStore = __webpack_require__(134);

	exports.connect = __webpack_require__(135);

	exports.connectFilter = __webpack_require__(136);

	exports.ListenerMixin = __webpack_require__(137);

	exports.listenTo = __webpack_require__(138);

	exports.listenToMany = __webpack_require__(139);


	var maker = __webpack_require__(140).staticJoinCreator;

	exports.joinTrailing = exports.all = maker("last"); // Reflux.all alias for backward compatibility

	exports.joinLeading = maker("first");

	exports.joinStrict = maker("strict");

	exports.joinConcat = maker("all");

	var _ = __webpack_require__(141);

	exports.EventEmitter = _.EventEmitter;

	exports.Promise = _.Promise;

	/**
	 * Convenience function for creating a set of actions
	 *
	 * @param definitions the definitions for the actions to be created
	 * @returns an object with actions of corresponding action names
	 */
	exports.createActions = function(definitions) {
	    var actions = {};
	    for (var k in definitions){
	        if (definitions.hasOwnProperty(k)) {
	            var val = definitions[k],
	                actionName = _.isObject(val) ? k : val;

	            actions[actionName] = exports.createAction(val);
	        }
	    }
	    return actions;
	};

	/**
	 * Sets the eventmitter that Reflux uses
	 */
	exports.setEventEmitter = function(ctx) {
	    var _ = __webpack_require__(141);
	    exports.EventEmitter = _.EventEmitter = ctx;
	};


	/**
	 * Sets the Promise library that Reflux uses
	 */
	exports.setPromise = function(ctx) {
	    var _ = __webpack_require__(141);
	    exports.Promise = _.Promise = ctx;
	};


	/**
	 * Sets the Promise factory that creates new promises
	 * @param {Function} factory has the signature `function(resolver) { return [new Promise]; }`
	 */
	exports.setPromiseFactory = function(factory) {
	    var _ = __webpack_require__(141);
	    _.createPromise = factory;
	};


	/**
	 * Sets the method used for deferring actions and stores
	 */
	exports.nextTick = function(nextTick) {
	    var _ = __webpack_require__(141);
	    _.nextTick = nextTick;
	};

	/**
	 * Provides the set of created actions and stores for introspection
	 */
	exports.__keep = __webpack_require__(142);

	/**
	 * Warn if Function.prototype.bind not available
	 */
	if (!Function.prototype.bind) {
	  console.error(
	    'Function.prototype.bind not available. ' +
	    'ES5 shim required. ' +
	    'https://github.com/spoike/refluxjs#es5'
	  );
	}


/***/ },
/* 53 */,
/* 54 */,
/* 55 */,
/* 56 */,
/* 57 */,
/* 58 */,
/* 59 */,
/* 60 */,
/* 61 */,
/* 62 */,
/* 63 */,
/* 64 */,
/* 65 */,
/* 66 */,
/* 67 */,
/* 68 */,
/* 69 */,
/* 70 */,
/* 71 */,
/* 72 */,
/* 73 */,
/* 74 */,
/* 75 */,
/* 76 */,
/* 77 */,
/* 78 */,
/* 79 */,
/* 80 */,
/* 81 */,
/* 82 */,
/* 83 */,
/* 84 */,
/* 85 */,
/* 86 */,
/* 87 */,
/* 88 */,
/* 89 */,
/* 90 */,
/* 91 */,
/* 92 */,
/* 93 */,
/* 94 */,
/* 95 */,
/* 96 */,
/* 97 */,
/* 98 */,
/* 99 */,
/* 100 */,
/* 101 */,
/* 102 */,
/* 103 */,
/* 104 */,
/* 105 */,
/* 106 */,
/* 107 */,
/* 108 */,
/* 109 */,
/* 110 */,
/* 111 */,
/* 112 */,
/* 113 */,
/* 114 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactLink
	 * @typechecks static-only
	 */

	'use strict';

	/**
	 * ReactLink encapsulates a common pattern in which a component wants to modify
	 * a prop received from its parent. ReactLink allows the parent to pass down a
	 * value coupled with a callback that, when invoked, expresses an intent to
	 * modify that value. For example:
	 *
	 * React.createClass({
	 *   getInitialState: function() {
	 *     return {value: ''};
	 *   },
	 *   render: function() {
	 *     var valueLink = new ReactLink(this.state.value, this._handleValueChange);
	 *     return <input valueLink={valueLink} />;
	 *   },
	 *   this._handleValueChange: function(newValue) {
	 *     this.setState({value: newValue});
	 *   }
	 * });
	 *
	 * We have provided some sugary mixins to make the creation and
	 * consumption of ReactLink easier; see LinkedValueUtils and LinkedStateMixin.
	 */

	var React = __webpack_require__(8);

	/**
	 * @param {*} value current value of the link
	 * @param {function} requestChange callback to request a change
	 */
	function ReactLink(value, requestChange) {
	  this.value = value;
	  this.requestChange = requestChange;
	}

	/**
	 * Creates a PropType that enforces the ReactLink API and optionally checks the
	 * type of the value being passed inside the link. Example:
	 *
	 * MyComponent.propTypes = {
	 *   tabIndexLink: ReactLink.PropTypes.link(React.PropTypes.number)
	 * }
	 */
	function createLinkTypeChecker(linkType) {
	  var shapes = {
	    value: typeof linkType === 'undefined' ?
	      React.PropTypes.any.isRequired :
	      linkType.isRequired,
	    requestChange: React.PropTypes.func.isRequired
	  };
	  return React.PropTypes.shape(shapes);
	}

	ReactLink.PropTypes = {
	  link: createLinkTypeChecker
	};

	module.exports = ReactLink;


/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactStateSetters
	 */

	'use strict';

	var ReactStateSetters = {
	  /**
	   * Returns a function that calls the provided function, and uses the result
	   * of that to set the component's state.
	   *
	   * @param {ReactCompositeComponent} component
	   * @param {function} funcReturningState Returned callback uses this to
	   *                                      determine how to update state.
	   * @return {function} callback that when invoked uses funcReturningState to
	   *                    determined the object literal to setState.
	   */
	  createStateSetter: function(component, funcReturningState) {
	    return function(a, b, c, d, e, f) {
	      var partialState = funcReturningState.call(component, a, b, c, d, e, f);
	      if (partialState) {
	        component.setState(partialState);
	      }
	    };
	  },

	  /**
	   * Returns a single-argument callback that can be used to update a single
	   * key in the component's state.
	   *
	   * Note: this is memoized function, which makes it inexpensive to call.
	   *
	   * @param {ReactCompositeComponent} component
	   * @param {string} key The key in the state that you should update.
	   * @return {function} callback of 1 argument which calls setState() with
	   *                    the provided keyName and callback argument.
	   */
	  createStateKeySetter: function(component, key) {
	    // Memoize the setters.
	    var cache = component.__keySetters || (component.__keySetters = {});
	    return cache[key] || (cache[key] = createStateKeySetter(component, key));
	  }
	};

	function createStateKeySetter(component, key) {
	  // Partial state is allocated outside of the function closure so it can be
	  // reused with every call, avoiding memory allocation when this function
	  // is called.
	  var partialState = {};
	  return function stateKeySetter(value) {
	    partialState[key] = value;
	    component.setState(partialState);
	  };
	}

	ReactStateSetters.Mixin = {
	  /**
	   * Returns a function that calls the provided function, and uses the result
	   * of that to set the component's state.
	   *
	   * For example, these statements are equivalent:
	   *
	   *   this.setState({x: 1});
	   *   this.createStateSetter(function(xValue) {
	   *     return {x: xValue};
	   *   })(1);
	   *
	   * @param {function} funcReturningState Returned callback uses this to
	   *                                      determine how to update state.
	   * @return {function} callback that when invoked uses funcReturningState to
	   *                    determined the object literal to setState.
	   */
	  createStateSetter: function(funcReturningState) {
	    return ReactStateSetters.createStateSetter(this, funcReturningState);
	  },

	  /**
	   * Returns a single-argument callback that can be used to update a single
	   * key in the component's state.
	   *
	   * For example, these statements are equivalent:
	   *
	   *   this.setState({x: 1});
	   *   this.createStateKeySetter('x')(1);
	   *
	   * Note: this is memoized function, which makes it inexpensive to call.
	   *
	   * @param {string} key The key in the state that you should update.
	   * @return {function} callback of 1 argument which calls setState() with
	   *                    the provided keyName and callback argument.
	   */
	  createStateKeySetter: function(key) {
	    return ReactStateSetters.createStateKeySetter(this, key);
	  }
	};

	module.exports = ReactStateSetters;


/***/ },
/* 116 */,
/* 117 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @typechecks
	 * @providesModule ReactCSSTransitionGroupChild
	 */

	'use strict';

	var React = __webpack_require__(8);

	var CSSCore = __webpack_require__(177);
	var ReactTransitionEvents = __webpack_require__(178);

	var onlyChild = __webpack_require__(31);
	var warning = __webpack_require__(57);

	// We don't remove the element from the DOM until we receive an animationend or
	// transitionend event. If the user screws up and forgets to add an animation
	// their node will be stuck in the DOM forever, so we detect if an animation
	// does not start and if it doesn't, we just call the end listener immediately.
	var TICK = 17;
	var NO_EVENT_TIMEOUT = 5000;

	var noEventListener = null;


	if ("production" !== process.env.NODE_ENV) {
	  noEventListener = function() {
	    ("production" !== process.env.NODE_ENV ? warning(
	      false,
	      'transition(): tried to perform an animation without ' +
	      'an animationend or transitionend event after timeout (' +
	      '%sms). You should either disable this ' +
	      'transition in JS or add a CSS animation/transition.',
	      NO_EVENT_TIMEOUT
	    ) : null);
	  };
	}

	var ReactCSSTransitionGroupChild = React.createClass({
	  displayName: 'ReactCSSTransitionGroupChild',

	  transition: function(animationType, finishCallback) {
	    var node = this.getDOMNode();
	    var className = this.props.name + '-' + animationType;
	    var activeClassName = className + '-active';
	    var noEventTimeout = null;

	    var endListener = function(e) {
	      if (e && e.target !== node) {
	        return;
	      }
	      if ("production" !== process.env.NODE_ENV) {
	        clearTimeout(noEventTimeout);
	      }

	      CSSCore.removeClass(node, className);
	      CSSCore.removeClass(node, activeClassName);

	      ReactTransitionEvents.removeEndEventListener(node, endListener);

	      // Usually this optional callback is used for informing an owner of
	      // a leave animation and telling it to remove the child.
	      if (finishCallback) {
	        finishCallback();
	      }
	    };

	    ReactTransitionEvents.addEndEventListener(node, endListener);

	    CSSCore.addClass(node, className);

	    // Need to do this to actually trigger a transition.
	    this.queueClass(activeClassName);

	    if ("production" !== process.env.NODE_ENV) {
	      noEventTimeout = setTimeout(noEventListener, NO_EVENT_TIMEOUT);
	    }
	  },

	  queueClass: function(className) {
	    this.classNameQueue.push(className);

	    if (!this.timeout) {
	      this.timeout = setTimeout(this.flushClassNameQueue, TICK);
	    }
	  },

	  flushClassNameQueue: function() {
	    if (this.isMounted()) {
	      this.classNameQueue.forEach(
	        CSSCore.addClass.bind(CSSCore, this.getDOMNode())
	      );
	    }
	    this.classNameQueue.length = 0;
	    this.timeout = null;
	  },

	  componentWillMount: function() {
	    this.classNameQueue = [];
	  },

	  componentWillUnmount: function() {
	    if (this.timeout) {
	      clearTimeout(this.timeout);
	    }
	  },

	  componentWillAppear: function(done) {
	    if (this.props.appear) {
	      this.transition('appear', done);
	    } else {
	      done();
	    }
	  },

	  componentWillEnter: function(done) {
	    if (this.props.enter) {
	      this.transition('enter', done);
	    } else {
	      done();
	    }
	  },

	  componentWillLeave: function(done) {
	    if (this.props.leave) {
	      this.transition('leave', done);
	    } else {
	      done();
	    }
	  },

	  render: function() {
	    return onlyChild(this.props.children);
	  }
	});

	module.exports = ReactCSSTransitionGroupChild;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(46)))

/***/ },
/* 118 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @typechecks static-only
	 * @providesModule ReactTransitionChildMapping
	 */

	'use strict';

	var ReactChildren = __webpack_require__(13);
	var ReactFragment = __webpack_require__(38);

	var ReactTransitionChildMapping = {
	  /**
	   * Given `this.props.children`, return an object mapping key to child. Just
	   * simple syntactic sugar around ReactChildren.map().
	   *
	   * @param {*} children `this.props.children`
	   * @return {object} Mapping of key to child
	   */
	  getChildMapping: function(children) {
	    if (!children) {
	      return children;
	    }
	    return ReactFragment.extract(ReactChildren.map(children, function(child) {
	      return child;
	    }));
	  },

	  /**
	   * When you're adding or removing children some may be added or removed in the
	   * same render pass. We want to show *both* since we want to simultaneously
	   * animate elements in and out. This function takes a previous set of keys
	   * and a new set of keys and merges them with its best guess of the correct
	   * ordering. In the future we may expose some of the utilities in
	   * ReactMultiChild to make this easy, but for now React itself does not
	   * directly have this concept of the union of prevChildren and nextChildren
	   * so we implement it here.
	   *
	   * @param {object} prev prev children as returned from
	   * `ReactTransitionChildMapping.getChildMapping()`.
	   * @param {object} next next children as returned from
	   * `ReactTransitionChildMapping.getChildMapping()`.
	   * @return {object} a key set that contains all keys in `prev` and all keys
	   * in `next` in a reasonable order.
	   */
	  mergeChildMappings: function(prev, next) {
	    prev = prev || {};
	    next = next || {};

	    function getValueForKey(key) {
	      if (next.hasOwnProperty(key)) {
	        return next[key];
	      } else {
	        return prev[key];
	      }
	    }

	    // For each key of `next`, the list of keys to insert before that key in
	    // the combined list
	    var nextKeysPending = {};

	    var pendingKeys = [];
	    for (var prevKey in prev) {
	      if (next.hasOwnProperty(prevKey)) {
	        if (pendingKeys.length) {
	          nextKeysPending[prevKey] = pendingKeys;
	          pendingKeys = [];
	        }
	      } else {
	        pendingKeys.push(prevKey);
	      }
	    }

	    var i;
	    var childMapping = {};
	    for (var nextKey in next) {
	      if (nextKeysPending.hasOwnProperty(nextKey)) {
	        for (i = 0; i < nextKeysPending[nextKey].length; i++) {
	          var pendingNextKey = nextKeysPending[nextKey][i];
	          childMapping[nextKeysPending[nextKey][i]] = getValueForKey(
	            pendingNextKey
	          );
	        }
	      }
	      childMapping[nextKey] = getValueForKey(nextKey);
	    }

	    // Finally, add the keys which didn't appear before any key in `next`
	    for (i = 0; i < pendingKeys.length; i++) {
	      childMapping[pendingKeys[i]] = getValueForKey(pendingKeys[i]);
	    }

	    return childMapping;
	  }
	};

	module.exports = ReactTransitionChildMapping;


/***/ },
/* 119 */,
/* 120 */,
/* 121 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactPropTransferer
	 */

	'use strict';

	var assign = __webpack_require__(29);
	var emptyFunction = __webpack_require__(110);
	var joinClasses = __webpack_require__(179);

	/**
	 * Creates a transfer strategy that will merge prop values using the supplied
	 * `mergeStrategy`. If a prop was previously unset, this just sets it.
	 *
	 * @param {function} mergeStrategy
	 * @return {function}
	 */
	function createTransferStrategy(mergeStrategy) {
	  return function(props, key, value) {
	    if (!props.hasOwnProperty(key)) {
	      props[key] = value;
	    } else {
	      props[key] = mergeStrategy(props[key], value);
	    }
	  };
	}

	var transferStrategyMerge = createTransferStrategy(function(a, b) {
	  // `merge` overrides the first object's (`props[key]` above) keys using the
	  // second object's (`value`) keys. An object's style's existing `propA` would
	  // get overridden. Flip the order here.
	  return assign({}, b, a);
	});

	/**
	 * Transfer strategies dictate how props are transferred by `transferPropsTo`.
	 * NOTE: if you add any more exceptions to this list you should be sure to
	 * update `cloneWithProps()` accordingly.
	 */
	var TransferStrategies = {
	  /**
	   * Never transfer `children`.
	   */
	  children: emptyFunction,
	  /**
	   * Transfer the `className` prop by merging them.
	   */
	  className: createTransferStrategy(joinClasses),
	  /**
	   * Transfer the `style` prop (which is an object) by merging them.
	   */
	  style: transferStrategyMerge
	};

	/**
	 * Mutates the first argument by transferring the properties from the second
	 * argument.
	 *
	 * @param {object} props
	 * @param {object} newProps
	 * @return {object}
	 */
	function transferInto(props, newProps) {
	  for (var thisKey in newProps) {
	    if (!newProps.hasOwnProperty(thisKey)) {
	      continue;
	    }

	    var transferStrategy = TransferStrategies[thisKey];

	    if (transferStrategy && TransferStrategies.hasOwnProperty(thisKey)) {
	      transferStrategy(props, thisKey, newProps[thisKey]);
	    } else if (!props.hasOwnProperty(thisKey)) {
	      props[thisKey] = newProps[thisKey];
	    }
	  }
	  return props;
	}

	/**
	 * ReactPropTransferer are capable of transferring props to another component
	 * using a `transferPropsTo` method.
	 *
	 * @class ReactPropTransferer
	 */
	var ReactPropTransferer = {

	  /**
	   * Merge two props objects using TransferStrategies.
	   *
	   * @param {object} oldProps original props (they take precedence)
	   * @param {object} newProps new props to merge in
	   * @return {object} a new object containing both sets of props merged.
	   */
	  mergeProps: function(oldProps, newProps) {
	    return transferInto(assign({}, oldProps), newProps);
	  }

	};

	module.exports = ReactPropTransferer;


/***/ },
/* 122 */,
/* 123 */,
/* 124 */,
/* 125 */,
/* 126 */,
/* 127 */,
/* 128 */
/***/ function(module, exports, __webpack_require__) {

	/** Changes descriptor constructor.
	 * @param {Array} path absolute changed path
	 * @param {Array} listenerPath absolute listener path
	 * @param {Boolean} valueChanged value changed flag
	 * @param {Immutable.Map} previousValue previous backing value
	 * @param {Immutable.Map} previousMeta previous meta binding backing value
	 * @public
	 * @class ChangesDescriptor
	 * @classdesc Encapsulates binding changes for binding listeners. */
	var ChangesDescriptor =
	  function (path, listenerPath, valueChanged, previousValue, previousMeta) {
	    /** @private */
	    this._path = path;
	    /** @private */
	    this._listenerPath = listenerPath;
	    /** @private */
	    this._valueChanged = valueChanged;
	    /** @private */
	    this._previousValue = previousValue;
	    /** @private */
	    this._previousMeta = previousMeta;
	  };

	ChangesDescriptor.prototype = Object.freeze( /** @lends ChangesDescriptor.prototype */ {

	  /** Get changed path relative to binding's path listener was installed on.
	   * @return {Array} changed path */
	  getPath: function () {
	    var listenerPathLen = this._listenerPath.length;
	    return listenerPathLen === this._path.length ? [] : this._path.slice(listenerPathLen);
	  },

	  /** Check if binding's value was changed.
	   * @returns {Boolean} */
	  isValueChanged: function () {
	    return this._valueChanged;
	  },

	  /** Check if meta binding's value was changed.
	   * @returns {Boolean} */
	  isMetaChanged: function () {
	    return !!this._previousMeta;
	  },

	  /** Get previous value at listening path.
	   * @returns {*} previous value at listening path or null if not changed */
	  getPreviousValue: function () {
	    return this._previousValue && this._previousValue.getIn(this._listenerPath);
	  },

	  /** Get previous backing value.
	   * @protected
	   * @returns {*} */
	  getPreviousBackingValue: function () {
	    return this._previousValue;
	  },

	  /** Get previous meta at listening path.
	   * @returns {*} */
	  getPreviousMeta: function () {
	    return this._previousMeta && this._previousMeta.getIn(this._listenerPath);
	  },

	  /** Get previous backing meta value.
	   * @protected
	   * @returns {*} */
	  getPreviousBackingMeta: function () {
	    return this._previousMeta;
	  }

	});

	module.exports = ChangesDescriptor;


/***/ },
/* 129 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A module of methods that you want to include in all actions.
	 * This module is consumed by `createAction`.
	 */
	module.exports = {
	};


/***/ },
/* 130 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(141),
	    maker = __webpack_require__(140).instanceJoinCreator;

	/**
	 * Extract child listenables from a parent from their
	 * children property and return them in a keyed Object
	 *
	 * @param {Object} listenable The parent listenable
	 */
	var mapChildListenables = function(listenable) {
	    var i = 0, children = {}, childName;
	    for (;i < (listenable.children||[]).length; ++i) {
	        childName = listenable.children[i];
	        if(listenable[childName]){
	            children[childName] = listenable[childName];
	        }
	    }
	    return children;
	};

	/**
	 * Make a flat dictionary of all listenables including their
	 * possible children (recursively), concatenating names in camelCase.
	 *
	 * @param {Object} listenables The top-level listenables
	 */
	var flattenListenables = function(listenables) {
	    var flattened = {};
	    for(var key in listenables){
	        var listenable = listenables[key];
	        var childMap = mapChildListenables(listenable);

	        // recursively flatten children
	        var children = flattenListenables(childMap);

	        // add the primary listenable and chilren
	        flattened[key] = listenable;
	        for(var childKey in children){
	            var childListenable = children[childKey];
	            flattened[key + _.capitalize(childKey)] = childListenable;
	        }
	    }

	    return flattened;
	};

	/**
	 * A module of methods related to listening.
	 */
	module.exports = {

	    /**
	     * An internal utility function used by `validateListening`
	     *
	     * @param {Action|Store} listenable The listenable we want to search for
	     * @returns {Boolean} The result of a recursive search among `this.subscriptions`
	     */
	    hasListener: function(listenable) {
	        var i = 0, j, listener, listenables;
	        for (;i < (this.subscriptions||[]).length; ++i) {
	            listenables = [].concat(this.subscriptions[i].listenable);
	            for (j = 0; j < listenables.length; j++){
	                listener = listenables[j];
	                if (listener === listenable || listener.hasListener && listener.hasListener(listenable)) {
	                    return true;
	                }
	            }
	        }
	        return false;
	    },

	    /**
	     * A convenience method that listens to all listenables in the given object.
	     *
	     * @param {Object} listenables An object of listenables. Keys will be used as callback method names.
	     */
	    listenToMany: function(listenables){
	        var allListenables = flattenListenables(listenables);
	        for(var key in allListenables){
	            var cbname = _.callbackName(key),
	                localname = this[cbname] ? cbname : this[key] ? key : undefined;
	            if (localname){
	                this.listenTo(allListenables[key],localname,this[cbname+"Default"]||this[localname+"Default"]||localname);
	            }
	        }
	    },

	    /**
	     * Checks if the current context can listen to the supplied listenable
	     *
	     * @param {Action|Store} listenable An Action or Store that should be
	     *  listened to.
	     * @returns {String|Undefined} An error message, or undefined if there was no problem.
	     */
	    validateListening: function(listenable){
	        if (listenable === this) {
	            return "Listener is not able to listen to itself";
	        }
	        if (!_.isFunction(listenable.listen)) {
	            return listenable + " is missing a listen method";
	        }
	        if (listenable.hasListener && listenable.hasListener(this)) {
	            return "Listener cannot listen to this listenable because of circular loop";
	        }
	    },

	    /**
	     * Sets up a subscription to the given listenable for the context object
	     *
	     * @param {Action|Store} listenable An Action or Store that should be
	     *  listened to.
	     * @param {Function|String} callback The callback to register as event handler
	     * @param {Function|String} defaultCallback The callback to register as default handler
	     * @returns {Object} A subscription obj where `stop` is an unsub function and `listenable` is the object being listened to
	     */
	    listenTo: function(listenable, callback, defaultCallback) {
	        var desub, unsubscriber, subscriptionobj, subs = this.subscriptions = this.subscriptions || [];
	        _.throwIf(this.validateListening(listenable));
	        this.fetchInitialState(listenable, defaultCallback);
	        desub = listenable.listen(this[callback]||callback, this);
	        unsubscriber = function() {
	            var index = subs.indexOf(subscriptionobj);
	            _.throwIf(index === -1,'Tried to remove listen already gone from subscriptions list!');
	            subs.splice(index, 1);
	            desub();
	        };
	        subscriptionobj = {
	            stop: unsubscriber,
	            listenable: listenable
	        };
	        subs.push(subscriptionobj);
	        return subscriptionobj;
	    },

	    /**
	     * Stops listening to a single listenable
	     *
	     * @param {Action|Store} listenable The action or store we no longer want to listen to
	     * @returns {Boolean} True if a subscription was found and removed, otherwise false.
	     */
	    stopListeningTo: function(listenable){
	        var sub, i = 0, subs = this.subscriptions || [];
	        for(;i < subs.length; i++){
	            sub = subs[i];
	            if (sub.listenable === listenable){
	                sub.stop();
	                _.throwIf(subs.indexOf(sub)!==-1,'Failed to remove listen from subscriptions list!');
	                return true;
	            }
	        }
	        return false;
	    },

	    /**
	     * Stops all subscriptions and empties subscriptions array
	     */
	    stopListeningToAll: function(){
	        var remaining, subs = this.subscriptions || [];
	        while((remaining=subs.length)){
	            subs[0].stop();
	            _.throwIf(subs.length!==remaining-1,'Failed to remove listen from subscriptions list!');
	        }
	    },

	    /**
	     * Used in `listenTo`. Fetches initial data from a publisher if it has a `getInitialState` method.
	     * @param {Action|Store} listenable The publisher we want to get initial state from
	     * @param {Function|String} defaultCallback The method to receive the data
	     */
	    fetchInitialState: function (listenable, defaultCallback) {
	        defaultCallback = (defaultCallback && this[defaultCallback]) || defaultCallback;
	        var me = this;
	        if (_.isFunction(defaultCallback) && _.isFunction(listenable.getInitialState)) {
	            var data = listenable.getInitialState();
	            if (data && _.isFunction(data.then)) {
	                data.then(function() {
	                    defaultCallback.apply(me, arguments);
	                });
	            } else {
	                defaultCallback.call(this, data);
	            }
	        }
	    },

	    /**
	     * The callback will be called once all listenables have triggered at least once.
	     * It will be invoked with the last emission from each listenable.
	     * @param {...Publishers} publishers Publishers that should be tracked.
	     * @param {Function|String} callback The method to call when all publishers have emitted
	     * @returns {Object} A subscription obj where `stop` is an unsub function and `listenable` is an array of listenables
	     */
	    joinTrailing: maker("last"),

	    /**
	     * The callback will be called once all listenables have triggered at least once.
	     * It will be invoked with the first emission from each listenable.
	     * @param {...Publishers} publishers Publishers that should be tracked.
	     * @param {Function|String} callback The method to call when all publishers have emitted
	     * @returns {Object} A subscription obj where `stop` is an unsub function and `listenable` is an array of listenables
	     */
	    joinLeading: maker("first"),

	    /**
	     * The callback will be called once all listenables have triggered at least once.
	     * It will be invoked with all emission from each listenable.
	     * @param {...Publishers} publishers Publishers that should be tracked.
	     * @param {Function|String} callback The method to call when all publishers have emitted
	     * @returns {Object} A subscription obj where `stop` is an unsub function and `listenable` is an array of listenables
	     */
	    joinConcat: maker("all"),

	    /**
	     * The callback will be called once all listenables have triggered.
	     * If a callback triggers twice before that happens, an error is thrown.
	     * @param {...Publishers} publishers Publishers that should be tracked.
	     * @param {Function|String} callback The method to call when all publishers have emitted
	     * @returns {Object} A subscription obj where `stop` is an unsub function and `listenable` is an array of listenables
	     */
	    joinStrict: maker("strict")
	};


/***/ },
/* 131 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(141);

	/**
	 * A module of methods for object that you want to be able to listen to.
	 * This module is consumed by `createStore` and `createAction`
	 */
	module.exports = {

	    /**
	     * Hook used by the publisher that is invoked before emitting
	     * and before `shouldEmit`. The arguments are the ones that the action
	     * is invoked with. If this function returns something other than
	     * undefined, that will be passed on as arguments for shouldEmit and
	     * emission.
	     */
	    preEmit: function() {},

	    /**
	     * Hook used by the publisher after `preEmit` to determine if the
	     * event should be emitted with given arguments. This may be overridden
	     * in your application, default implementation always returns true.
	     *
	     * @returns {Boolean} true if event should be emitted
	     */
	    shouldEmit: function() { return true; },

	    /**
	     * Subscribes the given callback for action triggered
	     *
	     * @param {Function} callback The callback to register as event handler
	     * @param {Mixed} [optional] bindContext The context to bind the callback with
	     * @returns {Function} Callback that unsubscribes the registered event handler
	     */
	    listen: function(callback, bindContext) {
	        bindContext = bindContext || this;
	        var eventHandler = function(args) {
	            if (aborted){
	                return;
	            }
	            callback.apply(bindContext, args);
	        }, me = this, aborted = false;
	        this.emitter.addListener(this.eventLabel, eventHandler);
	        return function() {
	            aborted = true;
	            me.emitter.removeListener(me.eventLabel, eventHandler);
	        };
	    },

	    /**
	     * Attach handlers to promise that trigger the completed and failed
	     * child publishers, if available.
	     *
	     * @param {Object} The promise to attach to
	     */
	    promise: function(promise) {
	        var me = this;

	        var canHandlePromise =
	            this.children.indexOf('completed') >= 0 &&
	            this.children.indexOf('failed') >= 0;

	        if (!canHandlePromise){
	            throw new Error('Publisher must have "completed" and "failed" child publishers');
	        }

	        promise.then(function(response) {
	            return me.completed(response);
	        }, function(error) {
	            return me.failed(error);
	        });
	    },

	    /**
	     * Subscribes the given callback for action triggered, which should
	     * return a promise that in turn is passed to `this.promise`
	     *
	     * @param {Function} callback The callback to register as event handler
	     */
	    listenAndPromise: function(callback, bindContext) {
	        var me = this;
	        bindContext = bindContext || this;
	        this.willCallPromise = (this.willCallPromise || 0) + 1;

	        var removeListen = this.listen(function() {

	            if (!callback) {
	                throw new Error('Expected a function returning a promise but got ' + callback);
	            }

	            var args = arguments,
	                promise = callback.apply(bindContext, args);
	            return me.promise.call(me, promise);
	        }, bindContext);

	        return function () {
	          me.willCallPromise--;
	          removeListen.call(me);
	        };

	    },

	    /**
	     * Publishes an event using `this.emitter` (if `shouldEmit` agrees)
	     */
	    trigger: function() {
	        var args = arguments,
	            pre = this.preEmit.apply(this, args);
	        args = pre === undefined ? args : _.isArguments(pre) ? pre : [].concat(pre);
	        if (this.shouldEmit.apply(this, args)) {
	            this.emitter.emit(this.eventLabel, args);
	        }
	    },

	    /**
	     * Tries to publish the event on the next tick
	     */
	    triggerAsync: function(){
	        var args = arguments,me = this;
	        _.nextTick(function() {
	            me.trigger.apply(me, args);
	        });
	    },

	    /**
	     * Returns a Promise for the triggered action
	     *
	     * @return {Promise}
	     *   Resolved by completed child action.
	     *   Rejected by failed child action.
	     *   If listenAndPromise'd, then promise associated to this trigger.
	     *   Otherwise, the promise is for next child action completion.
	     */
	    triggerPromise: function(){
	        var me = this;
	        var args = arguments;

	        var canHandlePromise =
	            this.children.indexOf('completed') >= 0 &&
	            this.children.indexOf('failed') >= 0;

	        var promise = _.createPromise(function(resolve, reject) {
	            // If `listenAndPromise` is listening
	            // patch `promise` w/ context-loaded resolve/reject
	            if (me.willCallPromise) {
	                _.nextTick(function() {
	                    var old_promise_method = me.promise;
	                    me.promise = function (promise) {
	                        promise.then(resolve, reject);
	                        // Back to your regularly schedule programming.
	                        me.promise = old_promise_method;
	                        return me.promise.apply(me, arguments);
	                    };
	                    me.trigger.apply(me, args);
	                });
	                return;
	            }

	            if (canHandlePromise) {
	                var removeSuccess = me.completed.listen(function(args) {
	                    removeSuccess();
	                    removeFailed();
	                    resolve(args);
	                });

	                var removeFailed = me.failed.listen(function(args) {
	                    removeSuccess();
	                    removeFailed();
	                    reject(args);
	                });
	            }

	            me.triggerAsync.apply(me, args);

	            if (!canHandlePromise) {
	                resolve();
	            }
	        });

	        return promise;
	    }
	};


/***/ },
/* 132 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * A module of methods that you want to include in all stores.
	 * This module is consumed by `createStore`.
	 */
	module.exports = {
	};


/***/ },
/* 133 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(141),
	    Reflux = __webpack_require__(52),
	    Keep = __webpack_require__(142),
	    allowed = {preEmit:1,shouldEmit:1};

	/**
	 * Creates an action functor object. It is mixed in with functions
	 * from the `PublisherMethods` mixin. `preEmit` and `shouldEmit` may
	 * be overridden in the definition object.
	 *
	 * @param {Object} definition The action object definition
	 */
	var createAction = function(definition) {

	    definition = definition || {};
	    if (!_.isObject(definition)){
	        definition = {actionName: definition};
	    }

	    for(var a in Reflux.ActionMethods){
	        if (!allowed[a] && Reflux.PublisherMethods[a]) {
	            throw new Error("Cannot override API method " + a +
	                " in Reflux.ActionMethods. Use another method name or override it on Reflux.PublisherMethods instead."
	            );
	        }
	    }

	    for(var d in definition){
	        if (!allowed[d] && Reflux.PublisherMethods[d]) {
	            throw new Error("Cannot override API method " + d +
	                " in action creation. Use another method name or override it on Reflux.PublisherMethods instead."
	            );
	        }
	    }

	    definition.children = definition.children || [];
	    if (definition.asyncResult){
	        definition.children = definition.children.concat(["completed","failed"]);
	    }

	    var i = 0, childActions = {};
	    for (; i < definition.children.length; i++) {
	        var name = definition.children[i];
	        childActions[name] = createAction(name);
	    }

	    var context = _.extend({
	        eventLabel: "action",
	        emitter: new _.EventEmitter(),
	        _isAction: true
	    }, Reflux.PublisherMethods, Reflux.ActionMethods, definition);

	    var functor = function() {
	        return functor[functor.sync?"trigger":"triggerPromise"].apply(functor, arguments);
	    };

	    _.extend(functor,childActions,context);

	    Keep.createdActions.push(functor);

	    return functor;

	};

	module.exports = createAction;


/***/ },
/* 134 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(141),
	    Reflux = __webpack_require__(52),
	    Keep = __webpack_require__(142),
	    mixer = __webpack_require__(183),
	    allowed = {preEmit:1,shouldEmit:1},
	    bindMethods = __webpack_require__(184);

	/**
	 * Creates an event emitting Data Store. It is mixed in with functions
	 * from the `ListenerMethods` and `PublisherMethods` mixins. `preEmit`
	 * and `shouldEmit` may be overridden in the definition object.
	 *
	 * @param {Object} definition The data store object definition
	 * @returns {Store} A data store instance
	 */
	module.exports = function(definition) {

	    definition = definition || {};

	    for(var a in Reflux.StoreMethods){
	        if (!allowed[a] && (Reflux.PublisherMethods[a] || Reflux.ListenerMethods[a])){
	            throw new Error("Cannot override API method " + a +
	                " in Reflux.StoreMethods. Use another method name or override it on Reflux.PublisherMethods / Reflux.ListenerMethods instead."
	            );
	        }
	    }

	    for(var d in definition){
	        if (!allowed[d] && (Reflux.PublisherMethods[d] || Reflux.ListenerMethods[d])){
	            throw new Error("Cannot override API method " + d +
	                " in store creation. Use another method name or override it on Reflux.PublisherMethods / Reflux.ListenerMethods instead."
	            );
	        }
	    }

	    definition = mixer(definition);

	    function Store() {
	        var i=0, arr;
	        this.subscriptions = [];
	        this.emitter = new _.EventEmitter();
	        this.eventLabel = "change";
	        bindMethods(this, definition);
	        if (this.init && _.isFunction(this.init)) {
	            this.init();
	        }
	        if (this.listenables){
	            arr = [].concat(this.listenables);
	            for(;i < arr.length;i++){
	                this.listenToMany(arr[i]);
	            }
	        }
	    }

	    _.extend(Store.prototype, Reflux.ListenerMethods, Reflux.PublisherMethods, Reflux.StoreMethods, definition);

	    var store = new Store();
	    Keep.createdStores.push(store);

	    return store;
	};


/***/ },
/* 135 */
/***/ function(module, exports, __webpack_require__) {

	var Reflux = __webpack_require__(52),
	    _ = __webpack_require__(141);

	module.exports = function(listenable,key){
	    return {
	        getInitialState: function(){
	            if (!_.isFunction(listenable.getInitialState)) {
	                return {};
	            } else if (key === undefined) {
	                return listenable.getInitialState();
	            } else {
	                return _.object([key],[listenable.getInitialState()]);
	            }
	        },
	        componentDidMount: function(){
	            _.extend(this,Reflux.ListenerMethods);
	            var me = this, cb = (key === undefined ? this.setState : function(v){me.setState(_.object([key],[v]));});
	            this.listenTo(listenable,cb);
	        },
	        componentWillUnmount: Reflux.ListenerMixin.componentWillUnmount
	    };
	};


/***/ },
/* 136 */
/***/ function(module, exports, __webpack_require__) {

	var Reflux = __webpack_require__(52),
	  _ = __webpack_require__(141);

	module.exports = function(listenable, key, filterFunc) {
	    filterFunc = _.isFunction(key) ? key : filterFunc;
	    return {
	        getInitialState: function() {
	            if (!_.isFunction(listenable.getInitialState)) {
	                return {};
	            } else if (_.isFunction(key)) {
	                return filterFunc.call(this, listenable.getInitialState());
	            } else {
	                // Filter initial payload from store.
	                var result = filterFunc.call(this, listenable.getInitialState());
	                if (result) {
	                  return _.object([key], [result]);
	                } else {
	                  return {};
	                }
	            }
	        },
	        componentDidMount: function() {
	            _.extend(this, Reflux.ListenerMethods);
	            var me = this;
	            var cb = function(value) {
	                if (_.isFunction(key)) {
	                    me.setState(filterFunc.call(me, value));
	                } else {
	                    var result = filterFunc.call(me, value);
	                    me.setState(_.object([key], [result]));
	                }
	            };

	            this.listenTo(listenable, cb);
	        },
	        componentWillUnmount: Reflux.ListenerMixin.componentWillUnmount
	    };
	};



/***/ },
/* 137 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(141),
	    ListenerMethods = __webpack_require__(130);

	/**
	 * A module meant to be consumed as a mixin by a React component. Supplies the methods from
	 * `ListenerMethods` mixin and takes care of teardown of subscriptions.
	 * Note that if you're using the `connect` mixin you don't need this mixin, as connect will
	 * import everything this mixin contains!
	 */
	module.exports = _.extend({

	    /**
	     * Cleans up all listener previously registered.
	     */
	    componentWillUnmount: ListenerMethods.stopListeningToAll

	}, ListenerMethods);


/***/ },
/* 138 */
/***/ function(module, exports, __webpack_require__) {

	var Reflux = __webpack_require__(52);


	/**
	 * A mixin factory for a React component. Meant as a more convenient way of using the `ListenerMixin`,
	 * without having to manually set listeners in the `componentDidMount` method.
	 *
	 * @param {Action|Store} listenable An Action or Store that should be
	 *  listened to.
	 * @param {Function|String} callback The callback to register as event handler
	 * @param {Function|String} defaultCallback The callback to register as default handler
	 * @returns {Object} An object to be used as a mixin, which sets up the listener for the given listenable.
	 */
	module.exports = function(listenable,callback,initial){
	    return {
	        /**
	         * Set up the mixin before the initial rendering occurs. Import methods from `ListenerMethods`
	         * and then make the call to `listenTo` with the arguments provided to the factory function
	         */
	        componentDidMount: function() {
	            for(var m in Reflux.ListenerMethods){
	                if (this[m] !== Reflux.ListenerMethods[m]){
	                    if (this[m]){
	                        throw "Can't have other property '"+m+"' when using Reflux.listenTo!";
	                    }
	                    this[m] = Reflux.ListenerMethods[m];
	                }
	            }
	            this.listenTo(listenable,callback,initial);
	        },
	        /**
	         * Cleans up all listener previously registered.
	         */
	        componentWillUnmount: Reflux.ListenerMethods.stopListeningToAll
	    };
	};


/***/ },
/* 139 */
/***/ function(module, exports, __webpack_require__) {

	var Reflux = __webpack_require__(52);

	/**
	 * A mixin factory for a React component. Meant as a more convenient way of using the `listenerMixin`,
	 * without having to manually set listeners in the `componentDidMount` method. This version is used
	 * to automatically set up a `listenToMany` call.
	 *
	 * @param {Object} listenables An object of listenables
	 * @returns {Object} An object to be used as a mixin, which sets up the listeners for the given listenables.
	 */
	module.exports = function(listenables){
	    return {
	        /**
	         * Set up the mixin before the initial rendering occurs. Import methods from `ListenerMethods`
	         * and then make the call to `listenTo` with the arguments provided to the factory function
	         */
	        componentDidMount: function() {
	            for(var m in Reflux.ListenerMethods){
	                if (this[m] !== Reflux.ListenerMethods[m]){
	                    if (this[m]){
	                        throw "Can't have other property '"+m+"' when using Reflux.listenToMany!";
	                    }
	                    this[m] = Reflux.ListenerMethods[m];
	                }
	            }
	            this.listenToMany(listenables);
	        },
	        /**
	         * Cleans up all listener previously registered.
	         */
	        componentWillUnmount: Reflux.ListenerMethods.stopListeningToAll
	    };
	};


/***/ },
/* 140 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Internal module used to create static and instance join methods
	 */

	var slice = Array.prototype.slice,
	    _ = __webpack_require__(141),
	    createStore = __webpack_require__(134),
	    strategyMethodNames = {
	        strict: "joinStrict",
	        first: "joinLeading",
	        last: "joinTrailing",
	        all: "joinConcat"
	    };

	/**
	 * Used in `index.js` to create the static join methods
	 * @param {String} strategy Which strategy to use when tracking listenable trigger arguments
	 * @returns {Function} A static function which returns a store with a join listen on the given listenables using the given strategy
	 */
	exports.staticJoinCreator = function(strategy){
	    return function(/* listenables... */) {
	        var listenables = slice.call(arguments);
	        return createStore({
	            init: function(){
	                this[strategyMethodNames[strategy]].apply(this,listenables.concat("triggerAsync"));
	            }
	        });
	    };
	};

	/**
	 * Used in `ListenerMethods.js` to create the instance join methods
	 * @param {String} strategy Which strategy to use when tracking listenable trigger arguments
	 * @returns {Function} An instance method which sets up a join listen on the given listenables using the given strategy
	 */
	exports.instanceJoinCreator = function(strategy){
	    return function(/* listenables..., callback*/){
	        _.throwIf(arguments.length < 3,'Cannot create a join with less than 2 listenables!');
	        var listenables = slice.call(arguments),
	            callback = listenables.pop(),
	            numberOfListenables = listenables.length,
	            join = {
	                numberOfListenables: numberOfListenables,
	                callback: this[callback]||callback,
	                listener: this,
	                strategy: strategy
	            }, i, cancels = [], subobj;
	        for (i = 0; i < numberOfListenables; i++) {
	            _.throwIf(this.validateListening(listenables[i]));
	        }
	        for (i = 0; i < numberOfListenables; i++) {
	            cancels.push(listenables[i].listen(newListener(i,join),this));
	        }
	        reset(join);
	        subobj = {listenable: listenables};
	        subobj.stop = makeStopper(subobj,cancels,this);
	        this.subscriptions = (this.subscriptions || []).concat(subobj);
	        return subobj;
	    };
	};

	// ---- internal join functions ----

	function makeStopper(subobj,cancels,context){
	    return function() {
	        var i, subs = context.subscriptions,
	            index = (subs ? subs.indexOf(subobj) : -1);
	        _.throwIf(index === -1,'Tried to remove join already gone from subscriptions list!');
	        for(i=0;i < cancels.length; i++){
	            cancels[i]();
	        }
	        subs.splice(index, 1);
	    };
	}

	function reset(join) {
	    join.listenablesEmitted = new Array(join.numberOfListenables);
	    join.args = new Array(join.numberOfListenables);
	}

	function newListener(i,join) {
	    return function() {
	        var callargs = slice.call(arguments);
	        if (join.listenablesEmitted[i]){
	            switch(join.strategy){
	                case "strict": throw new Error("Strict join failed because listener triggered twice.");
	                case "last": join.args[i] = callargs; break;
	                case "all": join.args[i].push(callargs);
	            }
	        } else {
	            join.listenablesEmitted[i] = true;
	            join.args[i] = (join.strategy==="all"?[callargs]:callargs);
	        }
	        emitIfAllListenablesEmitted(join);
	    };
	}

	function emitIfAllListenablesEmitted(join) {
	    for (var i = 0; i < join.numberOfListenables; i++) {
	        if (!join.listenablesEmitted[i]) {
	            return;
	        }
	    }
	    join.callback.apply(join.listener,join.args);
	    reset(join);
	}


/***/ },
/* 141 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * isObject, extend, isFunction, isArguments are taken from undescore/lodash in
	 * order to remove the dependency
	 */
	var isObject = exports.isObject = function(obj) {
	    var type = typeof obj;
	    return type === 'function' || type === 'object' && !!obj;
	};

	exports.extend = function(obj) {
	    if (!isObject(obj)) {
	        return obj;
	    }
	    var source, prop;
	    for (var i = 1, length = arguments.length; i < length; i++) {
	        source = arguments[i];
	        for (prop in source) {
	            if (Object.getOwnPropertyDescriptor && Object.defineProperty) {
	                var propertyDescriptor = Object.getOwnPropertyDescriptor(source, prop);
	                Object.defineProperty(obj, prop, propertyDescriptor);
	            } else {
	                obj[prop] = source[prop];
	            }
	        }
	    }
	    return obj;
	};

	exports.isFunction = function(value) {
	    return typeof value === 'function';
	};

	exports.EventEmitter = __webpack_require__(199);

	exports.nextTick = function(callback) {
	    setTimeout(callback, 0);
	};

	exports.capitalize = function(string){
	    return string.charAt(0).toUpperCase()+string.slice(1);
	};

	exports.callbackName = function(string){
	    return "on"+exports.capitalize(string);
	};

	exports.object = function(keys,vals){
	    var o={}, i=0;
	    for(;i<keys.length;i++){
	        o[keys[i]] = vals[i];
	    }
	    return o;
	};

	exports.Promise = __webpack_require__(200);

	exports.createPromise = function(resolver) {
	    return new exports.Promise(resolver);
	};

	exports.isArguments = function(value) {
	    return typeof value === 'object' && ('callee' in value) && typeof value.length === 'number';
	};

	exports.throwIf = function(val,msg){
	    if (val){
	        throw Error(msg||val);
	    }
	};


/***/ },
/* 142 */
/***/ function(module, exports, __webpack_require__) {

	exports.createdStores = [];

	exports.createdActions = [];

	exports.reset = function() {
	    while(exports.createdStores.length) {
	        exports.createdStores.pop();
	    }
	    while(exports.createdActions.length) {
	        exports.createdActions.pop();
	    }
	};


/***/ },
/* 143 */,
/* 144 */,
/* 145 */,
/* 146 */,
/* 147 */,
/* 148 */,
/* 149 */,
/* 150 */,
/* 151 */,
/* 152 */,
/* 153 */,
/* 154 */,
/* 155 */,
/* 156 */,
/* 157 */,
/* 158 */,
/* 159 */,
/* 160 */,
/* 161 */,
/* 162 */,
/* 163 */,
/* 164 */,
/* 165 */,
/* 166 */,
/* 167 */,
/* 168 */,
/* 169 */,
/* 170 */,
/* 171 */,
/* 172 */,
/* 173 */,
/* 174 */,
/* 175 */,
/* 176 */,
/* 177 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule CSSCore
	 * @typechecks
	 */

	var invariant = __webpack_require__(54);

	/**
	 * The CSSCore module specifies the API (and implements most of the methods)
	 * that should be used when dealing with the display of elements (via their
	 * CSS classes and visibility on screen. It is an API focused on mutating the
	 * display and not reading it as no logical state should be encoded in the
	 * display of elements.
	 */

	var CSSCore = {

	  /**
	   * Adds the class passed in to the element if it doesn't already have it.
	   *
	   * @param {DOMElement} element the element to set the class on
	   * @param {string} className the CSS className
	   * @return {DOMElement} the element passed in
	   */
	  addClass: function(element, className) {
	    ("production" !== process.env.NODE_ENV ? invariant(
	      !/\s/.test(className),
	      'CSSCore.addClass takes only a single class name. "%s" contains ' +
	      'multiple classes.', className
	    ) : invariant(!/\s/.test(className)));

	    if (className) {
	      if (element.classList) {
	        element.classList.add(className);
	      } else if (!CSSCore.hasClass(element, className)) {
	        element.className = element.className + ' ' + className;
	      }
	    }
	    return element;
	  },

	  /**
	   * Removes the class passed in from the element
	   *
	   * @param {DOMElement} element the element to set the class on
	   * @param {string} className the CSS className
	   * @return {DOMElement} the element passed in
	   */
	  removeClass: function(element, className) {
	    ("production" !== process.env.NODE_ENV ? invariant(
	      !/\s/.test(className),
	      'CSSCore.removeClass takes only a single class name. "%s" contains ' +
	      'multiple classes.', className
	    ) : invariant(!/\s/.test(className)));

	    if (className) {
	      if (element.classList) {
	        element.classList.remove(className);
	      } else if (CSSCore.hasClass(element, className)) {
	        element.className = element.className
	          .replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)', 'g'), '$1')
	          .replace(/\s+/g, ' ') // multiple spaces to one
	          .replace(/^\s*|\s*$/g, ''); // trim the ends
	      }
	    }
	    return element;
	  },

	  /**
	   * Helper to add or remove a class from an element based on a condition.
	   *
	   * @param {DOMElement} element the element to set the class on
	   * @param {string} className the CSS className
	   * @param {*} bool condition to whether to add or remove the class
	   * @return {DOMElement} the element passed in
	   */
	  conditionClass: function(element, className, bool) {
	    return (bool ? CSSCore.addClass : CSSCore.removeClass)(element, className);
	  },

	  /**
	   * Tests whether the element has the class specified.
	   *
	   * @param {DOMNode|DOMWindow} element the element to set the class on
	   * @param {string} className the CSS className
	   * @return {boolean} true if the element has the class, false if not
	   */
	  hasClass: function(element, className) {
	    ("production" !== process.env.NODE_ENV ? invariant(
	      !/\s/.test(className),
	      'CSS.hasClass takes only a single class name.'
	    ) : invariant(!/\s/.test(className)));
	    if (element.classList) {
	      return !!className && element.classList.contains(className);
	    }
	    return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
	  }

	};

	module.exports = CSSCore;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(46)))

/***/ },
/* 178 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule ReactTransitionEvents
	 */

	'use strict';

	var ExecutionEnvironment = __webpack_require__(32);

	/**
	 * EVENT_NAME_MAP is used to determine which event fired when a
	 * transition/animation ends, based on the style property used to
	 * define that event.
	 */
	var EVENT_NAME_MAP = {
	  transitionend: {
	    'transition': 'transitionend',
	    'WebkitTransition': 'webkitTransitionEnd',
	    'MozTransition': 'mozTransitionEnd',
	    'OTransition': 'oTransitionEnd',
	    'msTransition': 'MSTransitionEnd'
	  },

	  animationend: {
	    'animation': 'animationend',
	    'WebkitAnimation': 'webkitAnimationEnd',
	    'MozAnimation': 'mozAnimationEnd',
	    'OAnimation': 'oAnimationEnd',
	    'msAnimation': 'MSAnimationEnd'
	  }
	};

	var endEvents = [];

	function detectEvents() {
	  var testEl = document.createElement('div');
	  var style = testEl.style;

	  // On some platforms, in particular some releases of Android 4.x,
	  // the un-prefixed "animation" and "transition" properties are defined on the
	  // style object but the events that fire will still be prefixed, so we need
	  // to check if the un-prefixed events are useable, and if not remove them
	  // from the map
	  if (!('AnimationEvent' in window)) {
	    delete EVENT_NAME_MAP.animationend.animation;
	  }

	  if (!('TransitionEvent' in window)) {
	    delete EVENT_NAME_MAP.transitionend.transition;
	  }

	  for (var baseEventName in EVENT_NAME_MAP) {
	    var baseEvents = EVENT_NAME_MAP[baseEventName];
	    for (var styleName in baseEvents) {
	      if (styleName in style) {
	        endEvents.push(baseEvents[styleName]);
	        break;
	      }
	    }
	  }
	}

	if (ExecutionEnvironment.canUseDOM) {
	  detectEvents();
	}

	// We use the raw {add|remove}EventListener() call because EventListener
	// does not know how to remove event listeners and we really should
	// clean up. Also, these events are not triggered in older browsers
	// so we should be A-OK here.

	function addEventListener(node, eventName, eventListener) {
	  node.addEventListener(eventName, eventListener, false);
	}

	function removeEventListener(node, eventName, eventListener) {
	  node.removeEventListener(eventName, eventListener, false);
	}

	var ReactTransitionEvents = {
	  addEndEventListener: function(node, eventListener) {
	    if (endEvents.length === 0) {
	      // If CSS transitions are not supported, trigger an "end animation"
	      // event immediately.
	      window.setTimeout(eventListener, 0);
	      return;
	    }
	    endEvents.forEach(function(endEvent) {
	      addEventListener(node, endEvent, eventListener);
	    });
	  },

	  removeEndEventListener: function(node, eventListener) {
	    if (endEvents.length === 0) {
	      return;
	    }
	    endEvents.forEach(function(endEvent) {
	      removeEventListener(node, endEvent, eventListener);
	    });
	  }
	};

	module.exports = ReactTransitionEvents;


/***/ },
/* 179 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright 2013-2015, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 *
	 * @providesModule joinClasses
	 * @typechecks static-only
	 */

	'use strict';

	/**
	 * Combines multiple className strings into one.
	 * http://jsperf.com/joinclasses-args-vs-array
	 *
	 * @param {...?string} classes
	 * @return {string}
	 */
	function joinClasses(className/*, ... */) {
	  if (!className) {
	    className = '';
	  }
	  var nextClass;
	  var argLength = arguments.length;
	  if (argLength > 1) {
	    for (var ii = 1; ii < argLength; ii++) {
	      nextClass = arguments[ii];
	      if (nextClass) {
	        className = (className ? className + ' ' : '') + nextClass;
	      }
	    }
	  }
	  return className;
	}

	module.exports = joinClasses;


/***/ },
/* 180 */,
/* 181 */,
/* 182 */,
/* 183 */
/***/ function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(141);

	module.exports = function mix(def) {
	    var composed = {
	        init: [],
	        preEmit: [],
	        shouldEmit: []
	    };

	    var updated = (function mixDef(mixin) {
	        var mixed = {};
	        if (mixin.mixins) {
	            mixin.mixins.forEach(function (subMixin) {
	                _.extend(mixed, mixDef(subMixin));
	            });
	        }
	        _.extend(mixed, mixin);
	        Object.keys(composed).forEach(function (composable) {
	            if (mixin.hasOwnProperty(composable)) {
	                composed[composable].push(mixin[composable]);
	            }
	        });
	        return mixed;
	    }(def));

	    if (composed.init.length > 1) {
	        updated.init = function () {
	            var args = arguments;
	            composed.init.forEach(function (init) {
	                init.apply(this, args);
	            }, this);
	        };
	    }
	    if (composed.preEmit.length > 1) {
	        updated.preEmit = function () {
	            return composed.preEmit.reduce(function (args, preEmit) {
	                var newValue = preEmit.apply(this, args);
	                return newValue === undefined ? args : [newValue];
	            }.bind(this), arguments);
	        };
	    }
	    if (composed.shouldEmit.length > 1) {
	        updated.shouldEmit = function () {
	            var args = arguments;
	            return !composed.shouldEmit.some(function (shouldEmit) {
	                return !shouldEmit.apply(this, args);
	            }, this);
	        };
	    }
	    Object.keys(composed).forEach(function (composable) {
	        if (composed[composable].length === 1) {
	            updated[composable] = composed[composable][0];
	        }
	    });

	    return updated;
	};


/***/ },
/* 184 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function(store, definition) {
	  for (var name in definition) {
	    if (Object.getOwnPropertyDescriptor && Object.defineProperty) {
	        var propertyDescriptor = Object.getOwnPropertyDescriptor(definition, name);

	        if (!propertyDescriptor.value || typeof propertyDescriptor.value !== 'function' || !definition.hasOwnProperty(name)) {
	            continue;
	        }

	        store[name] = definition[name].bind(store);
	    } else {
	        var property = definition[name];

	        if (typeof property !== 'function' || !definition.hasOwnProperty(name)) {
	            continue;
	        }

	        store[name] = property.bind(store);
	    }
	  }

	  return store;
	};


/***/ },
/* 185 */,
/* 186 */,
/* 187 */,
/* 188 */,
/* 189 */,
/* 190 */,
/* 191 */,
/* 192 */,
/* 193 */,
/* 194 */,
/* 195 */,
/* 196 */,
/* 197 */,
/* 198 */,
/* 199 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/**
	 * Representation of a single EventEmitter function.
	 *
	 * @param {Function} fn Event handler to be called.
	 * @param {Mixed} context Context for function execution.
	 * @param {Boolean} once Only emit once
	 * @api private
	 */
	function EE(fn, context, once) {
	  this.fn = fn;
	  this.context = context;
	  this.once = once || false;
	}

	/**
	 * Minimal EventEmitter interface that is molded against the Node.js
	 * EventEmitter interface.
	 *
	 * @constructor
	 * @api public
	 */
	function EventEmitter() { /* Nothing to set */ }

	/**
	 * Holds the assigned EventEmitters by name.
	 *
	 * @type {Object}
	 * @private
	 */
	EventEmitter.prototype._events = undefined;

	/**
	 * Return a list of assigned event listeners.
	 *
	 * @param {String} event The events that should be listed.
	 * @returns {Array}
	 * @api public
	 */
	EventEmitter.prototype.listeners = function listeners(event) {
	  if (!this._events || !this._events[event]) return [];
	  if (this._events[event].fn) return [this._events[event].fn];

	  for (var i = 0, l = this._events[event].length, ee = new Array(l); i < l; i++) {
	    ee[i] = this._events[event][i].fn;
	  }

	  return ee;
	};

	/**
	 * Emit an event to all registered event listeners.
	 *
	 * @param {String} event The name of the event.
	 * @returns {Boolean} Indication if we've emitted an event.
	 * @api public
	 */
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
	  if (!this._events || !this._events[event]) return false;

	  var listeners = this._events[event]
	    , len = arguments.length
	    , args
	    , i;

	  if ('function' === typeof listeners.fn) {
	    if (listeners.once) this.removeListener(event, listeners.fn, true);

	    switch (len) {
	      case 1: return listeners.fn.call(listeners.context), true;
	      case 2: return listeners.fn.call(listeners.context, a1), true;
	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
	    }

	    for (i = 1, args = new Array(len -1); i < len; i++) {
	      args[i - 1] = arguments[i];
	    }

	    listeners.fn.apply(listeners.context, args);
	  } else {
	    var length = listeners.length
	      , j;

	    for (i = 0; i < length; i++) {
	      if (listeners[i].once) this.removeListener(event, listeners[i].fn, true);

	      switch (len) {
	        case 1: listeners[i].fn.call(listeners[i].context); break;
	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
	        default:
	          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
	            args[j - 1] = arguments[j];
	          }

	          listeners[i].fn.apply(listeners[i].context, args);
	      }
	    }
	  }

	  return true;
	};

	/**
	 * Register a new EventListener for the given event.
	 *
	 * @param {String} event Name of the event.
	 * @param {Functon} fn Callback function.
	 * @param {Mixed} context The context of the function.
	 * @api public
	 */
	EventEmitter.prototype.on = function on(event, fn, context) {
	  var listener = new EE(fn, context || this);

	  if (!this._events) this._events = {};
	  if (!this._events[event]) this._events[event] = listener;
	  else {
	    if (!this._events[event].fn) this._events[event].push(listener);
	    else this._events[event] = [
	      this._events[event], listener
	    ];
	  }

	  return this;
	};

	/**
	 * Add an EventListener that's only called once.
	 *
	 * @param {String} event Name of the event.
	 * @param {Function} fn Callback function.
	 * @param {Mixed} context The context of the function.
	 * @api public
	 */
	EventEmitter.prototype.once = function once(event, fn, context) {
	  var listener = new EE(fn, context || this, true);

	  if (!this._events) this._events = {};
	  if (!this._events[event]) this._events[event] = listener;
	  else {
	    if (!this._events[event].fn) this._events[event].push(listener);
	    else this._events[event] = [
	      this._events[event], listener
	    ];
	  }

	  return this;
	};

	/**
	 * Remove event listeners.
	 *
	 * @param {String} event The event we want to remove.
	 * @param {Function} fn The listener that we need to find.
	 * @param {Boolean} once Only remove once listeners.
	 * @api public
	 */
	EventEmitter.prototype.removeListener = function removeListener(event, fn, once) {
	  if (!this._events || !this._events[event]) return this;

	  var listeners = this._events[event]
	    , events = [];

	  if (fn) {
	    if (listeners.fn && (listeners.fn !== fn || (once && !listeners.once))) {
	      events.push(listeners);
	    }
	    if (!listeners.fn) for (var i = 0, length = listeners.length; i < length; i++) {
	      if (listeners[i].fn !== fn || (once && !listeners[i].once)) {
	        events.push(listeners[i]);
	      }
	    }
	  }

	  //
	  // Reset the array, or remove it completely if we have no more listeners.
	  //
	  if (events.length) {
	    this._events[event] = events.length === 1 ? events[0] : events;
	  } else {
	    delete this._events[event];
	  }

	  return this;
	};

	/**
	 * Remove all listeners or only the listeners for the specified event.
	 *
	 * @param {String} event The event want to remove all listeners for.
	 * @api public
	 */
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
	  if (!this._events) return this;

	  if (event) delete this._events[event];
	  else this._events = {};

	  return this;
	};

	//
	// Alias methods names because people roll like that.
	//
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	//
	// This function doesn't apply anymore.
	//
	EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
	  return this;
	};

	//
	// Expose the module.
	//
	EventEmitter.EventEmitter = EventEmitter;
	EventEmitter.EventEmitter2 = EventEmitter;
	EventEmitter.EventEmitter3 = EventEmitter;

	//
	// Expose the module.
	//
	module.exports = EventEmitter;


/***/ },
/* 200 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(global, setImmediate) {/*! Native Promise Only
	    v0.7.6-a (c) Kyle Simpson
	    MIT License: http://getify.mit-license.org
	*/
	!function(t,n,e){n[t]=n[t]||e(),"undefined"!=typeof module&&module.exports?module.exports=n[t]:"function"=="function"&&__webpack_require__(209)&&!(__WEBPACK_AMD_DEFINE_RESULT__ = function(){return n[t]}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))}("Promise","undefined"!=typeof global?global:this,function(){"use strict";function t(t,n){l.add(t,n),h||(h=y(l.drain))}function n(t){var n,e=typeof t;return null==t||"object"!=e&&"function"!=e||(n=t.then),"function"==typeof n?n:!1}function e(){for(var t=0;t<this.chain.length;t++)o(this,1===this.state?this.chain[t].success:this.chain[t].failure,this.chain[t]);this.chain.length=0}function o(t,e,o){var r,i;try{e===!1?o.reject(t.msg):(r=e===!0?t.msg:e.call(void 0,t.msg),r===o.promise?o.reject(TypeError("Promise-chain cycle")):(i=n(r))?i.call(r,o.resolve,o.reject):o.resolve(r))}catch(c){o.reject(c)}}function r(o){var c,u,a=this;if(!a.triggered){a.triggered=!0,a.def&&(a=a.def);try{(c=n(o))?(u=new f(a),c.call(o,function(){r.apply(u,arguments)},function(){i.apply(u,arguments)})):(a.msg=o,a.state=1,a.chain.length>0&&t(e,a))}catch(s){i.call(u||new f(a),s)}}}function i(n){var o=this;o.triggered||(o.triggered=!0,o.def&&(o=o.def),o.msg=n,o.state=2,o.chain.length>0&&t(e,o))}function c(t,n,e,o){for(var r=0;r<n.length;r++)!function(r){t.resolve(n[r]).then(function(t){e(r,t)},o)}(r)}function f(t){this.def=t,this.triggered=!1}function u(t){this.promise=t,this.state=0,this.triggered=!1,this.chain=[],this.msg=void 0}function a(n){if("function"!=typeof n)throw TypeError("Not a function");if(0!==this.__NPO__)throw TypeError("Not a promise");this.__NPO__=1;var o=new u(this);this.then=function(n,r){var i={success:"function"==typeof n?n:!0,failure:"function"==typeof r?r:!1};return i.promise=new this.constructor(function(t,n){if("function"!=typeof t||"function"!=typeof n)throw TypeError("Not a function");i.resolve=t,i.reject=n}),o.chain.push(i),0!==o.state&&t(e,o),i.promise},this["catch"]=function(t){return this.then(void 0,t)};try{n.call(void 0,function(t){r.call(o,t)},function(t){i.call(o,t)})}catch(c){i.call(o,c)}}var s,h,l,p=Object.prototype.toString,y="undefined"!=typeof setImmediate?function(t){return setImmediate(t)}:setTimeout;try{Object.defineProperty({},"x",{}),s=function(t,n,e,o){return Object.defineProperty(t,n,{value:e,writable:!0,configurable:o!==!1})}}catch(d){s=function(t,n,e){return t[n]=e,t}}l=function(){function t(t,n){this.fn=t,this.self=n,this.next=void 0}var n,e,o;return{add:function(r,i){o=new t(r,i),e?e.next=o:n=o,e=o,o=void 0},drain:function(){var t=n;for(n=e=h=void 0;t;)t.fn.call(t.self),t=t.next}}}();var g=s({},"constructor",a,!1);return s(a,"prototype",g,!1),s(g,"__NPO__",0,!1),s(a,"resolve",function(t){var n=this;return t&&"object"==typeof t&&1===t.__NPO__?t:new n(function(n,e){if("function"!=typeof n||"function"!=typeof e)throw TypeError("Not a function");n(t)})}),s(a,"reject",function(t){return new this(function(n,e){if("function"!=typeof n||"function"!=typeof e)throw TypeError("Not a function");e(t)})}),s(a,"all",function(t){var n=this;return"[object Array]"!=p.call(t)?n.reject(TypeError("Not an array")):0===t.length?n.resolve([]):new n(function(e,o){if("function"!=typeof e||"function"!=typeof o)throw TypeError("Not a function");var r=t.length,i=Array(r),f=0;c(n,t,function(t,n){i[t]=n,++f===r&&e(i)},o)})}),s(a,"race",function(t){var n=this;return"[object Array]"!=p.call(t)?n.reject(TypeError("Not an array")):new n(function(e,o){if("function"!=typeof e||"function"!=typeof o)throw TypeError("Not a function");c(n,t,function(t,n){e(n)},o)})}),a});

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(208).setImmediate))

/***/ },
/* 201 */,
/* 202 */,
/* 203 */,
/* 204 */,
/* 205 */,
/* 206 */,
/* 207 */,
/* 208 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(46).nextTick;
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
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(208).setImmediate, __webpack_require__(208).clearImmediate))

/***/ },
/* 209 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {module.exports = __webpack_amd_options__;

	/* WEBPACK VAR INJECTION */}.call(exports, {}))

/***/ }
]);