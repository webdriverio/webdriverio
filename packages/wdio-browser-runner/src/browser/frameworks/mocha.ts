import stringify from 'fast-safe-stringify'

import { setupEnv, formatMessage } from '@wdio/mocha-framework/common'

import { getCID } from '../utils.js'
import { MESSAGE_TYPES, EVENTS } from '../../constants.js'
import type { HookResultEvent, HookTriggerEvent, SocketMessage } from '../../vite/types.js'

const startTime = Date.now()

if (!window.Mocha) {
    throw new Error('Can\'t find Mocha attached to the `window` scope, was it installed? Run `npm install mocha` and run again!')
}

const BaseReporter = window.Mocha.reporters.html
class HTMLReporter extends BaseReporter {
    constructor (runner: never, options: never) {
        /**
         * this is a little hack to ensure Mocha attaches the HTML reporter
         * to the element within the Shadow DOM
         */
        const getElementById = document.getElementById.bind(document)
        document.getElementById = () => document.querySelector('mocha-framework')?.shadowRoot?.querySelector('#mocha')!
        super(runner, options)
        document.getElementById = getElementById
    }

    addCodeToggle () {}
}

//examples/wdio/node_modules/uuid/dist/esm-browser/index.js

export class MochaFramework extends HTMLElement {
    #root: ShadowRoot
    #spec: string
    #socket?: WebSocket
    #hookResolver = new Map<string, { resolve: Function, reject: Function }>()
    #runnerEvents: any[] = []
    #isMinified = false

    constructor () {
        super()
        this.#root = this.attachShadow({ mode: 'open' })
        this.#spec = this.getAttribute('spec')!

        if (!this.#spec) {
            throw new Error('"spec" attribute required but not set')
        }

        mocha.setup({
            ...window.__wdioEnv__.args,
            reporter: HTMLReporter
        } as any)
    }

    static get observedAttributes() {
        return ['minified']
    }

    connectedCallback() {
        this.#root.appendChild(template.content.cloneNode(true))
        this.#root.querySelector('.btnCollapseExpand')?.addEventListener('click', () => {
            if (this.#isMinified) {
                this.shadowRoot!.host.removeAttribute('minified')
            } else {
                this.shadowRoot!.host.setAttribute('minified', 'minified')
            }
        })
    }

    attributeChangedCallback (name: string, oldValue: unknown, newValue: unknown) {
        if (name === 'minified') {
            this.#isMinified = typeof newValue === 'string'

            const reporterElem = this.#root.querySelector('.reporter')
            if (reporterElem) {
                reporterElem.className = this.#isMinified ? 'reporter minified' : 'reporter'
            }

            document.body.style.width = `calc(100% - ${this.#isMinified ? '65px' : '500px'})`
        }
    }

    async run (socket: WebSocket) {
        /**
         * import test case (order is important here)
         */
        const file = this.#spec
        await import(file)

        this.#socket = socket
        socket.addEventListener('message', this.#handleSocketMessage.bind(this))
        const cid = getCID()
        if (!cid) {
            throw new Error('"cid" query parameter is missing')
        }

        const beforeHook = this.#getHook('beforeHook')
        const beforeTest = this.#getHook('beforeTest')
        const afterHook = this.#getHook('afterHook')
        const afterTest = this.#getHook('afterTest')
        setupEnv(cid, window.__wdioEnv__.args, beforeTest, beforeHook, afterTest, afterHook)

        const self = this
        before(function () {
            self.#getHook('beforeSuite')({
                ...this.test?.parent?.suites[0],
                file,
            })
        })

        after(function () {
            self.#getHook('afterSuite')({
                ...this.test?.parent?.suites[0],
                file,
                duration: Date.now() - startTime
            })
        })

        const runner = mocha.run(this.#onFinish.bind(this))
        Object.entries(EVENTS).map(([mochaEvent, wdioEvent]) => runner.on(mochaEvent, (payload: any) => {
            this.#runnerEvents.push(formatMessage({ type: wdioEvent, payload, err: payload.err }))
        }))
    }

    async #onFinish (failures: number) {
        await this.#getHook('after')(failures, window.__wdioEnv__.capabilities, [this.#spec])

        /**
         * propagate results to browser so it can be picked up by the runner
         */
        window.__wdioEvents__ = this.#runnerEvents
        window.__wdioFailures__ = failures
        console.log(`[WDIO] Finished test suite in ${Date.now() - startTime}ms`)
    }

    #handleSocketMessage (payload: MessageEvent) {
        try {
            const message: SocketMessage = JSON.parse(payload.data)
            if (message.type === MESSAGE_TYPES.hookResultMessage) {
                return this.#handleHookResult(message.value)
            }

            // no-op
        } catch (err: any) {
            console.error(`Failed handling message from Vite server: ${err.stack}`)
        }
    }

    #handleHookResult (result: HookResultEvent) {
        const resolver = this.#hookResolver.get(result.id)
        if (!resolver) {
            return console.warn(`[WDIO] couldn't find resolve for id "${result.id}"`)
        }

        this.#hookResolver.delete(result.id)
        if (result.error) {
            return resolver.reject(result.error)
        }
        return resolver.resolve()
    }

    #getHook (name: string) {
        return (...args: any[]) => new Promise((resolve, reject) => {
            const id = (this.#hookResolver.size + 1).toString()
            const cid = getCID()
            if (!cid) {
                return reject(new Error('"cid" query parameter is missing'))
            }

            this.#hookResolver.set(id.toString(), { resolve, reject })
            this.#socket?.send(stringify(this.#hookTrigger({ name, id, cid, args })))
        })
    }

    #hookTrigger (value: HookTriggerEvent): SocketMessage {
        return {
            type: MESSAGE_TYPES.hookTriggerMessage,
            value
        }
    }
}

