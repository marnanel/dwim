const path = require('path')
const webpack = require('webpack')

module.exports = {
        mode: 'development',
        entry: [
                './src/index.js',
                './src/grok.js',
        ],
        output: {
                path: path.resolve(__dirname, 'www'),
                filename: 'index.bundle.js'
        },
        devtool: 'inline-source-map',
        module: {
                rules: [
                        {
                                test: /\.(js|jsx)$/,
                                exclude: /node_modules/,
                                use: {
                                        loader: 'babel-loader'
                                }
                        },
                ],
        },
        plugins: [
                // fix "process is not defined" error:
                // https://stackoverflow.com/questions/41359504/webpack-bundle-js-uncaught-referenceerror-process-is-not-defined
                new webpack.ProvidePlugin({
                        process: 'process/browser',
                }),
        ]
}
