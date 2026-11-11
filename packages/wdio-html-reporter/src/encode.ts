import { readFileSync } from 'node:fs'

export default function encode(url:string) {
    const fileBuf = readFileSync(url)
    return 'data:image/png;base64,'  + fileBuf.toString('base64')
}