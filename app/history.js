'use strict';

var React = require('react/addons');
var Morearty = require('morearty');

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
