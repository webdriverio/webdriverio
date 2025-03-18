import logger, { type Logger } from '@testplane/wdio-logger'

// hack to support cjs - https://github.com/evanw/esbuild/issues/2480#issuecomment-1833104754
const safeESModule = <T>(a: T | { default: T }): T => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = a as any
    return b.__esModule || b[Symbol.toStringTag] === 'Module' ? b.default : b
}

export default safeESModule<(name: string) => Logger>(logger)
