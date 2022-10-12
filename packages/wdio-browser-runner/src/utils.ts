import { EVENTS } from './constants.js'
import type { Environment } from './types'

export function getTemplate (cid: string, env: Environment, spec: string) {
    const listeners = Object.entries(EVENTS).map(([mochaEvent, wdioEvent]) => (
        /*js*/`runner.on('${mochaEvent}', (payload) => {
            window.__wdioEvents__.push(formatMessage({ type: '${wdioEvent}', payload, err: payload.err }))
        })`
    )).join('\n')

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
                import { formatMessage } from '@wdio/mocha-framework/common'

                const mocha = Mocha.setup(${JSON.stringify(env.args || {})})
                window.__wdioEvents__ = []

                await import('${spec}')

                const runner = mocha.run((failures) => {
                    window.__wdioFailures__ = failures
                })
                ${listeners}
            </script>
        </body>
    </html>`
}
