import { expect } from '@wdio/globals'
import { execSync } from 'node:child_process'
import { XvfbManager } from '@wdio/xvfb'

describe('xvfb existing installation', () => {
    let xvfbManager: XvfbManager

    beforeEach(() => {
        xvfbManager = new XvfbManager()
    })

    it('should detect and use pre-installed xvfb', async function(this: Mocha.Context) {
        this.timeout(300000) // 5 minutes

        // Should detect existing xvfb installation
        expect(xvfbManager.shouldRun()).toBe(true)

        // Verify xvfb-run is available (pre-installed in this container)
        let xvfbRunPath = ''
        try {
            xvfbRunPath = execSync('which xvfb-run', { encoding: 'utf8' }).trim()
        } catch (error) {
            throw new Error(`xvfb-run should be pre-installed: ${error}`)
        }
        expect(xvfbRunPath).toContain('xvfb-run')
        expect(xvfbRunPath.length).toBeGreaterThan(0)

        // Initialize xvfb - should detect existing installation and return true
        const initResult = await xvfbManager.init()
        expect(initResult).toBe(true)

        // Verify xvfb-run still works after init
        try {
            const testOutput = execSync('xvfb-run --help', { encoding: 'utf8' })
            expect(testOutput).toContain('xvfb-run')
        } catch (error) {
            throw new Error(`xvfb-run execution failed: ${error}`)
        }
    })

    it('should execute xvfb-run commands with pre-installed xvfb', async function(this: Mocha.Context) {
        this.timeout(300000)

        await xvfbManager.init()

        // Actually execute xvfb-run command
        try {
            const result = execSync('xvfb-run --auto-servernum -- echo "test successful"', {
                encoding: 'utf8',
                timeout: 10000
            })
            expect(result.trim()).toBe('test successful')
        } catch (error) {
            throw new Error(`xvfb-run command execution failed: ${error}`)
        }
    })

    afterEach(async () => {
        // Skip process cleanup to prevent SIGTERM
        await new Promise(resolve => setTimeout(resolve, 100))
    })
})
