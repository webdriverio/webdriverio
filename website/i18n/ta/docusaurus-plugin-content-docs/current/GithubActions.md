---
id: githubactions
title: Github Actions
---

உங்கள் களஞ்சியமானது Github இல் ஹோஸ்ட் செய்யப்பட்டிருந்தால், Github இன் உள்கட்டமைப்பில் உங்கள் டெஸ்டுகளை இயக்க [Github Actions](https://docs.github.com/en/actions/getting-started-with-github-actions/about-github-actions#about-github-actions) பயன்படுத்தலாம்.

1. ஒவ்வொரு முறையும் நீங்கள் மாற்றங்களைப் பகிரும்பொழுது
2. ஒவ்வொரு இழுப்பு கோரிக்கை உருவாக்கத்திலும்
3. திட்டமிட்ட நேரத்தில்
4. மேனுவல் தூண்டுதல் மூலம்

உங்கள் களஞ்சியத்தின் ரூட்டில், `.github/workflows` டைரக்டரியை உருவாக்கவும். Yaml பைலைச் சேர்க்கவும், எடுத்துக்காட்டாக `.github/workflows/ci.yaml`. உங்கள் டெஸ்டுகளை எவ்வாறு இயக்குவது என்பதை அங்கு உள்ளமைப்பீர்கள்.

குறிப்பு செயலாக்கத்திற்கு [jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) ஐப் பார்க்கவும், மற்றும் [sample test runs](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI).

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

ஒர்க்ப்ளோ பைல்களை உருவாக்குவது பற்றிய கூடுதல் தகவல்களை [Github Docs](https://docs.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow#creating-a-workflow-file) இல் கண்டறியவும்.
