import { createHash } from 'node:crypto'

export const md5 = (s: string) => createHash('md5').update(s).digest('hex')
