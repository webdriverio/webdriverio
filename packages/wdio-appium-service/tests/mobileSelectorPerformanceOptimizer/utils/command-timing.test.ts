import { describe, expect, test } from 'vitest'
import type { CommandTiming } from '../../../src/mobileSelectorPerformanceOptimizer/types.js'
import {
    findMostRecentUnmatchedUserCommand,
    findMatchingInternalCommandTiming
} from '../../../src/mobileSelectorPerformanceOptimizer/utils/command-timing.js'

describe('command-timing utils', () => {
    describe('findMostRecentUnmatchedUserCommand', () => {
        test('should find most recent unmatched user command', () => {
            const timings = new Map<string, CommandTiming>([
                ['id1', {
                    startTime: 1000,
                    commandName: '$',
                    selector: '//button',
                    formattedSelector: '//button',
                    timingId: 'id1',
                    isUserCommand: true
                }],
                ['id2', {
                    startTime: 2000,
                    commandName: '$',
                    selector: '//input',
                    formattedSelector: '//input',
                    timingId: 'id2',
                    isUserCommand: true
                }]
            ])

            const result = findMostRecentUnmatchedUserCommand(timings)
            expect(result).toBeDefined()
            expect(result![0]).toBe('id2')
            expect(result![1].startTime).toBe(2000)
        })

        test('should exclude commands with selectorType (already matched)', () => {
            const timings = new Map<string, CommandTiming>([
                ['id1', {
                    startTime: 1000,
                    commandName: '$',
                    selector: '//button',
                    formattedSelector: '//button',
                    selectorType: 'xpath',
                    timingId: 'id1',
                    isUserCommand: true
                }],
                ['id2', {
                    startTime: 2000,
                    commandName: '$',
                    selector: '//input',
                    formattedSelector: '//input',
                    timingId: 'id2',
                    isUserCommand: true
                }]
            ])

            const result = findMostRecentUnmatchedUserCommand(timings)
            expect(result).toBeDefined()
            expect(result![0]).toBe('id2')
        })

        test('should exclude internal commands', () => {
            const timings = new Map<string, CommandTiming>([
                ['id1', {
                    startTime: 1000,
                    commandName: 'findElement',
                    selector: '//button',
                    formattedSelector: '//button',
                    timingId: 'id1',
                    isUserCommand: false
                }],
                ['id2', {
                    startTime: 2000,
                    commandName: '$',
                    selector: '//input',
                    formattedSelector: '//input',
                    timingId: 'id2',
                    isUserCommand: true
                }]
            ])

            const result = findMostRecentUnmatchedUserCommand(timings)
            expect(result).toBeDefined()
            expect(result![0]).toBe('id2')
        })

        test('should return undefined when no unmatched user commands', () => {
            const timings = new Map<string, CommandTiming>([
                ['id1', {
                    startTime: 1000,
                    commandName: 'findElement',
                    selector: '//button',
                    formattedSelector: '//button',
                    timingId: 'id1',
                    isUserCommand: false
                }]
            ])

            const result = findMostRecentUnmatchedUserCommand(timings)
            expect(result).toBeUndefined()
        })

        test('should return undefined for empty map', () => {
            const timings = new Map<string, CommandTiming>()
            const result = findMostRecentUnmatchedUserCommand(timings)
            expect(result).toBeUndefined()
        })

        test('should sort by startTime descending', () => {
            const timings = new Map<string, CommandTiming>([
                ['id1', {
                    startTime: 3000,
                    commandName: '$',
                    selector: '//first',
                    formattedSelector: '//first',
                    timingId: 'id1',
                    isUserCommand: true
                }],
                ['id2', {
                    startTime: 1000,
                    commandName: '$',
                    selector: '//second',
                    formattedSelector: '//second',
                    timingId: 'id2',
                    isUserCommand: true
                }],
                ['id3', {
                    startTime: 2000,
                    commandName: '$',
                    selector: '//third',
                    formattedSelector: '//third',
                    timingId: 'id3',
                    isUserCommand: true
                }]
            ])

            const result = findMostRecentUnmatchedUserCommand(timings)
            expect(result![1].selector).toBe('//first')
        })
    })

    describe('findMatchingInternalCommandTiming', () => {
        test('should find matching internal command timing', () => {
            const timings = new Map<string, CommandTiming>([
                ['id1', {
                    startTime: 1000,
                    commandName: '$',
                    selector: '//button',
                    formattedSelector: '//button',
                    selectorType: 'xpath',
                    timingId: 'id1',
                    isUserCommand: false
                }]
            ])

            const result = findMatchingInternalCommandTiming(timings, '//button', 'xpath')
            expect(result).toBeDefined()
            expect(result![0]).toBe('id1')
        })

        test('should exclude user commands', () => {
            const timings = new Map<string, CommandTiming>([
                ['id1', {
                    startTime: 1000,
                    commandName: '$',
                    selector: '//button',
                    formattedSelector: '//button',
                    selectorType: 'xpath',
                    timingId: 'id1',
                    isUserCommand: true
                }],
                ['id2', {
                    startTime: 2000,
                    commandName: 'findElement',
                    selector: '//button',
                    formattedSelector: '//button',
                    selectorType: 'xpath',
                    timingId: 'id2',
                    isUserCommand: false
                }]
            ])

            const result = findMatchingInternalCommandTiming(timings, '//button', 'xpath')
            expect(result![0]).toBe('id2')
        })

        test('should match by formattedSelector and selectorType', () => {
            const timings = new Map<string, CommandTiming>([
                ['id1', {
                    startTime: 1000,
                    commandName: 'findElement',
                    selector: '//button',
                    formattedSelector: '//button',
                    selectorType: 'css',
                    timingId: 'id1',
                    isUserCommand: false
                }],
                ['id2', {
                    startTime: 2000,
                    commandName: 'findElement',
                    selector: '//button',
                    formattedSelector: '//button',
                    selectorType: 'xpath',
                    timingId: 'id2',
                    isUserCommand: false
                }]
            ])

            const result = findMatchingInternalCommandTiming(timings, '//button', 'xpath')
            expect(result![0]).toBe('id2')
        })

        test('should return undefined when no match found', () => {
            const timings = new Map<string, CommandTiming>([
                ['id1', {
                    startTime: 1000,
                    commandName: 'findElement',
                    selector: '//input',
                    formattedSelector: '//input',
                    selectorType: 'xpath',
                    timingId: 'id1',
                    isUserCommand: false
                }]
            ])

            const result = findMatchingInternalCommandTiming(timings, '//button', 'xpath')
            expect(result).toBeUndefined()
        })

        test('should return undefined for empty map', () => {
            const timings = new Map<string, CommandTiming>()
            const result = findMatchingInternalCommandTiming(timings, '//button', 'xpath')
            expect(result).toBeUndefined()
        })

        test('should return most recent match', () => {
            const timings = new Map<string, CommandTiming>([
                ['id1', {
                    startTime: 1000,
                    commandName: 'findElement',
                    selector: '//button',
                    formattedSelector: '//button',
                    selectorType: 'xpath',
                    timingId: 'id1',
                    isUserCommand: false
                }],
                ['id2', {
                    startTime: 3000,
                    commandName: 'findElement',
                    selector: '//button',
                    formattedSelector: '//button',
                    selectorType: 'xpath',
                    timingId: 'id2',
                    isUserCommand: false
                }],
                ['id3', {
                    startTime: 2000,
                    commandName: 'findElement',
                    selector: '//button',
                    formattedSelector: '//button',
                    selectorType: 'xpath',
                    timingId: 'id3',
                    isUserCommand: false
                }]
            ])

            const result = findMatchingInternalCommandTiming(timings, '//button', 'xpath')
            expect(result![0]).toBe('id2')
            expect(result![1].startTime).toBe(3000)
        })
    })
})
