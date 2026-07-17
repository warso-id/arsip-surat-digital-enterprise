/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Babel Configuration
 * ============================================================
 */

module.exports = function(api) {
    api.cache(true);

    const presets = [
        [
            '@babel/preset-env',
            {
                targets: {
                    browsers: [
                        '> 0.5%',
                        'last 2 versions',
                        'not dead',
                        'not ie 11',
                        'not op_mini all'
                    ],
                    node: 'current'
                },
                modules: process.env.NODE_ENV === 'test' ? 'auto' : false,
                useBuiltIns: 'usage',
                corejs: {
                    version: 3,
                    proposals: true
                },
                shippedProposals: true,
                bugfixes: true,
                loose: false
            }
        ]
    ];

    const plugins = [
        // Transform runtime
        [
            '@babel/plugin-transform-runtime',
            {
                corejs: false,
                helpers: true,
                regenerator: true,
                useESModules: true
            }
        ],
        // Class properties
        '@babel/plugin-proposal-class-properties',
        // Optional chaining
        '@babel/plugin-proposal-optional-chaining',
        // Nullish coalescing
        '@babel/plugin-proposal-nullish-coalescing-operator',
        // Object rest spread
        '@babel/plugin-proposal-object-rest-spread',
        // Dynamic import
        '@babel/plugin-syntax-dynamic-import',
        // Private methods
        '@babel/plugin-proposal-private-methods',
        // Private properties
        '@babel/plugin-proposal-private-property-in-object',
        // Logical assignment
        '@babel/plugin-proposal-logical-assignment-operators',
        // Export namespace
        '@babel/plugin-proposal-export-namespace-from',
        // JSON import
        '@babel/plugin-proposal-json-strings',
        // Numeric separator
        '@babel/plugin-proposal-numeric-separator',
    ];

    // Production plugins
    if (process.env.NODE_ENV === 'production') {
        plugins.push(
            // Remove console
            ['transform-remove-console', {
                exclude: ['error', 'warn']
            }],
            // Remove debugger
            'transform-remove-debugger',
            // Minify
            ['babel-plugin-minify-simplify', {
                keepFnName: true
            }]
        );
    }

    // Test plugins
    if (process.env.NODE_ENV === 'test') {
        plugins.push(
            // Istanbul coverage
            'babel-plugin-istanbul'
        );
    }

    const env = {
        production: {
            plugins: [
                // Additional production optimizations
                ['babel-plugin-transform-react-remove-prop-types', {
                    removeImport: true
                }]
            ]
        },
        test: {
            plugins: [
                '@babel/plugin-transform-modules-commonjs'
            ]
        }
    };

    return {
        presets,
        plugins,
        env,
        sourceMaps: true,
        comments: false,
        compact: process.env.NODE_ENV === 'production',
        minified: process.env.NODE_ENV === 'production',
        ignore: [
            'node_modules/**',
            'dist/**',
            'build/**',
            'backups/**',
            'coverage/**'
        ]
    };
};
