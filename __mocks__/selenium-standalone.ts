import { vi } from 'vitest'

const install = vi.fn(() => new Promise<void>((resolve) => resolve()))
const start = vi.fn(() => new Promise((resolve) => resolve({
    kill: vi.fn(),
    stdout: { pipe : vi.fn().mockReturnValue({ pipe : vi.fn() }) },
    stderr: { pipe : vi.fn().mockReturnValue({ pipe : vi.fn() }) }
})))

export default {
    install,
    start
}
