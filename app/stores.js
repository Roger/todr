'use strict';

var React = require('react/addons');
var Morearty = require('morearty');
var Reflux = require('reflux');
var Immutable = require('immutable');
var PouchDB = require('pouchdb');
var uuid = require('node-uuid');

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
