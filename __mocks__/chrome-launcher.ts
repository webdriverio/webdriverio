import { vi } from 'vitest'
export const launch = vi.fn().mockReturnValue(Promise.resolve({
    port: 1234
}))
