import url from 'node:url'
import path from 'node:path'

import { browser } from '@wdio/globals'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

let startFailure = ''
process.argv.forEach(arg => {
    if (arg.startsWith('--startFailure=')) {
        startFailure = arg.split('=')[1]
    }
})
console.log('^^^ startFailure: ', startFailure)

export const config: WebdriverIO.Config = {
    runner: 'browser',
    /**
     * specify test files
     */
    specs: [
        './mocha.test.ts'
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome'
    }],

    /**
     * test configurations
     */
    logLevel: 'trace',
    framework: 'mocha',
    outputDir: path.resolve(__dirname, 'logs'),

    reporters: ['spec', 'dot', 'junit'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 30000
    },

    /**
     * hooks
     */
    before: async function() {
        if (startFailure) {
            await browser.addInitScript(async () => {
                if (startFailure === 'vite') {
                    // Simulate vite Error
                    console.log('Simulate vite error in addInitScript') // Shows up on the browser's console log.
                    const viteErrorElem = document.createElement('vite-error-overlay')
                    const shadowRoot = viteErrorElem.attachShadow({ mode: 'open' })

                    const errorMessage = document.createElement('pre')
                    errorMessage.innerText = 'Mock Vite Error: Something went wrong!'
                    shadowRoot.appendChild(errorMessage)

                    document.body.appendChild(viteErrorElem)
                } else if (startFailure === 'browserLoad') {
                    // Simulate the conditions for loadError
                    await browser.execute(() => {
                        delete window.__wdioErrors__ // Ensure this is undefined
                        document.title = 'Some Other Title' // Change the title
                        const mochaElem = document.querySelector('mocha-framework')
                        if (mochaElem) {
                            mochaElem.remove() // Remove mocha-framework element if it exists
                        }
                    })
                }
            })
        }
    },
    onPrepare: function() {

        console.log('let\'s go')
    },
    onComplete: function() {

        console.log('that\'s it')
    }
}
