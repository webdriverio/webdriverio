import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { writeRefs, readRefs, resolveRef } from '../src/refs.js'
import type { RefMap, RefEntry } from '../src/refs.js'

describe('refs', () => {
    let tmpDir: string

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-refs-'))
    })

    afterEach(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true })
    })

    describe('writeRefs + readRefs', () => {
        it('should round-trip a ref map correctly', async () => {
            const refsPath = path.join(tmpDir, 'refs.json')
            const refs: RefMap = {
                'btn-login': {
                    cssSelector: 'button.login',
                    tagName: 'button',
                    text: 'Log In',
                },
                'input-email': {
                    cssSelector: 'input#email',
                    selector: '//input[@id="email"]',
                    tagName: 'input',
                    placeholder: 'Enter your email',
                },
            }

            await writeRefs(refsPath, refs)
            const result = await readRefs(refsPath)

            expect(result).toEqual(refs)
        })

        it('should handle an empty ref map', async () => {
            const refsPath = path.join(tmpDir, 'empty-refs.json')
            const refs: RefMap = {}

            await writeRefs(refsPath, refs)
            const result = await readRefs(refsPath)

            expect(result).toEqual({})
        })

        it('should preserve extra keys in ref entries', async () => {
            const refsPath = path.join(tmpDir, 'extra-refs.json')
            const refs: RefMap = {
                'card-item': {
                    cssSelector: 'div.card',
                    tagName: 'div',
                    ariaLabel: 'Product card',
                    dataTestId: 'card-1',
                },
            }

            await writeRefs(refsPath, refs)
            const result = await readRefs(refsPath)

            expect(result).toEqual(refs)
        })
    })

    describe('readRefs', () => {
        it('should return null for a non-existent path', async () => {
            const result = await readRefs(path.join(tmpDir, 'does-not-exist.json'))
            expect(result).toBeNull()
        })
    })

    describe('resolveRef', () => {
        it('should return cssSelector for browser refs', () => {
            const ref: RefEntry = {
                cssSelector: 'button.submit',
                tagName: 'button',
                text: 'Submit',
            }
            expect(resolveRef(ref)).toBe('button.submit')
        })

        it('should return selector for mobile refs (no cssSelector)', () => {
            const ref: RefEntry = {
                selector: '//android.widget.Button[@text="Submit"]',
                tagName: 'android.widget.Button',
                text: 'Submit',
            }
            expect(resolveRef(ref)).toBe('//android.widget.Button[@text="Submit"]')
        })

        it('should prefer cssSelector over selector when both are present', () => {
            const ref: RefEntry = {
                cssSelector: 'button.submit',
                selector: '//button[@class="submit"]',
                tagName: 'button',
            }
            expect(resolveRef(ref)).toBe('button.submit')
        })

        it('should return null when neither cssSelector nor selector exists', () => {
            const ref: RefEntry = {
                tagName: 'div',
                text: 'Hello',
            }
            expect(resolveRef(ref)).toBeNull()
        })
    })
})
