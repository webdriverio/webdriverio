import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('fetch')

describe('startActivity', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()
    })

    it('rejects the removed positional signature', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'Android' } as any
        })
        await expect(
            // @ts-expect-error removed positional signature
            browser.startActivity('com.example.app', '.MainActivity')
        ).rejects.toThrow('`startActivity` only accepts an options object in WebdriverIO v10.')
    })

    it('rejects options that only applied to the removed HTTP endpoint', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'Android' } as any
        })
        const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(undefined)
        await expect(browser.startActivity({
            appPackage: 'com.example.app',
            appActivity: '.MainActivity',
            // @ts-expect-error removed in v10
            appWaitPackage: 'com.example.app',
        })).rejects.toThrow(
            'The `appWaitPackage`, `appWaitActivity`, and `optionalIntentArguments` options were removed from `startActivity` in WebdriverIO v10.'
        )
        expect(executeSpy).not.toHaveBeenCalled()
    })

    describe('non-mobile', () => {
        it('should throw for non-mobile platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar' } as any
            })
            await expect(browser.startActivity({
                appPackage: 'com.example.app',
                appActivity: '.MainActivity'
            })).rejects.toThrow('The `startActivity` command is only available for mobile platforms.')
        })
    })

    describe('platform validation', () => {
        it('should throw for iOS platforms', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: { browserName: 'foobar', mobileMode: true, platformName: 'iOS' } as any
            })
            await expect(browser.startActivity({
                appPackage: 'com.example',
                appActivity: '.MainActivity'
            })).rejects.toThrow('The `startActivity` command is only available for Android.')
        })
    })

    describe('modern driver (mobile: startActivity succeeds)', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar',
                    mobileMode: true,
                    platformName: 'Android',
                } as any
            })
        })

        describe('object API', () => {
            it('should accept an options object with required fields', async () => {
                const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(undefined)
                await browser.startActivity({ appPackage: 'com.example.app', appActivity: '.MainActivity' })
                expect(executeSpy).toHaveBeenCalledWith('mobile: startActivity', [{
                    component: 'com.example.app/.MainActivity',
                }])
            })

            it('should map intent options from the object', async () => {
                const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(undefined)
                await browser.startActivity({
                    appPackage: 'com.example.app',
                    appActivity: '.MainActivity',
                    intentAction: 'android.intent.action.MAIN',
                    intentCategory: 'android.intent.category.LAUNCHER',
                    intentFlags: '0x10200000',
                })
                expect(executeSpy).toHaveBeenCalledWith('mobile: startActivity', [{
                    component: 'com.example.app/.MainActivity',
                    action: 'android.intent.action.MAIN',
                    categories: 'android.intent.category.LAUNCHER',
                    flags: '0x10200000',
                }])
            })

            it('should map dontStopAppOnReset from the object', async () => {
                const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(undefined)
                await browser.startActivity({
                    appPackage: 'com.example.app',
                    appActivity: '.MainActivity',
                    dontStopAppOnReset: 'true',
                })
                expect(executeSpy).toHaveBeenCalledWith('mobile: startActivity', [{
                    component: 'com.example.app/.MainActivity',
                    stop: false,
                }])
            })

            it('should map dontStopAppOnReset=false to stop=true', async () => {
                const executeSpy = vi.spyOn(browser, 'executeScript').mockResolvedValue(undefined)
                await browser.startActivity({
                    appPackage: 'com.example.app',
                    appActivity: '.MainActivity',
                    dontStopAppOnReset: 'false',
                })
                expect(executeSpy).toHaveBeenCalledWith('mobile: startActivity', [{
                    component: 'com.example.app/.MainActivity',
                    stop: true,
                }])
            })
        })

        it('should re-throw non-unknown-method errors', async () => {
            vi.spyOn(browser, 'executeScript').mockRejectedValue(new Error('device disconnected'))
            await expect(browser.startActivity({
                appPackage: 'com.example.app',
                appActivity: '.MainActivity'
            })).rejects.toThrow('device disconnected')
        })
    })
})
