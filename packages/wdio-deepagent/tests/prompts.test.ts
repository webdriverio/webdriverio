import { describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { DEFAULT_INSTRUCTIONS, readAppendedInstructions, readInstructionsFile } from '../src/prompts.js'

const FILE_CONTENT = 'file-based rules\n- keep it short'
const INLINE_TEXT = 'inline rules: prefer get_elements'

describe('readAppendedInstructions', () => {
    it('returns an empty string when both sources are absent', async () => {
        expect(await readAppendedInstructions({})).toBe('')
    })

    it('returns an empty string when both values are empty strings', async () => {
        expect(await readAppendedInstructions({ appendInstructions: '', appendInstructionsFile: '' })).toBe('')
    })

    it('appends inline text only when no file is given', async () => {
        expect(await readAppendedInstructions({ appendInstructions: INLINE_TEXT })).toBe('\n\n' + INLINE_TEXT)
    })

    it('reads the file when no inline text is given', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-prompts-'))
        const file = path.join(dir, 'rules.md')
        await fs.writeFile(file, FILE_CONTENT)
        try {
            expect(await readAppendedInstructions({ appendInstructionsFile: file })).toBe('\n\n' + FILE_CONTENT)
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it('treats an empty inline string as absent', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-prompts-'))
        const file = path.join(dir, 'rules.md')
        await fs.writeFile(file, FILE_CONTENT)
        try {
            expect(await readAppendedInstructions({ appendInstructions: '', appendInstructionsFile: file }))
                .toBe('\n\n' + FILE_CONTENT)
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it('puts file contents before inline text when both are set', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-prompts-'))
        const file = path.join(dir, 'rules.md')
        await fs.writeFile(file, FILE_CONTENT)
        try {
            const result = await readAppendedInstructions({
                appendInstructions: INLINE_TEXT,
                appendInstructionsFile: file,
            })
            const fileIdx = result.indexOf(FILE_CONTENT)
            const inlineIdx = result.indexOf(INLINE_TEXT)
            expect(fileIdx).toBeGreaterThan(-1)
            expect(inlineIdx).toBeGreaterThan(-1)
            expect(fileIdx).toBeLessThan(inlineIdx)
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it('rejects with a helpful message when the file cannot be read', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-prompts-'))
        try {
            await expect(readAppendedInstructions({ appendInstructionsFile: path.join(dir, 'missing.md') }))
                .rejects.toThrow(/Cannot read appended instructions file/)
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })
})

describe('readInstructionsFile', () => {
    it('replaces the default instructions entirely when a file is given', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-prompts-'))
        const file = path.join(dir, 'instructions.md')
        await fs.writeFile(file, FILE_CONTENT)
        try {
            const result = await readInstructionsFile(file)
            expect(result).toBe(FILE_CONTENT)
            expect(result).not.toContain(DEFAULT_INSTRUCTIONS)
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })
})
