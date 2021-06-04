const { output, plugins } = require('../../rollup.config')
output.file = __dirname + '/build/index.cjs'
module.exports = {
    input: __dirname + '/build/index.js',
    output,
    plugins,
}
