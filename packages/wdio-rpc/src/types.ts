// ───────────────────────────────────────────────
// IPC Message-Based RPC Interfaces
// ───────────────────────────────────────────────
import type { IPCMessageValue, IPC_MESSAGE_TYPES } from '@wdio/types'

/**
 * Functions exposed by the worker process to the runner.
 * These are called from the runner using `rpc.sessionStarted(...)`, etc.
 */
export interface WorkerFunctions {
    /** Notify that the session has started */
    sessionStarted(data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.sessionStartedMessage]): void

    /** Notify that the session has ended */
    sessionEnded(data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.sessionEnded]): void

    /** Send snapshot test results */
    snapshotResults(data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.snapshotResultMessage]): void

    /** Send failure information for a test or hook */
    printFailureMessage(data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.printFailureMessage]): void

    /** Send a general error message from the worker */
    errorMessage(data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.errorMessage]): void

    /** Notify that the test framework has been initialized */
    testFrameworkInitMessage(data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.testFrameworkInitMessage]): void
}

// ───────────────────────────────────────────────
// WebSocket Message-Based RPC Interfaces
// ───────────────────────────────────────────────
import type { WS_MESSAGE_TYPES, WSMessageValue } from '@wdio/types'

/**
 * Functions exposed by the browser runner to the main process.
 * These are emitted via WebSocket from browser → runner.
 */
export interface BrowserRunnerFunctions {
    /** Forward a console log message from the browser */
    consoleMessage(data: WSMessageValue[typeof WS_MESSAGE_TYPES.consoleMessage]): void

    /** Send a response from a previously executed browser command */
    commandResponseMessage(data: WSMessageValue[typeof WS_MESSAGE_TYPES.commandResponseMessage]): void

    /** Report the result of a triggered hook */
    hookResultMessage(data: WSMessageValue[typeof WS_MESSAGE_TYPES.hookResultMessage]): void

    /** Send result from an expectation/matcher assertion */
    expectResponseMessage(data: WSMessageValue[typeof WS_MESSAGE_TYPES.expectResponseMessage]): void

    /** Send the collected coverage data */
    coverageMap(data: WSMessageValue[typeof WS_MESSAGE_TYPES.coverageMap]): void
}

/**
 * Functions exposed by the main runner to the worker or browser runner.
 * These are called from the worker/browser → runner.
 */
export interface RunnerFunctions {
    /** Instruct the runner to execute a WebDriver command */
    runCommand(data: WSMessageValue[typeof WS_MESSAGE_TYPES.commandRequestMessage]): Promise<unknown>

    /** Trigger a hook (e.g. beforeTest, afterTest) */
    triggerHook(data: WSMessageValue[typeof WS_MESSAGE_TYPES.hookTriggerMessage]): Promise<unknown>

    /** Run an assertion using a registered matcher */
    expectRequest(data: WSMessageValue[typeof WS_MESSAGE_TYPES.expectRequestMessage]): Promise<unknown>

    /** Get all available matchers (e.g. toBeVisible, toHaveText) */
    expectMatchersRequest(): WSMessageValue[typeof WS_MESSAGE_TYPES.expectMatchersResponse]
}
