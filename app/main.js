'use strict';

var React = require('react/addons');
var Morearty = require('morearty');

var mui = require('material-ui');
var AppCanvas = React.createFactory(mui.AppCanvas);
var AppBar = React.createFactory(mui.AppBar);

var List = React.createFactory(require('./todo').List);
var History = React.createFactory(require('./history'));

// Needed for onTouchTap Can go away when react 1.0 release
// Check this repo: https://github.com/zilverline/react-tap-event-plugin
var injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();

var stores = require('./stores');

var ROM = React.DOM;

require('./style.less');


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
