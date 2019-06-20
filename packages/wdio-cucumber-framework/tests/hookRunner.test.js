import { executeHooksWithArgs } from '@wdio/config'

import HookRunner from '../src/hookRunner'

jest.mock('@wdio/config', () => ({
    executeHooksWithArgs: jest.fn()
}))

jest.mock('../src/cucumberEventListener', () => (
    class CucumberEventListener {
        constructor () {
            this.on = jest.fn()
            this.on.mockReturnValue(this)
        }
    }
))

test('registers all listeners', () => {
    const hookRunner = new HookRunner('foobar', {})
    expect(hookRunner.eventListener.on)
        .toBeCalledWith('before-feature', expect.any(Function))
    expect(hookRunner.eventListener.on)
        .toBeCalledWith('before-scenario', expect.any(Function))
    expect(hookRunner.eventListener.on)
        .toBeCalledWith('before-step', expect.any(Function))
    expect(hookRunner.eventListener.on)
        .toBeCalledWith('after-step', expect.any(Function))
    expect(hookRunner.eventListener.on)
        .toBeCalledWith('after-scenario', expect.any(Function))
    expect(hookRunner.eventListener.on)
        .toBeCalledWith('after-feature', expect.any(Function))
})

test('handles hooks', () => {
    const hookRunner = new HookRunner('foobar', {
        beforeFeature: 'beforeFeature',
        beforeScenario: 'beforeScenario',
        beforeStep: 'beforeStep',
        afterStep: 'afterStep',
        afterScenario: 'afterScenario',
        afterFeature: 'afterFeature'
    })

    hookRunner.handleBeforeFeature('uri', 'feature')
    expect(executeHooksWithArgs).toBeCalledWith('beforeFeature', 'feature')
    hookRunner.handleBeforeScenario('uri', 'feature', 'scenario')
    expect(executeHooksWithArgs).toBeCalledWith('beforeScenario', 'scenario')
    hookRunner.handleBeforeStep('uri', 'feature', 'scenario', 'step')
    expect(executeHooksWithArgs).toBeCalledWith('beforeStep', 'step')
    hookRunner.handleAfterStep(
        'uri',
        { name: 'feature123' },
        { name: 'scenario123' },
        { name: 'step123' },
        { status: 'pass' }
    )
    expect(executeHooksWithArgs).toBeCalledWith('afterStep', {
        name: 'step123',
        feature: 'feature123',
        scenario: 'scenario123',
        status: 'pass'
    }, { status: 'pass' })
    hookRunner.handleAfterScenario('uri', 'feature', 'scenario')
    expect(executeHooksWithArgs).toBeCalledWith('afterScenario', 'scenario')
    hookRunner.handleAfterFeature('uri', 'feature')
    expect(executeHooksWithArgs).toBeCalledWith('afterFeature', 'feature')
})
