import { vi } from 'vitest'
export const waitForFullyLoaded = vi.fn().mockReturnValue(Promise.resolve({}))
