async function getCjsLogger (name: string) {
    const fn = await import('../node.js')
    return fn.default(name)
}

module.exports = getCjsLogger
