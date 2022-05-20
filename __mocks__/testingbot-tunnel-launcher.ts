import { vi } from 'vitest'

export default (opts: any, cb: any) => {
    cb(null, {
        close: vi.fn()
    })
}
