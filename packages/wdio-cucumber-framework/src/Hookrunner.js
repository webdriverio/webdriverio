import { executeHooksWithArgs } from '@wdio/config'
import { CucumberEventListener } from './CucumberEventListener'

class Hookrunner {
    gherkinDocEvents = []

    constructor (eventBroadcaster, config) {
        this.config = config

        new CucumberEventListener(eventBroadcaster)
            .on('before-feature', this.handleBeforeFeature.bind(this))
            .on('before-scenario', this.handleBeforeScenario.bind(this))
            .on('before-step', this.handleBeforeStep.bind(this))
            .on('after-step', this.handleAfterStep.bind(this))
            .on('after-scenario', this.handleAfterScenario.bind(this))
            .on('after-feature', this.handleAfterFeature.bind(this))
    }

    handleBeforeFeature (uri, feature) {
        return executeHooksWithArgs(this.config.beforeFeature, feature)
    }

    handleBeforeScenario (uri, feature, scenario) {
        return executeHooksWithArgs(this.config.beforeScenario, scenario)
    }

    handleBeforeStep (uri, feature, scenario, step) {
        return executeHooksWithArgs(this.config.beforeStep, step)
    }

    handleAfterStep (uri, feature, scenario, step, result) {
        return executeHooksWithArgs(this.config.afterStep, {...step, feature: feature.name, scenario: scenario.name, status: result.status}, result)
    }

    handleAfterScenario (uri, feature, scenario) {
        return executeHooksWithArgs(this.config.afterScenario, scenario)
    }

    handleAfterFeature (uri, feature) {
        return executeHooksWithArgs(this.config.afterFeature, feature)
    }
}

export default Hookrunner
