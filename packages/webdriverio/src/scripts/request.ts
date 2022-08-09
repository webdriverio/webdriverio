import type { RequestParams } from '../types'

export default async function request (url: string, params: RequestParams, done: Function) {
    try {
        const response = await window.fetch(url, params)
        return done(response)
    } catch (error: any) {
        done({
            error: 'RequestError',
            message: error.message
        })
    }
}
