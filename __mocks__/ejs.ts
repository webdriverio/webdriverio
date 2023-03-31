import { vi } from 'vitest'
export default {
    renderFile: vi.fn().mockImplementation((...args: any[]) => args.pop()())
}