const template = document.createElement('template')
template.innerHTML = /*html*/`
<style>
    @import "/node_modules/mocha/mocha.css";

    .reporter {
        transition: width .3s;
        box-shadow: -5px 0px 10px #aaa;
        position: absolute;
        top: 0;
        right: 0;
        width: 500px;
        height: 100%;
        margin: 0;
        color: var(--mocha-color);
        background-color: var(--mocha-bg-color);
        background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNjRweCIgaGVpZ2h0PSI2NHB4IiB2aWV3Qm94PSIwIDAgNjQgNjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8dGl0bGU+TG9nbyBSZWd1bGFyPC90aXRsZT4KICAgIDxnIGlkPSJMb2dvLVJlZ3VsYXIiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxyZWN0IGlkPSJSZWN0YW5nbGUiIGZpbGw9IiNFQTU5MDYiIHg9IjAiIHk9IjAiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcng9IjUiPjwvcmVjdD4KICAgICAgICA8cGF0aCBkPSJNOCwxNiBMOCw0OCBMNiw0OCBMNiwxNiBMOCwxNiBaIE00MywxNiBDNTEuODM2NTU2LDE2IDU5LDIzLjE2MzQ0NCA1OSwzMiBDNTksNDAuODM2NTU2IDUxLjgzNjU1Niw0OCA0Myw0OCBDMzQuMTYzNDQ0LDQ4IDI3LDQwLjgzNjU1NiAyNywzMiBDMjcsMjMuMTYzNDQ0IDM0LjE2MzQ0NCwxNiA0MywxNiBaIE0yNywxNiBMMTQuMTA2LDQ3Ljk5OTIwNzggTDExLjk5OSw0Ny45OTkyMDc4IEwyNC44OTQsMTYgTDI3LDE2IFogTTQzLDE4IEMzNS4yNjgwMTM1LDE4IDI5LDI0LjI2ODAxMzUgMjksMzIgQzI5LDM5LjczMTk4NjUgMzUuMjY4MDEzNSw0NiA0Myw0NiBDNTAuNzMxOTg2NSw0NiA1NywzOS43MzE5ODY1IDU3LDMyIEM1NywyNC4yNjgwMTM1IDUwLjczMTk4NjUsMTggNDMsMTggWiIgaWQ9IkNvbWJpbmVkLVNoYXBlIiBmaWxsPSIjRkZGRkZGIj48L3BhdGg+CiAgICA8L2c+Cjwvc3ZnPg==);
        background-repeat: no-repeat;
        background-size: 30px;
        background-position: 15px 20px;
    }
    .reporter.minified {
        width: 65px;
    }

    #mocha {
        margin: 0;
    }
    ul#mocha-report {
        transition: opacity .3s;
        opacity: 1;
        padding: 50px 15px  0 0;
    }
    .minified ul#mocha-report {
        opacity: 0;
    }
    .minified .progress {
        display: block;
        float: none;
    }
    .minified #mocha-stats {
        width: 50px;
        padding-top: 60px;
    }
    .minified #mocha-stats li {
        font-size: .9em;
    }

    @keyframes fadeOutIn {
        0% { opacity: 1; }
        20% { opacity: 0; }
        100% { opacity: 1; }
    }

    .btnCollapseExpand {
        display: block;
        width: 50px;
        position: absolute;
        height: 50px;
        bottom: 0;
        right: 0;
        transition: transform .3s;
        transform: scale(1) translateX(-434px);
        margin: 10px 8px;
        background: transparent;
        border: 0;
        cursor: pointer;
    }
    .minified .btnCollapseExpand {
        transform: scale(-1) translateX(0px);
        animation-name: fadeOutIn;
        animation-duration: .3s;
    }
</style>
<div class="reporter">
    <div id="mocha"></div>
    <button class="btnCollapseExpand">
        <svg width="50" height="40" viewBox="2 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path fill="#fff" d="M13.11 29.113c7.243 0 13.113-5.871 13.113-13.113S20.353 2.887 13.11 2.887C5.868 2.887-.003 8.758-.003 16S5.868 29.113 13.11 29.113zm0-25.177c6.652 0 12.064 5.412 12.064 12.064S19.762 28.064 13.11 28.064C6.457 28.064 1.046 22.652 1.046 16S6.457 3.936 13.11 3.936z"/>
            <path fill="#fff" d="m13.906 21.637.742.742L21.026 16l-6.378-6.379-.742.742 5.112 5.112H6.291v1.049h12.727z"/>
        </svg>
    </button>
</div>
`

customElements.define('mocha-framework', MochaFramework)
