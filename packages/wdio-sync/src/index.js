import deasync from 'deasync'

export default function waitForPromise (promise) {
    if (!(promise instanceof Promise)) {
        return promise
    }

    let error
    let result
    let isDone = false

    promise.then((res) => {
        result = res
        isDone = true
    }, (err) => {
        error = err
        isDone = true
    })

    deasync.loopWhile(() => !isDone)

    if (error) {
        throw error
    }

    return result
}
