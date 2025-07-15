# @wdio/rpc

WebdriverIO internal RPC communication layer powered by birpc.

This package provides type-safe, bi-directional RPC communication between the main test runner and worker processes, as well as between the browser runner and test runner.

## Features

- **Type Safety**: All IPC messages are strictly typed using TypeScript
- **Bi-directional Communication**: Support for both client-to-server and server-to-client RPC calls
- **Error Handling**: Robust error handling with customizable error callbacks
- **Performance Optimized**: Efficient message handling with minimal overhead
- **Backward Compatible**: Maintains compatibility with existing WebdriverIO IPC system

## Architecture

The RPC system consists of two main components:

### Server Functions
Functions exposed by the test runner process that can be called from workers and browser runners:

- `sessionStarted()` - Handle session initialization
- `sessionEnded()` - Handle session cleanup
- `sessionMetadata()` - Manage session metadata
- `testFrameworkInitMessage()` - Initialize test framework
- `errorMessage()` - Handle error reporting
- `snapshotResults()` - Process snapshot results
- `printFailureMessage()` - Handle failure messages
- `workerEvent()` - Process worker events
- `workerResponse()` - Handle worker responses

### Client Functions
Functions exposed by the test environment that can be called by the main runner:

- `consoleMessage()` - Handle console output
- `commandResponseMessage()` - Process command responses
- `hookResultMessage()` - Handle hook results
- `expectResponseMessage()` - Process expectation responses
- `coverageMap()` - Handle coverage data
- `runCommand()` - Execute commands
- `triggerHook()` - Trigger test hooks
- `expectRequest()` - Handle expectation requests
- `expectMatchersRequest()` - Process matcher requests
- `browserTestResult()` - Handle browser test results

## Usage

### Basic Setup

```typescript
import { createClientRpc, createServerRpc } from '@wdio/rpc'

// Create server RPC instance
const serverRpc = createServerRpc({
    sessionStarted: (data) => {
        console.log('Session started:', data.content.sessionId)
    },
    sessionEnded: (data) => {
        console.log('Session ended:', data.cid)
    }
})

// Create client RPC instance
const clientRpc = createClientRpc({
    consoleMessage: (data) => {
        console.log('Console:', data.args)
    },
    runCommand: async (data) => {
        // Execute command and return result
        return 'command result'
    }
})
```

### With Error Handling

```typescript
import { createClientRpc } from '@wdio/rpc'

const clientRpc = createClientRpc(
    {
        consoleMessage: (data) => {
            console.log('Console:', data.args)
        }
    },
    {
        onError: (error) => {
            console.error('RPC Error:', error.message)
            // Handle error appropriately
        },
        timeout: 5000,
        retries: 3
    }
)
```

### Integration with WebdriverIO

The RPC system is automatically integrated into WebdriverIO's architecture:

#### Browser Runner Integration
```typescript
import { createServerRpc } from '@wdio/rpc'
// Note: ServerWorkerCommunicator is a WebdriverIO internal utility, not exported by @wdio/rpc.
// For demonstration, you can imagine it as:
// class ServerWorkerCommunicator { constructor(config) { /* ... */ } }

const communicator = new ServerWorkerCommunicator(config)
communicator.register(server, worker)

// RPC handlers are automatically set up for:
// - Session management
// - Worker communication
// - Coverage collection
// - Custom commands
```

> **Note:**
> `ServerWorkerCommunicator` is a WebdriverIO internal utility used for managing communication between the test runner and worker processes. It is not exported by `@wdio/rpc`. In your own implementation, you may need to provide a similar communicator or use the WebdriverIO-provided one if available.

#### Test Runner Integration
```typescript
// In test runner
import { createClientRpc } from '@wdio/rpc'

const framework = new BrowserFramework(cid, config, specs, reporter)
// RPC is automatically configured for:
// - Hook execution
// - Command execution
// - Expectation handling
// - Console message handling
```

## Message Flow

