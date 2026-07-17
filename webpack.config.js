// webpack.config.js - Webpack Configuration
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: {
            app: './src/public/js/app.js',
            dashboard: './src/public/js/dashboard.js',
            surat: './src/public/js/surat.js',
            disposisi: './src/public/js/disposisi.js',
            laporan: './src/public/js/laporan.js'
        },
        
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
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
                    use: [
                        isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                        'postcss-loader'
                    ]
                },
                {
                    test: /\.(png|jpe?g|gif|svg|ico)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'images/[name].[hash:8][ext]'
                    }
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'fonts/[name].[hash:8][ext]'
                    }
                }
            ]
        },
        
        plugins: [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: './index.html',
                filename: 'index.html',
                chunks: ['app'],
                minify: isProduction ? {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeRedundantAttributes: true
                } : false
            }),
            ...(isProduction ? [
                new MiniCssExtractPlugin({
                    filename: 'css/[name].[contenthash:8].css'
                }),
                new WorkboxPlugin.GenerateSW({
                    clientsClaim: true,
                    skipWaiting: true,
                    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
                })
            ] : [])
        ],
        
        optimization: {
            splitChunks: {
                chunks: 'all',
                name: 'vendors'
            }
        },
        
        devServer: {
            static: {
                directory: path.join(__dirname, 'dist')
            },
            port: 3000,
            hot: true,
            historyApiFallback: true,
            compress: true
        },
        
        devtool: isProduction ? 'source-map' : 'eval-source-map'
    };
};
