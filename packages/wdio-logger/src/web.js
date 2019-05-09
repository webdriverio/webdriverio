export default function getLogger (component) {
    return ['error', 'warn', 'info', 'debug', 'trace', 'silent'].reduce((acc, cur) => {
        // check if the method is available on console (web doesn't have
        // 'silent', for example) before adding to acc
        // eslint-disable-next-line no-console
        if (console[cur]) {
            // eslint-disable-next-line no-console
            acc[cur] = console[cur].bind(console, `${component}:`)
        }
        return acc
    }, {})
}

// logging interface expects a 'setLevel' method
getLogger.setLevel = () => {}
getLogger.setLogLevelsConfig = () => {}
getLogger.waitForBuffer = () => {}
