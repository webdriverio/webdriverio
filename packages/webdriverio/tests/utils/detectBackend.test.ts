import { describe, it, expect } from 'vitest'
import detectBackend from '../../src/utils/detectBackend.js'

describe('detectBackend', () => {
    it('should not set anything if host is set in caps', () => {
        const caps = {
            hostname: 'localhost',
            port: 1234,
            protocol: 'http',
            path: '/'
        }
        expect(detectBackend(caps)).toEqual(caps)
    })

    it('should default to local selenium server', () => {
        const caps = detectBackend({})
        expect(typeof caps.hostname).toBe('undefined')
        expect(typeof caps.port).toBe('undefined')
        expect(typeof caps.path).toBe('undefined')

        const otherCaps = detectBackend()
        expect(typeof otherCaps.hostname).toBe('undefined')
        expect(typeof otherCaps.port).toBe('undefined')
        expect(typeof otherCaps.path).toBe('undefined')
    })

    it('should default if host or port is not given', () => {
        let caps = detectBackend({ port: 1234 })
        expect(caps.hostname).toBe('127.0.0.1')
        expect(caps.port).toBe(1234)
        expect(caps.path).toBe('/')

        caps = detectBackend({ hostname: 'foobar' })
        expect(caps.hostname).toBe('foobar')
        expect(caps.port).toBe(4444)
        expect(caps.path).toBe('/')

        caps = detectBackend({ path: '/foo/bar' })
        expect(caps.hostname).toBe('127.0.0.1')
        expect(caps.port).toBe(4444)
        expect(caps.path).toBe('/foo/bar')
    })

    it('should detect browserstack user', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: 'zHcv9sZ39ip8ZPsxBVJ2'
        })
        expect(caps.hostname).toBe('hub-cloud.browserstack.com')
        expect(caps.port).toBe(443)
        expect(caps.path).toBe('/wd/hub')
        expect(caps.protocol).toBe('https')
    })

    it('should detect testingbot user', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: 'ec337d7b677720a4dde7bd72be0bfc67'
        })
        expect(caps.hostname).toBe('hub.testingbot.com')
        expect(caps.port).toBe(443)
        expect(caps.path).toBe('/wd/hub')
        expect(caps.protocol).toBe('https')
    })

    it('should detect lambdatest user', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: 'cYAjKrqGwyPjPQv41ICDF4C5OjlxzA9epZsnugVJJxqOReWRWU'
        })
        expect(caps.hostname).toBe('hub.lambdatest.com')
        expect(caps.port).toBe(80)
        expect(caps.path).toBe('/wd/hub')
        expect(caps.protocol).toBe('http')
    })

    it('should detect saucelabs user', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: '50aa152c-1932-B2f0-9707-18z46q2n1mb0'
        })
        expect(caps.hostname).toBe('ondemand.us-west-1.saucelabs.com')
        expect(caps.port).toBe(443)
        expect(caps.path).toBe('/wd/hub')
        expect(caps.protocol).toBe('https')
    })

    it('should detect saucelabs user running in the default DC', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: '50aa152c-1932-B2f0-9707-18z46q2n1mb0',
            region: 'us'
        })
        expect(caps.hostname).toBe('ondemand.us-west-1.saucelabs.com')
        expect(caps.port).toBe(443)
        expect(caps.path).toBe('/wd/hub')
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
        expect(caps.path).toBe('/wd/hub')
        expect(caps.protocol).toBe('https')
    })

    it('should detect saucelabs user running in an APAC DC', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: '50aa152c-1932-B2f0-9707-18z46q2n1mb0',
            region: 'apac'
        })
        expect(caps.hostname).toBe('ondemand.apac-southeast-1.saucelabs.com')
        expect(caps.port).toBe(443)
        expect(caps.path).toBe('/wd/hub')
        expect(caps.protocol).toBe('https')
    })

    it('should detect saucelabs user running on a random DC and default to the us', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: '50aa152c-1932-B2f0-9707-18z46q2n1mb0',
            // @ts-expect-error wrong param
            region: 'foobar'
        })
        expect(caps.hostname).toBe('ondemand.us-west-1.saucelabs.com')
        expect(caps.port).toBe(443)
        expect(caps.path).toBe('/wd/hub')
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

    describe('saucelabs legacy rdc', () => {
        it('should detect saucelabs rdc user that had not defaulted a region', () => {
            const caps = detectBackend({ capabilities: { testobject_api_key: '123' } })
            expect(caps.hostname).toBe('us1.appium.testobject.com')
            expect(caps.port).toBe(443)
            expect(caps.path).toBe('/wd/hub')
            expect(caps.protocol).toBe('https')
        })

        it('should detect saucelabs us rdc user', () => {
            const caps = detectBackend({ region: 'us', capabilities: { testobject_api_key: '123' } })
            expect(caps.hostname).toBe('us1.appium.testobject.com')
            expect(caps.port).toBe(443)
            expect(caps.path).toBe('/wd/hub')
            expect(caps.protocol).toBe('https')
        })

        it('should detect saucelabs eu rdc user', () => {
            const caps = detectBackend({ region: 'eu', capabilities: { testobject_api_key: '123' } })
            expect(caps.hostname).toBe('eu1.appium.testobject.com')
            expect(caps.port).toBe(443)
            expect(caps.path).toBe('/wd/hub')
            expect(caps.protocol).toBe('https')
        })
    })

    describe('saucelabs visual', () => {
        it('should not detect sauce visual if api key is missing', () => {
            const caps = detectBackend({ capabilities: { 'sauce:visual': {} } })
            expect(typeof caps.hostname).toBe('undefined')
        })

        it('should detect sauce visual if api key is existing', () => {
            const caps = detectBackend({ capabilities: { 'sauce:visual': { apiKey: 'foobar' } } })
            expect(caps.hostname).toBe('hub.screener.io')
            expect(caps.port).toBe(443)
            expect(caps.path).toBe('/wd/hub')
            expect(caps.protocol).toBe('https')
        })
    })

    it('should detect saucelabs headless user', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: '50aa152c-1932-B2f0-9707-18z46q2n1mb0',
            region: 'eu',
            headless: true
        })
        expect(caps.hostname).toBe('ondemand.us-east-1.saucelabs.com')
        expect(caps.port).toBe(443)
        expect(caps.path).toBe('/wd/hub')
        expect(caps.protocol).toBe('https')
    })

    it('should throw if user and key are given but can not be connected to a cloud', () => {
        expect(() => detectBackend({
            user: 'foobar',
            key: 'barfoo'
        })).toThrow()
    })

    it('should not throw if user and key are invalid but a custom host was set', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: 'barfoo',
            hostname: 'foobar.com'
        })
        expect(caps.hostname).toBe('foobar.com')
        expect(caps.port).toBe(4444)
        expect(caps.path).toBe('/')
    })

    it('should detect browserstack user but keep custom properties if set', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: 'zHcv9sZ39ip8ZPsxBVJ2',
            hostname: 'foobar.com',
            port: 1234,
            protocol: 'ftp',
            path: '/foo/bar'
        })
        expect(caps.hostname).toBe('foobar.com')
        expect(caps.port).toBe(1234)
        expect(caps.protocol).toBe('ftp')
        expect(caps.path).toBe('/foo/bar')
    })

    it('should detect saucelabs user but keep custom properties if set', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: '50aa152c-1932-B2f0-9707-18z46q2n1mb0',
            hostname: 'foobar.com',
            port: 1234,
            protocol: 'ftp',
            path: '/foo/bar'
        })
        expect(caps.hostname).toBe('foobar.com')
        expect(caps.port).toBe(1234)
        expect(caps.protocol).toBe('ftp')
        expect(caps.path).toBe('/foo/bar')
    })

    it('should detect testingbot user but keep custom properties if set', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: 'ec337d7b677720a4dde7bd72be0bfc67',
            hostname: 'foobar.com',
            port: 1234,
            protocol: 'ftp',
            path: '/foo/bar'
        })
        expect(caps.hostname).toBe('foobar.com')
        expect(caps.port).toBe(1234)
        expect(caps.protocol).toBe('ftp')
        expect(caps.path).toBe('/foo/bar')
    })

    it('should detect lambdatest user but keep custom properties if set', () => {
        const caps = detectBackend({
            user: 'foobar',
            key: 'cYAjKrqGwyPjPQv41ICDF4C5OjlxzA9epZsnugVJJxqOReWRWU',
            hostname: 'foobar.com',
            port: 1234,
            protocol: 'ftp',
            path: '/foo/bar'
        })
        expect(caps.hostname).toBe('foobar.com')
        expect(caps.port).toBe(1234)
        expect(caps.protocol).toBe('ftp')
        expect(caps.path).toBe('/foo/bar')
    })
})
