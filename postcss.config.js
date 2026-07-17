// postcss.config.js - PostCSS Configuration
module.exports = {
    plugins: [
        require('autoprefixer')({
            overrideBrowserslist: [
                'last 2 versions',
                '> 1%',
                'not dead'
            ]
        }),
        require('cssnano')({
            preset: [
                'default',
                {
                    discardComments: {
                        removeAll: true
                    },
                    normalizeWhitespace: true,
                    minifyFontValues: true,
                    minifyGradients: true,
                    reduceTransforms: true,
                    colormin: true
                }
            ]
        })
    ]
};
