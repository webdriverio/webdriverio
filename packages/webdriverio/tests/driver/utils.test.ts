import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getChromePath } from 'chrome-launcher'
import { canDownload, resolveBuildId, detectBrowserPlatform } from '@puppeteer/browsers'

import { parseParams, getLocalChromePath, getBuildIdByPath, setupChrome } from '../../src/driver/utils.js'

vi.mock('chrome-launcher', () => ({
    getChromePath: vi.fn().mockReturnValue('/foo/bar')
}))

vi.mock('node:child_process', () => ({
    default: {
        execSync: vi.fn().mockReturnValue(Buffer.from('Google Chrome 115.0.5790.98\n'))
    }
}))

vi.mock('@puppeteer/browsers', () => ({
    Browser: { CHROME: 'chrome' },
    ChromeReleaseChannel: { STABLE: 'stable' },
    detectBrowserPlatform: vi.fn(),
    resolveBuildId: vi.fn().mockReturnValue('115.0.5790.98'),
    canDownload: vi.fn().mockResolvedValue(true),
    computeExecutablePath: vi.fn().mockReturnValue('/foo/bar/executable'),
    install: vi.fn()
}))

describe('driver utils', () => {
    it('should parse params', () => {
        expect(parseParams({ baseUrl: 'foobar', silent: true, verbose: false, allowedIps: ['123', '321'] }))
            .toMatchSnapshot()
    })

    it('getLocalChromePath', () => {
        expect(getLocalChromePath()).toBe('/foo/bar')
        vi.mocked(getChromePath).mockImplementationOnce(() => { throw new Error('boom') })
        expect(getLocalChromePath()).toBe(undefined)
    })

    it('getBuildIdByPath', () => {
        expect(getBuildIdByPath()).toBe(undefined)
        expect(getBuildIdByPath('/foo/bar')).toBe('115.0.5790.98')
    })

    describe('setupChrome', () => {
        beforeEach(() => {
            vi.mocked(resolveBuildId).mockClear()
        })

        it('should throw if platform is not supported', async () => {
            vi.mocked(detectBrowserPlatform).mockReturnValueOnce(undefined)
            await expect(setupChrome({}, '/foo/bar')).rejects.toThrow('The current platform is not supported.')
        })

        it('should run setup for local chrome if browser version is omitted', async () => {
            vi.mocked(detectBrowserPlatform).mockReturnValueOnce('mac' as any)
            await expect(setupChrome({}, '/foo/bar')).resolves.toEqual({
                buildId: '115.0.5790.98',
                executablePath: '/foo/bar',
                platform: 'mac'
            })
        })

        it('should install chrome stable if browser is not found', async () => {
            vi.mocked(detectBrowserPlatform).mockReturnValueOnce('windows' as any)
            vi.mocked(getChromePath).mockReturnValue('/path/to/stable')
            await expect(setupChrome({}, '/foo/bar')).resolves.toEqual( {
                buildId: '115.0.5790.98',
                executablePath: '/path/to/stable',
                platform: 'windows'
            })
        })

        it('should throw if browser version is not found', async () => {
            vi.mocked(detectBrowserPlatform).mockReturnValueOnce('windows' as any)
            vi.mocked(canDownload).mockResolvedValueOnce(false)
            vi.mocked(getChromePath).mockImplementationOnce(() => { throw new Error('boom') })
            await expect(setupChrome({}, '/foo/bar')).rejects.toThrow(/Couldn't find a matching Chrome browser /)
        })

        it('should install chrome browser with specific version provided', async () => {
            vi.mocked(detectBrowserPlatform).mockReturnValueOnce('windows' as any)
            await expect(setupChrome({ browserVersion: '1.2.3' }, '/foo/bar')).resolves.toEqual({
                buildId: '115.0.5790.98',
                executablePath: '/foo/bar/executable',
                platform: 'windows'
            })
            expect(resolveBuildId).toBeCalledWith('chrome', 'windows', '1.2.3')
        })
    })
})
