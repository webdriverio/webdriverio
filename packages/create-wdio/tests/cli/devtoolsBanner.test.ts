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
async function successMessage(services: string[]) {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
        await runConfigCommand({ projectRootDir: '/project', services, rawAnswers: {} } as any, 'latest')
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

    it('stays out of the message when DevTools was not selected', async () => {
        expect(await successMessage(['visual'])).not.toContain('DevTools is set up')
    })
})
