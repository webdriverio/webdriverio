import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { removeAllureAttachments } from '../src/allureResults.js'

describe('removeAllureAttachments', () => {
    let dir: string
    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-reporter-allure-'))
    })
    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true })
    })

    it('removes the placeholder files and their attachments from the results', () => {
        const result = {
            name: 'passes',
            attachments: [{ name: 'Execution video', source: 'a-attachment.webm', type: 'video/webm' }],
            steps: [{ name: 'step', attachments: [
                { name: 'Screenshot', source: 's-attachment.png', type: 'image/png' },
                { name: 'Execution video', source: 'a-attachment.webm', type: 'video/webm' }
            ], steps: [] }]
        }
        const other = { name: 'fails', attachments: [{ name: 'Execution video', source: 'b-attachment.webm', type: 'video/webm' }] }
        fs.writeFileSync(path.join(dir, '1-result.json'), JSON.stringify(result))
        fs.writeFileSync(path.join(dir, '2-result.json'), JSON.stringify(other))
        fs.writeFileSync(path.join(dir, 'a-attachment.webm'), '/videos/passes.webm')
        fs.writeFileSync(path.join(dir, 'b-attachment.webm'), 'real video')

        removeAllureAttachments(dir, [path.join(dir, 'a-attachment.webm')])

        expect(fs.existsSync(path.join(dir, 'a-attachment.webm'))).toBe(false)
        expect(fs.existsSync(path.join(dir, 'b-attachment.webm'))).toBe(true)
        const updated = JSON.parse(fs.readFileSync(path.join(dir, '1-result.json'), 'utf-8'))
        expect(updated.attachments).toEqual([])
        expect(updated.steps[0].attachments).toEqual([{ name: 'Screenshot', source: 's-attachment.png', type: 'image/png' }])
        expect(JSON.parse(fs.readFileSync(path.join(dir, '2-result.json'), 'utf-8'))).toEqual(other)
    })

    it('removes the step that held only the removed video, and keeps the other steps', () => {
        const result = {
            name: 'passes',
            steps: [
                // the step of `addAttachment`, as the Allure reporter writes it
                { name: 'Execution video', attachments: [{ name: 'Execution video', source: 'a-attachment.webm', type: 'video/webm' }], start: 1, stop: 1 },
                { name: 'click', attachments: [], steps: [], start: 2, stop: 3 }
            ]
        }
        fs.writeFileSync(path.join(dir, '1-result.json'), JSON.stringify(result))
        fs.writeFileSync(path.join(dir, 'a-attachment.webm'), '/videos/passes.webm')

        removeAllureAttachments(dir, [path.join(dir, 'a-attachment.webm')])

        const updated = JSON.parse(fs.readFileSync(path.join(dir, '1-result.json'), 'utf-8'))
        expect(updated.steps).toEqual([{ name: 'click', attachments: [], steps: [], start: 2, stop: 3 }])
    })

    it('does nothing without placeholders', () => {
        fs.writeFileSync(path.join(dir, '1-result.json'), '{"name":"x","attachments":[]}')
        removeAllureAttachments(dir, [])
        expect(fs.readFileSync(path.join(dir, '1-result.json'), 'utf-8')).toBe('{"name":"x","attachments":[]}')
    })

    it('skips a result file that another worker is writing, and keeps going', () => {
        const result = { name: 'passes', attachments: [{ name: 'Execution video', source: 'a-attachment.webm', type: 'video/webm' }] }
        fs.writeFileSync(path.join(dir, '1-result.json'), '{"name":"half writ')
        fs.writeFileSync(path.join(dir, '2-result.json'), JSON.stringify(result))
        fs.writeFileSync(path.join(dir, 'a-attachment.webm'), '/videos/passes.webm')

        expect(() => removeAllureAttachments(dir, [path.join(dir, 'a-attachment.webm')])).not.toThrow()

        expect(JSON.parse(fs.readFileSync(path.join(dir, '2-result.json'), 'utf-8')).attachments).toEqual([])
        expect(fs.readFileSync(path.join(dir, '1-result.json'), 'utf-8')).toBe('{"name":"half writ')
        expect(fs.readdirSync(dir).filter((file) => file.includes('.tmp'))).toEqual([])
    })
})
