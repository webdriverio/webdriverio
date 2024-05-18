import { vi } from 'vitest'

export const canAccess = vi.fn()
export const startWebDriver = vi.fn().mockResolvedValue({ pid: 42 })
