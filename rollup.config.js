const json = require('@rollup/plugin-json')
const cleanup = require('rollup-plugin-cleanup')
const { terser } = require('rollup-plugin-terser')

const output = {
    format: 'cjs',
    exports: 'named'
}

const plugins = [
    json(),
    terser(),
    cleanup({
        comments: 'none',
        extensions: ['*'],
    }),
]

module.exports = {
    output,
    plugins
}
