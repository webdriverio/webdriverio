import path from 'path'
import Mocha from 'mocha'

import logger from '@wdio/logger'
import { runTestInFiberContext, executeHooksWithArgs } from '@wdio/config'

import { loadModule } from './utils'
import { INTERFACES, EVENTS, NOOP } from './constants'

const log = logger('@wdio/mocha-framework')

/**
* Extracts the mocha UI type following this convention:
*  - If the mochaOpts.ui provided doesn't contain a '-' then the full name
*      is taken as ui type (i.e. 'bdd','tdd','qunit')
*  - If it contains a '-' then it asumes we are providing a custom ui for
*      mocha. Then it extracts the text after the last '-' (ignoring .js if
*      provided) as the interface type. (i.e. strong-bdd in
*      https://github.com/strongloop/strong-mocha-interfaces)
*/
const MOCHA_UI_TYPE_EXTRACTOR = /^(?:.*-)?([^-.]+)(?:.js)?$/
const DEFAULT_INTERFACE_TYPE = 'bdd'

/**
 * Mocha runner
 */
class MochaAdapter {
    constructor (cid, config, specs, capabilities, reporter) {
        this.cid = cid
        this.capabilities = capabilities
        this.reporter = reporter
        this.specs = specs
        this.config = Object.assign({
            mochaOpts: {}
        }, config)
        this.runner = {}
        this.level = 0
        this.suiteCnt = new Map()
        this.hookCnt = new Map()
        this.testCnt = new Map()
        this.suiteIds = ['0']
    }

    async run () {
        const { mochaOpts } = this.config
        const mocha = this.mocha = new Mocha(mochaOpts)
        mocha.loadFiles()
        mocha.reporter(NOOP)
        mocha.fullTrace()

        this.specs.forEach((spec) => mocha.addFile(spec))
        mocha.suite.on('pre-require', ::this.preRequire)

        let runtimeError
        await executeHooksWithArgs(this.config.before, [this.capabilities, this.specs])
        const result = await new Promise((resolve) => {
            try {
                this.runner = mocha.run(resolve)
            } catch (e) {
                runtimeError = e
                return resolve(1)
            }

            Object.keys(EVENTS).forEach((e) =>
                this.runner.on(e, this.emit.bind(this, EVENTS[e])))

            this.runner.suite.beforeAll(this.wrapHook('beforeSuite'))
            this.runner.suite.beforeEach(this.wrapHook('beforeTest'))
            this.runner.suite.afterEach(this.wrapHook('afterTest'))
            this.runner.suite.afterAll(this.wrapHook('afterSuite'))
        })
        await executeHooksWithArgs(this.config.after, [runtimeError || result, this.capabilities, this.specs])

        /**
         * in case the spec has a runtime error throw after the wdio hook
         */
        if (runtimeError) {
            throw runtimeError
        }

        return result
    }

    options (options, context) {
        let { require = [], compilers = [] } = options

        if (typeof require === 'string') {
            require = [require]
        }

        this.requireExternalModules([...compilers, ...require], context)
    }

    preRequire (context, file, mocha) {
        const options = this.config.mochaOpts

        const match = MOCHA_UI_TYPE_EXTRACTOR.exec(options.ui)
        const type = (match && INTERFACES[match[1]] && match[1]) || DEFAULT_INTERFACE_TYPE

        INTERFACES[type].forEach((fnName) => {
            let testCommand = INTERFACES[type][0]

            runTestInFiberContext(
                [testCommand, testCommand + '.only'],
                this.config.beforeHook,
                this.config.afterHook,
                fnName
            )
        })
        this.options(options, { context, file, mocha, options })
    }

    /**
     * Hooks which are added as true Mocha hooks need to call done() to notify async
     */
    wrapHook (hookName) {
        return () => executeHooksWithArgs(
            this.config[hookName],
            this.prepareMessage(hookName)
        ).catch((e) => {
            log.error(`Error in ${hookName} hook: ${e.stack.slice(7)}`)
        })
    }

    prepareMessage (hookName) {
        const params = { type: hookName }

        switch (hookName) {
        case 'beforeSuite':
        case 'afterSuite':
            params.payload = this.runner.suite.suites[0]
            break
        case 'beforeTest':
        case 'afterTest':
            params.payload = this.runner.test
            break
        }

        params.err = this.lastError
        delete this.lastError
        return this.formatMessage(params)
    }

