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
}

const ABORT_ERROR = 'repl closed'

/**
 * Interactive agent REPL root. Streams replies token-by-token, renders
 * bordered tool-call cards, shows an arrow-key approval picker for
 * `heal=ask` gates, and keeps a sticky status footer. Input is hidden
 * while a turn runs (`still running the previous turn — input ignored
 * (Ctrl-C to stop)`); `close`/`close session`/`reset` close the browser
 * session without exiting; `exit`/`quit`/Ctrl-C shut down cleanly.
 */
export function ReplApp({ agent, closeSession }: ReplAppProps): React.JSX.Element {
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
    const replyRef = useRef('')
    const closedRef = useRef(false)

    useEffect(() => {
        setLines([{ kind: 'notice', text: 'wdio-deepagent REPL — type a mission, or "exit" to quit. "close session" closes the browser session.' }])
        // abort the in-flight turn when ink unmounts us (Ctrl-C / exit)
        return () => {
            abortRef.current?.abort()
        }
    }, [])

    const shutdown = () => {
        if (closedRef.current) {
            return
        }
        closedRef.current = true
        abortRef.current?.abort()
        rejectPendingApprovals(new Error(`${ABORT_ERROR} — approval abandoned`))
        exit()
    }

    const runTurn = async (text: string) => {
        setBusy(true)
        setLines((prev) => [...prev, { kind: 'user', text: `> ${text}` }])
        replyRef.current = ''
        setCurrentReply('')
        const startedAt = Date.now()
        const ac = new AbortController()
        abortRef.current = ac
        try {
            await runStreamedTurn(agent, text, {
                resolveInterrupt: requestApproval,
                onToken: (delta) => {
                    replyRef.current += delta
                    setCurrentReply(replyRef.current)
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
                        [call.callId]: { ...prev[call.callId], status: call.status, durationMs: call.durationMs, error: call.error },
                    }))
                },
                onUsage: (usage) => {
                    setInputTokens((t) => t + usage.inputTokens)
                    setOutputTokens((t) => t + usage.outputTokens)
                },
                signal: ac.signal,
            })
            if (replyRef.current.trim()) {
                setLines((prev) => [...prev, { kind: 'reply', text: replyRef.current }])
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

    // busy: swallow keystrokes so mid-turn typing is ignored, not buffered.
    // idle: TextInput handles input; nothing to act on here.
    useInput(() => {
        if (busy) {
            return
        }
    })

    const footerStatus = pendingApproval ? 'approval' : busy ? 'running' : 'idle'

    return (
        <Box flexDirection="column">
            {lines.map((line, i) => (
                <Fragment key={i}>
                    {line.kind === 'user' && <Text color="cyan">{line.text}</Text>}
                    {line.kind === 'reply' && <Text>{line.text}</Text>}
                    {line.kind === 'notice' && <Text dimColor>{line.text}</Text>}
                    {line.kind === 'error' && <Text color="red">{line.text}</Text>}
                    {line.kind === 'tool' && toolCalls[line.callId] && <ToolCallCard card={toolCalls[line.callId]} />}
                </Fragment>
            ))}
            {busy && currentReply ? <Text>{currentReply}</Text> : null}
            {pendingApproval ? <ApprovalPrompt request={pendingApproval.request} /> : null}
            {!busy && !pendingApproval ? (
                <TextInput placeholder="wdio> " onSubmit={onSubmit} />
            ) : (
                <Text dimColor>still running the previous turn — input ignored (Ctrl-C to stop)</Text>
            )}
            <StatusFooter status={footerStatus} lastTurnMs={lastTurnMs} inputTokens={inputTokens} outputTokens={outputTokens} />
        </Box>
    )
}
