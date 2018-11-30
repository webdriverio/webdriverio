import { detectBackend } from '../src/utils'

describe('detectBackend', () => {
    it('should not set anything if host is set in caps', () => {
        const caps = {
            hostname: '0.0.0.0',
            port: 1234,
            protocol: 'http'
        }
        expect(detectBackend(caps)).toEqual(caps)
    })

    it('should default to local selenium server', () => {
        const caps = detectBackend({})
        expect(caps.hostname).toBe('127.0.0.1')
        expect(caps.port).toBe(4444)

        const otherCaps = detectBackend()
        expect(otherCaps.hostname).toBe('127.0.0.1')
        expect(otherCaps.port).toBe(4444)
    })

    it('should default if host or port is not given', () => {
        let caps = detectBackend({ port: 1234 })
        expect(caps.hostname).toBe('127.0.0.1')
        expect(caps.port).toBe(1234)

        caps = detectBackend({ hostname: 'foobar' })
        expect(caps.hostname).toBe('foobar')
        expect(caps.port).toBe(4444)
    })

    it('should detect browserstack user', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: 'zHcv9sZ39ip8ZPsxBVJ2'
        })
        expect(caps.hostname).toBe('hub.browserstack.com')
        expect(caps.port).toBe(80)
    })

    it('should detect testingbot user', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: 'ec337d7b677720a4dde7bd72be0bfc67'
        })
        expect(caps.hostname).toBe('hub.testingbot.com')
        expect(caps.port).toBe(80)
    })

    it('should detect saucelabs user', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: '50aa152c-1932-B2f0-9707-18z46q2n1mb0'
        })
        expect(caps.hostname).toBe('ondemand.saucelabs.com')
        expect(caps.port).toBe(443)
        expect(caps.protocol).toBe('https')
    })

    it('should detect saucelabs user running in the default DC', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: '50aa152c-1932-B2f0-9707-18z46q2n1mb0',
            region: 'us'
        })
        expect(caps.hostname).toBe('ondemand.saucelabs.com')
        expect(caps.port).toBe(443)
        expect(caps.protocol).toBe('https')
    })

    it('should detect saucelabs user running in an EU DC', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: '50aa152c-1932-B2f0-9707-18z46q2n1mb0',
            region: 'eu'
        })
        expect(caps.hostname).toBe('ondemand.eu-central-1.saucelabs.com')
        expect(caps.port).toBe(443)
        expect(caps.protocol).toBe('https')
    })

    it('should detect saucelabs user running on a random DC', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: '50aa152c-1932-B2f0-9707-18z46q2n1mb0',
            region: 'foobar'
        })
        expect(caps.hostname).toBe('ondemand.foobar.saucelabs.com')
        expect(caps.port).toBe(443)
        expect(caps.protocol).toBe('https')
    })

    it('should detect saucelabs user but recognise custom endpoint properties', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: '50aa152c-1932-B2f0-9707-18z46q2n1mb0',
            hostname: 'foobar.com',
            port: 1234,
            protocol: 'tcp'
        })
        expect(caps.hostname).toBe('foobar.com')
        expect(caps.port).toBe(1234)
        expect(caps.protocol).toBe('tcp')
    })
})
