webpackJsonp([0],{

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },

/***/ 1:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var React = __webpack_require__(10);
	var Morearty = __webpack_require__(2);

	var mui = __webpack_require__(8);
	var AppCanvas = React.createFactory(mui.AppCanvas);
	var AppBar = React.createFactory(mui.AppBar);

	var List = React.createFactory(__webpack_require__(11).List);
	var History = React.createFactory(__webpack_require__(12));

	// Needed for onTouchTap Can go away when react 1.0 release
	// Check this repo: https://github.com/zilverline/react-tap-event-plugin
	var injectTapEventPlugin = __webpack_require__(14);
	injectTapEventPlugin();

	var stores = __webpack_require__(13);

	var ROM = React.DOM;

	__webpack_require__(30);


	var App = React.createClass({
	  displayname: 'app',
	  mixins: [Morearty.Mixin],
	  render: function() {
	    var binding = this.getDefaultBinding();
	    return AppCanvas({predefinedLayout: 1}, [
	      AppBar({key: "bar", zDepth: 0, title: "Tasks"}),
	      ROM.div({key: "content", className: "page-with-nav-contents"}, [
	        // History({key: "history", binding: binding}),
	        List({key: "list", binding: binding})
	      ])
	    ]);
	  }
	});

	var Bootstrap = React.createFactory(stores.Ctx.bootstrap(App));
	React.render(Bootstrap(), document.body);


/***/ },

/***/ 11:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var React = __webpack_require__(10);
	var Morearty = __webpack_require__(2);
	var ROM = React.DOM;

	var sortTypes = __webpack_require__(33);
	var DragDropMixin = __webpack_require__(17).DragDropMixin;

	var mui = __webpack_require__(8);
	var FlatButton = React.createFactory(mui.FlatButton);

	var Input = React.createFactory(__webpack_require__(34));
	// var Input = React.createFactory(Morearty.DOM.input);

	var stores = __webpack_require__(13);
	var actions = stores.actions;

	var Item = React.createClass({
	  displayName: 'Item',
	  mixins: [DragDropMixin, Morearty.Mixin],
	  statics: {
	    configureDragDrop: function(register) {
	      register(sortTypes.todoItem, {
	        dragSource: {
	          beginDrag: function(component) {
	            return {
	              item: {
	                id: component.props.id
	              }
	            };
	          }
	        },
	        dropTarget: {
	          over: function(component, item) {
	            actions.move(component.props.id, item.id);
	          }
	        }
	      });
	    }
	  },

	  focus: function() {
	    var ctx = this.getMoreartyContext();

	    if(this.props.selected) {
	      this.refs.input.focus();
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
	    var shift = event.shiftKey;

	    var binding = this.getDefaultBinding();
	    var item = binding.get();

	    if(key === "Enter") {
	      actions.add("");
	    } else if(key === "ArrowUp") {
	      if(shift) {
	        actions.sortUp(this.props.id);
	      } else {
	        actions.prev();
	      }
	      event.preventDefault();
	    } else if(key === "ArrowDown") {
	      if(shift) {
	        actions.sortDown(this.props.id);
	      } else {
	        actions.next();
	      }
	      event.preventDefault();
	    } else if(key === "Backspace" || key === "Delete") {
	      if(!item || item.get("title") === "") {
	        if(key === "Backspace")
	          actions.prev();
	        else
	          actions.next();
	        actions.remove(this.props.id);
	      }
	    }
	  },
	  onFocus: function(event) {
	    var binding = this.getDefaultBinding();
	    actions.select(this.props.id);
	  },
	  onPaste: function(event) {
	    var binding = this.getDefaultBinding();

	    event.clipboardData.items[0].getAsString(function(string) {
	      var strings = string.trim().split("\n");
	      var first = strings.shift();
	      actions.update(this.props.id, binding.get("title") + first);
	      strings.map(function(val) {
	        actions.add(val);
	      });
	    });
	    event.preventDefault();
	  },
	  onChangeItem: function(event) {
	    var title = event.target.value;
	    actions.update(this.props.id, title);
	  },
	  render: function() {
	    var binding = this.getDefaultBinding();
	    var item = binding.get();

	    var dragProps = this.dragSourceFor(sortTypes.todoItem);
	    var dropProps = this.dropTargetFor(sortTypes.todoItem);
	    var isDragging = this.getDragState(sortTypes.todoItem).isDragging;
	    var props = Morearty.Util.assign({}, this.props, dropProps, dragProps, {
	      style: {
	        opacity: isDragging ? 0.1 : 1
	      }
	    });

	    return ROM.div(props, [
	      // mui.Checkbox(),
	      Input({
	        key: "input",
	        ref: "input",
	        className: "task-input",
	        hintText: "Add some task..",
	        onPaste: this.onPaste,
	        onFocus: this.onFocus,
	        onKeyDown: this.onKeyDown,
	        onChange: this.onChangeItem,
	        value: item ? item.get("title") : ""
	      })
	    ]);
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
	    var sortingBinding = binding.sub('sorting.order');
	    var itemsBinding = binding.sub('items');

	    var items = itemsBinding.get();
	    var sorting = sortingBinding.get();

	    var list = sorting.map(function(id) {
	      var itemBinding = itemsBinding.sub(id);

	      return ROM.li({key: id}, ItemFactory({
	        id: id,
	        key: id,
	        selected: selected === id,
	        binding: itemBinding,
	        onKeyPress: this.onKeyPress
	      }));
	    }.bind(this));
	    return ROM.div(null, [
	      ROM.ul({key: "list"}, list.toArray()),
	      FlatButton({key: "link", label: "Add New Task", onClick: this.onAdd})
	    ]);
	  }
	});


	module.exports.List = List;


/***/ },

/***/ 12:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var React = __webpack_require__(10);
	var Morearty = __webpack_require__(2);

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
	        Morearty.History.undo(binding);
	      }}, "Undo"),
	      " - ",
	      ROM.a({key: "redo", href: "#", onClick: function() {
	        Morearty.History.redo(binding);
	      }}, "Redo")
	    ]);
	  }
	});

	module.exports = History;


/***/ },

/***/ 13:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var React = __webpack_require__(10);
	var Morearty = __webpack_require__(2);
	var Reflux = __webpack_require__(3);
	var Immutable = __webpack_require__(7);
	var PouchDB = __webpack_require__(6);
	var uuid = __webpack_require__(5);

	var state = {
	  selected: null,
	  items: {},
	  sorting: {
	    _id: "sorting",
	    doc_type: "sorting",
	    order: []
	  }
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
	  'move',
	  'sortUp',
	  'sortDown',
	  'next',
	  'prev'
	]);

	var fromCouch = function(val) {
	  return function() {
	    return val;
	  };
	};

	var ItemsStore = Reflux.createStore({
	  listenables: ItemsActions,

	  init: function() {
	    this.timeouts = {};

	    this.db = new PouchDB('todr_db');
	    this.db.sync("http://todr:enter@roger.iriscouch.com/todr", {live: true});
	    this.rootBinding = this.getMoreartyContext().getBinding();
	    this.itemsBinding = this.rootBinding.sub('items');
	    this.sortingBinding = this.rootBinding.sub('sorting');
	    this.orderBinding = this.sortingBinding.sub('order');
	    this.listenCouch();
	    this.listenBindings();
	  },

	  updateDoc: function(doc) {
	    var binding;
	    if(doc.doc_type === "item") {
	      binding = this.itemsBinding.sub(doc._id);
	    } else if(doc.doc_type === "sorting") {
	      binding = this.sortingBinding;
	    } else {
	      // console.log("ignored", doc);
	      return;
	    }
	    binding.atomically()
	      .set(Immutable.fromJS(doc))
	      .update(binding.meta(), 'fromCouch', fromCouch(true))
	      .commit();
	  },

	  eventuallyWrite: function(doc) {
	    console.log("WRITE", doc);
	    var docID = doc._id;
	    if(this.timeouts[docID]) {
	      clearTimeout(this.timeouts[docID]);
	      delete(this.timeouts[docID]);
	    }
	    this.timeouts[docID] = setTimeout(function() {
	      this.db.put(doc);
	      delete(this.timeouts[docID]);
	    }.bind(this), 1000);
	  },
	  listenBindings: function() {
	    var onChange = function(type, changes) {
	      if(!changes.isValueChanged()) return;

	      var path = changes.getPath();
	      var attr, binding;
	      if(type === "items") {
	        attr = path[1];
	        binding = this.itemsBinding.sub(path[0]);
	      } else {
	        attr = path[0];
	        binding =this.sortingBinding;
	      }

	      if(attr === "__meta__") return;

	      var fromCouch = binding.meta().get("fromCouch");
	      if(fromCouch || fromCouch === undefined) {
	        return;
	      }

	      if(type === "items") {
	        if(changes.getPath().length === 0) {
	          var prevBinding = changes.getPreviousValue();
	          var oldKeys = Object.keys(prevBinding.toObject());
	          var newKeys = Object.keys(this.itemsBinding.get().toObject());
	          var key;
	          oldKeys.map(function(key) {
	            if(newKeys.indexOf(key) === -1) {
	              var item = prevBinding.get(key);
	              this.eventuallyWrite(item.set("_deleted", true).toJS());
	            }
	          }.bind(this));

	          return;
	        }
	      }

	      this.eventuallyWrite(binding.toJS());
	    }.bind(this);

	    this.sortListenID = this.sortingBinding.addListener(function (changes) {
	      onChange("sorting", changes);
	    });

	    this.itemsListenID = this.itemsBinding.addListener(function (changes) {
	      onChange("items", changes);
	    });

	  },
	  listenCouch: function() {
	    var updateDoc = this.updateDoc;
	    var itemsBinding = this.itemsBinding;

	    // this.db.query("items/by_name", {include_docs: true}).then(function(resp) {
	    this.db.allDocs({include_docs: true}).then(function (resp) {
	      var rows = resp.rows;
	      rows.map(function(row) {
	        updateDoc(row.doc);
	      });

	      this._changes = this.db.changes({
	        // view: "products/by_name",
	        since: "now",
	        include_docs: true,
	        live: true
	      }).on('create', function(change) {
	        updateDoc(change.doc);
	      }).on('update', function(change) {
	        updateDoc(change.doc);
	      }.bind(this)).on('delete', function(change) {
	        var doc = change.doc;

	        var binding;
	        if(doc.doc_type === "item") {
	          var itemBinding = itemsBinding.sub(doc._id);
	          itemBinding.atomically()
	            .delete()
	            .update(itemBinding.meta(), 'fromCouch', fromCouch(true))
	            .commit();
	        } else {
	          var newOrder = this.orderBinding.get().delete(doc._id);
	          this.sortingBinding.atomically()
	            .set('order', newOrder)
	            .update(this.sortingBinding.meta(), 'fromCouch', fromCouch(true))
	            .commit();
	        }
	      }.bind(this));

	    }.bind(this));
	  },

	  findIndex: function(id) {
	    return this.orderBinding.get().indexOf(id);
	  },

	  onAdd: function (title, last) {
	    var id = uuid.v4();

	    var itemBinding = this.itemsBinding.sub(id);
	    itemBinding.atomically()
	      .set(Immutable.Map({
	        _id: id, doc_type: "item", title: title
	      }))
	      .update(itemBinding.meta(), 'fromCouch', fromCouch(false))
	      .commit();

	    var selectedIdx;
	    if(last) {
	      selectedIdx = this.itemsBinding.get().count();
	    } else {
	      var selected = this.rootBinding.get("selected");
	      selectedIdx = this.findIndex(selected);
	    }

	    this.updateSorting(id, selectedIdx);
	    this.rootBinding.set('selected', id);
	  },

	  updateSorting: function(id, selectedIdx){
	    var order = this.orderBinding.get();
	    var newOrder;
	    if(selectedIdx !== -1) {
	      newOrder = order.splice(selectedIdx+1, 0, id);
	    } else {
	      newOrder = order.push(id);
	    }

	    this.sortingBinding.atomically()
	      .set('order', newOrder)
	      .update(this.sortingBinding.meta(), 'fromCouch', fromCouch(false))
	      .commit();
	  },

	  onUpdate: function (id, title) {
	    var itemBinding = this.itemsBinding.sub(id);
	    itemBinding.atomically()
	      .set('title', title)
	      .update(itemBinding.meta(), 'fromCouch', fromCouch(false))
	      .commit();
	  },

	  onRemove: function (id) {
	    var sortingIndex = this.findIndex(id);
	    var itemBinding = this.itemsBinding.sub(sortingIndex);

	    var itemBinding = this.itemsBinding.sub(id);

	    itemBinding.atomically()
	      .delete()
	      .update(itemBinding.meta(), 'fromCouch', fromCouch(false))
	      .commit();
	    var newOrder = this.orderBinding.get().delete(sortingIndex);
	    this.sortingBinding.atomically()
	      .set('order', newOrder)
	      .update(this.sortingBinding.meta(), 'fromCouch', fromCouch(false))
	      .commit();
	  },

	  onSelect: function(id) {
	    this.rootBinding.set('selected', id);
	  },
	  onMove: function(id, afterID) {
	    var index = this.findIndex(id);
	    var afterIndex = this.findIndex(afterID);

	    var order = this.orderBinding.get();
	    var newOrder = order.splice(index, 1)
	                        .splice(afterIndex, 0, id);

	    this.sortingBinding.atomically()
	      .set('order', newOrder)
	      .update(this.sortingBinding.meta(), 'fromCouch', fromCouch(false))
	      .commit();
	  },
	  onSortUp: function(id) {
	    var index = this.findIndex(id);
	    if(index === 0)
	      index = this.orderBinding.get().count();
	    var afterID = this.orderBinding.get(index - 1);
	    this.onMove(id, afterID);
	  },
	  onSortDown: function(id) {
	    var index = this.findIndex(id);
	    if(index === this.orderBinding.get().count() - 1)
	      index = -1;
	    var afterID = this.orderBinding.get(index + 1);
	    this.onMove(id, afterID);
	  },
	  onNext: function() {
	    var selected = this.rootBinding.get("selected");
	    var selectedIdx = this.findIndex(selected);
	    // Loop
	    if(this.itemsBinding.get().count() === selectedIdx + 1)
	      selectedIdx = -1;
	    var newSelected = this.orderBinding.get(selectedIdx + 1);
	    this.rootBinding.set('selected', newSelected);
	  },
	  onPrev: function() {
	    var selected = this.rootBinding.get("selected");
	    var selectedIdx = this.findIndex(selected);
	    var newSelected = this.orderBinding.get(selectedIdx - 1);
	    this.rootBinding.set('selected', newSelected);
	  }
	});

	module.exports.Ctx = Ctx;
	module.exports.actions = ItemsActions;
	module.exports.store = ItemsStore;


