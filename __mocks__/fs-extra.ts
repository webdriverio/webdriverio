import { vi } from 'vitest'
import fs from './fs'

export default {
    ...fs,
    ensureDirSync: vi.fn(),
    readFileSync: vi.fn(),
    createFile: vi.fn()
}
