---
id: globals
title: Globals
---

In your test files, WebdriverIO puts each of these methods and objects into the global environment. You don't have to import anything to use them. However, if you prefer explicit imports, you can do `import { browser, $, $$, expect } from '@wdio/globals'` and set `injectGlobals: false` in your WDIO configuration.

The following global objects are set if not configured otherwise:

- `browser`: WebdriverIO [Browser object](https://webdriver.io/docs/api/browser)
- `driver`: alias to `browser` (used when running mobile tests)
- `multiremotebrowser`: alias to `browser` or `driver` but only set for [Multiremote](/docs/multiremote) sessions
- `$`: command to fetch an element (see more in [API docs](/docs/api/browser/$))
- `$$`: command to fetch elements (see more in [API docs](/docs/api/browser/$$))
- `expect`: WebdriverIO के लिए अभिकथन ढांचा (देखें [एपीआई डॉक्स](/docs/api/expect-webdriverio))

__नोट:__ WebdriverIO का उपयोग किए गए ढांचे (जैसे मोचा या जैस्मीन) का कोई नियंत्रण नहीं है, जब वे अपने पर्यावरण को बूटस्ट्रैप करते समय वैश्विक चर सेट करते हैं।
