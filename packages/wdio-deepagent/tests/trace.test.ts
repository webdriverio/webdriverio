import { describe, expect, it } from 'vitest'
import AdmZip from 'adm-zip'
import { parseTraceArchive } from '../src/trace/reader.js'

/** Builds a fixture trace.zip in the documented devtools layout. */
function makeFixtureZip(): Buffer {
    const zip = new AdmZip()
    zip.addFile('trace.trace', Buffer.from([
        JSON.stringify({ type: 'context-options', context: 'ctx-1', url: 'https://example.com' }),
        JSON.stringify({
            type: 'before', id: 'a1', ts: 1000,
            action: { name: 'url', value: 'https://example.com' },
            screenshotFile: 'resources/page@ctx-1-1000.jpeg',
            elementsFile: 'resources/page@ctx-1-1000-elements.json',
            snapshotFile: 'resources/page@ctx-1-1000-snapshot.txt',
        }),
        JSON.stringify({ type: 'after', id: 'a1', ts: 1450 }),
        JSON.stringify({
            type: 'before', id: 'a2', ts: 1500,
            action: { name: 'click', selector: '#login-btn' },
        }),
        JSON.stringify({ type: 'after', id: 'a2', ts: 1500, error: 'element not found' }),
        'this is not json',
    ].join('\n')))
    zip.addFile('trace.network', Buffer.from(
        JSON.stringify({ method: 'GET', url: 'https://example.com/api', status: 200, duration: 12 }) + '\n' +
        JSON.stringify({ method: 'POST', url: 'https://example.com/login', status: 500, duration: 300 }) + '\n',
    ))
    zip.addFile('transcript.md', Buffer.from('# Trace\n- url https://example.com\n'))
    zip.addFile('resources/page@ctx-1-1000-elements.json', Buffer.from('{"elements":[{"selector":"#login-btn"}]}'))
    zip.addFile('resources/page@ctx-1-1000-snapshot.txt', Buffer.from('root\n  button "Login" #login-btn\n'))
    zip.addFile('resources/page@ctx-1-1000.jpeg', Buffer.from('jpeg-bytes'))
    return zip.toBuffer()
}

describe('parseTraceArchive', () => {
    it('parses the action timeline from before/after pairs', () => {
        const artifact = parseTraceArchive(makeFixtureZip(), 'trace-test.zip')

        expect(artifact.source).toBe('trace-test.zip')
        // context-options + after records do not become actions
        expect(artifact.actions).toHaveLength(2)

        const [nav, click] = artifact.actions
        expect(nav).toMatchObject({ id: 'a1', name: 'url', value: 'https://example.com' })
        expect(nav.startedAt).toBe(1000)
        expect(nav.duration).toBe(450)
        expect(nav.ok).toBe(true)

        expect(click).toMatchObject({ id: 'a2', name: 'click', selector: '#login-btn' })
        expect(click.ok).toBe(false)
        expect(click.error).toBe('element not found')
    })

    it('parses network entries', () => {
        const artifact = parseTraceArchive(makeFixtureZip())
        expect(artifact.network).toHaveLength(2)
        expect(artifact.network[0]).toMatchObject({ method: 'GET', status: 200, duration: 12 })
        expect(artifact.network[1].status).toBe(500)
    })

    it('extracts transcript, snapshots and screenshots', () => {
        const artifact = parseTraceArchive(makeFixtureZip())
        expect(artifact.transcript).toContain('Trace')
        expect(artifact.snapshots.size).toBe(2)
        expect(artifact.snapshots.get('resources/page@ctx-1-1000-snapshot.txt')).toContain('#login-btn')
        expect(artifact.screenshots.size).toBe(1)
        expect(artifact.screenshots.get('resources/page@ctx-1-1000.jpeg')?.toString()).toBe('jpeg-bytes')
    })

    it('tolerates malformed lines and empty archives', () => {
        const empty = new AdmZip().toBuffer()
        const artifact = parseTraceArchive(empty, 'empty.zip')
        expect(artifact.actions).toHaveLength(0)
        expect(artifact.network).toHaveLength(0)
        expect(artifact.transcript).toBe('')
    })

    it('rejects archives with more entries than the cap', () => {
        const zip = new AdmZip()
        for (let i = 0; i < 5; i++) {
            zip.addFile(`f-${i}.txt`, Buffer.from('x'))
        }
        expect(() => parseTraceArchive(zip.toBuffer(), 'bomb.zip', { maxEntries: 3 }))
            .toThrow(/5 entries \(max 3\)/)
    })

    it('rejects entries that declare more bytes than the cap', () => {
        const zip = new AdmZip()
        zip.addFile('big.txt', Buffer.from('hello'))
        expect(() => parseTraceArchive(zip.toBuffer(), 'bomb.zip', { maxTotalBytes: 4 }))
            .toThrow(/declares 5 bytes/)
    })

    it('rejects archives whose total decompressed size exceeds the cap', () => {
        const zip = new AdmZip()
        zip.addFile('a.txt', Buffer.from('aaaa'))
        zip.addFile('b.txt', Buffer.from('bbbb'))
        expect(() => parseTraceArchive(zip.toBuffer(), 'bomb.zip', { maxTotalBytes: 6 }))
            .toThrow(/exceeds 6 bytes decompressed/)
    })
})
