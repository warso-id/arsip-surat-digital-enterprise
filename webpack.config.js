/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Webpack Build Configuration
 * ============================================================
 */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    // ==================== ENTRY POINTS ====================
    entry: {
        // Core (loaded on every page)
        startup: './src/public/js/startup.js',
        connector: './src/public/js/connector.js',
        'error-boundary': './src/public/js/error-boundary.js',
        logger: './src/public/js/logger.js',
        
        // Main application
        app: './src/public/js/app.js',
        core: './src/public/js/enterprise-core.js',
        
        // Features (lazy loaded)
        'surat-masuk': './src/public/js/surat-masuk.js',
        'surat-keluar': './src/public/js/surat-keluar.js',
        disposisi: './src/public/js/disposisi.js',
        laporan: './src/public/js/laporan.js',
        admin: './src/public/js/admin.js',
        
        // Styles
        enterprise: './src/public/css/enterprise.css',
    },
    
    // ==================== OUTPUT ====================
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
        chunkFilename: isProduction ? 'js/[name].[contenthash:8].chunk.js' : 'js/[name].chunk.js',
        publicPath: '/',
        clean: true,
    },
    
    // ==================== RESOLVE ====================
    resolve: {
        extensions: ['.js', '.json', '.css'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@js': path.resolve(__dirname, 'src/public/js'),
            '@css': path.resolve(__dirname, 'src/public/css'),
            '@config': path.resolve(__dirname, 'src/config'),
        },
    },
    
    // ==================== MODULES ====================
    module: {
        rules: [
            // JavaScript
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: {
                                    browsers: ['> 0.5%', 'not dead', 'not op_mini all'],
                                },
                                useBuiltIns: 'usage',
                                corejs: 3,
                            }],
                        ],
                        plugins: [
                            '@babel/plugin-transform-runtime',
                        ],
                    },
                },
            },
            // CSS
            {
                test: /\.css$/,
                use: [
                    isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            sourceMap: !isProduction,
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    'postcss-preset-env',
                                    'autoprefixer',
                                    isProduction ? 'cssnano' : null,
                                ].filter(Boolean),
                            },
                        },
                    },
                ],
            },
            // Assets
            {
                test: /\.(png|jpe?g|gif|svg|ico)$/i,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 8 * 1024, // 8KB
                    },
                },
                generator: {
                    filename: 'img/[name].[hash:8][ext]',
                },
            },
            // Fonts
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name].[hash:8][ext]',
                },
            },
        ],
    },
    
    // ==================== PLUGINS ====================
    plugins: [
        new CleanWebpackPlugin(),
        
        // HTML Pages
        ...['index', 'login', 'dashboard', 'surat-masuk', 'surat-keluar', 'disposisi', 'laporan', 'admin', 'profile', '404', 'offline'].map(page => {
            return new HtmlWebpackPlugin({
                template: `./${page}.html`,
                filename: `${page}.html`,
                chunks: ['startup', 'connector', 'error-boundary', 'logger', 'core', 'app', 'enterprise'],
                minify: isProduction ? {
                    collapseWhitespace: true,
                    removeComments: true,
                    removeRedundantAttributes: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    useShortDoctype: true,
                } : false,
                inject: 'head',
                scriptLoading: 'defer',
            });
        }),
        
        // CSS extraction
        new MiniCssExtractPlugin({
            filename: isProduction ? 'css/[name].[contenthash:8].css' : 'css/[name].css',
            chunkFilename: isProduction ? 'css/[name].[contenthash:8].chunk.css' : 'css/[name].chunk.css',
        }),
        
        // Copy static files
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/manifest.json', to: 'manifest.json' },
                { from: 'service-worker.js', to: 'service-worker.js' },
                { from: 'robots.txt', to: 'robots.txt' },
                { from: 'sitemap.xml', to: 'sitemap.xml' },
                { from: '.htaccess', to: '.htaccess' },
                { from: 'VERSION.json', to: 'VERSION.json' },
                { from: 'src/config/routes.json', to: 'config/routes.json' },
                { from: 'docs', to: 'docs' },
            ],
        }),
        
        // PWA Workbox
        ...(isProduction ? [
            new WorkboxPlugin.GenerateSW({
                clientsClaim: true,
                skipWaiting: true,
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                runtimeCaching: [
                    {
                        urlPattern: /\.(?:html|css|js|png|jpg|jpeg|svg|gif|ico|woff|woff2|ttf|eot)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'static-resources',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                            },
                        },
                    },
                    {
                        urlPattern: /\/api\//,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 5 * 60, // 5 minutes
                            },
                        },
                    },
                ],
            }),
        ] : []),
    ].filter(Boolean),
    
    // ==================== OPTIMIZATION ====================
    optimization: {
        minimize: isProduction,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true,
                        drop_debugger: true,
                    },
                    output: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
            new CssMinimizerPlugin({
                minimizerOptions: {
                    preset: ['default', {
                        discardComments: { removeAll: true },
                    }],
                },
            }),
        ],
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendor',
                    chunks: 'all',
                    priority: 10,
                },
                common: {
                    name: 'common',
                    minChunks: 2,
                    priority: 5,
                    reuseExistingChunk: true,
                },
            },
        },
        runtimeChunk: 'single',
    },
    
    // ==================== DEV SERVER ====================
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 3000,
        hot: true,
        open: true,
        historyApiFallback: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        },
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    },
    
    // ==================== PERFORMANCE ====================
    performance: {
        hints: isProduction ? 'warning' : false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
    },
    
    // ==================== STATS ====================
    stats: {
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
    },
};