    formatMessage (params) {
        let message = {
            type: params.type
        }

        if (params.err) {
            message.error = {
                message: params.err.message,
                stack: params.err.stack,
                type: params.err.type || params.err.name,
                expected: params.err.expected,
                actual: params.err.actual
            }

            /**
             * hook failures are emitted as "test:fail"
             */
            if (params.payload && params.payload.title && params.payload.title.match(/^"(before|after)( all)*" hook/g)) {
                message.type = 'hook:end'
            }
        }

        if (params.payload) {
            message.title = params.payload.title
            message.parent = params.payload.parent ? params.payload.parent.title : null

            message.fullTitle = params.payload.fullTitle ? params.payload.fullTitle() : message.parent + ' ' + message.title
            message.pending = params.payload.pending || false
            message.file = params.payload.file
            message.duration = params.payload.duration

            /**
             * Add the current test title to the payload for cases where it helps to
             * identify the test, e.g. when running inside a beforeEach hook
             */
            if (params.payload.ctx && params.payload.ctx.currentTest) {
                message.currentTest = params.payload.ctx.currentTest.title
            }

            if (params.type.match(/Test/)) {
                message.passed = (params.payload.state === 'passed')
            }

            if (params.payload.context) { message.context = params.payload.context }
        }

        return message
    }

    requireExternalModules (modules, context) {
        modules.forEach(module => {
            if (!module) {
                return
            }

            module = module.replace(/.*:/, '')

            if (module.substr(0, 1) === '.') {
                module = path.join(process.cwd(), module)
            }

            loadModule(module, context)
        })
    }

    emit (event, payload, err) {
        /**
         * For some reason, Mocha fires a second 'suite:end' event for the root suite,
         * with no matching 'suite:start', so this can be ignored.
         */
        if (payload.root) return

        let message = this.formatMessage({ type: event, payload, err })

        message.cid = this.cid
        message.specs = this.specs
        message.uid = this.getUID(message)

        if (message.error) {
            this.lastError = message.error
        }

        this.reporter.emit(message.type, message)
    }

    getSyncEventIdStart (type) {
        const prop = `${type}Cnt`
        const suiteId = this.suiteIds[this.suiteIds.length - 1]
        const cnt = this[prop].has(suiteId)
            ? this[prop].get(suiteId)
            : 0
        this[prop].set(suiteId, cnt + 1)
        return `${type}-${suiteId}-${cnt}`
    }

    getSyncEventIdEnd (type) {
        const prop = `${type}Cnt`
        const suiteId = this.suiteIds[this.suiteIds.length - 1]
        const cnt = this[prop].get(suiteId) - 1
        return `${type}-${suiteId}-${cnt}`
    }

    getUID (message) {
        if (message.type === 'suite:start') {
            const suiteCnt = this.suiteCnt.has(this.level)
                ? this.suiteCnt.get(this.level)
                : 0
            const suiteId = `suite-${this.level}-${suiteCnt}`

            if (this.suiteCnt.has(this.level)) {
                this.suiteCnt.set(this.level, this.suiteCnt.get(this.level) + 1)
            } else {
                this.suiteCnt.set(this.level, 1)
            }

            // const suiteId = this.getSyncEventIdStart('suite')
            this.suiteIds.push(`${this.level}${suiteCnt}`)
            this.level++
            return suiteId
        }
        if (message.type === 'suite:end') {
            this.level--
            const suiteCnt = this.suiteCnt.get(this.level) - 1
            const suiteId = `suite-${this.level}-${suiteCnt}`
            this.suiteIds.pop()
            return suiteId
        }
        if (message.type === 'hook:start') {
            return this.getSyncEventIdStart('hook')
        }
        if (message.type === 'hook:end') {
            return this.getSyncEventIdEnd('hook')
        }
        if (['test:start', 'test:pending'].includes(message.type)) {
            return this.getSyncEventIdStart('test')
        }
        if (['test:end', 'test:pass', 'test:fail'].includes(message.type)) {
            return this.getSyncEventIdEnd('test')
        }

        throw new Error(`Unknown message type : ${message.type}`)
    }
}

const adapterFactory = {}

adapterFactory.run = async function (...args) {
    const adapter = new MochaAdapter(...args)
    const result = await adapter.run()
    return result
}

export default adapterFactory
export { MochaAdapter, adapterFactory }
