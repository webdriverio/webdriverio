---
id: environment
title: என்விரான்மென்ட் வேறியபல்ஸ்
---

WebdriverIO ஒவ்வொரு ஒர்க்கருக்குள்ளும் பின்வரும் என்விரான்மென்ட் வேறியபல்சுகளை அமைக்கிறது:

## `NODE_ENV`

ஏற்கனவே வேறு ஏதாவது அமைக்கப்படவில்லை எனில் `'test'` ஆக அமைக்கவும்.

## `WDIO_LOG_LEVEL`

தொடர்புடைய விவரங்களுடன் பதிவுகளை எழுத மதிப்புகள் `trace`, `debug`, `info`, `warn`, `error`, `silent` என அமைக்கலாம். `logLevel` மதிப்பைவிட முன்னுரிமை உள்ளது.

## `WDIO_WORKER_ID`

ஒர்க்கர் செயல்முறையை அடையாளம் காண உதவும் தனித்துவமான ஐடி. It has format of `{number}-{number}` where the first number identifies the capability and the second the spec file that capability is running, e.g. `0-5` indicates a worker the first running the 6th spec file for the first capability.
