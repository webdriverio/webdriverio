import fs from 'fs'

const WGXPATH_PATH = require.resolve('wgxpath')

let wgxpathSrc

/**
 * Ensures document.evaluate() in the browser.
 */
let ensureClientSideSelectorSupport = function () {
    return this.execute('return !!document.evaluate;').then((res) => {
        if (res.value) {
            return true
        }

        /**
         * Don't read in unless necessary
         */
        if (!wgxpathSrc) {
            wgxpathSrc = fs.readFileSync(WGXPATH_PATH)
            wgxpathSrc = wgxpathSrc.toString().split('module.exports')[0]
        }

        return this.execute(wgxpathSrc + '\nwgxpath.install(window);')
    })
}

export default ensureClientSideSelectorSupport
