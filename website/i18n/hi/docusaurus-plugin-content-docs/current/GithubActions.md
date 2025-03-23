---
id: githubactions
title: जीथब क्रियाएँ
---

If your repository is hosted on Github, you can use [Github Actions](https://docs.github.com/en/actions) to run your tests on Github's infrastructure.

1. every time you push changes
2. प्रत्येक पुल अनुरोध निर्माण पर
3. निर्धारित समय पर
4. मैनुअल ट्रिगर द्वारा

अपने रिपॉजिटरी के रूट में, एक `.github/workflows` डायरेक्टरी बनाएं। एक Yaml फ़ाइल जोड़ें, उदाहरण के लिए `.github/workflows/ci.yaml`। वहां आप कॉन्फ़िगर करेंगे कि अपने परीक्षण कैसे चलाएं।

संदर्भ कार्यान्वयन के लिए [चमेली-बॉयलरप्लेट](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) देखें, और [नमूना परीक्षण](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI)चलता है।

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

Find out in the [Github Docs](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow?tool=cli) on more information about creating workflow files.
