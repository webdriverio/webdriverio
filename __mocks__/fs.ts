import { vi } from 'vitest'

const fs = {} as any
fs.createWriteStream = vi.fn()
fs.writeFileSync = vi.fn()
fs.existsSync = vi.fn(() => true)
fs.accessSync = vi.fn(() => true)

export default fs
