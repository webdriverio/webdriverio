import type { DeepAgent } from 'deepagents'

/**
 * Interactive agent REPL: an ink (React-for-terminal) chat loop. Each prompt
 * runs one agent turn through the v3 stream — token-by-token replies,
 * bordered tool-call cards, an arrow-key approval picker for `heal=ask`
 * gates, and a status footer. `close`/`close session`/`reset` closes the
 * browser session without exiting; `exit`/`quit`/Ctrl-C shuts down cleanly
 * (closing the MCP server).
 *
 * ink has no plain-text fallback for piped stdin, so the REPL requires a
 * TTY; non-TTY callers get a pointer to `run` (the CI path).
 */
export async function runRepl(agent: DeepAgent, onClose: () => Promise<void>, closeSession?: () => Promise<void>): Promise<void> {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        console.error('[@wdio/deepagent] repl requires a TTY. Use `wdio-deepagent run "<prompt>"` for non-interactive use.')
        process.exitCode = 1
        // the harness was already built (spawning the MCP server), so close
        // it here — otherwise the child keeps the process alive after exit
        await onClose()
        return
    }
    // ink is lazy-loaded: its layout engine (yoga-layout) fetches a wasm
    // blob through global fetch at import time, so importing it from the CLI
    // entry would break other commands' unit tests and slow their startup.
    const [{ render }, { createElement }, { ReplApp }, { rejectPendingApprovals }] = await Promise.all([
        import('ink'),
        import('react'),
        import('./ui/ReplApp.js'),
        import('./ui/approvalBus.js'),
    ])
    const app = render(createElement(ReplApp, { agent, onClose, closeSession }), { exitOnCtrlC: true })
    await app.waitUntilExit()
    rejectPendingApprovals(new Error('repl closed — approval abandoned'))
    await onClose()
    process.exitCode = 0
}
