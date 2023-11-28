import { expect } from 'expect-webdriverio'
import type { Services, Frameworks } from '@wdio/types'
import { SnapshotState } from 'jest-snapshot'
import path from 'node:path'
import logger from '@wdio/logger'

const log = logger('@wdio/snapshot-service')

export default class SnapshotService implements Services.ServiceInstance {
    snapshotState: SnapshotState | null = null

    async beforeTest(test: Frameworks.Test) {
        const snapshotPath = resolveSnapshotPath(test.file)
        this.snapshotState = new SnapshotState(snapshotPath, {
            updateSnapshot: 'new',
            snapshotFormat: {},
            rootDir: test.file
        })
        expect.setState({ snapshotState: this.snapshotState, testPath: test.file } as any)
        expect.setState({ currentTestName: getNames(test).join(' > ') })
    }

    async afterTest(_test: Frameworks.Test, context: any) {
        this.snapshotState?.save()
        this.snapshotState?.clear()
        const expectState = expect.getState()
        //Handle jest-snapshot suppressed errors
        if (expectState.suppressedErrors.length > 0) {
            expectState.suppressedErrors.forEach((suppressedError: Error) => log.error(suppressedError))
            context.snapshotError = new Error('Some snapshot assertions failed. See above for details.')
        }
    }
}

class SnapshotServiceLauncher {
    constructor() {
        log.info('SnapshotServiceLauncher constructor called\n')
    }
}

function getNames(test: Frameworks.Test) {
    const value: string[] = [test.title]
    if (test.ctx && test.ctx.test) {
        let parent = typeof test.parent === 'object' ? test.parent : test.ctx.test.parent
        while (parent && parent.title !== '') {
            value.push(parent.title)
            parent = parent.parent
        }
    }
    return value.reverse()
}
function resolveSnapshotPath(testPath: string) {
    return path.join(
        path.join(path.dirname(testPath), '__snapshots__'),
        path.basename(testPath) + '.snap',
    )
}
export const launcher = SnapshotServiceLauncher

