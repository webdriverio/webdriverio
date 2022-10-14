import fs from 'node:fs/promises'
import got from 'got'

import { EVENTS } from './constants.js'
import type { Environment } from './types'

export async function getTemplate (cid: string, env: Environment, spec: string) {
    const listeners = Object.entries(EVENTS).map(([mochaEvent, wdioEvent]) => (
        /*js*/`runner.on('${mochaEvent}', (payload) => {
            window.__wdioEvents__.push(formatMessage({ type: '${wdioEvent}', payload, err: payload.err }))
        })`
    )).join('\n')

    const testScript = await fs.readFile(spec, 'utf-8')
    const vueScript = await (await got('https://unpkg.com/vue@3.2.40/dist/vue.global.prod.js')).body
    const vueCompilerScript = await (await got('https://unpkg.com/@vue/compiler-dom@3.2.40/dist/compiler-dom.global.prod.js')).body

    return /* html */`
    <!doctype html>
    <html>
        <head>
            <title>WebdriverIO Browser Test</title>
            <link rel="stylesheet" href="https://unpkg.com/mocha@10.0.0/mocha.css">
            <script type="module">
                ${vueScript}
                window.Vue = Vue
            </script>
            <script type="module">
                ${vueCompilerScript}
                window.VueCompilerDOM = VueCompilerDOM
            </script>
            <script type="module">
            window.Symbol.for = (a) => a

            import Mocha from 'https://esm.sh/mocha@10.0.0'
            const mocha = Mocha.setup(${JSON.stringify(env.args || {})})
            </script>
        </head>
        <body>
            <div id="mocha"></div>
            <script type="module">
                ${testScript}

                import { formatMessage } from '@wdio/mocha-framework/common'

                window.__wdioEvents__ = []
                const runner = mocha.run((failures) => {
                    window.__wdioFailures__ = failures
                })
                ${listeners}
            </script>
        </body>
    </html>`
}
