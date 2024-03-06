export class ResponseError extends Error {
    public response: Response
    constructor(message: string, res: Response) {
        super(message)
        this.response = res
    }
}

export default async function fetchWrap(input: RequestInfo | URL, init?: RequestInit) {
    const res = await fetch(input, init)
    if (!res.ok) {
        throw new ResponseError(`Error response from server ${res.status}:  ${await res.text()}`, res)
    }
    return res
}
