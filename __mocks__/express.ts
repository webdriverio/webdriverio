import { vi } from 'vitest'

const expressMock = vi.fn().mockReturnValue({
    use: vi.fn(),
    listen: vi.fn().mockImplementation(function (this: unknown, port, cb) {
        if (this === undefined) {
            return cb(
                new Error('This value missing when invoking server.listen()')
            )
        }

        cb()
    })
}) as any

expressMock.static = vi.fn()

export default expressMock
