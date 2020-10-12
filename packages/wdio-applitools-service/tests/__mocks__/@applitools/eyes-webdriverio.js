const Target = {
    window: jest.fn().mockReturnValue('some window'),
    region: jest.fn().mockImplementation((region, frame) => {
        if (frame) {
            return 'foobarRegionWithFrame'
        }
        return 'foobarRegion'
    })
}

class Eyes {
    constructor () {
        this.setApiKey = jest.fn()
        this.setServerUrl = jest.fn()
        this.setProxy = jest.fn()
        this.check = jest.fn()
        this.open = jest.fn()
        this.close = jest.fn()
        this.abortIfNotClosed = jest.fn()
    }
}

export { Eyes, Target }
