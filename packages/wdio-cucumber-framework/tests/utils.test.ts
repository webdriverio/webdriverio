import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Status } from '@cucumber/cucumber'
import {
    formatMessage,
    getStepType,
    getFeatureId,
    buildStepPayload,
    addKeywordToStep,
    getRule,
    generateSkipTagsFromCapabilities,
    convertStatus,
    getAmbiguousStepMessage
} from '../src/utils.js'
import type { StepDefinition } from '@cucumber/messages'
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

    describe('getFeatureId', () => {
        const feature = { location: { line: 3, column: 1 } } as any
        const root = path.resolve('/project')

        it('uses the path of the file from rootDir', () => {
            expect(getFeatureId(path.join(root, 'features', 'admin', 'login.feature'), feature, root)).toBe('features/admin/login.feature:3:1')
            expect(getFeatureId(path.join(root, 'features', 'user', 'login.feature'), feature, root)).toBe('features/user/login.feature:3:1')
        })

        it('feature outside rootDir', () => {
            expect(getFeatureId(path.join(root, '..', 'shared', 'login.feature'), feature, root)).toBe('../shared/login.feature:3:1')
        })

        it('encodes `:` and `%` so that only the line and the column follow a `:`', () => {
            expect(getFeatureId(path.join(root, 'a:b', 'x.feature'), feature, root)).toBe('a%3Ab/x.feature:3:1')
            expect(getFeatureId(path.join(root, 'a%3Ab', 'x.feature'), feature, root)).toBe('a%253Ab/x.feature:3:1')
        })

        it('uses the cwd without rootDir', () => {
            expect(getFeatureId(path.join('features', 'x.feature'), feature)).toBe('features/x.feature:3:1')
        })

        describe('with real files', () => {
            let tmp: string
            beforeEach(() => {
                tmp = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'featid-')))
            })
            afterEach(() => {
                fs.rmSync(tmp, { recursive: true, force: true })
            })

            it('same uid when rootDir is a symbolic link', () => {
                const real = path.join(tmp, 'real')
                const link = path.join(tmp, 'link')
                fs.mkdirSync(path.join(real, 'f'), { recursive: true })
                fs.writeFileSync(path.join(real, 'f', 'x.feature'), '')
                fs.symlinkSync(real, link, 'junction')
                expect(getFeatureId(path.join(real, 'f', 'x.feature'), feature, link)).toBe('f/x.feature:3:1')
                expect(getFeatureId(path.join(link, 'f', 'x.feature'), feature, real)).toBe('f/x.feature:3:1')
            })

            it('keeps a folder link under rootDir, e.g. a pnpm package', () => {
                const store = path.join(tmp, 'node_modules', '.pnpm', 'pkg@1.2.3', 'features')
                fs.mkdirSync(store, { recursive: true })
                fs.writeFileSync(path.join(store, 'login.feature'), '')
                fs.symlinkSync(store, path.join(tmp, 'node_modules', 'pkg'), 'junction')
                fs.mkdirSync(path.join(tmp, 'features'))
                fs.symlinkSync(store, path.join(tmp, 'features', 'admin'), 'junction')
                fs.symlinkSync(store, path.join(tmp, 'features', 'user'), 'junction')
                expect(getFeatureId(path.join(tmp, 'node_modules', 'pkg', 'login.feature'), feature, tmp)).toBe('node_modules/pkg/login.feature:3:1')
                expect(getFeatureId(path.join(tmp, 'features', 'admin', 'login.feature'), feature, tmp)).toBe('features/admin/login.feature:3:1')
                expect(getFeatureId(path.join(tmp, 'features', 'user', 'login.feature'), feature, tmp)).toBe('features/user/login.feature:3:1')
                // rootDir through a link too
                const rootLink = path.join(os.tmpdir(), `featid-root-${path.basename(tmp)}`)
                fs.symlinkSync(tmp, rootLink, 'junction')
                try {
                    expect(getFeatureId(path.join(tmp, 'node_modules', 'pkg', 'login.feature'), feature, rootLink)).toBe('node_modules/pkg/login.feature:3:1')
                } finally {
                    fs.rmSync(rootLink, { force: true })
                }
            })

            it.skipIf(process.platform === 'win32')('keeps the file name of a feature file that is a symbolic link', () => {
                fs.mkdirSync(path.join(tmp, 'shared'))
                fs.mkdirSync(path.join(tmp, 'a'))
                fs.writeFileSync(path.join(tmp, 'shared', 'login.feature'), '')
                fs.symlinkSync(path.join(tmp, 'shared', 'login.feature'), path.join(tmp, 'a', 'login.feature'))
                expect(getFeatureId(path.join(tmp, 'a', 'login.feature'), feature, tmp)).toBe('a/login.feature:3:1')
            })
        })

        it.runIf(process.platform === 'win32')('feature on another Windows drive', () => {
            expect(getFeatureId('D:\\x\\login.feature', feature, 'C:\\project')).toBe('D%3A/x/login.feature:3:1')
        })
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

    describe('getAmbiguousStepMessage', () => {
        const definitions = [
            { id: '16', pattern: { source: 'I do something', type: 'CUCUMBER_EXPRESSION' }, sourceReference: { uri: 'features/steps.js', location: { line: 3 } } },
            { id: '99', pattern: { source: '^I do', type: 'REGULAR_EXPRESSION' }, sourceReference: { uri: 'features/steps.js', location: { line: 7 } } }
        ] as StepDefinition[]

        it('lists each definition with its pattern and location', () => {
            expect(getAmbiguousStepMessage(definitions)).toBe(
                'Multiple step definitions match:\n  I do something - features/steps.js:3\n  /^I do/ - features/steps.js:7')
        })

        it('does not add slashes to a regular expression with flags', () => {
            // Cucumber sends `pattern.toString()` for a regular expression with flags
            const withFlags = { ...definitions[1], pattern: { source: '/^I do/i', type: 'REGULAR_EXPRESSION' } } as StepDefinition
            expect(getAmbiguousStepMessage([withFlags])).toBe('Multiple step definitions match:\n  /^I do/i - features/steps.js:7')
        })

        it('writes the pattern alone without a uri', () => {
            expect(getAmbiguousStepMessage([{ ...definitions[0], sourceReference: {} }]))
                .toBe('Multiple step definitions match:\n  I do something')
        })

        it('gives undefined for no definition', () => {
            expect(getAmbiguousStepMessage([])).toBeUndefined()
        })
    })
})
