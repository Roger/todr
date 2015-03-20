'use strict';

var React = require('react/addons');
var Morearty = require('morearty');
var ROM = React.DOM;

var sortTypes = require('./sortTypes');
var DragDropMixin = require('react-dnd').DragDropMixin;

var mui = require('material-ui');
var FlatButton = React.createFactory(mui.FlatButton);

var Input = React.createFactory(require('./input'));

var stores = require('./stores');
var actions = stores.actions;

var Item = React.createClass({
  displayName: 'Item',
  mixins: [DragDropMixin, Morearty.Mixin],
  statics: {
    configureDragDrop: function(register) {
      register(sortTypes.todoItem, {
        dragSource: {
          beginDrag: function(component) {
            var binding = component.getDefaultBinding();
            var item = binding.get();

            return {
              item: {
                id: item.get("id")
              }
            };
          }
        },
        dropTarget: {
          over: function(component, item) {
            var binding = component.getDefaultBinding();
            var componentItem = binding.get();
            actions.move(componentItem.get("id"), item.id);
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
        actions.sortUp(item.get("id"));
      } else {
        actions.prev();
      }
      event.preventDefault();
    } else if(key === "ArrowDown") {
      if(shift) {
        actions.sortDown(item.get("id"));
      } else {
        actions.next();
      }
      event.preventDefault();
    } else if(key === "Backspace" || key === "Delete") {
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
        onChange: Morearty.Callback.set(binding, 'val'),
        value: item.get("val")
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
      FlatButton({key: "link", label: "Add New Task", onClick: this.onAdd})
    ]);
  }
});


module.exports.List = List;
