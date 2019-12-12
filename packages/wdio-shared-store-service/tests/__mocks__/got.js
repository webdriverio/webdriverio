export const post = jest.fn().mockImplementation((url, options) => new Promise((resolve, reject) => {
    if (options.body.key === 'fail') {
        return reject({
            message: 'Response code 404 (Not Found)',
            statusCode: 404,
            statusMessage: 'Not Found',
            body: 'Not Found',
            url
        })
    }
    if (typeof options.body.key === 'undefined') {
        return resolve({})
    }
    return resolve({ body: { value: 'store value' } })
}))
