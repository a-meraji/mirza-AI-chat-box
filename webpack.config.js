const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'mirza-chat-box.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'MirzaChatBox',
      type: 'umd',
      export: ['MirzaChatBox']
    },
    globalObject: 'this',
    clean: true,
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@components': path.resolve(__dirname, 'src/components')
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'demo.html',
      filename: 'index.html',
      inject: true
    }),
    new HtmlWebpackPlugin({
      template: 'integration-example.html',
      filename: 'integration-example.html',
      inject: false
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    hot: true,
    open: true
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    usedExports: true
  },
  performance: {
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false
  }
}; 