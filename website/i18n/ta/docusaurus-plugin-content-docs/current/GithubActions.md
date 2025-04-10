---
id: githubactions
title: Github Actions
---

If your repository is hosted on Github, you can use [Github Actions](https://docs.github.com/en/actions) to run your tests on Github's infrastructure.

1. every time you push changes
2. ஒவ்வொரு இழுப்பு கோரிக்கை உருவாக்கத்திலும்
3. திட்டமிட்ட நேரத்தில்
4. மேனுவல் தூண்டுதல் மூலம்

உங்கள் களஞ்சியத்தின் ரூட்டில், `.github/workflows` டைரக்டரியை உருவாக்கவும். Yaml பைலைச் சேர்க்கவும், எடுத்துக்காட்டாக `.github/workflows/ci.yaml`. உங்கள் டெஸ்டுகளை எவ்வாறு இயக்குவது என்பதை அங்கு உள்ளமைப்பீர்கள்.

குறிப்பு செயலாக்கத்திற்கு [jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) ஐப் பார்க்கவும், மற்றும் [sample test runs](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI).

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

Find out in the [Github Docs](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow?tool=cli) on more information about creating workflow files.