/***/ },

/***/ 30:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(31);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(79)(content, {});
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		module.hot.accept("!!/home/roger/proyectos/gits/todr/node_modules/css-loader/index.js!/home/roger/proyectos/gits/todr/node_modules/less-loader/index.js?strictMath&cleancss!/home/roger/proyectos/gits/todr/app/style.less", function() {
			var newContent = require("!!/home/roger/proyectos/gits/todr/node_modules/css-loader/index.js!/home/roger/proyectos/gits/todr/node_modules/less-loader/index.js?strictMath&cleancss!/home/roger/proyectos/gits/todr/app/style.less");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 31:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(458)();
	exports.push([module.id, "/*! normalize.css v3.0.2 | MIT License | git.io/normalize */\n/**\n * 1. Set default font family to sans-serif.\n * 2. Prevent iOS text size adjust after orientation change, without disabling\n *    user zoom.\n */\nhtml {\n  font-family: sans-serif;\n  /* 1 */\n  -ms-text-size-adjust: 100%;\n  /* 2 */\n  -webkit-text-size-adjust: 100%;\n  /* 2 */\n}\n/**\n * Remove default margin.\n */\nbody {\n  margin: 0;\n}\n/* HTML5 display definitions\n   ========================================================================== */\n/**\n * Correct `block` display not defined for any HTML5 element in IE 8/9.\n * Correct `block` display not defined for `details` or `summary` in IE 10/11\n * and Firefox.\n * Correct `block` display not defined for `main` in IE 11.\n */\narticle,\naside,\ndetails,\nfigcaption,\nfigure,\nfooter,\nheader,\nhgroup,\nmain,\nmenu,\nnav,\nsection,\nsummary {\n  display: block;\n}\n/**\n * 1. Correct `inline-block` display not defined in IE 8/9.\n * 2. Normalize vertical alignment of `progress` in Chrome, Firefox, and Opera.\n */\naudio,\ncanvas,\nprogress,\nvideo {\n  display: inline-block;\n  /* 1 */\n  vertical-align: baseline;\n  /* 2 */\n}\n/**\n * Prevent modern browsers from displaying `audio` without controls.\n * Remove excess height in iOS 5 devices.\n */\naudio:not([controls]) {\n  display: none;\n  height: 0;\n}\n/**\n * Address `[hidden]` styling not present in IE 8/9/10.\n * Hide the `template` element in IE 8/9/11, Safari, and Firefox < 22.\n */\n[hidden],\ntemplate {\n  display: none;\n}\n/* Links\n   ========================================================================== */\n/**\n * Remove the gray background color from active links in IE 10.\n */\na {\n  background-color: transparent;\n}\n/**\n * Improve readability when focused and also mouse hovered in all browsers.\n */\na:active,\na:hover {\n  outline: 0;\n}\n/* Text-level semantics\n   ========================================================================== */\n/**\n * Address styling not present in IE 8/9/10/11, Safari, and Chrome.\n */\nabbr[title] {\n  border-bottom: 1px dotted;\n}\n/**\n * Address style set to `bolder` in Firefox 4+, Safari, and Chrome.\n */\nb,\nstrong {\n  font-weight: bold;\n}\n/**\n * Address styling not present in Safari and Chrome.\n */\ndfn {\n  font-style: italic;\n}\n/**\n * Address variable `h1` font-size and margin within `section` and `article`\n * contexts in Firefox 4+, Safari, and Chrome.\n */\nh1 {\n  font-size: 2em;\n  margin: 0.67em 0;\n}\n/**\n * Address styling not present in IE 8/9.\n */\nmark {\n  background: #ff0;\n  color: #000;\n}\n/**\n * Address inconsistent and variable font size in all browsers.\n */\nsmall {\n  font-size: 80%;\n}\n/**\n * Prevent `sub` and `sup` affecting `line-height` in all browsers.\n */\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\nsup {\n  top: -0.5em;\n}\nsub {\n  bottom: -0.25em;\n}\n/* Embedded content\n   ========================================================================== */\n/**\n * Remove border when inside `a` element in IE 8/9/10.\n */\nimg {\n  border: 0;\n}\n/**\n * Correct overflow not hidden in IE 9/10/11.\n */\nsvg:not(:root) {\n  overflow: hidden;\n}\n/* Grouping content\n   ========================================================================== */\n/**\n * Address margin not present in IE 8/9 and Safari.\n */\nfigure {\n  margin: 1em 40px;\n}\n/**\n * Address differences between Firefox and other browsers.\n */\nhr {\n  -moz-box-sizing: content-box;\n  box-sizing: content-box;\n  height: 0;\n}\n/**\n * Contain overflow in all browsers.\n */\npre {\n  overflow: auto;\n}\n/**\n * Address odd `em`-unit font size rendering in all browsers.\n */\ncode,\nkbd,\npre,\nsamp {\n  font-family: monospace, monospace;\n  font-size: 1em;\n}\n/* Forms\n   ========================================================================== */\n/**\n * Known limitation: by default, Chrome and Safari on OS X allow very limited\n * styling of `select`, unless a `border` property is set.\n */\n/**\n * 1. Correct color not being inherited.\n *    Known issue: affects color of disabled elements.\n * 2. Correct font properties not being inherited.\n * 3. Address margins set differently in Firefox 4+, Safari, and Chrome.\n */\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  color: inherit;\n  /* 1 */\n  font: inherit;\n  /* 2 */\n  margin: 0;\n  /* 3 */\n}\n/**\n * Address `overflow` set to `hidden` in IE 8/9/10/11.\n */\nbutton {\n  overflow: visible;\n}\n/**\n * Address inconsistent `text-transform` inheritance for `button` and `select`.\n * All other form control elements do not inherit `text-transform` values.\n * Correct `button` style inheritance in Firefox, IE 8/9/10/11, and Opera.\n * Correct `select` style inheritance in Firefox.\n */\nbutton,\nselect {\n  text-transform: none;\n}\n/**\n * 1. Avoid the WebKit bug in Android 4.0.* where (2) destroys native `audio`\n *    and `video` controls.\n * 2. Correct inability to style clickable `input` types in iOS.\n * 3. Improve usability and consistency of cursor style between image-type\n *    `input` and others.\n */\nbutton,\nhtml input[type=\"button\"],\ninput[type=\"reset\"],\ninput[type=\"submit\"] {\n  -webkit-appearance: button;\n  /* 2 */\n  cursor: pointer;\n  /* 3 */\n}\n/**\n * Re-set default cursor for disabled elements.\n */\nbutton[disabled],\nhtml input[disabled] {\n  cursor: default;\n}\n/**\n * Remove inner padding and border in Firefox 4+.\n */\nbutton::-moz-focus-inner,\ninput::-moz-focus-inner {\n  border: 0;\n  padding: 0;\n}\n/**\n * Address Firefox 4+ setting `line-height` on `input` using `!important` in\n * the UA stylesheet.\n */\ninput {\n  line-height: normal;\n}\n/**\n * It's recommended that you don't attempt to style these elements.\n * Firefox's implementation doesn't respect box-sizing, padding, or width.\n *\n * 1. Address box sizing set to `content-box` in IE 8/9/10.\n * 2. Remove excess padding in IE 8/9/10.\n */\ninput[type=\"checkbox\"],\ninput[type=\"radio\"] {\n  box-sizing: border-box;\n  /* 1 */\n  padding: 0;\n  /* 2 */\n}\n/**\n * Fix the cursor style for Chrome's increment/decrement buttons. For certain\n * `font-size` values of the `input`, it causes the cursor style of the\n * decrement button to change from `default` to `text`.\n */\ninput[type=\"number\"]::-webkit-inner-spin-button,\ninput[type=\"number\"]::-webkit-outer-spin-button {\n  height: auto;\n}\n/**\n * 1. Address `appearance` set to `searchfield` in Safari and Chrome.\n * 2. Address `box-sizing` set to `border-box` in Safari and Chrome\n *    (include `-moz` to future-proof).\n */\ninput[type=\"search\"] {\n  -webkit-appearance: textfield;\n  /* 1 */\n  -moz-box-sizing: content-box;\n  -webkit-box-sizing: content-box;\n  /* 2 */\n  box-sizing: content-box;\n}\n/**\n * Remove inner padding and search cancel button in Safari and Chrome on OS X.\n * Safari (but not Chrome) clips the cancel button when the search input has\n * padding (and `textfield` appearance).\n */\ninput[type=\"search\"]::-webkit-search-cancel-button,\ninput[type=\"search\"]::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n/**\n * Define consistent border, margin, and padding.\n */\nfieldset {\n  border: 1px solid #c0c0c0;\n  margin: 0 2px;\n  padding: 0.35em 0.625em 0.75em;\n}\n/**\n * 1. Correct `color` not being inherited in IE 8/9/10/11.\n * 2. Remove padding so people aren't caught out if they zero out fieldsets.\n */\nlegend {\n  border: 0;\n  /* 1 */\n  padding: 0;\n  /* 2 */\n}\n/**\n * Remove default vertical scrollbar in IE 8/9/10/11.\n */\ntextarea {\n  overflow: auto;\n}\n/**\n * Don't inherit the `font-weight` (applied by a rule above).\n * NOTE: the default cannot safely be changed in Chrome and Safari on OS X.\n */\noptgroup {\n  font-weight: bold;\n}\n/* Tables\n   ========================================================================== */\n/**\n * Remove most spacing between table cells.\n */\ntable {\n  border-collapse: collapse;\n  border-spacing: 0;\n}\ntd,\nth {\n  padding: 0;\n}\n/*------------------------------------*\n  RESET\n*------------------------------------*/\nbody,\ndiv,\ndl,\ndt,\ndd,\nul,\nol,\nli,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\npre,\nform,\nfieldset,\ninput,\ntextarea,\np,\nblockquote,\nth,\ntd {\n  margin: 0;\n  padding: 0;\n}\ntable {\n  border-collapse: collapse;\n  border-spacing: 0;\n}\nfieldset,\nimg {\n  border: 0;\n}\naddress,\ncaption,\ncite,\ndfn,\nth,\nvar {\n  font-style: normal;\n  font-weight: normal;\n}\ncaption,\nth {\n  text-align: left;\n}\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: 100%;\n  font-weight: normal;\n}\nq:before,\nq:after {\n  content: '';\n}\nabbr,\nacronym {\n  border: 0;\n}\n.no-wrap {\n  white-space: nowrap;\n}\n* {\n  box-sizing: border-box;\n  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);\n}\n*:before,\n*:after {\n  box-sizing: border-box;\n}\nhtml,\nbody {\n  height: 100%;\n  width: 100%;\n}\nhtml {\n  -webkit-font-smoothing: antialiased;\n  color: rgba(0, 0, 0, 0.87);\n  font-family: 'Roboto', sans-serif;\n  background-color: #ffffff;\n}\nhr {\n  border: none;\n  border-bottom: solid 1px #e0e0e0;\n}\n.mui-text-full-black {\n  color: #000000;\n}\n.mui-text-dark-black {\n  color: rgba(0, 0, 0, 0.87);\n}\n.mui-text-light-black {\n  color: rgba(0, 0, 0, 0.54);\n}\n.mui-text-min-black {\n  color: rgba(0, 0, 0, 0.26);\n}\n.mui-text-full-white {\n  color: #ffffff;\n}\n.mui-text-dark-white {\n  color: rgba(255, 255, 255, 0.87);\n}\n.mui-text-light-white {\n  color: rgba(255, 255, 255, 0.54);\n}\n.mui-font-weight-light {\n  font-weight: 300;\n}\n.mui-font-weight-normal {\n  font-weight: 400;\n}\n.mui-font-weight-medium {\n  font-weight: 500;\n}\n/* Type Styles */\n.mui-font-style-display-4 {\n  font-size: 112px;\n  line-height: 128px;\n  letter-spacing: -7px;\n  padding-top: 17px;\n  margin-bottom: 15px;\n  font-weight: 300;\n  color: rgba(0, 0, 0, 0.54);\n}\n.mui-font-style-display-3 {\n  font-size: 56px;\n  line-height: 64px;\n  letter-spacing: -2px;\n  padding-top: 8px;\n  margin-bottom: 28px;\n  font-weight: 400;\n  color: rgba(0, 0, 0, 0.54);\n}\n.mui-font-style-display-2 {\n  font-size: 45px;\n  line-height: 48px;\n  margin-bottom: 11px;\n  letter-spacing: -1px;\n  font-weight: 400;\n  color: rgba(0, 0, 0, 0.54);\n}\n.mui-font-style-display-1 {\n  font-size: 34px;\n  line-height: 40px;\n  padding-top: 8px;\n  margin-bottom: 12px;\n  letter-spacing: -1px;\n  font-weight: 400;\n  color: rgba(0, 0, 0, 0.54);\n}\n.mui-font-style-headline {\n  font-size: 24px;\n  line-height: 32px;\n  padding-top: 16px;\n  margin-bottom: 12px;\n  letter-spacing: 0;\n  font-weight: 400;\n  color: rgba(0, 0, 0, 0.87);\n}\n.mui-font-style-title {\n  font-size: 20px;\n  line-height: 28px;\n  padding-top: 19px;\n  margin-bottom: 13px;\n  letter-spacing: 0;\n  font-weight: 500;\n  color: rgba(0, 0, 0, 0.87);\n}\n.mui-font-style-subhead-2 {\n  font-size: 15px;\n  line-height: 28px;\n  padding-top: 2px;\n  margin-bottom: 10px;\n  letter-spacing: 0;\n  font-weight: 400;\n  color: rgba(0, 0, 0, 0.87);\n}\n.mui-font-style-subhead-1 {\n  font-size: 15px;\n  line-height: 28px;\n  padding-top: 2px;\n  margin-bottom: 10px;\n  letter-spacing: 0;\n  font-weight: 400;\n  line-height: 24px;\n  padding-top: 3px;\n  margin-bottom: 13px;\n  color: rgba(0, 0, 0, 0.87);\n}\n.mui-font-style-body-2 {\n  font-size: 13px;\n  line-height: 24px;\n  padding-top: 4px;\n  margin-bottom: 12px;\n  letter-spacing: 0;\n  font-weight: 500;\n  color: rgba(0, 0, 0, 0.87);\n}\n.mui-font-style-body-1 {\n  font-size: 13px;\n  line-height: 20px;\n  padding-top: 6px;\n  margin-bottom: 14px;\n  letter-spacing: 0;\n  font-weight: 400;\n  color: rgba(0, 0, 0, 0.87);\n}\n.mui-font-style-caption {\n  font-size: 12px;\n  line-height: 20px;\n  padding-top: 6px;\n  margin-bottom: 14px;\n  letter-spacing: 0;\n  font-weight: 400;\n  color: rgba(0, 0, 0, 0.54);\n}\n.mui-font-style-menu {\n  font-size: 13px;\n  line-height: 20px;\n  padding-top: 6px;\n  margin-bottom: 14px;\n  letter-spacing: 0;\n  font-weight: 500;\n  color: rgba(0, 0, 0, 0.87);\n}\n.mui-font-style-button {\n  font-size: 14px;\n  line-height: 20px;\n  padding-top: 5px;\n  margin-bottom: 15px;\n  letter-spacing: 0;\n  text-transform: uppercase;\n  font-weight: 500;\n  color: rgba(0, 0, 0, 0.87);\n}\n/* General HTML Typography */\nbody {\n  font-size: 13px;\n  line-height: 20px;\n}\nh1 {\n  font-size: 45px;\n  line-height: 48px;\n  margin-bottom: 11px;\n  letter-spacing: -1px;\n  font-weight: 400;\n  color: rgba(0, 0, 0, 0.54);\n}\nh2 {\n  font-size: 34px;\n  line-height: 40px;\n  padding-top: 8px;\n  margin-bottom: 12px;\n  letter-spacing: -1px;\n  font-weight: 400;\n  color: rgba(0, 0, 0, 0.54);\n}\nh3 {\n  font-size: 24px;\n  line-height: 32px;\n  padding-top: 16px;\n  margin-bottom: 12px;\n  letter-spacing: 0;\n  font-weight: 400;\n  color: rgba(0, 0, 0, 0.87);\n}\nh4 {\n  font-size: 20px;\n  line-height: 28px;\n  padding-top: 19px;\n  margin-bottom: 13px;\n  letter-spacing: 0;\n  font-weight: 500;\n  color: rgba(0, 0, 0, 0.87);\n}\nh5 {\n  font-size: 15px;\n  line-height: 28px;\n  padding-top: 2px;\n  margin-bottom: 10px;\n  letter-spacing: 0;\n  font-weight: 400;\n  line-height: 24px;\n  padding-top: 3px;\n  margin-bottom: 13px;\n  color: rgba(0, 0, 0, 0.87);\n}\nh6 {\n  font-size: 13px;\n  line-height: 24px;\n  padding-top: 4px;\n  margin-bottom: 12px;\n  letter-spacing: 0;\n  font-weight: 500;\n  color: rgba(0, 0, 0, 0.87);\n}\np {\n  font-size: 13px;\n  line-height: 20px;\n  padding-top: 6px;\n  margin-bottom: 14px;\n  letter-spacing: 0;\n  font-weight: 400;\n  color: rgba(0, 0, 0, 0.87);\n}\nhr {\n  margin-top: 0;\n  margin-bottom: 18px;\n}\n.mui-predefined-layout-1 .mui-app-content-canvas {\n  padding-top: 64px;\n}\n.mui-predefined-layout-1 .mui-app-bar {\n  position: fixed;\n  height: 64px;\n}\n.mui-key-width-1 {\n  width: 64px;\n}\n.mui-key-width-2 {\n  width: 128px;\n}\n.mui-key-width-3 {\n  width: 192px;\n}\n.mui-key-width-4 {\n  width: 256px;\n}\n.mui-key-width-5 {\n  width: 320px;\n}\n.mui-key-width-6 {\n  width: 384px;\n}\n.mui-key-width-7 {\n  width: 448px;\n}\n.mui-key-width-8 {\n  width: 512px;\n}\n.mui-key-width-9 {\n  width: 576px;\n}\n.mui-key-width-10 {\n  width: 640px;\n}\n.mui-key-height-1 {\n  height: 64px;\n}\n.mui-key-height-2 {\n  height: 128px;\n}\n.mui-key-height-3 {\n  height: 192px;\n}\n.mui-key-height-4 {\n  height: 256px;\n}\n.mui-key-height-5 {\n  height: 320px;\n}\n.mui-key-height-6 {\n  height: 384px;\n}\n.mui-key-height-7 {\n  height: 448px;\n}\n.mui-key-height-8 {\n  height: 512px;\n}\n.mui-key-height-9 {\n  height: 576px;\n}\n.mui-key-height-10 {\n  height: 640px;\n}\n.mui-app-bar {\n  width: 100%;\n  min-height: 64px;\n  background-color: #00bcd4;\n  z-index: 5;\n}\n.mui-app-bar .mui-paper-container {\n  padding-left: 24px;\n  padding-right: 24px;\n}\n.mui-app-bar .mui-icon-button {\n  margin-top: 8px;\n}\n.mui-app-bar .mui-icon-button * {\n  fill: rgba(255, 255, 255, 0.87);\n  color: rgba(255, 255, 255, 0.87);\n}\n.mui-app-bar .mui-app-bar-title {\n  font-size: 24px;\n  line-height: 32px;\n  padding-top: 16px;\n  margin-bottom: 12px;\n  letter-spacing: 0;\n  font-weight: 400;\n  color: rgba(0, 0, 0, 0.87);\n  color: rgba(255, 255, 255, 0.87);\n  padding-top: 0;\n  line-height: 64px;\n  float: left;\n}\n.mui-app-bar .mui-app-bar-navigation-icon-button {\n  float: left;\n  margin-right: 8px;\n  margin-left: -16px;\n}\n.mui-card {\n  background-color: #ffffff;\n  padding: 24px;\n}\n.mui-card .mui-card-toolbar {\n  margin-top: -24px;\n  margin-left: -24px;\n  margin-right: -24px;\n  margin-bottom: 24px;\n  line-height: 56px;\n  height: 56px;\n  padding-left: 24px;\n  padding-right: 24px;\n  font-size: 13px;\n  line-height: 20px;\n  padding-top: 6px;\n  margin-bottom: 14px;\n  letter-spacing: 0;\n  font-weight: 500;\n  color: rgba(0, 0, 0, 0.87);\n}\n.mui-checkbox .mui-checkbox-icon {\n  height: 24px;\n  width: 24px;\n  margin-right: 16px;\n}\n.mui-checkbox .mui-checkbox-icon .mui-checkbox-check {\n  position: absolute;\n  opacity: 0;\n  transform: scale(0);\n  transform-origin: 50% 50%;\n  transition: opacity 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, transform 0ms cubic-bezier(0.23, 1, 0.32, 1) 450ms;\n}\n.mui-checkbox .mui-checkbox-icon .mui-checkbox-check * {\n  fill: #00bcd4;\n}\n.mui-checkbox .mui-checkbox-icon .mui-checkbox-box {\n  position: absolute;\n}\n.mui-checkbox .mui-checkbox-icon .mui-checkbox-box * {\n  fill: rgba(0, 0, 0, 0.87);\n  transition: all 2s cubic-bezier(0.23, 1, 0.32, 1) 200ms;\n}\n.mui-checkbox.mui-is-switched .mui-checkbox-icon .mui-checkbox-check {\n  transition: all 0.45s cubic-bezier(0.23, 1, 0.32, 1) 0s;\n  opacity: 1;\n  transform: scale(1);\n  transform-origin: 50% 50%;\n  transition: opacity 0ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, transform 800ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-checkbox.mui-is-switched .mui-checkbox-icon .mui-checkbox-box {\n  transition: all 100s cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-checkbox.mui-is-switched .mui-checkbox-icon .mui-checkbox-box * {\n  fill: #00bcd4;\n}\n.mui-checkbox.mui-is-disabled .mui-checkbox-icon .mui-checkbox-check *,\n.mui-checkbox.mui-is-disabled .mui-checkbox-icon .mui-checkbox-box * {\n  fill: rgba(0, 0, 0, 0.3);\n}\n.mui-checkbox.mui-is-required .mui-checkbox-icon .mui-checkbox-box * {\n  fill: #00bcd4;\n}\n.mui-date-picker-calendar {\n  font-size: 12px;\n}\n.mui-date-picker-calendar .mui-date-picker-calendar-week-title {\n  font-weight: 500;\n  color: rgba(0, 0, 0, 0.5);\n  line-height: 12px;\n  padding: 0 14px;\n}\n.mui-date-picker-calendar .mui-date-picker-calendar-week-title:before,\n.mui-date-picker-calendar .mui-date-picker-calendar-week-title:after {\n  content: \" \";\n  display: table;\n}\n.mui-date-picker-calendar .mui-date-picker-calendar-week-title:after {\n  clear: both;\n}\n.mui-date-picker-calendar .mui-date-picker-calendar-week-title-day {\n  list-style: none;\n  float: left;\n  width: 32px;\n  text-align: center;\n  margin: 0 2px;\n}\n.mui-date-picker-calendar .mui-date-picker-calendar-container {\n  transition: height 150ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-date-picker-calendar.mui-is-4week .mui-date-picker-calendar-container {\n  height: 228px;\n}\n.mui-date-picker-calendar.mui-is-5week .mui-date-picker-calendar-container {\n  height: 268px;\n}\n.mui-date-picker-calendar.mui-is-6week .mui-date-picker-calendar-container {\n  height: 308px;\n}\n.mui-is-landscape .mui-date-picker-calendar:before,\n.mui-is-landscape .mui-date-picker-calendar:after {\n  content: \" \";\n  display: table;\n}\n.mui-is-landscape .mui-date-picker-calendar:after {\n  clear: both;\n}\n.mui-is-landscape .mui-date-picker-calendar-date-display {\n  width: 280px;\n  height: 100%;\n  float: left;\n}\n.mui-is-landscape .mui-date-picker-calendar-container {\n  width: 280px;\n  float: right;\n}\n.mui-date-picker-calendar-month {\n  line-height: 32px;\n  text-align: center;\n  padding: 8px 14px 0 14px;\n  background-color: #ffffff;\n}\n.mui-date-picker-calendar-month .mui-date-picker-calendar-month-week:before,\n.mui-date-picker-calendar-month .mui-date-picker-calendar-month-week:after {\n  content: \" \";\n  display: table;\n}\n.mui-date-picker-calendar-month .mui-date-picker-calendar-month-week:after {\n  clear: both;\n}\n.mui-date-picker-calendar-toolbar {\n  height: 48px;\n  position: relative;\n}\n.mui-date-picker-calendar-toolbar .mui-date-picker-calendar-toolbar-title {\n  line-height: 48px;\n  font-size: 14px;\n  text-align: center;\n  font-weight: 500;\n}\n.mui-date-picker-calendar-toolbar .mui-date-picker-calendar-toolbar-button-left {\n  position: absolute;\n  left: 0;\n  top: 0;\n}\n.mui-date-picker-calendar-toolbar .mui-date-picker-calendar-toolbar-button-right {\n  position: absolute;\n  right: 0;\n  top: 0;\n}\n.mui-date-picker-date-display {\n  text-align: center;\n  position: relative;\n}\n.mui-date-picker-date-display .mui-date-picker-date-display-dow {\n  font-size: 13px;\n  height: 32px;\n  line-height: 32px;\n  background-color: #0097a7;\n  color: #ffffff;\n  border-radius: 2px 2px 0 0;\n}\n.mui-date-picker-date-display .mui-date-picker-date-display-date {\n  padding: 16px 0;\n  background-color: #00bcd4;\n  color: #ffffff;\n}\n.mui-date-picker-date-display .mui-date-picker-date-display-month,\n.mui-date-picker-date-display .mui-date-picker-date-display-year {\n  font-size: 22px;\n  line-height: 24px;\n  height: 24px;\n  text-transform: uppercase;\n}\n.mui-date-picker-date-display .mui-date-picker-date-display-day {\n  margin: 6px 0;\n  line-height: 58px;\n  height: 58px;\n  font-size: 58px;\n}\n.mui-date-picker-date-display .mui-date-picker-date-display-year {\n  color: rgba(255, 255, 255, 0.7);\n}\n.mui-is-landscape .mui-date-picker-date-display * {\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-is-landscape .mui-date-picker-date-display-dow {\n  border-radius: 2px 0 0 0;\n}\n.mui-is-landscape .mui-date-picker-date-display-date {\n  padding: 24px 0;\n}\n.mui-is-landscape .mui-date-picker-date-display-day {\n  font-size: 76px;\n  line-height: 76px;\n  height: 76px;\n}\n.mui-is-landscape .mui-date-picker-date-display-month,\n.mui-is-landscape .mui-date-picker-date-display-year {\n  font-size: 26px;\n  line-height: 26px;\n  height: 26px;\n}\n.mui-is-landscape .mui-is-5week .mui-date-picker-date-display-date {\n  padding: 30px 0;\n}\n.mui-is-landscape .mui-is-5week .mui-date-picker-date-display-day {\n  margin: 24px 0;\n}\n.mui-is-landscape .mui-is-6week .mui-date-picker-date-display-date {\n  padding: 50px 0;\n}\n.mui-is-landscape .mui-is-6week .mui-date-picker-date-display-day {\n  margin: 24px 0;\n}\n.mui-date-picker-dialog {\n  font-size: 14px;\n  color: rgba(0, 0, 0, 0.87);\n}\n.mui-date-picker-dialog .mui-date-picker-dialog-window.mui-dialog-window-contents {\n  width: 280px;\n}\n.mui-is-landscape .mui-date-picker-dialog-window.mui-dialog-window-contents {\n  width: 560px;\n}\n.mui-date-picker-day-button {\n  position: relative;\n  float: left;\n  width: 36px;\n  padding: 4px 2px;\n}\n.mui-date-picker-day-button .mui-date-picker-day-button-select {\n  position: absolute;\n  background-color: #0097a7;\n  height: 32px;\n  width: 32px;\n  opacity: 0;\n  border-radius: 50%;\n  transform: scale(0);\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-date-picker-day-button .mui-date-picker-day-button-label {\n  position: relative;\n}\n.mui-date-picker-day-button.mui-is-selected .mui-date-picker-day-button-label {\n  color: #ffffff;\n}\n.mui-date-picker-day-button.mui-is-selected .mui-date-picker-day-button-select {\n  opacity: 1;\n  transform: scale(1);\n}\n.mui-date-picker-day-button.mui-is-current-date {\n  color: #00bcd4;\n}\n.mui-dialog-window {\n  position: fixed;\n  z-index: 10;\n  top: 0px;\n  left: -10000px;\n  width: 100%;\n  height: 100%;\n  transition: left 0ms cubic-bezier(0.23, 1, 0.32, 1) 450ms;\n}\n.mui-dialog-window .mui-dialog-window-contents {\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n  position: relative;\n  width: 75%;\n  max-width: 768px;\n  margin: 0 auto;\n  z-index: 10;\n  background: #ffffff;\n  opacity: 0;\n}\n.mui-dialog-window .mui-dialog-window-actions {\n  padding: 8px;\n  margin-bottom: 8px;\n  width: 100%;\n  text-align: right;\n}\n.mui-dialog-window .mui-dialog-window-actions .mui-dialog-window-action {\n  margin-right: 8px;\n}\n.mui-dialog-window.mui-is-shown {\n  left: 0px;\n  transition: left 0ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-dialog-window.mui-is-shown .mui-dialog-window-contents {\n  opacity: 1;\n  top: 0px;\n  transform: translate3d(0, 64px, 0);\n}\n.mui-dialog .mui-dialog-title {\n  padding: 24px 24px 0 24px;\n  margin-bottom: 0;\n}\n.mui-dialog .mui-dialog-content {\n  padding: 24px;\n}\n.mui-drop-down-icon {\n  display: inline-block;\n  width: 48px !important;\n  position: relative;\n  height: 56px;\n  font-size: 15px;\n  cursor: pointer;\n}\n.mui-drop-down-icon.mui-open .mui-icon-highlight {\n  background-color: rgba(0, 0, 0, 0.1);\n}\n.mui-drop-down-icon.mui-open .mui-menu-control .mui-menu-control-bg,\n.mui-drop-down-icon.mui-open .mui-menu-control:hover .mui-menu-control-bg {\n  opacity: 0;\n}\n.mui-drop-down-icon.mui-open .mui-menu-control .mui-menu-label,\n.mui-drop-down-icon.mui-open .mui-menu-control:hover .mui-menu-label {\n  top: 28px;\n  opacity: 0;\n}\n.mui-drop-down-icon.mui-open .mui-menu {\n  opacity: 1;\n}\n.mui-drop-down-icon .mui-menu {\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n  right: -14px !important;\n  top: 9px !important;\n}\n.mui-drop-down-icon .mui-menu .mui-menu-item {\n  padding-right: 56px;\n  height: 32px;\n  line-height: 32px;\n}\n.mui-drop-down-menu {\n  position: relative;\n  display: inline-block;\n  height: 56px;\n  font-size: 15px;\n}\n.mui-drop-down-menu * {\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-drop-down-menu.mui-open .mui-menu-control .mui-menu-control-bg,\n.mui-drop-down-menu.mui-open .mui-menu-control:hover .mui-menu-control-bg {\n  opacity: 0;\n}\n.mui-drop-down-menu.mui-open .mui-menu-control .mui-menu-label,\n.mui-drop-down-menu.mui-open .mui-menu-control:hover .mui-menu-label {\n  top: 28px;\n  opacity: 0;\n}\n.mui-drop-down-menu.mui-open .mui-menu {\n  opacity: 1;\n}\n.mui-drop-down-menu .mui-menu-control {\n  cursor: pointer;\n  height: 100%;\n}\n.mui-drop-down-menu .mui-menu-control:before,\n.mui-drop-down-menu .mui-menu-control:after {\n  content: \" \";\n  display: table;\n}\n.mui-drop-down-menu .mui-menu-control:after {\n  clear: both;\n}\n.mui-drop-down-menu .mui-menu-control .mui-menu-control-bg {\n  background-color: #ffffff;\n  height: 100%;\n  width: 100%;\n  opacity: 0;\n}\n.mui-drop-down-menu .mui-menu-control:hover .mui-menu-control-bg {\n  opacity: 1;\n}\n.mui-drop-down-menu .mui-menu-control .mui-menu-label {\n  line-height: 56px;\n  position: absolute;\n  padding-left: 24px;\n  top: 0;\n  opacity: 1;\n}\n.mui-drop-down-menu .mui-menu-control .mui-menu-drop-down-icon {\n  position: absolute;\n  top: 16px;\n  right: 16px;\n}\n.mui-drop-down-menu .mui-menu-control .mui-menu-drop-down-icon * {\n  fill: rgba(0, 0, 0, 0.26);\n}\n.mui-drop-down-menu .mui-menu-control .mui-menu-control-underline {\n  border-top: solid 1px #e0e0e0;\n  margin: 0 24px;\n}\n.mui-drop-down-menu .mui-menu .mui-menu-item {\n  padding-right: 48px;\n  height: 32px;\n  line-height: 32px;\n  white-space: nowrap;\n}\n.mui-enhanced-button {\n  border: 0;\n  background: none;\n}\n.mui-enhanced-button:focus {\n  outline: none;\n}\n.mui-enhanced-button.mui-is-link-button {\n  display: inline-block;\n  cursor: pointer;\n  text-decoration: none;\n}\n.mui-enhanced-button.mui-is-link-button:hover {\n  text-decoration: none;\n}\n.mui-enhanced-button.mui-is-link-button.mui-is-disabled {\n  cursor: default;\n}\n.mui-enhanced-switch {\n  position: relative;\n  cursor: pointer;\n  overflow: visible;\n  display: table;\n  height: auto;\n  width: 100%;\n}\n.mui-enhanced-switch .mui-enhanced-switch-input {\n  position: absolute;\n  cursor: pointer;\n  pointer-events: all;\n  opacity: 0;\n  width: 100%;\n  height: 100%;\n  z-index: 2;\n  left: 0;\n}\n.mui-enhanced-switch .mui-enhanced-switch-wrap {\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n  float: left;\n  position: relative;\n  display: table-column;\n}\n.mui-enhanced-switch .mui-enhanced-switch-wrap .mui-touch-ripple,\n.mui-enhanced-switch .mui-enhanced-switch-wrap .mui-focus-ripple-inner {\n  width: 200%;\n  height: 200%;\n  top: -12px;\n  left: -12px;\n}\n.mui-enhanced-switch .mui-switch-label {\n  float: left;\n  position: relative;\n  display: table-column;\n  width: calc(100% - 60px);\n  line-height: 24px;\n}\n.mui-enhanced-switch.mui-is-switched .mui-focus-ripple-inner,\n.mui-enhanced-switch.mui-is-switched .mui-ripple-circle-inner {\n  background-color: rgba(0, 188, 212, 0.2);\n}\n.mui-enhanced-textarea .mui-enhanced-textarea-shadow,\n.mui-enhanced-textarea .mui-enhanced-textarea-input {\n  width: 100%;\n  resize: none;\n}\n.mui-enhanced-textarea .mui-enhanced-textarea-input {\n  overflow: hidden;\n}\n.mui-enhanced-textarea .mui-enhanced-textarea-shadow {\n  transform: scale(0);\n  position: absolute;\n}\n.mui-flat-button {\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n  font-size: 14px;\n  line-height: 20px;\n  padding-top: 5px;\n  margin-bottom: 15px;\n  letter-spacing: 0;\n  text-transform: uppercase;\n  font-weight: 500;\n  border-radius: 2px;\n  user-select: none;\n  position: relative;\n  overflow: hidden;\n  background-color: #ffffff;\n  color: rgba(0, 0, 0, 0.87);\n  line-height: 36px;\n  min-width: 88px;\n  padding: 0;\n  margin: 0;\n  transform: translate3d(0, 0, 0);\n}\n.mui-flat-button .mui-touch-ripple .mui-ripple-circle-inner {\n  background-color: rgba(0, 0, 0, 0.1);\n}\n.mui-flat-button .mui-focus-ripple .mui-focus-ripple-inner {\n  background-color: rgba(0, 0, 0, 0.07);\n}\n.mui-flat-button .mui-flat-button-label {\n  position: relative;\n  padding: 0 16px;\n}\n.mui-flat-button:hover,\n.mui-flat-button.mui-is-keyboard-focused {\n  background-color: #e6e6e6;\n}\n.mui-flat-button.mui-is-disabled {\n  color: rgba(0, 0, 0, 0.3);\n}\n.mui-flat-button.mui-is-disabled:hover {\n  background-color: inherit;\n}\n.mui-flat-button.mui-is-primary {\n  color: #ff4081;\n}\n.mui-flat-button.mui-is-primary:hover,\n.mui-flat-button.mui-is-primary.mui-is-keyboard-focused {\n  background-color: #ffe3ed;\n}\n.mui-flat-button.mui-is-primary .mui-touch-ripple .mui-ripple-circle-inner {\n  background-color: rgba(255, 64, 129, 0.2);\n}\n.mui-flat-button.mui-is-primary .mui-focus-ripple .mui-focus-ripple-inner {\n  background-color: rgba(255, 64, 129, 0.2);\n}\n.mui-flat-button.mui-is-secondary {\n  color: #00bcd4;\n}\n.mui-flat-button.mui-is-secondary:hover,\n.mui-flat-button.mui-is-secondary.mui-is-keyboard-focused {\n  background-color: #defbff;\n}\n.mui-flat-button.mui-is-secondary .mui-touch-ripple .mui-ripple-circle-inner {\n  background-color: rgba(0, 188, 212, 0.2);\n}\n.mui-flat-button.mui-is-secondary .mui-focus-ripple .mui-focus-ripple-inner {\n  background-color: rgba(0, 188, 212, 0.2);\n}\n.mui-floating-action-button {\n  display: inline-block;\n}\n.mui-floating-action-button,\n.mui-floating-action-button * {\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-floating-action-button .mui-floating-action-button-container {\n  position: relative;\n  height: 56px;\n  width: 56px;\n  padding: 0;\n  overflow: hidden;\n  background-color: #ff4081;\n  border-radius: 50%;\n  transform: translate3d(0, 0, 0);\n}\n.mui-floating-action-button .mui-floating-action-button-container.mui-is-disabled {\n  background-color: #e6e6e6;\n}\n.mui-floating-action-button .mui-floating-action-button-container.mui-is-disabled .mui-floating-action-button-icon {\n  color: rgba(0, 0, 0, 0.3);\n}\n.mui-floating-action-button .mui-floating-action-button-container.mui-is-disabled:hover {\n  background-color: #e6e6e6;\n}\n.mui-floating-action-button .mui-floating-action-button-container:hover,\n.mui-floating-action-button .mui-floating-action-button-container.mui-is-keyboard-focused {\n  background-color: #f30053;\n}\n.mui-floating-action-button .mui-floating-action-button-icon {\n  line-height: 56px;\n  color: #ffffff;\n  fill: #ffffff;\n}\n.mui-floating-action-button .mui-touch-ripple .mui-ripple-circle-inner {\n  background-color: rgba(255, 255, 255, 0.5);\n}\n.mui-floating-action-button .mui-focus-ripple .mui-focus-ripple-inner {\n  background-color: rgba(255, 255, 255, 0.5);\n}\n.mui-floating-action-button.mui-is-mini .mui-floating-action-button-container {\n  height: 40px;\n  width: 40px;\n}\n.mui-floating-action-button.mui-is-mini .mui-floating-action-button-icon {\n  line-height: 40px;\n}\n.mui-floating-action-button.mui-is-secondary .mui-floating-action-button-container {\n  background-color: #00bcd4;\n}\n.mui-floating-action-button.mui-is-secondary .mui-floating-action-button-container:hover,\n.mui-floating-action-button.mui-is-secondary .mui-floating-action-button-container.mui-is-keyboard-focused {\n  background-color: #00aac0;\n}\n.mui-floating-action-button.mui-is-secondary .mui-floating-action-button-icon {\n  color: #ffffff;\n}\n.mui-floating-action-button.mui-is-secondary .mui-touch-ripple .mui-ripple-circle-inner {\n  background-color: rgba(255, 255, 255, 0.35);\n}\n.mui-floating-action-button.mui-is-secondary .mui-focus-ripple .mui-focus-ripple-inner {\n  background-color: rgba(255, 255, 255, 0.35);\n}\n.mui-font-icon {\n  position: relative;\n  font-size: 24px;\n  display: inline-block;\n  user-select: none;\n}\n.mui-icon-button {\n  position: relative;\n  padding: 12px;\n  width: 24px*2;\n  height: 24px*2;\n}\n.mui-icon-button * {\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-icon-button .mui-focus-ripple .mui-focus-ripple-inner {\n  background-color: rgba(0, 0, 0, 0.1);\n  box-shadow: 0px 0px 0px 1px rgba(0, 0, 0, 0.1);\n  border: solid 6px rgba(0, 0, 0, 0);\n  background-clip: padding-box;\n  animation: icon-button-focus-ripple-pulsate 1.5s ease 0s infinite;\n}\n@keyframes icon-button-focus-ripple-pulsate {\n  0%,\n  100% {\n    transform: scale(0.75);\n  }\n  50% {\n    transform: scale(1);\n  }\n}\n.mui-icon-button .mui-icon-button-tooltip {\n  margin-top: 52px;\n}\n.mui-icon-button.mui-is-disabled * {\n  color: rgba(191, 191, 191, 0.87);\n  fill: rgba(191, 191, 191, 0.87);\n}\n.mui-dark-theme .mui-touch-ripple .mui-ripple-circle-inner {\n  background-color: rgba(255, 255, 255, 0.3);\n}\n.mui-dark-theme .mui-focus-ripple .mui-focus-ripple-inner {\n  background-color: rgba(255, 255, 255, 0.3);\n  box-shadow: 0px 0px 0px 1px rgba(255, 255, 255, 0.3);\n}\n.mui-ink-bar {\n  bottom: 0;\n  display: block;\n  background-color: yellow;\n  height: 2px;\n  margin-top: -2px;\n  position: relative;\n  transition: left 1s cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-input {\n  position: relative;\n  margin-top: 24px;\n  margin-bottom: 48px;\n}\n.mui-input input,\n.mui-input textarea {\n  background-color: transparent;\n  font-size: 16px;\n  border: 0;\n  outline: none;\n  border-bottom: 1px solid lightgray;\n  padding: 0;\n  box-sizing: border-box;\n  padding-bottom: 14px;\n}\n.mui-input input[type='text'],\n.mui-input textarea[type='text'],\n.mui-input input[type='password'],\n.mui-input textarea[type='password'],\n.mui-input input[type='email'],\n.mui-input textarea[type='email'] {\n  display: block;\n  width: 320px;\n}\n.mui-input input:focus,\n.mui-input textarea:focus,\n.mui-input input.mui-is-not-empty,\n.mui-input textarea.mui-is-not-empty,\n.mui-input input:disabled[value]:not([value=\"\"]),\n.mui-input textarea:disabled[value]:not([value=\"\"]) {\n  outline: none;\n  box-shadow: none;\n}\n.mui-input input:focus ~ .mui-input-placeholder,\n.mui-input textarea:focus ~ .mui-input-placeholder,\n.mui-input input.mui-is-not-empty ~ .mui-input-placeholder,\n.mui-input textarea.mui-is-not-empty ~ .mui-input-placeholder,\n.mui-input input:disabled[value]:not([value=\"\"]) ~ .mui-input-placeholder,\n.mui-input textarea:disabled[value]:not([value=\"\"]) ~ .mui-input-placeholder {\n  color: blue;\n  font-size: 13px !important;\n  font-weight: 300;\n  top: -32px;\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-input input:focus ~ .mui-input-highlight,\n.mui-input textarea:focus ~ .mui-input-highlight,\n.mui-input input.mui-is-not-empty ~ .mui-input-highlight,\n.mui-input textarea.mui-is-not-empty ~ .mui-input-highlight,\n.mui-input input:disabled[value]:not([value=\"\"]) ~ .mui-input-highlight,\n.mui-input textarea:disabled[value]:not([value=\"\"]) ~ .mui-input-highlight {\n  width: 0;\n  background-color: blue;\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-input input:focus ~ .mui-input-bar::before,\n.mui-input textarea:focus ~ .mui-input-bar::before,\n.mui-input input.mui-is-not-empty ~ .mui-input-bar::before,\n.mui-input textarea.mui-is-not-empty ~ .mui-input-bar::before,\n.mui-input input:disabled[value]:not([value=\"\"]) ~ .mui-input-bar::before,\n.mui-input textarea:disabled[value]:not([value=\"\"]) ~ .mui-input-bar::before,\n.mui-input input:focus ~ .mui-input-bar::after,\n.mui-input textarea:focus ~ .mui-input-bar::after,\n.mui-input input.mui-is-not-empty ~ .mui-input-bar::after,\n.mui-input textarea.mui-is-not-empty ~ .mui-input-bar::after,\n.mui-input input:disabled[value]:not([value=\"\"]) ~ .mui-input-bar::after,\n.mui-input textarea:disabled[value]:not([value=\"\"]) ~ .mui-input-bar::after {\n  background-color: blue;\n  width: 50%;\n}\n.mui-input input:focus ~ .mui-input-description,\n.mui-input textarea:focus ~ .mui-input-description,\n.mui-input input.mui-is-not-empty ~ .mui-input-description,\n.mui-input textarea.mui-is-not-empty ~ .mui-input-description,\n.mui-input input:disabled[value]:not([value=\"\"]) ~ .mui-input-description,\n.mui-input textarea:disabled[value]:not([value=\"\"]) ~ .mui-input-description {\n  display: block;\n}\n.mui-input input:not(:focus).mui-is-not-empty + .mui-input-placeholder,\n.mui-input textarea:not(:focus).mui-is-not-empty + .mui-input-placeholder,\n.mui-input input:disabled[value]:not([value=\"\"]) + .mui-input-placeholder,\n.mui-input textarea:disabled[value]:not([value=\"\"]) + .mui-input-placeholder {\n  color: gray;\n}\n.mui-input input:not(:focus).mui-is-not-empty + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::before,\n.mui-input textarea:not(:focus).mui-is-not-empty + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::before,\n.mui-input input:disabled[value]:not([value=\"\"]) + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::before,\n.mui-input textarea:disabled[value]:not([value=\"\"]) + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::before,\n.mui-input input:not(:focus).mui-is-not-empty + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::after,\n.mui-input textarea:not(:focus).mui-is-not-empty + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::after,\n.mui-input input:disabled[value]:not([value=\"\"]) + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::after,\n.mui-input textarea:disabled[value]:not([value=\"\"]) + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::after {\n  width: 0;\n}\n.mui-input input:not(:focus).mui-is-not-empty + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar + .mui-input-description,\n.mui-input textarea:not(:focus).mui-is-not-empty + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar + .mui-input-description,\n.mui-input input:disabled[value]:not([value=\"\"]) + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar + .mui-input-description,\n.mui-input textarea:disabled[value]:not([value=\"\"]) + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar + .mui-input-description {\n  display: none;\n}\n.mui-input input + .mui-input-placeholder,\n.mui-input textarea + .mui-input-placeholder {\n  font-size: 16px;\n  color: gray;\n  position: absolute;\n  top: -4px;\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-input .mui-input-highlight {\n  content: '';\n  position: absolute;\n  background-color: transparent;\n  opacity: 0.25;\n  height: 19px;\n  top: -3px;\n  width: 160px;\n  z-index: -1;\n}\n.mui-input .mui-input-bar {\n  position: relative;\n  display: block;\n  width: 320px;\n}\n.mui-input .mui-input-bar::before,\n.mui-input .mui-input-bar::after {\n  content: '';\n  height: 2px;\n  top: -2px;\n  width: 0;\n  position: absolute;\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-input .mui-input-bar::before {\n  left: 50%;\n}\n.mui-input .mui-input-bar::after {\n  right: 50%;\n}\n.mui-input .mui-input-description {\n  display: none;\n  color: blue;\n  position: absolute;\n}\n.mui-input .mui-input-error {\n  display: none;\n  color: red;\n  position: absolute;\n}\n.mui-input.mui-error input:focus + .mui-input-placeholder,\n.mui-input.mui-error textarea:focus + .mui-input-placeholder,\n.mui-input.mui-error input.mui-is-not-empty + .mui-input-placeholder,\n.mui-input.mui-error textarea.mui-is-not-empty + .mui-input-placeholder {\n  color: red;\n}\n.mui-input.mui-error input:focus + .mui-input-placeholder + .mui-input-highlight,\n.mui-input.mui-error textarea:focus + .mui-input-placeholder + .mui-input-highlight,\n.mui-input.mui-error input.mui-is-not-empty + .mui-input-placeholder + .mui-input-highlight,\n.mui-input.mui-error textarea.mui-is-not-empty + .mui-input-placeholder + .mui-input-highlight {\n  width: 0;\n  background-color: red;\n}\n.mui-input.mui-error input:focus + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::before,\n.mui-input.mui-error textarea:focus + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::before,\n.mui-input.mui-error input.mui-is-not-empty + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::before,\n.mui-input.mui-error textarea.mui-is-not-empty + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::before,\n.mui-input.mui-error input:focus + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::after,\n.mui-input.mui-error textarea:focus + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::after,\n.mui-input.mui-error input.mui-is-not-empty + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::after,\n.mui-input.mui-error textarea.mui-is-not-empty + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar::after {\n  background-color: red;\n}\n.mui-input.mui-error input:focus + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar + .mui-input-description,\n.mui-input.mui-error textarea:focus + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar + .mui-input-description,\n.mui-input.mui-error input.mui-is-not-empty + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar + .mui-input-description,\n.mui-input.mui-error textarea.mui-is-not-empty + .mui-input-placeholder + .mui-input-highlight + .mui-input-bar + .mui-input-description {\n  display: none;\n}\n.mui-input.mui-error .mui-input-error {\n  display: block;\n}\n.mui-input.mui-floating {\n  margin-top: 24px;\n}\n.mui-input.mui-floating input:focus + .mui-input-placeholder,\n.mui-input.mui-floating textarea:focus + .mui-input-placeholder {\n  display: block;\n  color: gray;\n  font-size: 16px !important;\n  font-weight: 400;\n  top: -4px;\n}\n.mui-input.mui-floating input:focus.mui-is-not-empty + .mui-input-placeholder,\n.mui-input.mui-floating textarea:focus.mui-is-not-empty + .mui-input-placeholder {\n  display: none;\n}\n.mui-input.mui-floating input.mui-is-not-empty + .mui-input-placeholder,\n.mui-input.mui-floating textarea.mui-is-not-empty + .mui-input-placeholder {\n  display: none;\n}\n.mui-input.mui-disabled {\n  opacity: 0.4;\n}\n.mui-input::-webkit-input-placeholder {\n  position: absolute !important;\n  top: -20px !important;\n}\n.mui-left-nav .mui-left-nav-menu {\n  height: 100%;\n  position: fixed;\n  width: 256px;\n  background-color: #ffffff;\n  z-index: 10;\n  left: 0px;\n  top: 0px;\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-left-nav .mui-left-nav-menu .mui-menu .mui-menu-item {\n  height: 48px;\n  line-height: 48px;\n}\n.mui-left-nav .mui-left-nav-menu .mui-menu a.mui-menu-item {\n  display: block;\n  text-decoration: none;\n  color: rgba(0, 0, 0, 0.87);\n}\n.mui-left-nav.mui-closed .mui-left-nav-menu {\n  transform: translate3d((-1 * 256px) - 10px, 0, 0);\n}\n.mui-menu {\n  background-color: #ffffff;\n}\n.mui-menu * {\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-menu.mui-menu-hideable {\n  opacity: 0;\n  position: absolute;\n  top: 0;\n  z-index: 1;\n}\n.mui-menu.mui-menu-hideable .mui-paper-container {\n  overflow: hidden;\n  padding: 0;\n}\n.mui-menu.mui-menu-hideable.mui-visible > .mui-paper-container {\n  padding-top: 8px;\n  padding-bottom: 8px;\n}\n.mui-menu .mui-paper-container {\n  padding-top: 8px;\n  padding-bottom: 8px;\n}\n.mui-menu .mui-subheader {\n  padding-left: 24px;\n  padding-right: 24px;\n}\n.mui-menu .mui-nested-menu-item {\n  position: relative;\n}\n.mui-menu .mui-nested-menu-item.mui-open > .mui-menu {\n  opacity: 1;\n}\n.mui-menu-item {\n  cursor: pointer;\n  line-height: 48px;\n  padding-left: 24px;\n  padding-right: 24px;\n  background-color: rgba(0, 0, 0, 0);\n}\n.mui-menu-item * {\n  user-select: none;\n}\n.mui-menu-item:hover {\n  background-color: rgba(0, 0, 0, 0.035);\n}\n.mui-menu-item .mui-menu-item-number {\n  float: right;\n  width: 24px;\n  text-align: center;\n}\n.mui-menu-item .mui-menu-item-attribute {\n  float: right;\n}\n.mui-menu-item .mui-menu-item-icon-right {\n  line-height: 48px;\n  float: right;\n}\n.mui-menu-item .mui-menu-item-icon {\n  float: left;\n  line-height: 48px;\n  margin-right: 24px;\n}\n.mui-menu-item .mui-menu-item-data {\n  display: block;\n  padding-left: 48px;\n  line-height: 32px;\n  height: 32px;\n  vertical-align: top;\n  top: -12px;\n  position: relative;\n  font-weight: 300;\n}\n.mui-menu-item .muidocs-icon-custom-arrow-drop-right {\n  margin-right: -8px;\n  color: rgba(0, 0, 0, 0.26);\n}\n.mui-menu-item .mui-toggle {\n  margin-top: 12px;\n  float: right;\n  width: 42px;\n}\n.mui-menu-item.mui-is-selected {\n  color: #ff4081;\n}\n.mui-overlay {\n  position: fixed;\n  height: 100%;\n  width: 100%;\n  z-index: 9;\n  top: 0px;\n  left: -100%;\n  background-color: rgba(0, 0, 0, 0);\n  transition: left 0ms cubic-bezier(0.23, 1, 0.32, 1) 400ms, background-color 400ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-overlay.mui-is-shown {\n  left: 0px;\n  background-color: rgba(0, 0, 0, 0.54);\n  transition: left 0ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, background-color 400ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-paper.mui-rounded {\n  border-radius: 2px;\n}\n.mui-paper.mui-rounded > .mui-paper-container {\n  border-radius: 2px;\n}\n.mui-paper.mui-circle {\n  border-radius: 50%;\n}\n.mui-paper.mui-circle > .mui-paper-container {\n  border-radius: 50%;\n}\n.mui-paper > .mui-paper-container {\n  height: 100%;\n  width: 100%;\n}\n.mui-paper.mui-z-depth-1 {\n  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.24);\n}\n.mui-paper.mui-z-depth-1 > .mui-z-depth-bottom {\n  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);\n}\n.mui-paper.mui-z-depth-2 {\n  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.23);\n}\n.mui-paper.mui-z-depth-2 > .mui-z-depth-bottom {\n  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.16);\n}\n.mui-paper.mui-z-depth-3 {\n  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.23);\n}\n.mui-paper.mui-z-depth-3 > .mui-z-depth-bottom {\n  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.19);\n}\n.mui-paper.mui-z-depth-4 {\n  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.22);\n}\n.mui-paper.mui-z-depth-4 > .mui-z-depth-bottom {\n  box-shadow: 0 14px 45px rgba(0, 0, 0, 0.25);\n}\n.mui-paper.mui-z-depth-5 {\n  box-shadow: 0 15px 20px rgba(0, 0, 0, 0.22);\n}\n.mui-paper.mui-z-depth-5 > .mui-z-depth-bottom {\n  box-shadow: 0 19px 60px rgba(0, 0, 0, 0.3);\n}\n.mui-radio-button .mui-radio-button-icon {\n  height: 24px;\n  width: 24px;\n  margin-right: 16px;\n}\n.mui-radio-button .mui-radio-button-icon .mui-radio-button-fill {\n  position: absolute;\n  opacity: 0;\n  transform: scale(0);\n  transform-origin: 50% 50%;\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-radio-button .mui-radio-button-icon .mui-radio-button-fill * {\n  fill: #00bcd4;\n}\n.mui-radio-button .mui-radio-button-icon .mui-radio-button-target {\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n  position: absolute;\n  opacity: 1;\n  transform: scale(1);\n}\n.mui-radio-button .mui-radio-button-icon .mui-radio-button-target * {\n  fill: rgba(0, 0, 0, 0.87);\n  transition: all 2s cubic-bezier(0.23, 1, 0.32, 1) 200ms;\n}\n.mui-radio-button.mui-is-switched .mui-radio-button-icon .mui-radio-button-fill {\n  opacity: 1;\n  transform: scale(1);\n}\n.mui-radio-button.mui-is-switched .mui-radio-button-icon .mui-radio-button-target {\n  opacity: 0;\n  transform: scale(0);\n}\n.mui-radio-button.mui-is-switched .mui-radio-button-icon .mui-radio-button-target * {\n  fill: #00bcd4;\n  transition: all 100s cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-radio-button.mui-is-disabled .mui-radio-button-icon .mui-radio-button-fill *,\n.mui-radio-button.mui-is-disabled .mui-radio-button-icon .mui-radio-button-target * {\n  fill: rgba(0, 0, 0, 0.3);\n}\n.mui-radio-button.mui-is-required .mui-radio-button-icon .mui-radio-button-target * {\n  fill: #00bcd4;\n}\n.mui-raised-button {\n  display: inline-block;\n  min-width: 88px;\n  height: 36px;\n}\n.mui-raised-button,\n.mui-raised-button * {\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-raised-button .mui-raised-button-container {\n  position: relative;\n  width: 100%;\n  padding: 0;\n  overflow: hidden;\n  border-radius: 2px;\n  background-color: #ffffff;\n  transform: translate3d(0, 0, 0);\n}\n.mui-raised-button .mui-raised-button-container.mui-is-keyboard-focused {\n  background-color: #e6e6e6;\n}\n.mui-raised-button .mui-raised-button-container.mui-is-disabled {\n  background-color: #e6e6e6;\n}\n.mui-raised-button .mui-raised-button-container.mui-is-disabled .mui-raised-button-label {\n  color: rgba(0, 0, 0, 0.3);\n}\n.mui-raised-button .mui-raised-button-container.mui-is-disabled:hover {\n  background-color: #e6e6e6;\n}\n.mui-raised-button .mui-touch-ripple .mui-ripple-circle-inner {\n  background-color: rgba(0, 0, 0, 0.1);\n}\n.mui-raised-button .mui-focus-ripple .mui-focus-ripple-inner {\n  background-color: rgba(0, 0, 0, 0.07);\n}\n.mui-raised-button .mui-raised-button-label {\n  position: relative;\n  font-size: 14px;\n  line-height: 20px;\n  padding-top: 5px;\n  margin-bottom: 15px;\n  letter-spacing: 0;\n  text-transform: uppercase;\n  font-weight: 500;\n  margin: 0;\n  padding: 0 16px;\n  user-select: none;\n  line-height: 36px;\n  color: rgba(0, 0, 0, 0.87);\n}\n.mui-raised-button:hover .mui-raised-button-container {\n  background-color: #e6e6e6;\n}\n.mui-raised-button.mui-is-primary .mui-raised-button-container {\n  background-color: #ff4081;\n}\n.mui-raised-button.mui-is-primary .mui-raised-button-container.mui-is-keyboard-focused {\n  background-color: #f30053;\n}\n.mui-raised-button.mui-is-primary .mui-touch-ripple .mui-ripple-circle-inner {\n  background-color: rgba(255, 255, 255, 0.5);\n}\n.mui-raised-button.mui-is-primary .mui-focus-ripple .mui-focus-ripple-inner {\n  background-color: rgba(255, 255, 255, 0.5);\n}\n.mui-raised-button.mui-is-primary .mui-raised-button-label {\n  color: #ffffff;\n}\n.mui-raised-button.mui-is-primary:hover .mui-raised-button-container {\n  background-color: #f30053;\n}\n.mui-raised-button.mui-is-secondary .mui-raised-button-container {\n  background-color: #00bcd4;\n}\n.mui-raised-button.mui-is-secondary .mui-raised-button-container.mui-is-keyboard-focused {\n  background-color: #00aac0;\n}\n.mui-raised-button.mui-is-secondary .mui-touch-ripple .mui-ripple-circle-inner {\n  background-color: rgba(255, 255, 255, 0.35);\n}\n.mui-raised-button.mui-is-secondary .mui-focus-ripple .mui-focus-ripple-inner {\n  background-color: rgba(255, 255, 255, 0.35);\n}\n.mui-raised-button.mui-is-secondary .mui-raised-button-label {\n  color: #ffffff;\n}\n.mui-raised-button.mui-is-secondary:hover .mui-raised-button-container {\n  background-color: #00aac0;\n}\n.mui-focus-ripple {\n  position: absolute;\n  height: 100%;\n  width: 100%;\n  top: 0;\n  left: 0;\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n  transform: scale(0);\n  opacity: 0;\n}\n.mui-focus-ripple .mui-focus-ripple-inner {\n  position: absolute;\n  height: 100%;\n  width: 100%;\n  border-radius: 50%;\n  background-color: rgba(0, 0, 0, 0.1);\n  animation: focus-ripple-pulsate 1.5s ease 0s infinite;\n}\n@keyframes focus-ripple-pulsate {\n  0%,\n  100% {\n    transform: scale(0.75);\n  }\n  50% {\n    transform: scale(0.85);\n  }\n}\n.mui-focus-ripple.mui-is-shown {\n  transform: scale(1);\n  opacity: 1;\n}\n.mui-ripple-circle {\n  position: absolute;\n  top: 0;\n  left: 0;\n  height: 100%;\n  width: 100%;\n  opacity: 0.7;\n  transition: opacity 2s cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-ripple-circle .mui-ripple-circle-inner {\n  height: 100%;\n  width: 100%;\n  border-radius: 50%;\n  transform: scale(0);\n  background-color: rgba(0, 0, 0, 0.2);\n  transition: transform 1s cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-ripple-circle.mui-is-started {\n  opacity: 1;\n}\n.mui-ripple-circle.mui-is-started .mui-ripple-circle-inner {\n  transform: scale(1);\n}\n.mui-ripple-circle.mui-is-ending {\n  opacity: 0;\n}\n.mui-touch-ripple {\n  height: 100%;\n  width: 100%;\n  position: absolute;\n  top: 0;\n  left: 0;\n}\n.react-draggable-dragging {\n  user-select: none;\n}\n.mui-slider {\n  -webkit-touch-callout: none;\n  cursor: default;\n  height: 12px * 2;\n  position: relative;\n}\n.mui-slider .mui-slider-track {\n  position: absolute;\n  top: (12px * 2 - 2px) / 2;\n  left: 0;\n  width: 100%;\n  height: 2px;\n}\n.mui-slider .mui-slider-selection {\n  position: absolute;\n  top: 0;\n  height: 100%;\n}\n.mui-slider .mui-slider-selection .mui-slider-selection-fill {\n  height: 100%;\n  transition: margin 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-slider .mui-slider-selection-low {\n  left: 0;\n}\n.mui-slider .mui-slider-selection-low .mui-slider-selection-fill {\n  background-color: #b2ebf2;\n  margin-right: 8px - 2px;\n}\n.mui-slider .mui-slider-selection-high {\n  right: 0;\n}\n.mui-slider .mui-slider-selection-high .mui-slider-selection-fill {\n  background-color: rgba(0, 0, 0, 0.26);\n  margin-left: 8px - 2px;\n}\n.mui-slider .mui-slider-handle {\n  cursor: pointer;\n  position: absolute;\n  top: 0;\n  left: 0%;\n  z-index: 1;\n  margin: 1px 0 0 0;\n  background-clip: padding-box;\n  border-radius: 50%;\n  transform: translate(-50%, -50%);\n  transition: border 450ms cubic-bezier(0.23, 1, 0.32, 1), width 450ms cubic-bezier(0.23, 1, 0.32, 1), height 450ms cubic-bezier(0.23, 1, 0.32, 1);\n  width: 12px;\n  height: 12px;\n}\n.mui-slider .mui-slider-handle:focus {\n  outline: none;\n}\n.mui-slider:not(.mui-disabled) .mui-slider-handle {\n  border: 0px solid transparent;\n  background-color: #b2ebf2;\n}\n.mui-slider:not(.mui-disabled) .mui-slider-handle:active {\n  width: 12px * 2;\n  height: 12px * 2;\n}\n.mui-slider:not(.mui-disabled):hover .mui-slider-selection-high .mui-slider-selection-fill,\n.mui-slider:not(.mui-disabled):focus .mui-slider-selection-high .mui-slider-selection-fill {\n  background: #9e9e9e;\n}\n.mui-slider:not(.mui-disabled):hover:not(.mui-slider-zero) .mui-slider-handle:not(:active),\n.mui-slider:not(.mui-disabled):focus:not(.mui-slider-zero) .mui-slider-handle:not(:active) {\n  border: 12px solid rgba(178, 235, 242, 0.2);\n  width: 12px * 2 + 12px;\n  height: 12px * 2 + 12px;\n}\n.mui-slider:not(.mui-disabled).mui-slider-zero .mui-slider-handle {\n  border: 2px solid rgba(0, 0, 0, 0.26);\n  background-color: transparent;\n  box-shadow: none;\n}\n.mui-slider:not(.mui-disabled).mui-slider-zero .mui-slider-handle:active {\n  border-color: #9e9e9e;\n  width: 12px * 2 !important;\n  height: 12px * 2 !important;\n  transition: background-color 450ms cubic-bezier(0.23, 1, 0.32, 1), width 450ms cubic-bezier(0.23, 1, 0.32, 1), height 450ms cubic-bezier(0.23, 1, 0.32, 1);\n}\n.mui-slider:not(.mui-disabled).mui-slider-zero .mui-slider-handle:active ~ .mui-slider-selection-high .mui-slider-selection-fill {\n  margin-left: 12px !important;\n  transition: margin 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-slider:not(.mui-disabled).mui-slider-zero:hover .mui-slider-handle,\n.mui-slider:not(.mui-disabled).mui-slider-zero:focus .mui-slider-handle {\n  border: 2px solid #bdbdbd;\n  width: 12px + 2px;\n  height: 12px + 2px;\n}\n.mui-slider.mui-disabled {\n  cursor: not-allowed;\n}\n.mui-slider.mui-disabled .mui-slider-selection-fill {\n  background-color: rgba(0, 0, 0, 0.26);\n}\n.mui-slider.mui-disabled .mui-slider-handle {\n  cursor: not-allowed;\n  background-color: rgba(0, 0, 0, 0.26);\n  width: 8px;\n  height: 8px;\n}\n.mui-slider.mui-disabled.mui-slider-zero .mui-slider-selection-low .mui-slider-selection-fill {\n  margin-right: (8px + 2px) / 2;\n}\n.mui-slider.mui-disabled.mui-slider-zero .mui-slider-selection-high .mui-slider-selection-fill {\n  margin-left: (8px + 2px) / 2;\n}\n.mui-slider.mui-disabled.mui-slider-zero .mui-slider-handle {\n  border: 2px solid rgba(0, 0, 0, 0.26);\n  background-color: transparent;\n}\n.mui-snackbar {\n  color: white;\n  background-color: #323232;\n  border-radius: 2px;\n  padding: 0 24px;\n  height: 48px;\n  line-height: 48px;\n  min-width: 288px;\n  max-width: 568px;\n  position: fixed;\n  z-index: 10;\n  bottom: 24px;\n  margin-left: 24px;\n  left: -10000px;\n  opacity: 0;\n  transform: translate3d(0, 20px, 0);\n  transition: left 0ms cubic-bezier(0.23, 1, 0.32, 1) 400ms, opacity 400ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, transform 400ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-snackbar .mui-snackbar-action {\n  color: #ff4081;\n  float: right;\n  margin-top: 6px;\n  margin-right: -16px;\n  margin-left: 24px;\n  background-color: transparent;\n}\n.mui-snackbar.mui-is-open {\n  left: 0;\n  opacity: 1;\n  transform: translate3d(0, 0, 0);\n  transition: left 0ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, opacity 400ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, transform 400ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-subheader {\n  font-size: 13px;\n  line-height: 24px;\n  padding-top: 4px;\n  margin-bottom: 12px;\n  letter-spacing: 0;\n  font-weight: 500;\n  color: rgba(0, 0, 0, 0.87);\n  margin: 0;\n  height: 48px + 8px;\n  line-height: 48px;\n  color: #00bcd4;\n  border-top: solid 1px #e0e0e0;\n  padding-top: 8px;\n  margin-top: 8px;\n}\n.mui-subheader:first-child {\n  height: 48px;\n  border-top: none;\n  padding-top: 0;\n  margin-top: 0;\n}\n.mui-svg-icon {\n  position: relative;\n  height: 24px;\n  width: 24px;\n  display: inline-block;\n  user-select: none;\n}\n.mui-svg-icon * {\n  fill: rgba(0, 0, 0, 0.87);\n}\n.mui-table {\n  padding: 0 24px;\n}\n.mui-table .mui-table-header .mui-table-header-column {\n  display: inline-block;\n  height: 48px;\n  line-height: 48px;\n  width: 200px;\n}\n.mui-table .mui-table-header .mui-table-header-pagify {\n  display: inline-block;\n  height: 48px;\n  line-height: 48px;\n  float: right;\n}\n.mui-table .mui-table-rows .mui-table-rows-item {\n  height: 48px;\n  line-height: 48px;\n  display: block;\n  width: 100%;\n}\n.mui-table .mui-table-rows .mui-table-rows-actions {\n  height: 48px;\n  line-height: 48px;\n  display: inline-block;\n  float: right;\n}\n.mui-tabs-container {\n  position: relative;\n}\n.mui-tabs-container .mui-tab-item-container {\n  margin: 0;\n  padding: 0;\n  width: 100%;\n  height: 48px;\n  background-color: #00bcd4;\n  white-space: nowrap;\n  display: block;\n}\n.mui-tabs-container .mui-tab-item-container .mui-tab-item {\n  display: inline-block;\n  height: 100%;\n  cursor: pointer;\n  text-align: center;\n  line-height: 48px;\n  color: #fff;\n  opacity: .6;\n  font-size: 14sp;\n  font-weight: 500;\n  font: 'Roboto', sans-serif;\n}\n.mui-tabs-container .mui-tab-item-container .mui-tab-item.mui-tab-is-active {\n  color: #fff;\n  opacity: 1;\n  font: 'Roboto', sans-serif;\n}\n.mui-tabs-container .mui-tab-item-container .mui-tab-item .mui-tab-template {\n  display: block;\n  width: 100%;\n  position: relative;\n  text-align: initial;\n}\n.mui-text-field {\n  font-size: 16px;\n  line-height: 24px;\n  width: 256px;\n  height: 48px;\n  display: inline-block;\n  position: relative;\n  transition: height 200ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-text-field .mui-text-field-hint,\n.mui-text-field .mui-text-field-floating-label {\n  position: absolute;\n  line-height: 48px;\n  color: rgba(0, 0, 0, 0.3);\n  opacity: 1;\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-text-field .mui-text-field-error {\n  position: absolute;\n  bottom: -10px;\n  font-size: 12px;\n  line-height: 12px;\n  color: #f44336;\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-text-field .mui-text-field-input,\n.mui-text-field .mui-text-field-textarea {\n  position: relative;\n  width: 100%;\n  height: 100%;\n  border: none;\n  outline: none;\n  background-color: rgba(0, 0, 0, 0);\n  color: rgba(0, 0, 0, 0.87);\n}\n.mui-text-field .mui-text-field-textarea {\n  margin-top: 12px;\n}\n.mui-text-field .mui-text-field-underline,\n.mui-text-field .mui-text-field-focus-underline {\n  position: absolute;\n  width: 100%;\n  bottom: 8px;\n  margin: 0;\n}\n.mui-text-field .mui-text-field-focus-underline {\n  border-color: #00bcd4;\n  border-bottom-width: 2px;\n  transform: scaleX(0);\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-text-field.mui-has-error .mui-text-field-focus-underline {\n  border-color: #f44336;\n  transform: scaleX(1);\n}\n.mui-text-field.mui-has-value .mui-text-field-hint {\n  opacity: 0;\n}\n.mui-text-field.mui-is-disabled .mui-text-field-input {\n  color: rgba(0, 0, 0, 0.3);\n}\n.mui-text-field.mui-is-disabled .mui-text-field-underline {\n  border: none;\n  height: 40px;\n  overflow: hidden;\n}\n.mui-text-field.mui-is-disabled .mui-text-field-underline:after {\n  content: '..............................................................................................................................................................................................................................................................................................................................................................';\n  position: absolute;\n  top: 23px;\n  color: rgba(0, 0, 0, 0.3);\n}\n.mui-text-field.mui-is-focused .mui-text-field-focus-underline {\n  transform: scaleX(1);\n}\n.mui-text-field.mui-has-floating-labels {\n  height: 72px;\n}\n.mui-text-field.mui-has-floating-labels .mui-text-field-floating-label {\n  top: 24px;\n  transform: scale(1) translate3d(0, 0, 0);\n  transform-origin: left top;\n}\n.mui-text-field.mui-has-floating-labels .mui-text-field-hint {\n  top: 24px;\n  opacity: 0;\n}\n.mui-text-field.mui-has-floating-labels .mui-text-field-input {\n  padding-top: 24px;\n}\n.mui-text-field.mui-has-floating-labels.mui-has-value .mui-text-field-floating-label,\n.mui-text-field.mui-has-floating-labels.mui-is-focused .mui-text-field-floating-label {\n  transform: scale(0.75) translate3d(0, -18px, 0);\n}\n.mui-text-field.mui-has-floating-labels.mui-has-value .mui-text-field-floating-label {\n  color: rgba(0, 0, 0, 0.5);\n}\n.mui-text-field.mui-has-floating-labels.mui-is-disabled .mui-text-field-hint {\n  color: rgba(0, 0, 0, 0.3);\n}\n.mui-text-field.mui-has-floating-labels.mui-is-focused .mui-text-field-hint {\n  opacity: 1;\n}\n.mui-text-field.mui-has-floating-labels.mui-is-focused .mui-text-field-floating-label {\n  transform: scale(0.75) translate3d(0, -18px, 0);\n  color: #00bcd4;\n}\n.mui-text-field.mui-has-floating-labels.mui-is-focused.mui-has-error .mui-text-field-floating-label {\n  color: #f44336;\n}\n.mui-text-field.mui-has-floating-labels.mui-is-focused.mui-has-value .mui-text-field-hint {\n  opacity: 0;\n}\n.mui-toggle .mui-toggle-icon {\n  padding: 4px 0px 6px 2px;\n  margin-right: 8px;\n}\n.mui-toggle .mui-toggle-icon .mui-toggle-track {\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n  width: 36px;\n  height: 14px;\n  border-radius: 30px;\n  background-color: rgba(0, 0, 0, 0.26);\n}\n.mui-toggle .mui-toggle-icon .mui-toggle-thumb {\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n  position: absolute;\n  top: 1px;\n  left: 2px;\n  width: 20px;\n  height: 20px;\n  line-height: 24px;\n  border-radius: 50%;\n  background-color: #fafafa;\n}\n.mui-toggle .mui-toggle-icon .mui-toggle-thumb .mui-paper-container {\n  border-radius: 50%;\n}\n.mui-toggle .mui-toggle-icon .mui-toggle-thumb .mui-touch-ripple,\n.mui-toggle .mui-toggle-icon .mui-toggle-thumb .mui-focus-ripple-inner {\n  width: 200%;\n  height: 200%;\n  top: -10px;\n  left: -10px;\n}\n.mui-toggle.mui-is-switched .mui-toggle-icon .mui-toggle-track {\n  background-color: rgba(0, 188, 212, 0.5);\n}\n.mui-toggle.mui-is-switched .mui-toggle-icon .mui-toggle-thumb {\n  left: 18px;\n  background-color: #00bcd4;\n}\n.mui-toggle.mui-is-disabled .mui-toggle-icon {\n  cursor: default;\n}\n.mui-toggle.mui-is-disabled .mui-toggle-icon .mui-toggle-track {\n  background-color: rgba(0, 0, 0, 0.12);\n}\n.mui-toggle.mui-is-disabled .mui-toggle-icon .mui-toggle-thumb {\n  background-color: #bdbdbd;\n}\n.mui-toggle.mui-is-required .mui-toggle-icon .mui-toggle-track {\n  background-color: rgba(0, 188, 212, 0.5);\n}\n.mui-toggle.mui-is-required .mui-toggle-icon .mui-toggle-thumb {\n  background-color: #00bcd4;\n}\n.mui-toolbar {\n  background-color: #e1e1e1;\n  height: 56px;\n  width: 100%;\n  padding: 0 24px;\n}\n.mui-toolbar .mui-toolbar-group {\n  position: relative;\n}\n.mui-toolbar .mui-toolbar-group .mui-toolbar-title {\n  padding-right: 16px;\n  line-height: 56px;\n}\n.mui-toolbar .mui-toolbar-group .mui-toolbar-separator {\n  background-color: rgba(0, 0, 0, 0.175);\n  display: inline-block;\n  height: 32px;\n  margin-left: 24px;\n  position: relative;\n  top: 12px;\n  width: 1px;\n}\n.mui-toolbar .mui-toolbar-group .mui-raised-button,\n.mui-toolbar .mui-toolbar-group .mui-flat-button {\n  margin: 0 24px;\n  margin-top: 10px;\n  position: relative;\n}\n.mui-toolbar .mui-toolbar-group .mui-drop-down-menu {\n  color: rgba(0, 0, 0, 0.54);\n  display: inline-block;\n  margin-right: 24px;\n}\n.mui-toolbar .mui-toolbar-group .mui-drop-down-menu .mui-menu-control-bg {\n  background-color: #ffffff;\n  border-radius: 0;\n}\n.mui-toolbar .mui-toolbar-group .mui-drop-down-menu .mui-menu-control .mui-menu-control-underline {\n  display: none;\n}\n.mui-toolbar .mui-toolbar-group .mui-drop-down-menu .mui-font-icon:hover {\n  color: rgba(0, 0, 0, 0.4);\n}\n.mui-toolbar .mui-toolbar-group .mui-font-icon {\n  color: rgba(0, 0, 0, 0.4);\n  cursor: pointer;\n  line-height: 56px;\n  padding-left: 24px;\n}\n.mui-toolbar .mui-toolbar-group .mui-font-icon:hover {\n  color: rgba(0, 0, 0, 0.87);\n  z-index: 1;\n}\n.mui-toolbar .mui-toolbar-group.mui-left {\n  float: left;\n}\n.mui-toolbar .mui-toolbar-group.mui-left .mui-drop-down-menu,\n.mui-toolbar .mui-toolbar-group.mui-left .mui-font-icon,\n.mui-toolbar .mui-toolbar-group.mui-left .mui-toolbar-separator,\n.mui-toolbar .mui-toolbar-group.mui-left .mui-drop-down-icon {\n  float: left;\n}\n.mui-toolbar .mui-toolbar-group.mui-left:first-child {\n  margin-left: -24px;\n}\n.mui-toolbar .mui-toolbar-group.mui-left:first-child .mui-toolbar-title {\n  margin-left: 24px;\n}\n.mui-toolbar .mui-toolbar-group.mui-right {\n  float: right;\n}\n.mui-toolbar .mui-toolbar-group.mui-right * {\n  vertical-align: top;\n}\n.mui-toolbar .mui-toolbar-group.mui-right:last-child {\n  margin-right: -24px;\n}\n.mui-tooltip {\n  position: absolute;\n  font-family: 'Roboto', sans-serif;\n  font-size: 10px;\n  line-height: 22px;\n  padding: 0 8px;\n  color: #ffffff;\n  overflow: hidden;\n  top: -10000px;\n  border-radius: 2px;\n  user-select: none;\n  opacity: 0;\n  transition: top 0ms cubic-bezier(0.23, 1, 0.32, 1) 450ms, transform 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, opacity 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-tooltip .mui-tooltip-label {\n  position: relative;\n  white-space: nowrap;\n}\n.mui-tooltip .mui-tooltip-ripple {\n  position: absolute;\n  left: 50%;\n  top: 0px;\n  transform: translate(-50%, -50%);\n  border-radius: 50%;\n  background-color: transparent;\n  transition: width 0ms cubic-bezier(0.23, 1, 0.32, 1) 450ms, height 0ms cubic-bezier(0.23, 1, 0.32, 1) 450ms, background-color 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-tooltip.mui-is-shown {\n  top: -16px;\n  opacity: 1;\n  transform: translate3d(0px, 16px, 0px);\n  transition: top 0ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, transform 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, opacity 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-tooltip.mui-is-shown .mui-tooltip-ripple {\n  background-color: #757575;\n  transition: width 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, height 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, background-color 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-tooltip.mui-is-touch {\n  font-size: 14px;\n  line-height: 44px;\n  padding: 0 16px;\n}\n.mui-tooltip.mui-is-touch.mui-is-shown .mui-tooltip-ripple {\n  height: 105px;\n  width: 105px;\n}\n.mui-transition-slide-in {\n  position: relative;\n  overflow: hidden;\n  height: 100%;\n}\n.mui-transition-slide-in .mui-transition-slide-in-child {\n  position: absolute;\n  height: 100%;\n  width: 100%;\n  top: 0px;\n  left: 0px;\n  transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;\n}\n.mui-transition-slide-in .mui-transition-slide-in-enter {\n  opacity: 0;\n}\n.mui-transition-slide-in .mui-transition-slide-in-enter-active {\n  opacity: 1;\n}\n.mui-transition-slide-in .mui-transition-slide-in-leave {\n  opacity: 1;\n}\n.mui-transition-slide-in .mui-transition-slide-in-leave-active {\n  opacity: 0;\n}\n.mui-transition-slide-in.mui-is-left .mui-transition-slide-in-enter {\n  transform: translate3d(100%, 0, 0);\n}\n.mui-transition-slide-in.mui-is-left .mui-transition-slide-in-enter-active {\n  transform: translate3d(0, 0, 0);\n}\n.mui-transition-slide-in.mui-is-left .mui-transition-slide-in-leave {\n  transform: translate3d(0, 0, 0);\n}\n.mui-transition-slide-in.mui-is-left .mui-transition-slide-in-leave-active {\n  transform: translate3d(-100%, 0, 0);\n}\n.mui-transition-slide-in.mui-is-right .mui-transition-slide-in-enter {\n  transform: translate3d(-100%, 0, 0);\n}\n.mui-transition-slide-in.mui-is-right .mui-transition-slide-in-enter-active {\n  transform: translate3d(0, 0, 0);\n}\n.mui-transition-slide-in.mui-is-right .mui-transition-slide-in-leave {\n  transform: translate3d(0, 0, 0);\n}\n.mui-transition-slide-in.mui-is-right .mui-transition-slide-in-leave-active {\n  transform: translate3d(100%, 0, 0);\n}\n.mui-transition-slide-in.mui-is-up .mui-transition-slide-in-enter {\n  transform: translate3d(0, 100%, 0);\n}\n.mui-transition-slide-in.mui-is-up .mui-transition-slide-in-enter-active {\n  transform: translate3d(0, 0, 0);\n}\n.mui-transition-slide-in.mui-is-up .mui-transition-slide-in-leave {\n  transform: translate3d(0, 0, 0);\n}\n.mui-transition-slide-in.mui-is-up .mui-transition-slide-in-leave-active {\n  transform: translate3d(0, -100%, 0);\n}\n.mui-transition-slide-in.mui-is-down .mui-transition-slide-in-enter {\n  transform: translate3d(0, -100%, 0);\n}\n.mui-transition-slide-in.mui-is-down .mui-transition-slide-in-enter-active {\n  transform: translate3d(0, 0, 0);\n}\n.mui-transition-slide-in.mui-is-down .mui-transition-slide-in-leave {\n  transform: translate3d(0, 0, 0);\n}\n.mui-transition-slide-in.mui-is-down .mui-transition-slide-in-leave-active {\n  transform: translate3d(0, 100%, 0);\n}\n.task-input {\n  width: 100%;\n}\n.page-with-nav-contents {\n  padding-top: 64px;\n}\n.page-with-nav-contents input {\n  padding: 0 10px;\n}\n.page-with-nav-contents .mui-text-field-hint {\n  padding: 0 10px;\n}\n", ""]);

/***/ },

/***/ 33:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports.todoItem = 'TODO_ITEM';


/***/ },

