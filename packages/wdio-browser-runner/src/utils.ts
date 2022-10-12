import fs from 'node:fs/promises'

import { EVENTS } from './constants.js'
import type { Environment } from './types'

export async function getTemplate (cid: string, env: Environment, spec: string) {
    const listeners = Object.entries(EVENTS).map(([mochaEvent, wdioEvent]) => (
        /*js*/`runner.on('${mochaEvent}', (payload) => {
            window.__wdioEvents__.push(formatMessage({ type: '${wdioEvent}', payload, err: payload.err }))
        })`
    )).join('\n')

    const testScript = await fs.readFile(spec, 'utf-8')

    return /* html */`
    <!doctype html>
    <html>
        <head>
            <title>WebdriverIO Browser Test</title>
            <link rel="stylesheet" href="https://unpkg.com/mocha@10.0.0/mocha.css">
        </head>
        <body>
            <div id="mocha"></div>
            <script type="module">
                import Mocha from 'https://esm.sh/mocha@10.0.0'
                const mocha = Mocha.setup(${JSON.stringify(env.args || {})})

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
