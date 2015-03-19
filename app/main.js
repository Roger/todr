var React = require('react/addons');
var Morearty = require('morearty');

var List = React.createFactory(require('./todo').List);
var History = React.createFactory(require('./history'));

var stores = require('./stores');

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
