var webpack = require('webpack');

var config = {
  // We split the entry into two specific chunks. Our app and vendors. Vendors
  // specify that react should be part of that chunk
  entry: {
    app: ['./app/main.js'],
    vendors: ['react', 'material-ui', 'morearty', 'node-uuid', 'reflux',
              'react-tap-event-plugin', 'pouchdb', 'delta-pouch', 'immutable']
  },
  resolve: { alias: {} },
  
  // We add a plugin called CommonsChunkPlugin that will take the vendors chunk
  // and create a vendors.js file. As you can see the first argument matches the key
  // of the entry, "vendors"
  plugins: [
    new webpack.optimize.CommonsChunkPlugin('vendors', 'vendors.js')
  ],
  output: {
    path: './public',
    filename: 'bundle.js'
  },
  module: {
    noParse: [/lie.js/, /leveldb.js/],
    loaders: [
      {
        test: /\.less$/,
        loader: "style-loader!css-loader!less-loader?strictMath&cleancss"
      },
      {
        test: /\.css/,
        loader: "style-loader!css-loader?strictMath&cleancss"
      }
      //{ test: /\.js$/, loader: 'jsx-loader' }
    ]
  }
};

module.exports = config;
