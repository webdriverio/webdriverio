---
id: globals
title: குளோபல்ஸ்
---

உங்கள் டெஸ்ட் பைல்களில், WebdriverIO இந்த மெத்தெட்ஸ் மற்றும் ஆப்ஜெக்ட்டுகள் ஒவ்வொன்றையும் குளோபல் என்விரான்மென்டில் வைக்கிறது. அவற்றைப் பயன்படுத்த நீங்கள் எதையும் இறக்குமதி செய்ய வேண்டியதில்லை. இருப்பினும், நீங்கள் வெளிப்படையான இறக்குமதிகளை விரும்பினால், `import { browser, $, $$, expect } from '@wdio/globals'` and set `injectGlobals: false`ஐ WDIOஇல் காணபிகுர் செய்யலாம்.

வேறுவிதமாகக் காணபிகுர் செய்யப்படாவிட்டால் பின்வரும் குளோபல் ஆப்ஜெக்ட்டுகள் அமைக்கப்படும்:

- `browser`: WebdriverIO [Browser object](https://webdriver.io/docs/api/browser)
- `driver`: alias to `browser` (used when running mobile tests)
- `multiremotebrowser`: alias to `browser` or `driver` but only set for [Multiremote](/docs/multiremote) sessions
- `$`: command to fetch an element ([API docs](/docs/api/browser/$)இல் மேலும் பார்க்கவும்)
- `$$`: command to fetch elements ([API docs](/docs/api/browser/$$)இல் மேலும் பார்க்கவும்)
- `expect`: assertion framework for WebdriverIO ([ஸAPI docs](/docs/api/expect-webdriverio)ஐப் பார்க்கவும்)

__ Note:__ WebdriverIO ஆனது பயன்படுத்தப்பட்ட பிரமேஒர்க்கின் (எ.கா. Mocha அல்லது Jasmine) குளோபல் மாறிகளை அவற்றின் என்விரான்மென்டை பூட்ஸ்ட்ராப் செய்யும்போது அமைக்கும் கட்டுப்பாடு இல்லை.
