var React = require('react/addons');
var Morearty = require('morearty');
var mui = require('material-ui');
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
