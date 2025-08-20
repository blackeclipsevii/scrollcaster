// webpack.config.js
const path = require('path');
const glob = require('glob');
const TerserPlugin = require('terser-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = {
  mode: 'production', // ensures optimization runs
  entry: glob.sync('./dist/**/*.js').map(filename => path.resolve(__dirname, filename)),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'output'),
    clean: true
  },
  optimization: {
    minimize: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
  plugins: [
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: true,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
};
