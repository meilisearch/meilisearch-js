const path = require('path')

module.exports = {
  entry: './src/index.ts',
  target: 'node', // this mean that the `main` field will be used
  devtool: 'inline-source-map',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.js'], //resolve all the modules other than index.ts
  },
  module: {
    rules: [
      {
        use: 'ts-loader',
        test: /\.ts?$/,
      },
    ],
  },
}
