export default function getLogger (component) {
    let logger = ['error', 'warn', 'info', 'debug', 'trace'].reduce((acc, cur) => {
        // eslint-disable-next-line no-console
        acc[cur] = console[cur].bind(console, `${component}:`)
        return acc
    }, {})

    // logging interface expects a 'setLevel' method
    logger.setLevel = () => {}

    return logger
}
