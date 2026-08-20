import React, { Fragment, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { TextInput } from '@inkjs/ui'
import type { DeepAgent } from 'deepagents'
import { runStreamedTurn } from '../streamedTurn.js'
import { getPendingApproval, rejectPendingApprovals, requestApproval, subscribeApproval } from './approvalBus.js'
import { ApprovalPrompt } from './ApprovalPrompt.js'
import { StatusFooter } from './StatusFooter.js'
import { ToolCallCard, type ToolCardState } from './ToolCallCard.js'

type TranscriptLine =
    | { kind: 'user'; text: string }
    | { kind: 'reply'; text: string }
    | { kind: 'notice'; text: string }
    | { kind: 'error'; text: string }
    | { kind: 'tool'; callId: string }

export interface ReplAppProps {
    agent: DeepAgent
    onClose: () => Promise<void>
    closeSession?: () => Promise<void>
    /** Fired once, on the first submit — lets the caller cancel startup work. */
    onFirstSubmit?: () => void
}

/** One transcript line, memoized so per-token re-renders skip history. */
const TranscriptLineView = React.memo(function TranscriptLineView({ line, card }: { line: TranscriptLine; card?: ToolCardState }): React.JSX.Element {
    if (line.kind === 'tool') {
        return card ? <ToolCallCard card={card} /> : <Fragment />
    }
    switch (line.kind) {
    case 'user':
        return <Text color="cyan">{line.text}</Text>
    case 'reply':
        return <Text>{line.text}</Text>
    case 'notice':
        return <Text dimColor>{line.text}</Text>
    case 'error':
        return <Text color="red">{line.text}</Text>
    }
})

const ABORT_ERROR = 'repl closed'

/**
 * Interactive agent REPL root. Streams replies token-by-token, renders
 * bordered tool-call cards, shows a y/N approval prompt for
 * `heal=ask` gates, and keeps a sticky status footer. Input is hidden
 * while a turn runs (`still running the previous turn — input ignored
 * (Ctrl-C to stop)`); `close`/`close session`/`reset` close the browser
 * session without exiting; `exit`/`quit` shut down cleanly; Ctrl-C
 * cancels a running turn or exits when idle.
 */
export function ReplApp({ agent, closeSession, onFirstSubmit }: ReplAppProps): React.JSX.Element {
    const { exit } = useApp()
    const [lines, setLines] = useState<TranscriptLine[]>([])
    const [toolCalls, setToolCalls] = useState<Record<string, ToolCardState>>({})
    const [currentReply, setCurrentReply] = useState('')
    const [busy, setBusy] = useState(false)
    const [lastTurnMs, setLastTurnMs] = useState<number | undefined>(undefined)
    const [inputTokens, setInputTokens] = useState(0)
    const [outputTokens, setOutputTokens] = useState(0)
    const pendingApproval = useSyncExternalStore(subscribeApproval, getPendingApproval)
    const abortRef = useRef<AbortController | null>(null)
    const closedRef = useRef(false)

    useEffect(() => {
        setLines([{ kind: 'notice', text: 'wdio-deepagent REPL — type a mission, or "exit" to quit. "close session" closes the browser session.' }])
        // abort the in-flight turn when ink unmounts us (Ctrl-C / exit)
        return () => {
            safeAbort()
        }
    }, [])

    // a throwing abort listener rethrows out of abort() on some Node builds —
    // the in-flight langgraph stream rejects via signal.reason instead of
    // crashing the unmount
    const safeAbort = () => {
        try {
            abortRef.current?.abort()
        } catch {
            // rejection handled by runTurn's AbortError catch
        }
    }

    const cancelTurn = () => {
        safeAbort()
        rejectPendingApprovals(new Error('turn cancelled'))
    }

    const shutdown = () => {
        if (closedRef.current) {
            return
        }
        closedRef.current = true
        safeAbort()
        rejectPendingApprovals(new Error(`${ABORT_ERROR} — approval abandoned`))
        exit()
    }

    const runTurn = async (text: string) => {
        setBusy(true)
        setLines((prev) => [...prev, { kind: 'user', text: `> ${text}` }])
        let acc = ''
        setCurrentReply('')
        const startedAt = Date.now()
        const ac = new AbortController()
        abortRef.current = ac
        try {
            await runStreamedTurn(agent, text, {
                resolveInterrupt: requestApproval,
                onToken: (delta) => {
                    acc += delta
                    setCurrentReply(acc)
                },
                onToolCallStart: (call) => {
                    setToolCalls((prev) => ({
                        ...prev,
                        [call.callId]: { name: call.name, input: call.input, status: 'running' },
                    }))
                    setLines((prev) => [...prev, { kind: 'tool', callId: call.callId }])
                },
                onToolCallEnd: (call) => {
                    setToolCalls((prev) => ({
                        ...prev,
                        [call.callId]: { ...prev[call.callId], status: call.status, durationMs: call.durationMs, error: call.error, output: call.output },
                    }))
                },
                onUsage: (usage) => {
                    setInputTokens((t) => t + usage.inputTokens)
                    setOutputTokens((t) => t + usage.outputTokens)
                },
                signal: ac.signal,
            })
            if (acc.trim()) {
                setLines((prev) => [...prev, { kind: 'reply', text: acc }])
            }
            setLastTurnMs(Date.now() - startedAt)
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            // shutdown (Ctrl-C / exit) aborts the turn — no error line for that
            if (!(err instanceof Error && (err.name === 'AbortError' || message.includes(ABORT_ERROR)))) {
                setLines((prev) => [...prev, { kind: 'error', text: `turn failed: ${message}` }])
            }
        } finally {
            setBusy(false)
            abortRef.current = null
        }
    }

    const onSubmit = (value: string) => {
        const text = value.trim()
        if (!text) {
            return
        }
        onFirstSubmit?.()
        if (text === 'exit' || text === 'quit') {
            shutdown()
            return
        }
        if (text === 'close' || text === 'close session' || text === 'reset') {
            if (!closeSession) {
                setLines((prev) => [...prev, { kind: 'notice', text: 'no browser session to close' }])
            } else {
                closeSession()
                    .then(() => setLines((prev) => [...prev, { kind: 'notice', text: 'session closed' }]))
                    .catch((err) => setLines((prev) => [...prev, { kind: 'error', text: (err as Error).message }]))
            }
            return
        }
        runTurn(text)
    }

    // busy: swallow keystrokes so mid-turn typing is ignored, not buffered,
    // except Ctrl-C which cancels the turn (exitOnCtrlC: false delivers it
    // here as ('c', { ctrl: true })). idle: Ctrl-C exits; TextInput handles
    // everything else.
    useInput((input, key) => {
        if (!key.ctrl || input !== 'c') {
            return
        }
        if (busy) {
            cancelTurn()
        } else {
            shutdown()
        }
    })

    const footerStatus = pendingApproval ? 'approval' : busy ? 'running' : 'idle'

    return (
        <Box flexDirection="column">
            {lines.map((line, i) => (
                <TranscriptLineView
                    key={line.kind === 'tool' ? line.callId : `${line.kind}-${i}`}
                    line={line}
                    card={line.kind === 'tool' ? toolCalls[line.callId] : undefined}
                />
            ))}
            {busy && currentReply ? <Text>{currentReply}</Text> : null}
            {pendingApproval ? <ApprovalPrompt request={pendingApproval.request} /> : null}
            {!busy && !pendingApproval ? (
                <TextInput placeholder="wdio> " onSubmit={onSubmit} />
            ) : busy && !pendingApproval ? (
                <Text dimColor>still running the previous turn — input ignored (Ctrl-C to stop)</Text>
            ) : null}
            <StatusFooter status={footerStatus} lastTurnMs={lastTurnMs} inputTokens={inputTokens} outputTokens={outputTokens} />
        </Box>
    )
}

/**
 * React error boundary keeping a Ctrl-C exit path alive when the tree
 * throws: ink's ErrorOverview registers no input handler, so with
 * exitOnCtrlC: false a crashed render would leave the REPL unkillable.
 */
export class ReplAppErrorBoundary extends React.Component<{ children: React.ReactNode }, { errored: boolean }> {
    state = { errored: false }

    static getDerivedStateFromError(): { errored: boolean } {
        return { errored: true }
    }

    render(): React.ReactNode {
        return this.state.errored ? <CrashFallback /> : this.props.children
    }
}

function CrashFallback(): React.JSX.Element {
    const { exit } = useApp()
    useInput((input, key) => {
        if (key.ctrl && input === 'c') {
            exit()
        }
    })
    return (
        <Box flexDirection="column">
            <Text color="red">[@wdio/deepagent] the REPL UI crashed — press Ctrl-C to exit</Text>
        </Box>
    )
}
