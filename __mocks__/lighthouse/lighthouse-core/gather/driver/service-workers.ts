import { vi } from 'vitest'
export default {
    getServiceWorkerRegistrations: vi.fn().mockResolvedValue({ registrations: 42 }),
    getServiceWorkerVersions: vi.fn().mockResolvedValue({ versions: '1.2.1' })
}
