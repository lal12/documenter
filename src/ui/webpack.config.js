const path = require("path");

module.exports = {
    entry: __dirname+'/page.tsx',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'ui.js',
        path: path.resolve(__dirname, '..', '..', 'dist', 'public')
    }
};