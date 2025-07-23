import { createHash } from 'node:crypto'
// import type { TestStats } from '@wdio/reporter'

export const md5 = (s: string) => createHash('md5').update(s).digest('hex')

// export function computeHistoryId(ev: Pick<TestStats, 'fullTitle' | 'fullName' | 'title'>) {
//     const src = ev.fullTitle || ev.fullName || ev.title
//     return md5(src)
// }
