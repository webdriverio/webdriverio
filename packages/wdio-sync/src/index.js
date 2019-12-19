import deasync from 'deasync'

export default function waitForPromise (promise) {
    if (!(promise instanceof Promise) || !process.env.WDIO_SYNC_ENABLED) {
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
        if (!(error instanceof Error)) {
            error = new Error(error)
        }

        throw error
    }

    return result
}
