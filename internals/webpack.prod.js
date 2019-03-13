const webpack = require('webpack');
// Plugins
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const CleanPlugin = require('clean-webpack-plugin');

const { joinToCwd, joinToDist } = require('./joinToUtils');
const { optionalFilesCopyRules } = require('./optionalFilesCopyRules');
const pkg = require('../package.json');

const optionalFileRules = optionalFilesCopyRules(['config.json', 'schema.json'], {
  root: joinToCwd(),
  outputPath: joinToDist()
});

module.exports = () => ({
  mode: 'production',
  output: {
    filename: '[name].[hash].js',
    path: joinToDist()
  },
  entry: {
    app: joinToCwd('src', 'index.js')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|otf)$/,
        loader: 'file-loader?name=[name].[ext]'
      },
      {
        test: /\.(mp4|webm|ogv|ogg)$/,
        loader: 'file-loader?name=[name].[ext]'
      },
      {
        test: /\.s?css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        use: [
          { loader: 'file-loader?name=[name].[ext]' },
          {
            loader: 'image-webpack-loader',
            options: {
              pngquant: {
                quality: '65-90',
                speed: 4
              },
              optipng: {
                optimizationLevel: 7
              },
              mozjpeg: {
                progressive: true
              },
              gifsicle: {
                interlaced: false
              }
            }
          }
        ]
      }
    ]
  },
  resolve: {
    symlinks: false,
    modules: ['src', 'node_modules']
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: 'initial',
          minChunks: 2,
          maxInitialRequests: 5, // The default limit is too small to showcase the effect
          minSize: 0
        },
        vendor: {
          test: /node_modules/,
          chunks: 'initial',
          name: 'vendor',
          priority: 10,
          enforce: true
        }
      }
    }
  },
  plugins: [
    new CleanPlugin([joinToDist()], { root: joinToCwd() }),
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[id].[hash].css'
    }),
    new HtmlWebpackPlugin({
      template: joinToCwd('index.html')
    }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production'
    }),
    new CopyPlugin([
      { from: joinToCwd('package.json'), to: joinToDist('package.json') },
      { from: joinToCwd('images'), to: 'images' },
      { from: joinToCwd('scripts'), to: 'scripts' },
      { from: joinToCwd('index.css'), to: '' }
    ].concat(optionalFileRules)),
    new ZipPlugin({
      filename: `${pkg.name}-v${pkg.version}.zip`
    })
  ]
});
