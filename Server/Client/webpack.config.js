var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var ExtractCss = new ExtractTextPlugin('styles.css');
var ExtractSass = new ExtractTextPlugin('sass.css');

var PROD = true;

module.exports = {

    stats: {
        colors: true,
        hash: false,
        version: false,
        timings: false,
        assets: false,
        chunks: false,
        modules: false,
        reasons: false,
        children: false,
        source: false,
        warnings: true,
        errorDetails: true,
        errors: true,
        publicPath: false
    },

    entry: './tunnelwp.js',

    output: {
        path: path.resolve(__dirname, 'build'),
        publicPath: 'c9.tunnel.com/',
        filename: 'bundle.js'
    },

    plugins: [
         ExtractCss,
         ExtractSass
    ],

    module: {
        rules: [
        {
            test: /\.js$/,
            use:  ["stripcomment-loader"]
        },


          {
              test: /\.css$/,
              use: ExtractCss.extract({
                  fallback: "style-loader",
                  use: [
                      {
                          loader: "css-loader",
                          options: {
                              minimize: PROD
                          }
                      },
                      "stripcomment-loader"
                      
                  ]
              })
          },

          {
              test: /\.scss$/,
              use: ExtractSass.extract({
                  fallback: "style-loader",
                  use: [
                      {
                          loader: "css-loader",
                          options: {
                              minimize: PROD
                          }
                      },
                      "postcss-loader",
                      "sass-loader",
                      "stripcomment-loader"
                  ]
              })
          },

          {
              test: /\.(png|woff|woff2|eot|ttf|svg)$/,
              use: [{
                  loader: "url-loader",
                  options: { limit: 8192 }
              }]
          }
        ]
    }
};