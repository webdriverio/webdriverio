declare module 'async-exit-hook' {
    export default function exitHook (
        hook: (callback: () => void) => void
    ): void
}
