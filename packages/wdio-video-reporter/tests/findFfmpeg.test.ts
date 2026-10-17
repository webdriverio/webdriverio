import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, it, expect, afterAll } from 'vitest'
import { findFfmpeg } from '../src/helpers.js'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-video-ffmpeg-'))
const binDir = path.join(dir, 'bin')
const emptyDir = path.join(dir, 'empty')
const onPath = path.join(binDir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
const custom = path.join(dir, 'custom-ffmpeg')
fs.mkdirSync(binDir)
fs.mkdirSync(emptyDir)
for (const file of [onPath, custom]) {
    fs.writeFileSync(file, '')
    fs.chmodSync(file, 0o755)
}

afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true })
})

describe('findFfmpeg', () => {
    it('uses the ffmpegPath option first', () => {
        expect(findFfmpeg(custom, { PATH: binDir, FFMPEG_PATH: onPath })).toBe(custom)
    })

    it('then the FFMPEG_PATH environment variable', () => {
        expect(findFfmpeg(undefined, { PATH: binDir, FFMPEG_PATH: custom })).toBe(custom)
    })

    it('then ffmpeg on the PATH', () => {
        expect(findFfmpeg(undefined, { PATH: [path.join(dir, 'missing'), emptyDir, binDir].join(path.delimiter) })).toBe(onPath)
    })

    it('finds nothing when ffmpeg is not installed', () => {
        expect(findFfmpeg(undefined, { PATH: emptyDir })).toBeUndefined()
        expect(findFfmpeg(undefined, {})).toBeUndefined()
    })

    it('does not use a ffmpegPath or FFMPEG_PATH that does not exist', () => {
        expect(findFfmpeg(path.join(dir, 'missing'), { PATH: binDir })).toBeUndefined()
        expect(findFfmpeg(undefined, { PATH: binDir, FFMPEG_PATH: path.join(dir, 'missing') })).toBeUndefined()
    })

    it('finds a ffmpegPath or FFMPEG_PATH with no folder (a command name) on the PATH', () => {
        expect(findFfmpeg(path.basename(onPath), { PATH: binDir })).toBe(onPath)
        expect(findFfmpeg(undefined, { PATH: binDir, FFMPEG_PATH: path.basename(onPath) })).toBe(onPath)
        expect(findFfmpeg('custom-ffmpeg', { PATH: binDir })).toBeUndefined()
    })

    it.skipIf(process.platform === 'win32')('does not use a file on the PATH that is not executable', () => {
        const noExec = path.join(dir, 'no-exec')
        fs.mkdirSync(noExec)
        fs.writeFileSync(path.join(noExec, 'ffmpeg'), '')
        fs.chmodSync(path.join(noExec, 'ffmpeg'), 0o644)
        expect(findFfmpeg(undefined, { PATH: noExec })).toBeUndefined()
    })
})
