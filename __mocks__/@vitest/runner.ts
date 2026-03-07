import { vi } from 'vitest'

export const startTests = vi.fn().mockResolvedValue([])

export const describe = vi.fn()
export const it = vi.fn()
export const test = vi.fn()
export const suite = vi.fn()
export const beforeAll = vi.fn()
export const afterAll = vi.fn()
export const beforeEach = vi.fn()
export const afterEach = vi.fn()

export const collectTests = vi.fn().mockResolvedValue([])

export const getCurrentSuite = vi.fn()
export const getCurrentTest = vi.fn()
export const setFn = vi.fn()
export const getFn = vi.fn()
export const setHooks = vi.fn()
export const getHooks = vi.fn()
export const updateTask = vi.fn()
export const createTaskCollector = vi.fn()
export const recordArtifact = vi.fn()
