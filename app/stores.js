'use strict';

var React = require('react/addons');
var Morearty = require('morearty');
var Reflux = require('reflux');
var Immutable = require('immutable');
var uuid = require('node-uuid');

var NOW_SHOWING = Object.freeze({ALL: 'all', ACTIVE: 'active', COMPLETED: 'completed'});

var state = {
  selected: null,
  items: {},
  sorting: []
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


var ItemsStore = Reflux.createStore({
  listenables: ItemsActions,

  init: function() {
    this.rootBinding = this.getMoreartyContext().getBinding();
    this.itemsBinding = this.rootBinding.sub('items');
    this.sortingBinding = this.rootBinding.sub('sorting');
  },

  findIndex: function(id) {
    return this.sortingBinding.get().indexOf(id);
  },

  onAdd: function (item, last) {
    var selectedIdx;
    if(last) {
      selectedIdx = this.itemsBinding.get().count();
    } else {
      var selected = this.rootBinding.get("selected");
      selectedIdx = this.findIndex(selected);
    }

    var id = uuid.v4();
    this.itemsBinding.update(function (items) {
      var newItem = Immutable.Map({val: item});
      return items.set(id, newItem);
    });

    this.sortingBinding.update(function (sorting) {
      if(selectedIdx !== -1) {
        return sorting.splice(selectedIdx+1, 0, id);
      } else {
        return sorting.push(id);
      }
    });
    this.rootBinding.set('selected', id);
  },

  onUpdate: function (id, item) {
    this.itemsBinding.set(id, Immutable.Map(item));
  },

  onRemove: function (id) {
    var sortingIndex = this.findIndex(id);
    var itemBinding = this.itemsBinding.sub(sortingIndex);

    this.itemsBinding.delete(id);
    this.sortingBinding.delete(sortingIndex);
  },

  onSelect: function(id) {
    this.rootBinding.set('selected', id);
  },
  onMove: function(id, afterID) {
    var index = this.findIndex(id);
    var afterIndex = this.findIndex(afterID);

    this.sortingBinding.update(function (sorting) {
      return sorting.splice(index, 1)
                    .splice(afterIndex, 0, id);
    });
  },
  onSortUp: function(id) {
    var index = this.findIndex(id);
    if(index === 0)
      index = this.sortingBinding.get().count();
    var afterID = this.sortingBinding.get(index - 1);
    this.onMove(id, afterID);
  },
  onSortDown: function(id) {
    var index = this.findIndex(id);
    if(index === this.sortingBinding.get().count() - 1)
      index = -1;
    var afterID = this.sortingBinding.get(index + 1);
    this.onMove(id, afterID);
  },
  onNext: function() {
    var selected = this.rootBinding.get("selected");
    var selectedIdx = this.findIndex(selected);
    // Loop
    if(this.itemsBinding.get().count() === selectedIdx + 1)
      selectedIdx = -1;
    var newSelected = this.sortingBinding.get(selectedIdx + 1);
    this.rootBinding.set('selected', newSelected);
  },
  onPrev: function() {
    var selected = this.rootBinding.get("selected");
    var selectedIdx = this.findIndex(selected);
    var newSelected = this.sortingBinding.get(selectedIdx - 1);
    this.rootBinding.set('selected', newSelected);
  }
});

module.exports.Ctx = Ctx;
module.exports.actions = ItemsActions;
module.exports.store = ItemsStore;
