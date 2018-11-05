export default function getLogger (component) {
    return ['error', 'warn', 'info', 'debug', 'trace'].reduce((acc, cur) => {
        // eslint-disable-next-line no-console
        acc[cur] = console[cur].bind(console, `${component}:`)
        return acc
    }, {})
}
