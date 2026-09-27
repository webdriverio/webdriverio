import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createProject, type Project } from './helpers.js'

describe('doctor', () => {
    let project: Project

    beforeEach(() => {
        project = createProject('doctor')
    })

    afterEach(() => project.cleanup())

    it('reports node and chrome, and a fix for missing Appium', async () => {
        const result = await project.run(['doctor', '--json'])
        expect(result.json?.ok).toBe(true)
        const checks = result.json.result.data.checks as { id: string, status: string, fix?: string }[]
        expect(checks.find((row) => row.id === 'node')?.status).toBe('ok')
        expect(checks.find((row) => row.id === 'browser:chrome')?.status).toBe('ok')
        const appium = checks.find((row) => row.id === 'appium')
        expect(appium?.status).toBe('fail')
        expect(appium?.fix).toBeTruthy()
        expect(result.code).toBe(1)
        expect(result.json.result.data.exitCode).toBe(1)
    })

    it('limits an Android doctor to Android checks', async () => {
        const result = await project.run(['doctor', 'android', '--json'])
        const checks = result.json.result.data.checks as { id: string }[]
        expect(checks.map((row) => row.id)).toEqual([
            'node', 'webdriverio', 'runtime-dir', 'sessions',
            'appium', 'appium-driver:uiautomator2', 'android-sdk'
        ])
        expect(result.code).toBe(1)
    })
})
