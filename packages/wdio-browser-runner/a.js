import { resolve } from 'import-meta-resolve'

console.log(await resolve('aria-query', import.meta.url))
