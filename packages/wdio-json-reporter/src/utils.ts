import type { HookStats, TestStats } from '@wdio/reporter'
import type { Hook, Test } from './types.js'

export function mapHooks (hooks: HookStats[]): Hook[] {
    return hooks.map((hook) => ({
        start: hook.start,
        end: hook.end,
        duration: hook.duration,
        title: hook.title,
        associatedSuite: hook.parent,
        associatedTest: hook.currentTest,
        state: hook.errors && hook.errors.length && hook.state ? hook.state : 'passed',
        error: hook.error
    }))
}

export function mapTests (tests: TestStats[]): Test[] {
    return tests.map((test) => ({
        name: test.title,
        start: test.start,
        end: test.end,
        duration: test.duration,
        state: test.state,
        error: test.error
    }))
}
