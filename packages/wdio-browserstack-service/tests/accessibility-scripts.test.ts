import fs from 'node:fs'

import { describe, expect, it, vi, afterAll, beforeAll } from 'vitest'

import AccessibilityScripts from '../src/scripts/accessibility-scripts.js'

vi.mock('node:fs', () => ({
    default: {
        readFileSync: vi.fn().mockReturnValue('{"scripts": {"scan": "scan", "getResults": "getResults", "getResultsSummary": "getResultsSummary", "saveResults": "saveResults"}, "commands": [{"command": "command1"}, {"command": "command2"}]}'),
        writeFileSync: vi.fn(),
        existsSync: vi.fn().mockReturnValue(true),
        mkdirSync: vi.fn()
    }
}))

describe('AccessibilityScripts', () => {
    let accessibilityScripts: typeof AccessibilityScripts

    beforeAll(() => {
        accessibilityScripts = AccessibilityScripts
    })

    afterAll(() => {
        accessibilityScripts.store()
    })

    it('should read from existing file if it exists', () => {
        // Simulate existing commands.json file
        accessibilityScripts.readFromExistingFile()

        expect(accessibilityScripts.performScan).to.equal('scan')
        expect(accessibilityScripts.getResults).to.equal('getResults')
        expect(accessibilityScripts.getResultsSummary).to.equal('getResultsSummary')
        expect(accessibilityScripts.saveTestResults).to.equal('saveResults')
        expect(accessibilityScripts.commandsToWrap).to.deep.equal([{ command: 'command1' }, { command: 'command2' }])
    })

    it('should update data', () => {
        const data = {
            commands: [{ command: 'command1' }, { command: 'command2' }],
            scripts: {
                scan: 'scan',
                getResults: 'getResults',
                getResultsSummary: 'getResultsSummary',
                saveResults: 'saveResults',
            },
        } as unknown

        accessibilityScripts.update(data as { commands: [any]; scripts: { scan: null; getResults: null; getResultsSummary: null; saveResults: null } })

        expect(accessibilityScripts.performScan).to.equal('scan')
        expect(accessibilityScripts.getResults).to.equal('getResults')
        expect(accessibilityScripts.getResultsSummary).to.equal('getResultsSummary')
        expect(accessibilityScripts.saveTestResults).to.equal('saveResults')
        expect(accessibilityScripts.commandsToWrap).to.deep.equal([{ command: 'command1' }, { command: 'command2' }])
    })

    it('should store data to file', () => {
        // Mock storing data
        accessibilityScripts.performScan = 'scan'
        accessibilityScripts.getResults = 'getResults'
        accessibilityScripts.getResultsSummary = 'getResultsSummary'
        accessibilityScripts.saveTestResults = 'saveResults'
        accessibilityScripts.commandsToWrap = [{ command: 'command1' }, { command: 'command2' }]

        const writeFileSyncStub = vi.spyOn(fs, 'writeFileSync')
        accessibilityScripts.store()
        // Check if the correct data is being written to the file
        expect(writeFileSyncStub).toHaveBeenCalledWith(
            accessibilityScripts.commandsPath,
            JSON.stringify({
                commands: accessibilityScripts.commandsToWrap,
                scripts: {
                    scan: accessibilityScripts.performScan,
                    getResults: accessibilityScripts.getResults,
                    getResultsSummary: accessibilityScripts.getResultsSummary,
                    saveResults: accessibilityScripts.saveTestResults,
                }
            })
        )
    })
})
