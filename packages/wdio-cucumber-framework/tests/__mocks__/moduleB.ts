function moduleB (opts) {
    // @ts-ignore
    global.MODULE_B_WAS_LOADED_WITH = opts
}

module.exports = moduleB
