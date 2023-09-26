exports.setValue = async function (key: string, value: never) {
    const m = await import('../index.js')
    return m.setValue(key, value)
}

exports.getValue = async function (key: string) {
    const m = await import('../index.js')
    return m.getValue(key)
}

exports.setResourcePool = async function (key: string, value: never) {
    const m = await import('../index.js')
    return m.setResourcePool(key, value)
}

exports.getValueFromPool = async function (key: string, options: never) {
    const m = await import('../index.js')
    return m.getValueFromPool(key, options)
}

exports.addValueToPool = async function (key: string, value: never) {
    const m = await import('../index.js')
    return m.addValueToPool(key, value)
}
