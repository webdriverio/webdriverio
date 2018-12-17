export function loadModule (name, context) {
    try {
        module.context = context
        require(name)
    } catch (e) {
        throw new Error(`Module ${name} can't get loaded. Are you sure you have installed it?\n` +
                        'Note: if you\'ve installed WebdriverIO globally you need to install ' +
                        'these external modules globally too!')
    }
}
