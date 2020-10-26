/* istanbul ignore file */

const LOG_METHODS = ['error', 'warn', 'info', 'debug', 'trace', 'silent']

export default function getLogger (component: string) {
    return LOG_METHODS.reduce((acc: Console, cur: string): Console => {
        const prop = cur as keyof Console

        // check if the method is available on console (web doesn't have
        // 'silent', for example) before adding to acc
        // eslint-disable-next-line no-console
        if (console[prop]) {
            // eslint-disable-next-line no-console
            acc[prop] = console[prop].bind(console, `${component}:`)
        }
        return acc
    }, {} as Console)
}

// logging interface expects a 'setLevel' method
getLogger.setLevel = () => {}
getLogger.setLogLevelsConfig = () => {}
getLogger.waitForBuffer = () => {}
