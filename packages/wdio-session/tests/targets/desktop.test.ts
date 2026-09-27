import { describe, it, expect } from 'vitest'

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
    })

    it('refuses macos off macOS and windows off Windows', async () => {
        await expect(buildPlan({ target: 'macos', bundleId: 'com.apple.TextEdit' }, ctx)).rejects.toMatchObject({ code: 'NOT_SUPPORTED' })
        await expect(buildPlan({ target: 'windows' }, ctx)).rejects.toMatchObject({ code: 'NOT_SUPPORTED' })
    })
})
