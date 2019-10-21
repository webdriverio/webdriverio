export const post = jest.fn().mockImplementation((uri, body) => new Promise((resolve, reject) => {
    if (body.key === 'fail') {
        return reject({ message: 'some error', response: { status: 404 } })
    }
    if (typeof body.key === 'undefined') {
        return resolve({})
    }
    return resolve({ data: { value: 'store value' } })
}))
