import { expect } from '@wdio/globals'
import { DisplayServerManager } from '@wdio/display-server'
import type { DisplayServerOptions } from '@wdio/display-server'

// Set per CI matrix cell: the preference to install with, and the server the cell must end up on.
const displayServer = (process.env.DISPLAY_SERVER_PREFERENCE || 'auto') as DisplayServerOptions['displayServer']
const expected = process.env.EXPECTED_DISPLAY_SERVER

describe('display server fresh installation', () => {
    it('should install display server using detected package manager', async () => {
        const manager = new DisplayServerManager({ autoInstall: true, displayServer })

        expect(manager.shouldRun()).toBe(true)
        expect(await manager.init()).toBe(true)

        const server = manager.getDisplayServer()
        expect(server).not.toBeNull()
        if (expected) {
            expect(server?.name).toBe(expected)
        }
    })

    it('should start the installed display server', async () => {
        const manager = new DisplayServerManager({ autoInstall: true, displayServer })
        const daemon = await manager.startDaemon()
        expect(daemon).not.toBeNull()
        try {
            if (expected) {
                expect(manager.getDisplayServer()?.name).toBe(expected)
            }
            expect(daemon?.env.DISPLAY ?? daemon?.env.WAYLAND_DISPLAY).toBeTruthy()
        } finally {
            await daemon?.stop()
        }
    })
})
