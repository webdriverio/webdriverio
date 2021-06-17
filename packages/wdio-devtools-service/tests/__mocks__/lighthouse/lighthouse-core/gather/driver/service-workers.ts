export default {
    getServiceWorkerRegistrations: jest.fn().mockResolvedValue({ registrations: 42 }),
    getServiceWorkerVersions: jest.fn().mockResolvedValue({ versions: '1.2.1' })
}
