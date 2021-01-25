const webpack = require('webpack')
const path = require('path')

let config = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, './public'),
    filename: './bundle.js',
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    mainFields: ['module', 'browser'], // the `module` field has priority on the browser field
  },
}

module.exports = config
