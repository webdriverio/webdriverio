import AdmZip from 'adm-zip'

/**
 * Builds a failing devtools trace.zip (adm-zip layout documented in
 * `packages/wdio-deepagent/tests/trace.test.ts`): a navigation that
 * succeeded and a click that errored, plus one network failure.
 */
export function buildTraceZip(): Buffer {
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
    ].join('\n')))
    zip.addFile('trace.network', Buffer.from(
        JSON.stringify({ method: 'GET', url: 'https://example.com/api', status: 200, duration: 12 }) + '\n' +
        JSON.stringify({ method: 'POST', url: 'https://example.com/login', status: 500, duration: 300 }) + '\n',
    ))
    zip.addFile('transcript.md', Buffer.from('# Trace\n- url https://example.com\n- click #login-btn failed\n'))
    zip.addFile('resources/page@ctx-1-1000-elements.json', Buffer.from('{"elements":[{"selector":"#login-btn"}]}'))
    zip.addFile('resources/page@ctx-1-1000-snapshot.txt', Buffer.from('root\n  button "Login" #login-btn\n'))
    zip.addFile('resources/page@ctx-1-1000.jpeg', Buffer.from('jpeg-bytes'))
    return zip.toBuffer()
}