```
┌──────────────────────────────┐    RPC Messages    ┌──────────────────────────────┐
│   Test Runner (Node.js RPC) │ ◄────────────────► │  Browser Runner (Browser RPC)│
│   (Server)                  │                    │    (Client)                  │
└──────────────────────────────┘                    └──────────────────────────────┘
         │                                               │
         │                                               │
         ▼                                               ▼
┌──────────────────────────────┐                    ┌──────────────────────────────┐
│   Worker Process            │                    │   Browser Environment        │
└──────────────────────────────┘                    └──────────────────────────────┘
```

**Implementation file references:**
- **Test Runner (Node.js RPC):** [`src/createServerRpc.ts`](./src/createServerRpc.ts)
- **Browser Runner (Browser RPC):** [`src/createClientRpc.ts`](./src/createClientRpc.ts)
- **Worker Process:** [`src/types.ts` (ServerFunctions)](./src/types.ts)
- **Browser Environment:** [`src/types.ts` (ClientFunctions)](./src/types.ts)

## Migration from Legacy IPC

The new RPC system is backward compatible with the existing IPC system. Here's how to migrate:

### Before (Legacy IPC)
```typescript
// Direct process.send usage
process.send({
    type: IPC_MESSAGE_TYPES.sessionStartedMessage,
    value: {
        origin: 'worker',
        name: 'sessionStarted',
        content: sessionData
    }
})
```

### After (RPC)
```typescript
// Type-safe RPC calls
await serverRpc.sessionStarted({
    origin: 'worker',
    name: 'sessionStarted',
    content: sessionData
})
```

### Benefits of Migration

1. **Type Safety**: Compile-time checking of message structure
2. **Better Error Handling**: Structured error handling with callbacks
3. **Improved Performance**: Optimized message serialization
4. **Easier Testing**: Mockable RPC interfaces for unit testing
5. **Future Extensibility**: Easy to add new RPC methods

## Configuration Options

### RpcOptions Interface

```typescript
interface RpcOptions {
    timeout?: number        // Message timeout in milliseconds
    retries?: number        // Number of retry attempts
    onError?: (error: Error) => void  // Error callback function
}
```

### Default Values

- `timeout`: No default (uses birpc defaults)
- `retries`: No default (uses birpc defaults)
- `onError`: No default (errors are thrown)

## Testing

The package includes comprehensive tests:

```bash
# Run unit tests
npx vitest packages/wdio-rpc/test --run

# Run integration tests
npx vitest packages/wdio-rpc/test/integration.test.ts --run

# Run performance tests
npx vitest packages/wdio-rpc/test/performance.test.ts --run
```

### Test Coverage

- ✅ Unit tests for RPC creation and configuration
- ✅ Integration tests for session lifecycle
- ✅ Performance tests for high-volume message handling
- ✅ Error handling tests
- ✅ Memory usage tests
- ✅ Concurrent connection tests

## Performance Characteristics

- **Message Throughput**: >1000 messages/second
- **Memory Usage**: <50MB for 5000 messages
- **Latency**: <1ms per message
- **Concurrent Connections**: Supports 10+ simultaneous connections

## Troubleshooting

### Common Issues

1. **"process.send not available"**
   - Ensure the code is running in a Node.js process with IPC enabled
   - Check that the process was spawned with `stdio: ['inherit', 'pipe', 'pipe', 'ipc']`

2. **Type Errors**
   - Verify that message payloads match the expected TypeScript interfaces
   - Check that IPC_MESSAGE_TYPES enum values are correct

3. **Performance Issues**
   - Monitor message volume and consider batching
   - Check for memory leaks in long-running processes
   - Use the performance tests to benchmark your use case

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=@wdio/rpc:* npm test
```

## Contributing

When adding new RPC methods:

1. Update the `ServerFunctions` or `ClientFunctions` interface in `types.ts`
2. Add corresponding message types to `@wdio/types`
3. Update integration tests
4. Add performance tests if needed
5. Update documentation

## License

MIT License - see [LICENSE](LICENSE) file for details. 