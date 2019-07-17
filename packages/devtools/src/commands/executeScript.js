/* global window */

export default function executeScript ({ script, args }) {
    const page = this.windows.get(this.currentWindowHandle)
    return page.$eval('html', (_, script, ...args) => {
        window.arguments = args
        return eval(script.slice(7))
    }, script, ...args)
}
