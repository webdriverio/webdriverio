if (!global.MY_VAR) {
    global.MY_VAR = 0
}

++global.MY_VAR

module.exports = (params) => {
    global.MY_PARAMS = params
}
