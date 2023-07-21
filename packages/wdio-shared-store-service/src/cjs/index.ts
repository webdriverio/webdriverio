const esmModule = import('../index.js')

exports.setValue = async function (key: string, value: never) {
    const m = await esmModule
    return m.setValue(key, value)
}

exports.getValue = async function (key: string) {
    const m = await esmModule
    return m.getValue(key)
}

exports.setResourcePool = async function (key: string, value: never) {
    const m = await esmModule
    return m.setResourcePool(key, value)
}

exports.getValueFromPool = async function (key: string, options: never) {
    const m = await esmModule
    return m.getValueFromPool(key, options)
}

exports.addValueToPool = async function (key: string, value: never) {
    const m = await esmModule
    return m.addValueToPool(key, value)
}