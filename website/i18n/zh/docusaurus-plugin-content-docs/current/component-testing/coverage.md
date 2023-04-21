---
id: coverage
title: 代码覆盖
---

WebdriverIO 的浏览器节点支持使用 [`istanbul`](https://istanbul.js.org/) 进行代码覆盖测试。 测试节点将自动根据您的代码生成代码覆盖率报告。

## Setup

要启用代码覆盖率报告，请在 WebdriverIO 的浏览器节点配置中添加类似如下配置：

```js title=wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: process.env.WDIO_PRESET,
        coverage: {
            enabled: true
        }
    }],
    // ...
}
```

您可以了解[其他覆盖选项](/docs/runner#coverage-options)来学习如何按您的需要进行配置。

## 忽略代码

您或许想将部分代码排除在覆盖率报告之外。为此，您可以添加如下解析提示：

- `/* istanbul ignore if */`：忽略下一个 if 语句。
- `/* istanbul ignore else */`：忽略 if 语句的 else 部分。
- `/* istanbul ignore next */`：忽略源代码中的下一部分 (函数、if 语句、类，等等)。
- `/* istanbul ignore file */`：忽略整个源文件 (此提示应放在文件顶部)。

:::info

为避免错误，我们建议您排除测试文件 (如调用  `execute` 或 `executeAsync` 命令的文件)。 若您仍想将其保留在报告中，您需要像如下方式将测试语句排除在代码检测中：

```ts
await browser.execute(/* istanbul ignore next */() => {
    // ...
})
```

:::
