import LambdaTestLauncher from '../src/launcher'
describe('onPrepare', () => {
    const options = { tunnel: true }
    const caps = [{}]
    const config = {
        user: 'foobaruser',
        key: '12345'
    }

    it('should not call LambdaTest tunnel if it\'s undefined', () => {
        const service = new LambdaTestLauncher({})
        service.onPrepare(config, caps)
        expect(service.tunnel).toBeUndefined()
        expect(service.lambdatestTunnelProcess).toBeUndefined()
    })

    it('should not call LambdaTest tunnel if it\'s false', () => {
        const service = new LambdaTestLauncher({
            tunnel: false
        })
        service.onPrepare(config, caps)
        expect(service.lambdatestTunnelProcess).toBeUndefined()
    })

    it('should reject if tunnel.start throws an error', async () => {
        const service = new LambdaTestLauncher(options)
        try {
            await service.onPrepare(config, caps)
        } catch (e) {
            expect(e).toEqual({
                message:
                    'Either username or token is invalid or user is not active',
                type: 'error'
            })
        }
    }, 30000)

    it('should add the tunnel property to a single capability', async () => {
        const service = new LambdaTestLauncher(options)
        const capabilities = {}
        try {
            await service.onPrepare(config, capabilities)
        } catch (e) {
            expect(capabilities).toEqual({ tunnel: true })
        }
        expect(capabilities).toEqual({ tunnel: true })
    }, 40000)
})

describe('onComplete', () => {
    it('should properly resolve if everything works', async () => {
        const service = new LambdaTestLauncher({}, [], {})
        expect(service.onComplete()).toBeUndefined()
    })
})