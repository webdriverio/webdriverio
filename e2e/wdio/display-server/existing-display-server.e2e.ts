import { expect } from '@wdio/globals'
import { execSync } from 'node:child_process'
import { DisplayServerManager } from '@wdio/display-server'

describe('display server existing installation', () => {
    let displayServerManager: DisplayServerManager

    beforeEach(() => {
        displayServerManager = new DisplayServerManager()
    })

    it('should detect and use pre-installed display server', async function(this: Mocha.Context) {
        this.timeout(300000) // 5 minutes

        // Should detect existing display server installation
        expect(displayServerManager.shouldRun()).toBe(true)

        // Initialize display server - should detect existing installation and return true
        const initResult = await displayServerManager.init()
        expect(initResult).toBe(true)

        // Get the active display server
        const displayServer = displayServerManager.getDisplayServer()
        expect(displayServer).not.toBeNull()

        // Verify based on which display server is being used
        if (displayServer?.name === 'xvfb') {
            // Verify xvfb-run is available
            let xvfbRunPath = ''
            try {
                xvfbRunPath = execSync('which xvfb-run', { encoding: 'utf8' }).trim()
            } catch (error) {
                throw new Error(`xvfb-run should be pre-installed: ${error}`)
            }
            expect(xvfbRunPath).toContain('xvfb-run')
            expect(xvfbRunPath.length).toBeGreaterThan(0)

            // Verify xvfb-run works
            try {
                const testOutput = execSync('xvfb-run --help', { encoding: 'utf8' })
                expect(testOutput).toContain('xvfb-run')
            } catch (error) {
                throw new Error(`xvfb-run execution failed: ${error}`)
            }
        } else if (displayServer?.name === 'wayland') {
            // Verify weston is available
            let westonPath = ''
            try {
                westonPath = execSync('which weston', { encoding: 'utf8' }).trim()
            } catch (error) {
                throw new Error(`weston should be pre-installed: ${error}`)
            }
            expect(westonPath).toContain('weston')
            expect(westonPath.length).toBeGreaterThan(0)
        }
    })

    it('should execute display server commands with pre-installed server', async function(this: Mocha.Context) {
        this.timeout(300000)

        await displayServerManager.init()

        const displayServer = displayServerManager.getDisplayServer()

        if (displayServer?.name === 'xvfb') {
            // Execute xvfb-run command
            try {
                const result = execSync('xvfb-run --auto-servernum -- echo "test successful"', {
                    encoding: 'utf8',
                    timeout: 10000
                })
                expect(result.trim()).toBe('test successful')
            } catch (error) {
                throw new Error(`xvfb-run command execution failed: ${error}`)
            }
        } else if (displayServer?.name === 'wayland') {
            // Verify weston is available
            try {
                const result = execSync('weston --version', { encoding: 'utf8' })
                expect(result).toContain('weston')
            } catch (error) {
                throw new Error(`weston command execution failed: ${error}`)
            }
        }
    })

    afterEach(async () => {
        // Skip process cleanup to prevent SIGTERM
        await new Promise(resolve => setTimeout(resolve, 100))
    })
})
