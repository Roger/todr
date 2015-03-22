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
      if(item.get("title") === "") {
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
        value: item.get("title")
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
