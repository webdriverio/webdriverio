---
id: why-webdriverio
title: ஏன் WebdriverIO?
---

WebdriverIO என்பது நவீன இணையம் மற்றும் மொபைல் பயன்பாடுகளைத் தானியங்குபடுத்துவதற்காகக் உருவாக்கப்பட்ட ஒரு முன்னேறுகிற ஆட்டோமேஷன் கட்டமைப்பாகும். இது உங்கள் பயன்பாட்டுடன் தொடர்புகொள்வதை எளிதாக்குகிறது மற்றும் அளவிடக்கூடிய, வலுவான மற்றும் நிலையான டெஸ்ட் தொகுப்பை உருவாக்க உதவும் ப்ளுகின்சுகளின் தொகுப்பை வழங்குகிறது.

இது வடிவமைக்கப்பட்டுள்ளது:

- __Extendable__ - உதவி செயல்பாடுகளைச் சேர்ப்பது அல்லது ஏற்கனவே உள்ள கட்டளைகளின் சிக்கலான தொகுப்புகள் மற்றும் சேர்க்கைகள் __simple__ மற்றும் __really useful__
- __Compatible__ - WebdriverIO ஐ [WebDriver Protocol](https://w3c.github.io/webdriver/) இல் __true cross-browser testing__ மற்றும் [Puppeteer](https://pptr.dev/)ஐப் பயன்படுத்தி Chromium அடிப்படையிலான ஆட்டோமேஷனுக்கான [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) இல் இயக்க முடியும்.
- __Feature Rich__ - உள்ளமைக்கப்பட்ட மற்றும் சமூக ப்ளுகின்சுகள் __easily integrate__ மற்றும் __extend__ உங்கள் தேவைகளைப் பூர்த்தி செய்ய அனுமதிக்கிறது.

தானியங்கு செய்ய WebdriverIO ஐப் பயன்படுத்தலாம்:

- 🌐 <span>&nbsp;</span> __modern web applications__ ரியாக்ட், வியூ, ஆங்குலர், ஸ்வெல்ட் அல்லது பிற முன்தள கட்டமைப்புகளில் எழுதப்பட்டுள்ளன
- 📱 <span>&nbsp;</span> __ hybrid __ அல்லது __native mobile applications__ எமுலேட்டர்/சிமுலேட்டரில் அல்லது உண்மையான சாதனத்தில் இயங்குகிறது
- 💻 <span>&nbsp;</span> __native desktop applications__ (எ.கா. Electron.js உடன் எழுதப்பட்டது)
- 📦 <span>&nbsp;</span> __unit or component testing__ பிரௌசரின் இணைய காம்போனென்டுகள்

## இணைய தரநிலைகளின் அடிப்படையில்

WebdriverIO ஆனது [WebDriver](https://w3c.github.io/webdriver/) மற்றும் [WebDriver-BiDi](https://github.com/w3c/webdriver-bidi) நெறிமுறையின் சக்தியைப் பயன்படுத்துகிறது, இது அனைத்து பிரௌசர் விற்பனையாளர்களாலும் உருவாக்கப்பட்டு ஆதரிக்கப்படுகிறது மற்றும் உண்மையான அனைத்து பிரௌசர் சோதனை அனுபவத்திற்கு உத்தரவாதம் அளிக்கிறது. பிற ஆட்டோமேஷன் கருவிகள், உண்மையான பயனர்களால் பயன்படுத்தப்படாத மாற்றியமைக்கப்பட்ட பிரௌசர் இயந்திரங்களைப் பதிவிறக்கம் செய்ய வேண்டும் அல்லது JavaScript ஐ உட்செலுத்துவதன் மூலம் பயனர் நடத்தையைப் பின்பற்ற வேண்டும், WebdriverIO ஆட்டோமேஷனுக்கான பொதுவான [properly tested](https://wpt.fyi/results/webdriver/tests?label=experimental&label=master&aligned) தரநிலையை நம்பியுள்ளது மற்றும் தசாப்தங்களுக்கு தன்னுடைய ஆதரவைத் தருகிறது.

Furthermore WebdriverIO has also support for alternative, proprietary automation protocols like [Chrome DevTools](https://chromedevtools.github.io/devtools-protocol/) for debugging and introspection purposes. இது WebDriver அடிப்படையிலான வழக்கமான கட்டளைகள் மற்றும் [Puppeteer](https://pptr.dev/)மூலம் சக்திவாய்ந்த பிரௌசர் தொடர்புகளுக்கு இடையே தடையின்றி மாறுவதற்கு பயனரை அனுமதிக்கிறது.

[Automation Protocols](automationProtocols)இல் உள்ள பிரிவில் இந்த ஆட்டோமேஷன் தரநிலைகளின் வேறுபாடுகளைப் பற்றி மேலும் படிக்கவும்.

## உண்மையான ஓபன் சோர்ஸ்

அமைப்பில் உள்ள பல தன்னியக்க கருவிகளுடன் ஒப்பிடும்போது, WebdriverIO என்பது ஒரு உண்மையான ஓபன் சோர்ஸ் திட்டமாகும், இது திறந்த நிர்வாகத்துடன் இயங்குகிறது மற்றும் [OpenJS Foundation](https://openjsf.org/)எனப்படும் இலாப நோக்கற்ற நிறுவனத்திற்கு சொந்தமானது. இது அனைத்து பங்கேற்பாளர்களின் நலனுக்காகவும் திட்டத்தை வளர்க்கவும் இயக்கவும் பிணைக்கிறது. திட்டக் குழு திறந்த தன்மை மற்றும் ஒத்துழைப்பை மதிக்கிறது மற்றும் பண நலன்களால் இயக்கப்படுவதில்லை.

இது திட்டத்தை எவ்வாறு உருவாக்குகிறது மற்றும் அது எங்குச் செல்ல வேண்டும் என்பதில் சுயாதீனமாக்குகிறது. It allows us to provide free 24/7 support in our [community channel](https://discord.webdriver.io) as we build a sustainable community that supports and learns from each other. கடைசியாக, அதன் [ open governance](https://github.com/webdriverio/webdriverio/blob/main/GOVERNANCE.md)காரணமாகத் திட்டத்தில் பங்களிக்கும் மற்றும் ஈடுபடும் மக்களுக்கு இது நிறைய வாய்ப்புகளை வழங்குகிறது.
