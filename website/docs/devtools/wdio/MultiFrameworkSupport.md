---
id: multi-framework-support
title: Multi-Framework Support
---

DevTools automatically works with Mocha, Jasmine, and Cucumber without requiring any framework-specific configuration. Simply add the service to your WebDriverIO config and all features work seamlessly regardless of which test framework you're using.

**Supported Frameworks:**
- **Mocha** - Test and suite-level execution with grep filtering
- **Jasmine** - Complete integration with grep-based filtering
- **Cucumber** - Scenario and example-level execution with feature:line targeting

The same debugging interface, test rerunning, and visualization features work consistently across all frameworks.

## Configuration

```js
// wdio.conf.js
export const config = {
    framework: 'mocha', // or 'jasmine' or 'cucumber'
    services: ['devtools'],
    // ...
};
```
