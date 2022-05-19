import { vi } from 'vitest'
export const install = vi.fn(() => new Promise<void>((resolve) => resolve()))
export const start = vi.fn(() => new Promise((resolve) => resolve({
    kill : vi.fn(),
    stdout : { pipe: vi.fn().mockReturnValue({ pipe : vi.fn() }) },
    stderr : { pipe: vi.fn().mockReturnValue({ pipe : vi.fn() }) }
})))
