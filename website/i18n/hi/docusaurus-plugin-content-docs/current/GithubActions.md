---
id: githubactions
title: जीथब क्रियाएँ
---

यदि आपकी रिपॉजिटरी को जीथब पर होस्ट किया गया है, तो आप जीथब के बुनियादी ढांचे पर अपने परीक्षण चलाने के लिए [जीथब एक्शन](https://docs.github.com/en/actions/getting-started-with-github-actions/about-github-actions#about-github-actions) का उपयोग कर सकते हैं।

1. हर बार जब आप परिवर्तनों को दबाते हैं
2. प्रत्येक पुल अनुरोध निर्माण पर
3. निर्धारित समय पर
4. मैनुअल ट्रिगर द्वारा

अपने रिपॉजिटरी के रूट में, एक `.github/workflows` डायरेक्टरी बनाएं। एक Yaml फ़ाइल जोड़ें, उदाहरण के लिए `.github/workflows/ci.yaml`। वहां आप कॉन्फ़िगर करेंगे कि अपने परीक्षण कैसे चलाएं।

संदर्भ कार्यान्वयन के लिए [चमेली-बॉयलरप्लेट](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) देखें, और [नमूना परीक्षण](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI)चलता है।

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

कार्यप्रवाह फ़ाइलें बनाने के बारे में अधिक जानकारी के बारे में [Github दस्तावेज़](https://docs.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow#creating-a-workflow-file) में पता करें।
