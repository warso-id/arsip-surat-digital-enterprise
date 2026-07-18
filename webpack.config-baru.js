const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    
    entry: {
        app: './public/js/app.js',
        dashboard: './public/js/dashboard.js',
        surat: './public/js/surat.js',
        disposisi: './public/js/disposisi.js',
        laporan: './public/js/laporan.js'
    },
    
    output: {
        path: path.resolve(__dirname, 'public/dist'),
        filename: 'js/[name].[contenthash].js',
        clean: true
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
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            }
        ]
    },
    
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'css/[name].[contenthash].css'
        })
    ],
    
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true
                    }
                }
            }),
            new CssMinimizerPlugin()
        ],
        splitChunks: {
            chunks: 'all',
            name: 'vendors'
        }
    },
    
    devtool: process.env.NODE_ENV === 'production' ? false : 'source-map'
};
