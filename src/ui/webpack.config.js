const path = require("path");
const fs = require('fs');

console.log([
    fs.realpathSync(__dirname+'/../shared'),
    fs.realpathSync(__dirname)
])

module.exports = {
    entry: __dirname+'/page.tsx',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },{
                test: /\.(css)$/,
                use: ['style-loader', 'css-loader'],
            },
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