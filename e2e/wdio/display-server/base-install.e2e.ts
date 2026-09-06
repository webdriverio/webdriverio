import { expect } from '@wdio/globals'
import { execSync } from 'node:child_process'
import { DisplayServerManager } from '@wdio/display-server'

describe('display server fresh installation', () => {
    it('should install display server using detected package manager', async function(this: Mocha.Context) {
        this.timeout(300000) // 5 minutes for real installation

        const manager = new DisplayServerManager({ autoInstall: true })

        expect(manager.shouldRun()).toBe(true)

        const result = await manager.init()
        expect(result).toBe(true)

        const displayServer = manager.getDisplayServer()
        expect(displayServer).not.toBeNull()
    })

    it('should verify display server works after installation', async function(this: Mocha.Context) {
        this.timeout(300000)

        const manager = new DisplayServerManager({ autoInstall: true })

        const result = await manager.init()
        expect(result).toBe(true)

        const displayServer = manager.getDisplayServer()
        expect(displayServer).not.toBeNull()

        if (displayServer?.name === 'xvfb') {
            try {
                const testResult = execSync('xvfb-run --auto-servernum -- echo "installation verified"', {
                    encoding: 'utf8',
                    timeout: 10000
                })
                expect(testResult.trim()).toBe('installation verified')
            } catch (error) {
                throw new Error(`xvfb-run execution failed after installation: ${error}`)
            }
        } else if (displayServer?.name === 'wayland') {
            try {
                const westonPath = execSync('which weston', { encoding: 'utf8' }).trim()
                expect(westonPath).toContain('weston')
            } catch (error) {
                throw new Error(`weston not available after installation: ${error}`)
            }
        }
    })

})
