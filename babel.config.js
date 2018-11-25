module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: 8
            }
        }]
    ],
    plugins: [
        '@babel/plugin-proposal-function-bind',
        '@babel/plugin-proposal-export-default-from',
        '@babel/plugin-proposal-class-properties'
    ],
    env: {
        development: {
            sourceMaps: 'inline',
            plugins: ['source-map-support']
        }
    }
}
