import path from 'node:path'
import type { MockedFunction } from 'vitest'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import AllureReporter from '../src/index.js'
import { LabelName, LinkType, Stage, Status, ContentType } from 'allure-js-commons'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

describe('reporter allure steps API', () => {
    const processEmit = process.emit.bind(process)

    beforeEach(() => {
        process.emit = vi.fn() as any
    })

    afterEach(() => {
        process.emit = processEmit
    })

    it('should add passed custom step', async () => {
        await AllureReporter.step('custom step', () => {})

        const [, call] = (process.emit as MockedFunction<any>).calls[0]

        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(call.steps).toHaveLength(1)
        expect(call.steps[0]).toMatchObject({
            name: 'custom step',
            status: Status.PASSED,
            stage: Stage.FINISHED,
        })
    })

    it('should add failed custom step', async () => {
        await AllureReporter.step('custom step', () => {
            throw new Error('an error here')
        })

        const [, call] = (process.emit as MockedFunction<any>).calls[0]

        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(call.steps).toHaveLength(1)
        expect(call.steps[0]).toMatchObject({
            name: 'custom step',
            status: Status.FAILED,
            stage: Stage.FINISHED,
        })
    })

    describe('labels', () => {
        describe('custom label', () => {
            it('should add step with custom label', async () => {
                await AllureReporter.step('custom step', (step) => {
                    step.label('foo', 'bar')
                })

                const [, call] = (process.emit as MockedFunction<any>).calls[0]

                expect(call.labels).toHaveLength(1)
                expect(call.labels[0]).toEqual({ name: 'foo', value: 'bar' })
            })
        })

        describe('epic', () => {
            it('should add step with epic', async () => {
                await AllureReporter.step('custom step', (step) => {
                    step.epic('foo')
                })

                const [, call] = (process.emit as MockedFunction<any>).calls[0]

                expect(call.labels).toHaveLength(1)
                expect(call.labels[0]).toEqual({ name: LabelName.EPIC, value: 'foo' })
            })
        })

        describe('feature', () => {
            it('should add step with feature label', async () => {
                await AllureReporter.step('custom step', (step) => {
                    step.feature('foo')
                })

                const [, call] = (process.emit as MockedFunction<any>).calls[0]

                expect(call.labels).toHaveLength(1)
                expect(call.labels[0]).toEqual({ name: LabelName.FEATURE, value: 'foo' })
            })
        })

        describe('story', () => {
            it('should add step with story label', async () => {
                await AllureReporter.step('custom step', (step) => {
                    step.story('foo')
                })

                const [, call] = (process.emit as MockedFunction<any>).calls[0]

                expect(call.labels).toHaveLength(1)
                expect(call.labels[0]).toEqual({ name: LabelName.STORY, value: 'foo' })
            })
        })

        describe('suite', () => {
            it('should add step with suite label', async () => {
                await AllureReporter.step('custom step', (step) => {
                    step.suite('foo')
                })

                const [, call] = (process.emit as MockedFunction<any>).calls[0]

                expect(call.labels).toHaveLength(1)
                expect(call.labels[0]).toEqual({ name: LabelName.SUITE, value: 'foo' })
            })
        })

        describe('parentSuite', () => {
            it('should add step with parent suite label', async () => {
                await AllureReporter.step('custom step', (step) => {
                    step.parentSuite('foo')
                })

                const [, call] = (process.emit as MockedFunction<any>).calls[0]

                expect(call.labels).toHaveLength(1)
                expect(call.labels[0]).toEqual({ name: LabelName.PARENT_SUITE, value: 'foo' })
            })
        })

        describe('subSuite', () => {
            it('should add step with sub suite label', async () => {
                await AllureReporter.step('custom step', (step) => {
                    step.subSuite('foo')
                })

                const [, call] = (process.emit as MockedFunction<any>).calls[0]

                expect(call.labels).toHaveLength(1)
                expect(call.labels[0]).toEqual({ name: LabelName.SUB_SUITE, value: 'foo' })
            })
        })

        describe('owner', () => {
            it('should add step with owner label', async () => {
                await AllureReporter.step('custom step', (step) => {
                    step.owner('foo')
                })

                const [, call] = (process.emit as MockedFunction<any>).calls[0]

                expect(call.labels).toHaveLength(1)
                expect(call.labels[0]).toEqual({ name: LabelName.OWNER, value: 'foo' })
            })
        })

        describe('severity', () => {
            it('should add step with severity label', async () => {
                await AllureReporter.step('custom step', (step) => {
                    step.severity('foo')
                })

                const [, call] = (process.emit as MockedFunction<any>).calls[0]

                expect(call.labels).toHaveLength(1)
                expect(call.labels[0]).toEqual({ name: LabelName.SEVERITY, value: 'foo' })
            })
        })

        describe('tag', () => {
            it('should add step with tag label', async () => {
                await AllureReporter.step('custom step', (step) => {
                    step.tag('foo')
                })

                const [, call] = (process.emit as MockedFunction<any>).calls[0]

                expect(call.labels).toHaveLength(1)
                expect(call.labels[0]).toEqual({ name: LabelName.TAG, value: 'foo' })
            })
        })
    })

    describe('links', () => {
        describe('custom link', () => {
            it('should add step with link', async () => {
                await AllureReporter.step('custom step', (step) => {
                    step.link('https://example.org', 'foo', 'bar')
                })

                const [, call] = (process.emit as MockedFunction<any>).calls[0]

                expect(call.links).toHaveLength(1)
                expect(call.links[0]).toEqual({ url: 'https://example.org', name: 'foo', type: 'bar' })
            })
        })

        describe('issue', () => {
            it('should add issue link', async () => {
                await AllureReporter.step('custom step', (step) => {
                    step.issue('foo', 'https://example.org')
                })

                const [, call] = (process.emit as MockedFunction<any>).calls[0]

                expect(call.links).toHaveLength(1)
                expect(call.links[0]).toEqual({ url: 'https://example.org', name: 'foo', type: LinkType.ISSUE })
            })
        })

        describe('tms', () => {
            it('should add tms link', async () => {
                await AllureReporter.step('custom step', (step) => {
                    step.tms('foo', 'https://example.org')
                })

                const [, call] = (process.emit as MockedFunction<any>).calls[0]

                expect(call.links).toHaveLength(1)
                expect(call.links[0]).toEqual({ url: 'https://example.org', name: 'foo', type: LinkType.TMS })
            })
        })
    })

    describe('attach', () => {
        it('should add step with attachment', async () => {
            await AllureReporter.step('custom step', (step) => {
                step.attach(JSON.stringify({ foo: 'bar' }), ContentType.JSON)
            })

            const [, call] = (process.emit as MockedFunction<any>).calls[0]

            expect(call.steps[0].attachments).toHaveLength(1)
            expect(call.steps[0].attachments[0]).toEqual({
                name: 'attachment',
                type: ContentType.JSON,
                encoding: 'utf8',
                content: JSON.stringify({ foo: 'bar' }),
            })
        })
    })

    describe('params', () => {
        it('should add provided parameter', async () => {
            await AllureReporter.step('custom step', (step) => {
                step.parameter('foo', 'bar', { excluded: false, mode: 'hidden' })
            })

            const [, call] = (process.emit as MockedFunction<any>).calls[0]

            expect(call.parameter).toHaveLength(1)
            expect(call.parameter[0]).toEqual({ name: 'foo', value: 'bar', excluded: false, mode: 'hidden' })
        })
    })
})
