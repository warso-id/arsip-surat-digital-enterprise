// babel.config.js - Babel Configuration
module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    browsers: [
                        'last 2 versions',
                        '> 1%',
                        'not dead',
                        'not ie 11'
                    ]
                },
                useBuiltIns: 'usage',
                corejs: 3,
                modules: false
            }
        ]
    ],
    plugins: [
        '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-optional-chaining'
    ],
    env: {
        test: {
            presets: [
                [
                    '@babel/preset-env',
                    {
                        targets: {
                            node: 'current'
                        }
                    }
                ]
            ]
        },
        production: {
            plugins: [
                'transform-remove-console'
            ]
        }
    }
};
