var React = require('react/addons');
var Morearty = require('morearty');
var Reflux = require('reflux');
var Immutable = require('immutable');
var uuid = require('node-uuid');

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
