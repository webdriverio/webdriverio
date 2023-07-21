import { vi } from 'vitest'

const which = vi.fn()
// @ts-expect-error
which.sync = vi.fn()
export default which
