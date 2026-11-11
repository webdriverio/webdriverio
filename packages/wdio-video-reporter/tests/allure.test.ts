import { describe, it, expect, vi } from 'vitest'

import AllureReporterExtension from '../src/allure.js'

const allure = vi.hoisted(() => ({ imports: 0, addArgument: vi.fn(), addAttachment: vi.fn() }))

vi.mock('@wdio/allure-reporter', () => {
    allure.imports++
    return { addArgument: allure.addArgument, addAttachment: allure.addAttachment }
})

describe('AllureReporterExtension', () => {
    it('imports the Allure reporter only when it is used', async () => {
        const extension = new AllureReporterExtension()
        await new Promise((resolve) => setTimeout(resolve, 0))
        expect(allure.imports).toBe(0)
        await extension.addArgument('browserVersion', '1')
        expect(allure.imports).toBe(1)
        expect(allure.addArgument).toHaveBeenCalledWith('browserVersion', '1')
    })
})
