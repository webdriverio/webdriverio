import { it, describe, expect } from 'vitest'
import { mask, parseMaskingPatterns } from '../src/utils.js'

describe('wdio-logger utils', () => {
    describe('parseMaskingPatterns', () => {

        it('should works when undefined', () => {
            const patterns = parseMaskingPatterns(undefined)

            expect(patterns).toEqual(undefined)
        })

        it('should skip when pattern is empty', () => {
            const patterns = parseMaskingPatterns('')

            expect(patterns).toEqual([])
        })

        it('should works when pattern has space', () => {
            const patterns = parseMaskingPatterns(' ')

            expect(patterns).toEqual([])
        })

        it('should parse one pattern with no flag', () => {
            const stringPatterns = '/--key=[^ ]*/'

            const patterns = parseMaskingPatterns(stringPatterns)

            expect(patterns).toEqual([/--key=[^ ]*/])
        })

        it('should parse one pattern no flag and no slash', () => {
            const stringPatterns = '--key=[^ ]*'

            const patterns = parseMaskingPatterns(stringPatterns)

            expect(patterns).toEqual([/--key=[^ ]*/])
        })

        it('should parse one pattern having 0 group and case insensitive', () => {
            const stringPatterns = '/--key=[^ ]*/i'

            const patterns = parseMaskingPatterns(stringPatterns)

            expect(patterns).toEqual([/--key=[^ ]*/i])
        })

        it('should parse one pattern having 0 group and global flag', () => {
            const stringPatterns = '/--key=[^ ]*/g'

            const patterns = parseMaskingPatterns(stringPatterns)

            expect(patterns).toEqual([/--key=[^ ]*/g])
        })

        it('should parse one pattern ex having 1 group', () => {
            const stringPatterns = '/--key=([^ ]*)/g'

            const patterns = parseMaskingPatterns(stringPatterns)

            expect(patterns).toEqual([/--key=([^ ]*)/g])
        })

        it('should parse one pattern having 2 group', () => {
            const stringPatterns = '(--key=)([^ ]*)'

            const patterns = parseMaskingPatterns(stringPatterns)

            expect(patterns).toEqual([/(--key=)([^ ]*)/])
        })

        it('should "parse" one pattern having more than 2 group', () => {
            const stringPatterns = '(--key)(=)([^ ]*)'

            const patterns = parseMaskingPatterns(stringPatterns)

            expect(patterns).toEqual([/(--key)(=)([^ ]*)/])
        })

        it('should parse two patterns having 2 groups each', () => {
            const stringPatterns = '(--key=)([^ ]*),/(TOKEN=)([^ ]*)/i'

            const patterns = parseMaskingPatterns(stringPatterns)

            expect(patterns).toEqual([/(--key=)([^ ]*)/, /(TOKEN=)([^ ]*)/i])
        })

        it('skipped regex when it is invalid', () => {
            const stringPatterns = '(--key=)([^ ]*,/(TOKEN=)([^ ]*)/i'

            const patterns = parseMaskingPatterns(stringPatterns)

            expect(patterns).toEqual([/(TOKEN=)([^ ]*)/i])
        })
        it('empty when all invalid', () => {
            const stringPatterns = '(--key=)([^ ]*'

            const patterns = parseMaskingPatterns(stringPatterns)

            expect(patterns).toEqual([])
        })

        it('undefined when wrong type', () => {
            const stringPatterns = [] as unknown as string

            const patterns = parseMaskingPatterns(stringPatterns)

            expect(patterns).toEqual(undefined)
        })

        it('empty when invalid empty pattern string ', () => {
            const stringPatterns = '//'

            const patterns = parseMaskingPatterns(stringPatterns)

            expect(patterns).toEqual([])
        })

    })

    describe('mask', () => {

        it('should return the arg as it is when not a string', () => {
            const arg = 123
            const patterns = [/--key=[^ ]*/]

            const maskedValue = mask(arg as unknown as string, patterns)

            expect(maskedValue).toEqual(arg)
        })

        it('should return the arg when undefined', () => {
            const arg = undefined
            const patterns = [/--key=[^ ]*/]

            const maskedValue = mask(arg as unknown as string, patterns)

            expect(maskedValue).toEqual(arg)
        })

        it('should not mask when nothing to mask', () => {
            const arg = 'mask nothing'
            const patterns = [/--key=[^ ]*/]

            const maskedValue = mask(arg, patterns)

            expect(maskedValue).toEqual(arg)
        })

        it('should mask when there is something to mask', () => {
            const arg = '--key=mySecretKey'
            const patterns = [/--key=[^ ]*/]

            const maskedValue = mask(arg, patterns)

            expect(maskedValue).toEqual('**MASKED**')
        })

        it('should mask and keep the rest of the string', () => {
            const arg = 'before --key=mySecretKey after'
            const patterns = [/--key=[^ ]*/]

            const maskedValue = mask(arg, patterns)

            expect(maskedValue).toEqual('before **MASKED** after')
        })

        it('should mask the captured group only when having one capturing group', () => {
            const arg = 'before --key=mySecretKey after'
            const patterns = [/--key=([^ ]*)/]

            const maskedValue = mask(arg, patterns)

            expect(maskedValue).toEqual('before --key=**MASKED** after')
        })

        it('should mask all captured groups when having 2 groups', () => {
            const arg = 'before --key=mySecretKey after'
            const patterns = [/(--key)=([^ ]*)/]

            const maskedValue = mask(arg, patterns)

            expect(maskedValue).toEqual('before **MASKED**=**MASKED** after')
        })

        it('should also work with global flag', () => {
            const arg = 'before --key=mySecretKey after'
            const patterns = [/--key=([^ ]*)/g]

            const maskedValue = mask(arg, patterns)

            expect(maskedValue).toEqual('before --key=**MASKED** after')
        })

        it('should masked multiple occurrences with the global flag', () => {
            const arg = 'before --key=mySecretKey1 --key=mySecretKey2 after'
            const patterns = [/--key=([^ ]*)/g]

            const maskedValue = mask(arg, patterns)

            expect(maskedValue).toEqual('before --key=**MASKED** --key=**MASKED** after')
        })

        it('should masked properly when having case insensitive flag', () => {
            const arg = 'before --KEY=mySecretKey1 --key=mySecretKey2 after'
            const patterns = [/--key=([^ ]*)/ig]

            const maskedValue = mask(arg, patterns)

            expect(maskedValue).toEqual('before --KEY=**MASKED** --key=**MASKED** after')
        })
    })
})