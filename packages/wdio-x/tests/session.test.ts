import os from 'node:os'
import fs from 'node:fs/promises'
import path from 'node:path'

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import {
    getSessionDir,
    getSessionPath,
    getRefsPath,
    writeSession,
    readSession,
    deleteSessionFiles,
    listSessions,
} from '../src/session.js'
import type { SessionMetadata } from '../src/session.js'

let tmpDir: string

const sampleMetadata: SessionMetadata = {
    sessionId: 'abc-123',
    hostname: 'localhost',
    port: 4444,
    capabilities: { browserName: 'chrome' },
    created: '2026-02-15T12:00:00.000Z',
    url: 'http://localhost:4444',
}

beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-x-session-test-'))
})

afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('session', () => {
    describe('getSessionDir', () => {
        it('should return default dir when no baseDir is provided', () => {
            const dir = getSessionDir()
            expect(dir).toBe(path.join(os.homedir(), '.wdio-x', 'sessions'))
        })

        it('should return the provided baseDir', () => {
            const dir = getSessionDir('/tmp/custom')
            expect(dir).toBe('/tmp/custom')
        })
    })

    describe('getSessionPath', () => {
        it('should return correct path for a named session', () => {
            const result = getSessionPath('my-session', tmpDir)
            expect(result).toBe(path.join(tmpDir, 'my-session.json'))
        })

        it('should return correct path for default session', () => {
            const result = getSessionPath('default', tmpDir)
            expect(result).toBe(path.join(tmpDir, 'default.json'))
        })
    })

    describe('getRefsPath', () => {
        it('should return refs path for a session', () => {
            const result = getRefsPath('my-session', tmpDir)
            expect(result).toBe(path.join(tmpDir, 'my-session.refs.json'))
        })
    })

    describe('writeSession + readSession', () => {
        it('should round-trip session metadata correctly', async () => {
            await writeSession('test-session', sampleMetadata, tmpDir)
            const result = await readSession('test-session', tmpDir)
            expect(result).toEqual(sampleMetadata)
        })

        it('should create the session directory if it does not exist', async () => {
            const nestedDir = path.join(tmpDir, 'nested', 'sessions')
            await writeSession('test-session', sampleMetadata, nestedDir)
            const result = await readSession('test-session', nestedDir)
            expect(result).toEqual(sampleMetadata)
        })
    })

    describe('readSession', () => {
        it('should return null for a non-existent session', async () => {
            const result = await readSession('nonexistent', tmpDir)
            expect(result).toBeNull()
        })
    })

    describe('deleteSessionFiles', () => {
        it('should remove both .json and .refs.json files', async () => {
            // Write both session and refs files
            await writeSession('del-test', sampleMetadata, tmpDir)
            const refsPath = getRefsPath('del-test', tmpDir)
            await fs.writeFile(refsPath, JSON.stringify({ refs: [] }))

            // Verify they exist
            await expect(fs.access(getSessionPath('del-test', tmpDir))).resolves.toBeUndefined()
            await expect(fs.access(refsPath)).resolves.toBeUndefined()

            // Delete
            await deleteSessionFiles('del-test', tmpDir)

            // Verify both are gone
            await expect(fs.access(getSessionPath('del-test', tmpDir))).rejects.toThrow()
            await expect(fs.access(refsPath)).rejects.toThrow()
        })

        it('should not throw when files do not exist', async () => {
            await expect(deleteSessionFiles('ghost', tmpDir)).resolves.toBeUndefined()
        })
    })

    describe('listSessions', () => {
        it('should return all sessions, excluding .refs.json files', async () => {
            await writeSession('alpha', sampleMetadata, tmpDir)
            await writeSession('beta', { ...sampleMetadata, sessionId: 'def-456' }, tmpDir)

            // Also write a refs file that should be excluded
            await fs.writeFile(
                getRefsPath('alpha', tmpDir),
                JSON.stringify({ refs: [] })
            )

            const sessions = await listSessions(tmpDir)
            expect(sessions).toHaveLength(2)

            const names = sessions.map((s) => s.name).sort()
            expect(names).toEqual(['alpha', 'beta'])

            const alpha = sessions.find((s) => s.name === 'alpha')
            expect(alpha?.metadata).toEqual(sampleMetadata)

            const beta = sessions.find((s) => s.name === 'beta')
            expect(beta?.metadata.sessionId).toBe('def-456')
        })

        it('should return empty array when no sessions exist', async () => {
            const sessions = await listSessions(tmpDir)
            expect(sessions).toEqual([])
        })

        it('should return empty array when directory does not exist', async () => {
            const sessions = await listSessions(path.join(tmpDir, 'nonexistent'))
            expect(sessions).toEqual([])
        })
    })
})
