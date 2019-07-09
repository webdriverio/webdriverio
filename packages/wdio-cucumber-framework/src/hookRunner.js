import { executeHooksWithArgs } from '@wdio/config'
import CucumberEventListener from './cucumberEventListener'

export default class HookRunner {
    gherkinDocEvents = []

    constructor (eventBroadcaster, config) {
        this.config = config
        this.eventListener = new CucumberEventListener(eventBroadcaster)
            .on('before-feature', ::this.handleBeforeFeature)
            .on('before-scenario', ::this.handleBeforeScenario)
            .on('before-step', ::this.handleBeforeStep)
            .on('after-step', ::this.handleAfterStep)
            .on('after-scenario', ::this.handleAfterScenario)
            .on('after-feature', ::this.handleAfterFeature)
    }

    /**
     * handle beforeFeature hook
     * @param  {String}  uri     url of feature
     * @param  {Object}  feature feature object from Cucumber
     * @return {Promise}         hook promise
     */
    handleBeforeFeature (...args) {
        return executeHooksWithArgs(this.config.beforeFeature, ...args)
    }

    /**
     * [handleBeforeScenario description]
     * @param  {String}  uri      uri of feature file
     * @param  {Object}  feature  feature object from Cucumber
     * @param  {[type]}  scenario scenario object from Cucumber
     * @return {Promise}         hook promise
     */
    handleBeforeScenario (...args) {
        return executeHooksWithArgs(this.config.beforeScenario, ...args)
    }

    /**
     * [handleBeforeStep description]
     * @param  {String}  uri      uri of feature file
     * @param  {Object}  feature  feature object from Cucumber
     * @param  {[type]}  scenario scenario object from Cucumber
     * @param  {[type]}  step     step object from Cucumber
     * @return {Promise}          hook promise
     */
    handleBeforeStep (...args) {
        return executeHooksWithArgs(this.config.beforeStep, ...args)
    }

    /**
     * [handleAfterStep description]
     * @param  {String}  uri      uri of feature file
     * @param  {Object}  feature  feature object from Cucumber
     * @param  {[type]}  scenario scenario object from Cucumber
     * @param  {[type]}  step     step object from Cucumber
     * @param  {[type]}  result   result of step
     * @return {Promise}          hook promise
     */
    handleAfterStep (...args) {
        return executeHooksWithArgs(this.config.afterStep, ...args)
    }

    /**
     * @param  {String}  uri      uri of feature file
     * @param  {Object}  feature  feature object from Cucumber
     * @param  {[type]}  scenario scenario object from Cucumber
     * @return {Promise}         hook promise
     */
    handleAfterScenario (...args) {
        return executeHooksWithArgs(this.config.afterScenario, ...args)
    }

    /**
     * [handleAfterFeature description]
     * @param  {String}  uri     url of feature
     * @param  {Object}  feature feature object from Cucumber
     * @return {Promise}         hook promise
     */
    handleAfterFeature (...args) {
        return executeHooksWithArgs(this.config.afterFeature, ...args)
    }
}
