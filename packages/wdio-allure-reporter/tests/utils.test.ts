import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest'
import type { CommandArgs } from '@wdio/type'
import process from 'node:process'
import { Status } from 'allure-js-commons'
import CompoundError from '../src/compoundError.js'
import {
    getTestStatus, isEmpty, isMochaEachHooks, getErrorFromFailedTest, isMochaAllHooks, getLinkByTemplate, findLast, isScreenshotCommand, getSuiteLabels,
} from '../src/utils.js'
import { suiteStart } from './__fixtures__/suite.js'
import { linkPlaceholder } from '../src/constants.js'

describe('utils', () => {
    let processEmit: any
    beforeAll(() => {
        processEmit = process.emit.bind(process)
        process.emit = vi.fn() as any
    })

    afterEach(() => {
        process.emit = processEmit
    })

    describe('isScreenshotCommand', () => {
        it('isScreenshotCommand', () => {
            expect(isScreenshotCommand({ endpoint: '/session/id/screenshot' } as CommandArgs)).toEqual(true)
            expect(isScreenshotCommand({ endpoint: '/wdu/hub/session/id/screenshot' } as CommandArgs)).toEqual(true)
            expect(isScreenshotCommand({ endpoint: '/session/id/click' } as CommandArgs)).toEqual(false)
            expect(isScreenshotCommand({ command: 'takeScreenshot' } as CommandArgs)).toEqual(true)
            expect(isScreenshotCommand({ command: 'elementClick' } as CommandArgs)).toEqual(false)
            expect(isScreenshotCommand({ endpoint: '/session/id/element/id/screenshot' } as CommandArgs)).toEqual(true)
        })
    })

    describe('getTestStatus', () => {
        it('return  status for jasmine', () => {
            const config: any = { framework: 'jasmine' }
            expect(getTestStatus({} as any, config)).toEqual(Status.FAILED)
        })

        it('broken for test with no error', () => {
            const config: any = { framework: 'mocha' }
            expect(getTestStatus({} as any, config)).toEqual(Status.BROKEN)
        })

        it('failed for AssertionError', () => {
            const config: any = { framework: 'mocha' }
            const test = { error: { name: 'Error', message: 'AssertionError' } }
            expect(getTestStatus(test as any, config)).toEqual(Status.FAILED)
        })

        it('failed for AssertionError stacktrace', () => {
            const config: any = { framework: 'mocha' }
            const test = { error: { stack: 'AssertionError' } }
            expect(getTestStatus(test as any, config)).toEqual(Status.FAILED)
        })

        it('broken for not AssertionError', () => {
            const config: any = { framework: 'mocha' }
            const test = { error: { name: 'MyError' } }
            expect(getTestStatus(test as any, config)).toEqual(Status.BROKEN)
        })

        it('broken for error without stacktrace', () => {
            const config: any = { framework: 'mocha' }
            const test = { error: {} }
            expect(getTestStatus(test as any, config)).toEqual(Status.BROKEN)
        })

        it('failed status for not AssertionError stacktrace', () => {
            const config: any = { framework: 'mocha' }
            const test = { error: { stack: 'MyError stack trace' } }
            expect(getTestStatus(test as any, config)).toEqual(Status.BROKEN)
        })
    })

    it('isMochaEachHooks filter hook by title', () => {
        expect(isMochaEachHooks('"before all" hook')).toEqual(false)
        expect(isMochaEachHooks('"after all" hook')).toEqual(false)
        expect(isMochaEachHooks('"before each" hook')).toEqual(true)
        expect(isMochaEachHooks('"after each" hook')).toEqual(true)
    })

    describe('isEmpty', () => {
        it('should filter empty objects', () => {
            expect(isEmpty({})).toEqual(true)
            expect(isEmpty([])).toEqual(true)
            expect(isEmpty(undefined)).toEqual(true)
            expect(isEmpty(null)).toEqual(true)
            expect(isEmpty('')).toEqual(true)
        })
    })

    describe('isMochaHooks', () => {
        it('should filter hook by title', () => {
            expect(isMochaEachHooks('"before all" hook')).toEqual(false)
            expect(isMochaEachHooks('"after all" hook')).toEqual(false)
            expect(isMochaEachHooks('"before each" hook')).toEqual(true)
            expect(isMochaEachHooks('"after each" hook')).toEqual(true)

            expect(isMochaAllHooks('"before all" hook')).toEqual(true)
            expect(isMochaAllHooks('"after all" hook')).toEqual(true)
            expect(isMochaAllHooks('"before each" hook')).toEqual(false)
            expect(isMochaAllHooks('"after each" hook')).toEqual(false)
        })
    })

    describe('getErrorFromFailedTest', () => {
        it('should handle test with no error object', () => {
            const testStat = {}
            expect(getErrorFromFailedTest(testStat as any)).toBeUndefined()
        })

        // wdio-mocha-framework returns a single 'error', while wdio-jasmine-framework returns an array of 'errors'
        it('should return just the error property when there is no errors property', () => {
            const testStat = {
                error: new Error('Everything is Broken Forever'),
            }
            expect(getErrorFromFailedTest(testStat as any)!.message).toBe(
                'Everything is Broken Forever'
            )
        })

        it('should return a single error when there is an errors array with one error', () => {
            const testStat = {
                errors: [new Error('Everything is Broken Forever')],
                error: new Error('Everything is Broken Forever'),
            }
            expect(getErrorFromFailedTest(testStat as any)!.message).toBe(
                'Everything is Broken Forever'
            )
        })

        it('should return a CompoundError of the errors when there is more than one error', () => {
            const testStat = {
                errors: [
                    new Error('Everything is Broken Forever'),
                    new Error('Additional things are broken'),
                ],
                error: new Error('Everything is Broken Forever'),
            }
            const error = getErrorFromFailedTest(
                testStat as any
            ) as CompoundError
            expect(error instanceof CompoundError).toBe(true)
            expect(error.innerErrors).toEqual(testStat.errors)
        })
    })

    describe('getLinkByTemplate', () => {
        const template = 'https://youtrack.jetbrains.com/issue/{}'
        const id = 'JIRA-42'
        it('should return link with task id', () => {
            const link = getLinkByTemplate(template, id)
            expect(link).toEqual(
                'https://youtrack.jetbrains.com/issue/JIRA-42'
            )
        })

        it('should return id if template is not a string', () => {
            expect(getLinkByTemplate(undefined, id)).toEqual(id)
            expect(getLinkByTemplate({} as any, id)).toEqual(id)
        })

        it('should throw error if template is invalid', () => {
            const template = 'foo'
            expect(() => getLinkByTemplate(template, id)).toThrow(
                `The link template "${template}" must contain ${linkPlaceholder} substring.`
            )
        })
    })

    describe('findLast', () => {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9]

        it('should return last matched element', () => {
            expect(findLast(arr, (el) => el % 2 === 0)).toEqual(8)

        })

        it('should return undefind when nothing matched', () => {
            expect(findLast(arr, (el) => el === 10)).toEqual(undefined)
        })
    })

    describe('getSuiteLabels', () => {
        describe('suite stats with tags', () => {
            it('returns allure labels', () => {
                expect(
                    getSuiteLabels({
                        ...suiteStart(),
                        tags: [
                            {
                                name: '@foo=bar',
                            }
                        ]
                    })
                ).toEqual([
                    {
                        name: 'foo',
                        value: 'bar',
                    },
                ])
            })
        })

        describe('suite stats with invalid tags', () => {
            it('returns empty array', () => {
                expect(
                    getSuiteLabels({
                        ...suiteStart(),
                        tags: [
                            {
                                name: 'foo bar',
                            },
                            {
                                name: 'foo,bar',
                            }
                        ]
                    })
                ).toEqual([])
            })
        })

        describe('suite stats without tags', () => {
            it('returns empty array', () => {
                expect(getSuiteLabels({ ...suiteStart(), tags: undefined })).toEqual(
                    []
                )
            })
        })
    })
})
