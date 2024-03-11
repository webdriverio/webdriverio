import fs from 'fs'

import AccessibilityScripts from '../src/scripts/accessibility-scripts'
jest.mock('fs', () => ({
    readFileSync: jest.fn().mockReturnValue('{"scripts": {"scan": "scan", "getResults": "getResults", "getResultsSummary": "getResultsSummary", "saveResults": "saveResults"}, "commands": [{"command": "command1"}, {"command": "command2"}]}'),
    writeFileSync: jest.fn(),
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn()
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

        expect(accessibilityScripts.performScan).toEqual('scan')
        expect(accessibilityScripts.getResults).toEqual('getResults')
        expect(accessibilityScripts.getResultsSummary).toEqual('getResultsSummary')
        expect(accessibilityScripts.saveTestResults).toEqual('saveResults')
        expect(accessibilityScripts.commandsToWrap).toEqual([{ command: 'command1' }, { command: 'command2' }])
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

        expect(accessibilityScripts.performScan).toEqual('scan')
        expect(accessibilityScripts.getResults).toEqual('getResults')
        expect(accessibilityScripts.getResultsSummary).toEqual('getResultsSummary')
        expect(accessibilityScripts.saveTestResults).toEqual('saveResults')
        expect(accessibilityScripts.commandsToWrap).toEqual([{ command: 'command1' }, { command: 'command2' }])
    })

    it('should store data to file', () => {
        // Mock storing data
        accessibilityScripts.performScan = 'scan'
        accessibilityScripts.getResults = 'getResults'
        accessibilityScripts.getResultsSummary = 'getResultsSummary'
        accessibilityScripts.saveTestResults = 'saveResults'
        accessibilityScripts.commandsToWrap = [{ command: 'command1' }, { command: 'command2' }]

        accessibilityScripts.store()
        // Check if the correct data is being written to the file
        expect(fs.writeFileSync).toHaveBeenCalledWith(
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
