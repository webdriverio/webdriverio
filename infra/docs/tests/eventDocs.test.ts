import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

import { renderEventPage, upcomingEventIds, generateEventDocs, type Event } from '../src/eventDocs.js'

const tempDirs: string[] = []

afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

const future: Event = {
    id: 'wdio-conf',
    time: '2099-12-01T00:00:00.000Z',
    title: 'WDIO Conf',
    image: 'img/conf.png',
    description: 'Join us',
    signup: true
}

const past: Event = {
    ...future,
    id: 'old-event',
    title: 'Old Event',
    time: '2000-01-01T00:00:00.000Z',
    signup: false
}

describe('renderEventPage', () => {
    it('includes signup and event details for upcoming events', () => {
        const page = renderEventPage(future)
        expect(page).toContain('id: "wdio-conf"')
        expect(page).toContain('title: "WDIO Conf"')
        expect(page).toContain('<EventDetails event=')
        expect(page).toContain('<EventSignup id="wdio-conf"')
        expect(page).toContain('Join us')
    })

    it('omits the signup widget when signup is false', () => {
        expect(renderEventPage(past)).not.toContain('<EventSignup')
    })
})

describe('upcomingEventIds', () => {
    it('keeps only events after the given date', () => {
        expect(upcomingEventIds([future, past], new Date('2026-01-01'))).toEqual(['wdio-conf'])
    })
})

describe('generateEventDocs', () => {
    it('writes sidebar ids and markdown pages', async () => {
        const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-events-'))
        tempDirs.push(rootDir)
        const fetchImpl = (async () => ({
            json: async () => [future, past]
        })) as unknown as typeof fetch

        await generateEventDocs({ rootDir, fetchImpl })

        expect(JSON.parse(fs.readFileSync(path.join(rootDir, 'website', 'events.json'), 'utf-8')))
            .toEqual(['wdio-conf'])
        expect(fs.existsSync(path.join(rootDir, 'website', 'community', 'events', 'wdio-conf.md'))).toBe(true)
        expect(fs.existsSync(path.join(rootDir, 'website', 'community', 'events', 'old-event.md'))).toBe(true)
    })

    it('writes an empty sidebar when the events API fails', async () => {
        const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-events-'))
        tempDirs.push(rootDir)
        const fetchImpl = (async () => {
            throw new Error('network down')
        }) as unknown as typeof fetch

        await generateEventDocs({ rootDir, fetchImpl })

        expect(JSON.parse(fs.readFileSync(path.join(rootDir, 'website', 'events.json'), 'utf-8')))
            .toEqual([])
    })
})
