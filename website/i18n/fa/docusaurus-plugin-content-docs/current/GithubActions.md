---
id: githubactions
title: Github Actions
---

اگر مخزن شما در Github میزبانی می شود، می توانید از [Github Actions](https://docs.github.com/en/actions/getting-started-with-github-actions/about-github-actions#about-github-actions) برای اجرای آزمایش های خود در زیرساخت Github استفاده کنید.

1. هر بار که تغییرات را push می‌کنید
2. در هر ایجاد درخواست pull
3. در زمان مقرر
4. توسط یک ماشه دستی

در ریشه مخزن خود، یک دایرکتوری `.github/workflows` ایجاد کنید. یک فایل Yaml اضافه کنید، برای مثال `/workflows/ci.yaml`. در آنجا نحوه اجرای تست های خود را پیکربندی خواهید کرد.

برای اجرای مرجع به [jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) و [اجرا های تست نمونه](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI) مراجعه کنید.

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

در [Github Docs](https://docs.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow#creating-a-workflow-file) اطلاعات بیشتری در مورد ایجاد فایل های workflow می‌یابید.
