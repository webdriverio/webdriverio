import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { Status } from '@cucumber/cucumber'
import {
    formatMessage,
    getStepType,
    getFeatureId,
    buildStepPayload,
    addKeywordToStep,
    getRule,
    generateSkipTagsFromCapabilities,
    convertStatus
} from '../src/utils.js'
import { featureWithRules } from './fixtures/features.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('utils', () => {
    describe('formatMessage', () => {
        it('should copy Error into a plain object', () => {
            const error = new Error('boom')
            expect(formatMessage({
                payload: { error }
            })).toEqual({
                error: {
                    name: 'Error',
                    message: 'boom',
                    stack: error.stack,
                }
            })
        })

        it('should not fail if payload was not passed', () => {
            expect(formatMessage({})).toEqual({})
        })

        it('should set fullTitle', () => {
            expect(formatMessage({
                payload: { parent: 'foo', title: 'bar' }
            })).toEqual({
                parent: 'foo',
                title: 'bar',
                fullTitle: 'foo: bar',
            })
        })
    })

    it('getStepType', () => {
        expect(getStepType({} as any)).toBe('test')
        expect(getStepType({ hookId: '123' } as any)).toBe('hook')
    })

    it('getFeatureId', () => {
        expect(getFeatureId('/foo/bar.feature', {
            location: {
                line: 1,
                column: 2
            }
        } as any)).toBe('bar.feature:1:2')
    })

    it('buildStepPayload', () => {
        expect(buildStepPayload('uri', {
            name: 'some feature'
        } as any, {
            id: '321',
            tags: [{ name: 'some tag' }]
        } as any, {
            id: '123',
            text: 'title',
            keyword: 'Given'
        } as any, {
            type: 'step'
        })).toMatchSnapshot()

        expect(buildStepPayload('uri', {
            name: 'some feature'
        } as any, {
            id: '321',
            tags: []
        } as any, {
            id: '123',
            text: '',
            keyword: '',
            argument: {
                docString: { content: 'some string content' }
            }
        } as any, {
            type: 'step'
        })).toMatchObject({
            title: 'Undefined Step',
            argument: 'some string content',
        })

        expect(buildStepPayload('uri', {
            name: 'some feature'
        } as any, {
            id: '321',
            tags: []
        } as any, {
            id: '123',
            text: 'title',
            keyword: 'Given',
            argument: {}
        } as any, {
            type: 'step'
        }).argument).toBeUndefined()
    })

    it('addKeywordToStep should add keywords to the steps', () => {
        const steps = [
            // Should get a keyword
            {
                text: 'I have a background',
                id: '20',
                astNodeIds: ['0']
            },
            // Should get a keyword
            {
                text: 'I have 42 cukes in my belly',
                id: '21',
                astNodeIds: ['2']
            },
            // Should NOT get a keyword
            {
                id: '77',
                hookId: '47'
            }
        ]
        const feature = {
            children: [
                {
                    background: {
                        keyword: 'Background',
                        name: '',
                        steps: [
                            {
                                keyword: 'Given ',
                                text: 'I have a background',
                                id: '0'
                            }
                        ],
                        id: '1'
                    }
                },
                {
                    scenario: {
                        keyword: 'Scenario',
                        name: 'cukes',
                        steps: [
                            {
                                keyword: 'Given ',
                                text: 'I have 42 cukes in my belly',
                                id: '2'
                            }
                        ],
                        id: '3'
                    }
                },
                {
                    rule: {
                        keyword: 'Rule',
                        name: 'Rule',
                        children: [
                            {
                                scenario: {
                                    keyword: 'Scenario Outline',
                                    name: 'rule outline',
                                    steps: [
                                        {
                                            keyword: 'Given ',
                                            text: 'I am on the login page',
                                            id: '4'
                                        }
                                    ],
                                    id: '5'
                                }
                            }
                        ],
                        id: '6'
                    }
                }
            ]
        }

        expect(addKeywordToStep(steps as any, feature as any)).toMatchSnapshot()
    })

    it('getRule should get the rule for an specific scenario id', () => {
        const feature = featureWithRules

        expect(getRule(feature as any, '1')).toBe(undefined)
        expect(getRule(feature as any, '2')).toBe('Rule for scenario 2')
        expect(getRule(feature as any, '3')).toBe('Rule for scenario 3 and 4')
        expect(getRule(feature as any, '4')).toBe('Rule for scenario 3 and 4')
    })

    it('generateSkipTagsFromCapabilities', () => {
        expect(generateSkipTagsFromCapabilities({
            browserName: 'chrome',
        }, [['@skip(browserName="chrome")']]))
            .toStrictEqual(['(not @skip\\(browserName="chrome"\\))'])

        expect(generateSkipTagsFromCapabilities({
            browserName: 'chrome',
        }, [['@skip(browserName="foobar")']]))
            .toStrictEqual([])

        expect(generateSkipTagsFromCapabilities({
            browserName: 'chrome',
            platformName: 'windows'
        }, [['@skip(browserName="foobar";platformName="windows")']]))
            .toStrictEqual([])

        expect(generateSkipTagsFromCapabilities({
            browserName: 'chrome',
        }, [['@skip(something="weird")']]))
            .toStrictEqual([])

        expect(generateSkipTagsFromCapabilities({
            browserName: 'chrome',
        }, [['@skip()']]))
            .toStrictEqual(['(not @skip\\(\\))'])

        expect(generateSkipTagsFromCapabilities({
            browserName: 'chrome',
        }, [['@skip']]))
            .toStrictEqual(['(not @skip)'])

        expect(generateSkipTagsFromCapabilities({
            browserName: 'chrome',
        }, [['@skip_local']]))
            .toStrictEqual([])

        // #14763: keep regex metacharacters so Cucumber can parse the tag expression.
        expect(generateSkipTagsFromCapabilities({
            browserName: 'chrome',
        }, [['@skip(browserName=/^chrome$/i)']]))
            .toStrictEqual(['(not @skip\\(browserName=/^chrome$/i\\))'])

        expect(generateSkipTagsFromCapabilities({
            browserName: 'chrome',
        }, [['@skip(browserName=/^firefox$/i)']]))
            .toStrictEqual([])

        // #14672: square brackets and nested regex text must not be escaped.
        expect(generateSkipTagsFromCapabilities({
            browserName: 'firefox',
        }, [['@skip(browserName=["firefox","safari",/^i.+explorer$/])']]))
            .toStrictEqual(['(not @skip\\(browserName=["firefox","safari",/^i.+explorer$/]\\))'])
    })

    describe('convertStatus', () => {
        it('maps Cucumber statuses to TestStatus', () => {
            expect(convertStatus(Status.PASSED)).toBe('pass')
            expect(convertStatus(Status.PENDING)).toBe('pending')
            expect(convertStatus(Status.SKIPPED)).toBe('skip')
            expect(convertStatus(Status.AMBIGUOUS)).toBe('skip')
            expect(convertStatus(Status.FAILED)).toBe('fail')
            expect(convertStatus(Status.UNDEFINED)).toBe('pass')
            expect(convertStatus(Status.UNKNOWN)).toBe('fail')
        })
    })
})
