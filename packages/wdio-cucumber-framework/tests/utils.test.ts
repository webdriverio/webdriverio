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
    getAmbiguousStepMessage,
    getFeatureStack,
    getStepResult,
    withAmbiguousMessage
} from '../src/utils.js'
import type { Feature, Pickle, PickleStep, StepDefinition, TestStepResult } from '@cucumber/messages'
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

        it('encodes `%`, `:` and `#`, so that only the line and the column follow a `:` and only a part number follows a `#`', () => {
            expect(getFeatureId(path.join(root, 'a:b', 'x.feature'), feature, root)).toBe('a%3Ab/x.feature:3:1')
            expect(getFeatureId(path.join(root, 'a%3Ab', 'x.feature'), feature, root)).toBe('a%253Ab/x.feature:3:1')
            expect(getFeatureId(path.join(root, 'c#', 'x.feature'), feature, root)).toBe('c%23/x.feature:3:1')
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
                    // rmSync of a folder link throws ERR_FS_EISDIR on Node 24.12-24.13
                    fs.unlinkSync(rootLink)
                }
            })

            it('keeps a linked folder whose name starts with `..`', () => {
                fs.mkdirSync(path.join(tmp, 'real'))
                fs.writeFileSync(path.join(tmp, 'real', 'x.feature'), '')
                fs.symlinkSync(path.join(tmp, 'real'), path.join(tmp, '..shared'), 'junction')
                expect(getFeatureId(path.join(tmp, '..shared', 'x.feature'), feature, tmp)).toBe('..shared/x.feature:3:1')
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

    describe('withAmbiguousMessage', () => {
        const stepDefinitions = new Map([
            ['16', { id: '16', pattern: { source: 'a step', type: 'CUCUMBER_EXPRESSION' }, sourceReference: { uri: 'steps.js', location: { line: 3 } } }],
            ['99', { id: '99', pattern: { source: '^a st', type: 'REGULAR_EXPRESSION' }, sourceReference: { uri: 'steps.js', location: { line: 7 } } }]
        ] as [string, StepDefinition][])
        const result = (status: string, message?: string) => ({ status, message, duration: { seconds: 0, nanos: 0 } }) as unknown as TestStepResult

        it('adds the matching step definitions as message of an ambiguous result', () => {
            expect(withAmbiguousMessage(result(Status.AMBIGUOUS), () => ['16', '99'], stepDefinitions).message)
                .toBe('Multiple step definitions match:\n  a step - steps.js:3\n  /^a st/ - steps.js:7')
        })

        it('keeps a result that is not ambiguous or has a message, and does not look up its step', () => {
            const ids = vi.fn(() => ['16'])
            const passed = result(Status.PASSED)
            const withMessage = result(Status.AMBIGUOUS, 'from Cucumber')
            expect(withAmbiguousMessage(passed, ids, stepDefinitions)).toBe(passed)
            expect(withAmbiguousMessage(withMessage, ids, stepDefinitions)).toBe(withMessage)
            expect(ids).not.toHaveBeenCalled()
        })

        it('keeps an ambiguous result when no step definition is found', () => {
            const ambiguous = result(Status.AMBIGUOUS)
            expect(withAmbiguousMessage(ambiguous, () => ['unknown'], stepDefinitions)).toBe(ambiguous)
        })
    })

    describe('getFeatureStack', () => {
        const feature = {
            children: [
                { background: { steps: [{ id: 'bg-1', text: 'a background step', location: { line: 4, column: 5 } }] } },
                { scenario: { id: 'sc-1', name: 'Get size', location: { line: 6, column: 3 }, steps: [{ id: 'st-1', text: 'a step', location: { line: 7, column: 5 } }] } }
            ]
        } as unknown as Feature
        const scenario = { astNodeIds: ['sc-1'] } as unknown as Pickle

        it('gives the location of the feature, the scenario and the step', () => {
            expect(getFeatureStack('/a.feature', feature, scenario, { astNodeIds: ['st-1'] } as unknown as PickleStep)).toBe(
                '\tat Feature(/a.feature):1:1\n\tat Scenario(Get size):6:3\n\tat Step(a step):7:5\n')
        })

        it('finds a background step', () => {
            expect(getFeatureStack('/a.feature', feature, scenario, { astNodeIds: ['bg-1'] } as unknown as PickleStep)).toBe(
                '\tat Feature(/a.feature):1:1\n\tat Scenario(Get size):6:3\n\tat Step(a background step):4:5\n')
        })

        it('gives only the feature for an unknown scenario', () => {
            expect(getFeatureStack('/a.feature', feature, { astNodeIds: ['x'] } as unknown as Pickle)).toBe('\tat Feature(/a.feature):1:1\n')
        })
    })

    describe('getStepResult', () => {
        const featureStack = '\tat Feature(/a.feature):1:1\n'
        const params = { title: 'a step', isStep: true, ignoreUndefinedDefinitions: false, failAmbiguousDefinitions: false, featureStack: () => featureStack }
        const result = (status: string, message?: string) => ({ status, message, duration: { seconds: 0, nanos: 0 } }) as unknown as TestStepResult

        it('passes a passed step', () => {
            expect(getStepResult(result(Status.PASSED), params)).toEqual({ state: 'pass', error: undefined, titleSuffix: '', failed: false })
        })

        it('builds the feature stack only for an error that shows it', () => {
            const stack = vi.fn(() => featureStack)
            for (const status of [Status.PASSED, Status.SKIPPED, Status.PENDING, Status.FAILED, Status.AMBIGUOUS]) {
                getStepResult(result(status, 'Error: x'), { ...params, featureStack: stack })
            }
            getStepResult(result(Status.UNDEFINED), { ...params, ignoreUndefinedDefinitions: true, featureStack: stack })
            expect(stack).not.toHaveBeenCalled()

            getStepResult(result(Status.UNDEFINED), { ...params, featureStack: stack })
            getStepResult(result(Status.AMBIGUOUS), { ...params, failAmbiguousDefinitions: true, featureStack: stack })
            expect(stack).toHaveBeenCalledTimes(2)
        })

        it('fails an undefined step with the sequential message', () => {
            const { state, error, failed, titleSuffix } = getStepResult(result(Status.UNDEFINED), params)
            expect(state).toBe('fail')
            expect(failed).toBe(true)
            expect(titleSuffix).toBe('')
            expect(error?.message).toBe('Step "a step" is not defined. You can ignore this error by setting cucumberOpts.ignoreUndefinedDefinitions as true.')
            expect(error?.stack).toBe(`${error?.message}\n${featureStack}`)
        })

        it('fails a scenario with an undefined step with the scenario message', () => {
            const { error } = getStepResult(result(Status.UNDEFINED), { ...params, title: 'S', isStep: false })
            expect(error?.message).toBe('Scenario S has undefined steps. You can ignore this error by setting cucumberOpts.ignoreUndefinedDefinitions as true.')
        })

        it('reports an undefined step as pending with the suffix', () => {
            expect(getStepResult(result(Status.UNDEFINED), { ...params, ignoreUndefinedDefinitions: true }))
                .toEqual({ state: 'pending', error: undefined, titleSuffix: ' (undefined step)', failed: false })
        })

        it('keeps the first line of a failed step as message and the Cucumber message as stack', () => {
            const message = 'Error: fails on purpose\n    at World.<anonymous> (steps.ts:1:1)'
            const { state, error, failed } = getStepResult(result(Status.FAILED, message), params)
            expect(state).toBe('fail')
            expect(failed).toBe(true)
            expect(error?.message).toBe('Error: fails on purpose')
            expect(error?.stack).toBe(message)
        })

        it('skips an ambiguous step with the definitions as pendingReason', () => {
            const message = 'Multiple step definitions match:\n  a step - steps.ts:1'
            const { state, failed, pendingReason } = getStepResult(result(Status.AMBIGUOUS, message), params)
            expect(state).toBe('skip')
            expect(failed).toBe(false)
            expect(pendingReason).toBe(message)
        })

        it('fails an ambiguous step with failAmbiguousDefinitions', () => {
            const message = 'Multiple step definitions match:\n  a step - steps.ts:1'
            const { state, failed, error, pendingReason } = getStepResult(result(Status.AMBIGUOUS, message), { ...params, failAmbiguousDefinitions: true })
            expect(state).toBe('fail')
            expect(failed).toBe(true)
            expect(pendingReason).toBeUndefined()
            expect(error?.message).toBe('Multiple step definitions match:')
            expect(error?.stack).toBe(`${message}\n${featureStack}`)
        })

        it('uses the fallback text for an ambiguous step with no definitions', () => {
            const { error } = getStepResult(result(Status.AMBIGUOUS), { ...params, failAmbiguousDefinitions: true })
            expect(error?.message).toBe('Step "a step" matches multiple step definitions. Make the step definitions unique by removing duplicate or overlapping expressions.')
        })
    })
})
