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

ஒர்க்கர் செயல்முறையை அடையாளம் காண உதவும் தனித்துவமான ஐடி. இது `{number}-{number}` வடிவத்தைக் கொண்டுள்ளது, இதில் முதல் எண் கேப்பபிலிட்டியைக் குறிக்கிறது மற்றும் இரண்டாவது கேப்பபிலிட்டி இயங்கும் ஸ்பெக் பைல், எ.கா. `0-5` என்பது முதல் கேப்பபிலிட்டிக்காக 6வது ஸ்பெக் பைலை இயக்கும் ஒர்க்கரைக் குறிக்கிறது.
