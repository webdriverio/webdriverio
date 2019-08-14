export default {
    connect: jest.fn().mockReturnValue(Promise.resolve({
        pages: jest.fn().mockReturnValue(Promise.resolve([
            { close: jest.fn(), url: jest.fn().mockReturnValue('about:blank') },
            { close: jest.fn(), url: jest.fn().mockReturnValue('http://json.org') }
        ]))
    }))
}
