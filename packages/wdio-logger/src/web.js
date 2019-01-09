export default function getLogger (component) {
    return ['error', 'warn', 'info', 'debug', 'trace', 'silent'].reduce((acc, cur) => {
        // eslint-disable-next-line no-console
        acc[cur] = console[cur].bind(console, `${component}:`)
        return acc
    }, {})
}

// logging interface expects a 'setLevel' method
getLogger.setLevel = () => {}
