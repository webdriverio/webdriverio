# XVFB E2E Tests

This directory contains end-to-end tests for the WebDriverIO xvfb integration functionality.

## Test Structure

### Test Scenarios

1. **Base Install Test** (`base-install.e2e.ts`)
   - Tests xvfb auto-installation on base systems
   - Verifies package manager detection and installation
   - Confirms xvfb-run becomes available after installation

2. **Existing Installation Test** (`existing-xvfb.e2e.ts`)
   - Tests xvfb detection on systems with pre-installed xvfb
   - Verifies no unnecessary installation attempts
   - Confirms ProcessFactory integration works correctly

### Docker Containers

Each test scenario runs in multiple Linux distributions:

- **Ubuntu 24.04**: Base and with-xvfb variants
- **Debian 12**: Base and with-xvfb variants
- **Fedora 40**: Base and with-xvfb variants
- **Rocky Linux 9**: Base and with-xvfb variants (CentOS replacement)
- **CentOS Stream 9**: Base and with-xvfb variants (upstream RHEL)
- **Arch Linux**: Base and with-xvfb variants
- **SUSE Leap 15.6**: Base and with-xvfb variants
- **Alpine 3.20**: Base and with-xvfb variants

### Configuration

- `wdio.conf.ts`: WebDriverIO configuration for xvfb tests
- Uses headless Chrome to avoid display dependencies
- Configured for local runner to test xvfb integration

## Running Tests

### Locally (requires Docker)

```bash
# Run all xvfb E2E tests
cd e2e
pnpm test:xvfb

# Run specific scenario
pnpm test:xvfb:base     # Base installation test
pnpm test:xvfb:existing # Existing installation test
```

### In CI/CD

Tests automatically run via GitHub Actions on:
- Push to main branch
- Pull requests affecting xvfb or local-runner packages

The workflow creates Docker containers for each distribution/scenario combination and runs the appropriate tests.

## Test Matrix

| Distribution    | Version | Base System  | With XVFB |
|----------------|---------|--------------|-----------|
| Ubuntu         | 24.04   | ✅           | ✅        |
| Debian         | 12      | ✅           | ✅        |
| Fedora         | 40      | ✅           | ✅        |
| Rocky Linux    | 9       | ✅           | ✅        |
| CentOS Stream  | 9       | ✅           | ✅        |
| Arch Linux     | latest  | ✅           | ✅        |
| SUSE Leap      | 15.6    | ✅           | ✅        |
| Alpine         | 3.20    | ✅           | ✅        |

## What These Tests Verify

### Base Installation Scenario
- ✅ Platform detection works correctly
- ✅ `xvfb.shouldRun()` returns `true` on Linux
- ✅ `xvfb-run` is initially not available
- ✅ `xvfb.init()` triggers package installation
- ✅ Correct package manager is detected and used
- ✅ `xvfb-run` becomes available after installation
- ✅ ProcessFactory uses spawn path with xvfb-run
- ✅ Error handling for unsupported distributions

### Existing Installation Scenario  
- ✅ `xvfb-run` is detected as pre-installed
- ✅ No installation commands are executed
- ✅ `xvfb.init()` succeeds immediately
- ✅ ProcessFactory integration works correctly
- ✅ Commands can be executed under xvfb-run
- ✅ Cross-platform behavior is correct

## Architecture Integration

These tests verify the complete integration chain:
1. `XvfbManager` - Platform detection and xvfb-run management
2. `ProcessFactory` - Process creation with/without xvfb-run
3. `LocalRunner` - High-level runner integration
4. Actual command execution under xvfb

## Debugging

Enable debug logging:
```bash
WDIO_LOG_LEVEL=debug pnpm test:xvfb
```

Test artifacts are uploaded on failure and include:
- Test logs
- Screenshots (if any)
- Container execution logs