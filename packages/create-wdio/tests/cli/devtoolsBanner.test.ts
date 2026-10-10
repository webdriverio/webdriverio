import { vi, describe, expect, it } from 'vitest'

import { runConfigCommand } from '../../src/cli/utils.js'

vi.mock('../../src/utils.js', async () => {
    const actual = await vi.importActual('../../src/utils.js') as Record<string, unknown>
    return {
        ...actual,
        createPackageJSON: vi.fn(),
        setupTypeScript: vi.fn(),
        npmInstall: vi.fn(),
        createWDIOConfig: vi.fn(),
        createWDIOScript: vi.fn(),
        runAppiumInstaller: vi.fn()
    }
})

/** The success message the wizard prints for the given services. */
async function successMessage(services: string[], npmInstall = true) {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
        await runConfigCommand({ projectRootDir: '/project', services, npmInstall, rawAnswers: {} } as any, 'latest')
        return log.mock.calls.map(([line]) => String(line)).join('\n')
    } finally {
        log.mockRestore()
    }
}

describe('DevTools banner', () => {
    it('tells a user who selected DevTools how to open it', async () => {
        const message = await successMessage(['devtools', 'visual'])

        expect(message).toContain('DevTools is set up')
        expect(message).toContain('https://webdriver.io/docs/devtools/wdio')
        // Above the run instructions, so it is read before the command it describes.
        expect(message.indexOf('DevTools is set up')).toBeLessThan(message.indexOf('To run your tests'))
    })

    it('asks for the install first when the wizard skipped it', async () => {
        // Only the install command was printed, so the service cannot start yet.
        const message = await successMessage(['devtools'], false)

        expect(message).not.toContain('DevTools is set up')
        expect(message).toContain('once you install the dependencies listed above')
    })

    it('stays out of the message when DevTools was not selected', async () => {
        const message = await successMessage(['visual'])

        expect(message).not.toContain('DevTools is set up')
        expect(message).not.toContain('DevTools is configured')
    })
})
