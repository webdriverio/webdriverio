import { vi } from 'vitest'
process.env.WDIO_ASSERTION_LIB_ACTIVATED = '1'
const setOptions = vi.fn()
const expect = vi.fn()
const matchers = new Map()
export { setOptions, expect, matchers }