/***/ 34:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var React = __webpack_require__(10);
	var Morearty = __webpack_require__(2);
	var mui = __webpack_require__(8);
	var TextField = React.createFactory(mui.TextField);


	var Input = React.createClass({
	  displayName: "Input",

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

	  focus: function() {
	    this.refs.input.focus();
	    var dom = this.refs.input.refs.input.getDOMNode();
	    dom.setSelectionRange(dom.value.length, dom.value.length);
	  },

	  render: function () {
	    var props = Morearty.Util.assign({}, this.props, {
	      ref: "input",
	      value: this.state.value,
	      onChange: this.onChange,
	      children: this.props.children
	    });
	    return TextField(props);
	  }
	});

	module.exports = Input;


/***/ },

/***/ 79:
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isIE9 = memoize(function() {
			return /msie 9\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0;

	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}

		options = options || {};
		// Force single-tag solution on IE9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isIE9();

		var styles = listToStyles(list);
		addStylesToDom(styles, options);

		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}

	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}

	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}

	function createStyleElement() {
		var styleElement = document.createElement("style");
		var head = getHeadElement();
		styleElement.type = "text/css";
		head.appendChild(styleElement);
		return styleElement;
	}

	function addStyle(obj, options) {
		var styleElement, update, remove;

		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement());
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else {
			styleElement = createStyleElement();
			update = applyToTag.bind(null, styleElement);
			remove = function () {
				styleElement.parentNode.removeChild(styleElement);
			};
		}

		update(obj);

		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}

	function replaceText(source, id, replacement) {
		var boundaries = ["/** >>" + id + " **/", "/** " + id + "<< **/"];
		var start = source.lastIndexOf(boundaries[0]);
		var wrappedReplacement = replacement
			? (boundaries[0] + replacement + boundaries[1])
			: "";
		if (source.lastIndexOf(boundaries[0]) >= 0) {
			var end = source.lastIndexOf(boundaries[1]) + boundaries[1].length;
			return source.slice(0, start) + wrappedReplacement + source.slice(end);
		} else {
			return source + wrappedReplacement;
		}
	}

	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;

		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(styleElement.styleSheet.cssText, index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}

	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;

		if(sourceMap && typeof btoa === "function") {
			try {
				css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(JSON.stringify(sourceMap)) + " */";
				css = "@import url(\"data:text/css;base64," + btoa(css) + "\")";
			} catch(e) {}
		}

		if(media) {
			styleElement.setAttribute("media", media)
		}

		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}


/***/ },

/***/ 458:
/***/ function(module, exports, __webpack_require__) {

	module.exports = function() {
		var list = [];
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};
		return list;
	}

/***/ }

});