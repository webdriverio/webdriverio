import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn, execFile } from 'node:child_process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ensureInspectorPluginInstalled } from '../src/cli-utils.js'

vi.mock('node:child_process', () => ({
    spawn: vi.fn(),
    execFile: vi.fn()
}))

vi.mock('node:readline/promises', () => ({
    default: {
        createInterface: vi.fn(() => ({ question: vi.fn().mockResolvedValue(''), close: vi.fn() }))
    }
}))

describe('ensureInspectorPluginInstalled in a workspace package', () => {
    let root: string
    let originalIsTTY: boolean | undefined

    const mockPluginList = (output: object) => {
        vi.mocked(execFile).mockImplementationOnce(((file: any, args: any, options: any, callback: any) => {
            setImmediate(() => callback(null, { stdout: JSON.stringify(output), stderr: '' }))
            return {} as any
        }) as any)
    }

    beforeEach(() => {
        vi.clearAllMocks()
        originalIsTTY = process.stdin.isTTY
        process.stdin.isTTY = true
        vi.spyOn(console, 'log').mockImplementation(() => {})

        root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-appium-service-')))
        const pkg = path.join(root, 'packages', 'app')
        fs.mkdirSync(pkg, { recursive: true })
        fs.writeFileSync(path.join(root, 'pnpm-lock.yaml'), '')
        fs.writeFileSync(path.join(root, 'package.json'), '{}')
        fs.writeFileSync(path.join(pkg, 'package.json'), '{}')
        fs.writeFileSync(path.join(root, 'plugin.js'), '')
        vi.spyOn(process, 'cwd').mockReturnValue(pkg)

        vi.mocked(spawn).mockImplementationOnce((() => {
            const installProcess: any = { once: vi.fn((event: string, cb: (arg: any) => void) => {
                if (event === 'exit') {
                    setImmediate(() => cb(0))
                }
                return installProcess
            }) }
            return installProcess
        }) as any)
    })

    afterEach(() => {
        vi.restoreAllMocks()
        process.stdin.isTTY = originalIsTTY as boolean
        fs.rmSync(root, { recursive: true, force: true })
    })

    it('should use the package manager of the workspace root', async () => {
        mockPluginList({})
        mockPluginList({ inspector: { pkgName: 'appium-inspector-plugin', installPath: path.join(root, 'plugin.js') } })

        await ensureInspectorPluginInstalled('/path/to/appium')

        expect(spawn).toHaveBeenCalledWith('pnpm', ['add', '-D', 'appium-inspector-plugin'], { stdio: 'inherit' })
    })
})
