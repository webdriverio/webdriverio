/**
 * retrieved from https://github.com/sindresorhus/ky/blob/3ba40cc6333cf1847c02c51744e22ab7c04407f5/source/utils/normalize.ts#L10
 */
export const RETRYABLE_STATUS_CODES = [408, 413, 429, 500, 502, 503, 504]
/**
 * retrieved from https://github.com/sindresorhus/got/blob/89b7fdfd4e7ea4e76258f50b70ae8a1d2aea8125/source/core/options.ts#L392C1-L399C37
 */
export const RETRYABLE_ERROR_CODES = [
    'ETIMEDOUT', 'ECONNRESET', 'EADDRINUSE', 'ECONNREFUSED', 'EPIPE', 'ENOTFOUND',
    'ENETUNREACH', 'EAI_AGAIN',
    // additional error codes we like to retry
    'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET'
]

export const REG_EXPS = {
    commandName: /.*\/session\/[0-9a-f-]+\/(.*)/,
    execFn: /return \(([\s\S]*)\)\.apply\(null, arguments\)/
}
