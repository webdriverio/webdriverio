var ROOT = __dirname + '/../..'

function beforeHook () {
    return 'beforeHook: I executed properly'
}

function before () {
    return 'before: I executed properly'
}

function after () {
    return 'after: I executed properly'
}

exports.config = {
    beforeHook: beforeHook,
    before: [before],
    after: [after, () => 'anonymous: I executed properly']
}
