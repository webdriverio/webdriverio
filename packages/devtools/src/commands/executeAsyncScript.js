/* global window */

export default function executeAsyncScript ({ script, args }) {
    const page = this.windows.get(this.currentWindowHandle)
    const scriptTimeout = this.timeouts.get('script')
    return page.$eval('html', async (_, script, scriptTimeout, ...args) => {
        return new Promise((resolve, reject) => {
            setTimeout(
                () => reject('script timeout'),
                scriptTimeout
            )

            window.arguments = [...args, resolve]
            return eval(script.slice(7))
        })
    }, script, scriptTimeout, ...args)
}
