import { vi } from 'vitest'

const fs = {} as any
fs.writeFileSync = vi.fn()
fs.existsSync = vi.fn(() => true)
fs.accessSync = vi.fn(() => true)

export default fs
