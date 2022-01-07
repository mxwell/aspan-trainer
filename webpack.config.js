const path = require('path');

module.exports = {
    entry: path.resolve(__dirname, 'static', 'src', 'javascripts', 'boot.jsx'),
    output: {
        path: path.join(__dirname, 'static', 'target', 'javascripts'),
        filename: 'boot.js'
    },
    resolve: {
        extensions: ['.js', '.jsx']
    },
    module: {
        rules: [
            {
                test: /\.jsx/,
                use: {
                    loader: 'babel-loader'
                }
            },
        ]
    },
};
