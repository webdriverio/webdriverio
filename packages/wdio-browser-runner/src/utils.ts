import { EVENTS } from './constants.js'
import type { Environment } from './types'

export function getTemplate (cid: string, env: Environment) {
    // eslint-disable-next-line quotes
    const specs = env.specs.map((spec) => /*ts*/`await import('${spec}')`).join('\n')

    const listeners = Object.entries(EVENTS).map(([e, eventName]) => (
        /*js*/`runner.on('${e}', (payload) => {
            window.__wdioEvents__.push({
                type: '${eventName}',
                uid: '${cid}',
                ...(JSON.parse(stringify(payload)))
            })
        })`
    ))

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
                import stringify from 'https://esm.sh/fast-safe-stringify@2.1.1'

                const mocha = Mocha.setup(${JSON.stringify(env.args || {})})
                window.__wdioEvents__ = []

                ${specs}

                const runner = mocha.run((failures) => {
                    window.__wdioFailures__ = failures
                })
                ${listeners}
            </script>
        </body>
    </html>`
}
