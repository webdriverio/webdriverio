---
id: preact
title: Preact
---

[Preact](https://preactjs.com/) 是 React 的轻量级替代框架，具有相同的现代 API。 您可以使用 WebdriverIO 及其[浏览器测试节点](/docs/runner#browser-runner)来测试 Preact 组件。

## 设置

要在您的 Preact 项目中设置 WebdriverIO，请按照我们的组件测试文档中的 [说明](/docs/component-testing#set-up) 进行操作。 确保在您的跑步者选项中选择 `preact` 作为预设，例如：

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'preact'
    }],
    // ...
}
```

:::info

如果您已经在使用 [Vite](https://vitejs.dev/) 作为开发服务器，您也可以在 WebdriverIO 配置中的 `vite.config.ts` 中重新使用您的配置。 有关详细信息，请参阅 [runner options](/docs/runner#runner-options)中的 `viteConfig`.

:::

React 预设需要安装 `@preact/preset-vite`。 我们还建议使用 [Testing Library](https://testing-library.com/) 将组件呈现到测试页面中。 因此，您需要安装以下附加依赖项：

```sh npm2yarn
npm install --save-dev @testing-library/preact @preact/preset-vite
```

然后，您可以通过运行以下命令开始测试：

```sh
npx wdio run ./wdio.conf.js
```

## 编写测试

假设您有以下 Preact 组件：

```tsx title="./components/Component.jsx"
import { h } from 'preact'
import { useState } from 'preact/hooks'

interface Props {
    initialCount: number
}

export function Counter({ initialCount }: Props) {
    const [count, setCount] = useState(initialCount)
    const increment = () => setCount(count + 1)

    return (
        <div>
            Current value: {count}
            <button onClick={increment}>Increment</button>
        </div>
    )
}

```

在您的测试中，使用 `@testing-library/preact` 中的 `render` 方法将组件依附到测试页面。 要与组件交互，我们建议使用更接近真实用户体验的 WebdriverIO 命令，示例如下：

```ts title="app.test.tsx"
import { expect } from 'expect'
import { render, screen } from '@testing-library/preact'

import { Counter } from './components/PreactComponent.js'

describe('Preact Component Testing', () => {
    it('should increment after "Increment" button is clicked', async () => {
        const component = await $(render(<Counter initialCount={5} />))
        await expect(component).toHaveTextContaining('Current value: 5')

        const incrElem = await $(screen.getByText('Increment'))
        await incrElem.click()
        await expect(component).toHaveTextContaining('Current value: 6')
    })
})
```

您可以在我们的[示例仓库](https://github.com/webdriverio/component-testing-examples/tree/main/react-typescript-vite)中找到 Preact 的 WebdriverIO 测试套件的完整示例。
