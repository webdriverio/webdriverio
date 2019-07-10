import { executeHooksWithArgs } from '@wdio/config'

import HookRunner from '../src/hookRunner'

jest.mock('../src/cucumberEventListener', () => (
    class CucumberEventListener {
        constructor() {
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

describe('handles hooks', () => {
    const hookRunner = new HookRunner('foobar', {
        beforeFeature: 'beforeFeature',
        beforeScenario: 'beforeScenario',
        beforeStep: 'beforeStep',
        afterStep: 'afterStep',
        afterScenario: 'afterScenario',
        afterFeature: 'afterFeature'
    })

    test('beforeFeature', () => {
        hookRunner.handleBeforeFeature('uri', 'feature')
        expect(executeHooksWithArgs).toBeCalledWith('beforeFeature', ['uri', 'feature'])
    })

    test('beforeScenario', () => {
        hookRunner.handleBeforeScenario('uri', 'feature', 'scenario')
        expect(executeHooksWithArgs).toBeCalledWith('beforeScenario', ['uri', 'feature', 'scenario'])
    })

    test('beforeStep', () => {
        hookRunner.handleBeforeStep('uri', 'feature', 'scenario', 'step')
        expect(executeHooksWithArgs).toBeCalledWith('beforeStep', ['uri', 'feature', 'scenario', 'step'])
    })

    test('afterStep', () => {
        hookRunner.handleAfterStep('uri', 'feature', 'scenario', 'step', 'result')
        expect(executeHooksWithArgs).toBeCalledWith('afterStep', ['uri', 'feature', 'scenario', 'step', 'result'])
    })

    test('afterScenario', () => {
        hookRunner.handleAfterScenario('uri', 'feature', 'scenario')
        expect(executeHooksWithArgs).toBeCalledWith('afterScenario', ['uri', 'feature', 'scenario'])
    })

    test('afterFeature', () => {
        hookRunner.handleAfterFeature('uri', 'feature')
        expect(executeHooksWithArgs).toBeCalledWith('afterFeature', ['uri', 'feature'])
    })

    afterEach(() => {
        executeHooksWithArgs.mockClear()
    })
})
