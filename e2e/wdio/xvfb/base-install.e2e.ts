import { expect } from '@wdio/globals'
import { execSync } from 'node:child_process'
import { XvfbManager } from '@wdio/xvfb'

describe('xvfb fresh installation', () => {
    let manager: XvfbManager

    beforeEach(() => {
        manager = new XvfbManager({ autoInstall: true })
    })

    it('should install xvfb using detected package manager', async function(this: Mocha.Context) {
        this.timeout(300000) // 5 minutes for real installation

        // Should initially not be available in base image
        expect(manager.shouldRun()).toBe(true)

        // Real installation attempt
        const result = await manager.init()
        expect(result).toBe(true)

        // Verify xvfb-run is now available
        const xvfbRunPath = execSync('which xvfb-run', { encoding: 'utf8' }).trim()
        expect(xvfbRunPath).toContain('xvfb-run')
    })

    it('should verify xvfb works after installation', async function(this: Mocha.Context) {
        this.timeout(300000)

        // Install and initialize
        const result = await manager.init()
        expect(result).toBe(true)

        // Test that xvfb-run can execute a simple command
        try {
            const testResult = execSync('xvfb-run --auto-servernum -- echo "installation verified"', {
                encoding: 'utf8',
                timeout: 10000
            })
            expect(testResult.trim()).toBe('installation verified')
        } catch (error) {
            throw new Error(`xvfb-run execution failed after installation: ${error}`)
        }
    })

    afterEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
    })

    after(() => {
        // Ensure clean exit
        setTimeout(() => {
            process.exit(0)
        }, 1000)
    })

})
