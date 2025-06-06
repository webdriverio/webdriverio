import fs from 'node:fs'

import { describe, expect, it, vi, afterAll, beforeAll, beforeEach } from 'vitest'

import AccessibilityScripts from '../src/scripts/accessibility-scripts.js'

vi.mock('node:fs', () => ({
    default: {
        readFileSync: vi.fn().mockReturnValue('{"scripts": {"scan": "scan", "getResults": "getResults", "getResultsSummary": "getResultsSummary", "saveResults": "saveResults"}, "commands": [{"command": "command1"}, {"command": "command2"}], "nonBStackInfraA11yChromeOptions": {"extension": ["extension1"]}}'),
        writeFileSync: vi.fn(),
        existsSync: vi.fn().mockReturnValue(true),
        mkdirSync: vi.fn(),
        accessSync: vi.fn()
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
        expect(accessibilityScripts.ChromeExtension).to.deep.equal({ extension: ['extension1'] })
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
            nonBStackInfraA11yChromeOptions: { extension: ['extension1'] }
        } as unknown

        accessibilityScripts.update(data as { commands: [any]; scripts: { scan: null; getResults: null; getResultsSummary: null; saveResults: null }; nonBStackInfraA11yChromeOptions:{} })

        expect(accessibilityScripts.performScan).to.equal('scan')
        expect(accessibilityScripts.getResults).to.equal('getResults')
        expect(accessibilityScripts.getResultsSummary).to.equal('getResultsSummary')
        expect(accessibilityScripts.saveTestResults).to.equal('saveResults')
        expect(accessibilityScripts.commandsToWrap).to.deep.equal([{ command: 'command1' }, { command: 'command2' }])
        expect(accessibilityScripts.ChromeExtension).to.deep.equal({ extension: ['extension1'] })
    })

    it('should store data to file', () => {
        // Mock storing data
        accessibilityScripts.performScan = 'scan'
        accessibilityScripts.getResults = 'getResults'
        accessibilityScripts.getResultsSummary = 'getResultsSummary'
        accessibilityScripts.saveTestResults = 'saveResults'
        accessibilityScripts.commandsToWrap = [{ command: 'command1' }, { command: 'command2' }]
        accessibilityScripts.ChromeExtension = { extension: ['extension1'] }

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
                },
                nonBStackInfraA11yChromeOptions: accessibilityScripts.ChromeExtension,
            })
        )
    })
})

describe('getWritableDir', () => {
    const accessibilityScripts: typeof AccessibilityScripts = AccessibilityScripts
    const existsSyncStub: any = vi.spyOn(fs, 'existsSync')
    const accessSyncStub: any = vi.spyOn(fs, 'accessSync')
    const mkdirSyncStub: any = vi.spyOn(fs, 'mkdirSync')
    let writableDir: string

    beforeEach(() => {
        existsSyncStub.mockReset()
        accessSyncStub.mockReset()
        mkdirSyncStub.mockReset()
    })

    it('should return a path when directory is present', () => {
        existsSyncStub.mockReturnValue(true)
        writableDir = accessibilityScripts.getWritableDir()
        expect(existsSyncStub).toHaveBeenCalled()
        expect(accessSyncStub).toHaveBeenCalled()
        expect(writableDir).toBeTruthy()
    })

    it('should create the directory and return the path when it is not present', () => {
        existsSyncStub.mockReturnValue(false)
        writableDir = accessibilityScripts.getWritableDir()
        expect(existsSyncStub).toHaveBeenCalled()
        expect(mkdirSyncStub).toHaveBeenCalledWith(expect.any(String), { recursive: true })
        expect(writableDir).toBeTruthy()
    })

    it('should return an empty string when mkdirSync throws an exception', () => {
        existsSyncStub.mockReturnValue(false)
        mkdirSyncStub.mockImplementation(() => {
            throw new Error('Failed to create directory')
        })

        writableDir = accessibilityScripts.getWritableDir()
        expect(existsSyncStub).toHaveBeenCalled()
        expect(mkdirSyncStub).toHaveBeenCalled()
        expect(writableDir).toBe('') // Expect empty string as fallback
    })

    it('should skip the first path if mkdirSync throws and succeed for the second path', () => {
        let callCount = 0

        existsSyncStub.mockImplementation(() => false)
        mkdirSyncStub.mockImplementation(() => {
            if (callCount === 0) {
                callCount++
                throw new Error('Failed to create first directory')
            }
        })

        writableDir = accessibilityScripts.getWritableDir()
        expect(existsSyncStub).toHaveBeenCalledTimes(2)
        expect(mkdirSyncStub).toHaveBeenCalledTimes(2) // Called for first adn second paths
        expect(writableDir).toBe(process.cwd()) // Should return the second path
    })
})
