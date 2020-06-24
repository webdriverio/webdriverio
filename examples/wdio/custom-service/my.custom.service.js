/**
 * you can also use
 * `export default class CustomService`
 * here
 */
module.exports = class CustomService {
    constructor (config) {
        console.log('custom service options:', config.someOption)
    }
    onPrepare () {
        console.log('execute onPrepare(config, capabilities)')
    }
    onWorkerStart () {
        console.log('execute onWorkerStart(cid, caps, specs, args, execArgv)')
    }
    beforeSession () {
        console.log('execute beforeSession(config, capabilities, specs)')
    }
    before () {
        console.log('execute before(capabilities, specs)')
    }
    beforeSuite () {
        console.log('execute beforeSuite(suite)')
    }
    beforeHook () {
        console.log('execute beforeHook(test, context)')
    }
    afterHook () {
        console.log('execute afterHook(test, context, { error, result, duration, passed, retries })')
    }
    beforeTest () {
        console.log('execute beforeTest(test, context)')
    }
    beforeCommand () {
        console.log('execute beforeCommand(commandName, args)')
    }
    afterCommand () {
        console.log('execute afterCommand(commandName, args, result, error)')
    }
    afterTest () {
        console.log('execute afterTest(test, context, { error, result, duration, passed, retries })')
    }
    afterSuite () {
        console.log('execute afterSuite(suite)')
    }
    after () {
        console.log('execute after(result, capabilities, specs)')
    }
    afterSession () {
        console.log('execute afterSession(config, capabilities, specs)')
    }
    onComplete () {
        console.log('execute onComplete(exitCode, config, capabilities, results)')
    }
    onReload() {
        console.log('execute onReloadoldSessionId, newSessionId)')
    }
    beforeFeature () {
        console.log('execute beforeFeature(uri, feature, scenarios)')
    }
    beforeScenario () {
        console.log('execute beforeScenario(uri, feature, scenario, sourceLocation, context)')
    }
    beforeStep () {
        console.log('execute beforeStep({ uri, feature, step }, context)')
    }
    afterStep () {
        console.log('execute afterStep({ uri, feature, step }, context, { error, result, duration, passed, retries })')
    }
    afterScenario () {
        console.log('execute afterScenario(uri, feature, scenario, result, sourceLocation, context)')
    }
    afterFeature () {
        console.log('execute afterFeature(uri, feature, scenarios)')
    }
}
