import { describe, it, expect } from 'vitest'

import path from 'node:path'

import { windowsApp } from '../../src/targets/desktop.js'
import { buildPlan } from '../../src/targets/index.js'

const ctx = {
    name: 'default',
    cwd: '/repo',
    runtimeDir: '/run',
    artifactsDir: '/artifacts',
    argv: ['open', 'macos'],
    env: {} as NodeJS.ProcessEnv,
    platform: 'linux' as const
}

describe('desktop targets', () => {
    it('builds macOS and Windows capabilities', async () => {
        const mac = await buildPlan({ target: 'macos', appiumUrl: 'http://localhost:4723/', bundleId: 'com.apple.TextEdit' }, { ...ctx, platform: 'darwin' })
        expect(mac.capabilities).toEqual({
            platformName: 'mac',
            'appium:automationName': 'Mac2',
            'appium:bundleId': 'com.apple.TextEdit',
            'appium:newCommandTimeout': 3600
        })
        expect(mac).toMatchObject({ platform: 'desktop', applies: ['D'], label: 'macos (Mac2)' })

        const win = await buildPlan({ target: 'windows', appiumUrl: 'http://localhost:4723/' }, { ...ctx, platform: 'win32' })
        expect(win.capabilities).toMatchObject({ platformName: 'windows', 'appium:automationName': 'Windows', 'appium:app': 'Root' })

        const calc = await buildPlan({ target: 'windows', appiumUrl: 'http://localhost:4723/', app: 'Microsoft.WindowsCalculator' }, { ...ctx, platform: 'win32' })
        expect(calc.capabilities).toMatchObject({ 'appium:app': 'Microsoft.WindowsCalculator' })
        expect(windowsApp('Microsoft.WindowsCalculator', '/repo')).toBe('Microsoft.WindowsCalculator')
        expect(windowsApp('Root', '/repo')).toBe('Root')
        expect(windowsApp('dist/app.exe', '/repo')).toBe(path.resolve('/repo', 'dist/app.exe'))
    })

    it('refuses macos off macOS and windows off Windows', async () => {
        await expect(buildPlan({ target: 'macos', bundleId: 'com.apple.TextEdit' }, ctx)).rejects.toMatchObject({ code: 'NOT_SUPPORTED' })
        await expect(buildPlan({ target: 'windows' }, ctx)).rejects.toMatchObject({ code: 'NOT_SUPPORTED' })
    })
})
