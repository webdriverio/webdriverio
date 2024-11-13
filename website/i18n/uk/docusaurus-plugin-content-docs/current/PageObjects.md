---
id: pageobjects
title: Шаблон Page Object
---

5-та версія WebdriverIO була розроблена з підтримкою Page Object Pattern. Впровадження принципу «елементи як першокласні об'єкти» дозволило створювати великі набори тестів, використовуючи цей патерн.

Для створення об'єктів сторінок не потрібні додаткові пакети. Виявляється, що чисті, сучасні класи надають всі необхідні функції, які нам потрібні:

- успадкування між об’єктами сторінки
- повільне завантаження елементів
- інкапсуляція методів та дій

Мета використання об'єктів сторінок - відокремити будь-яку інформацію про сторінку від самих тестів. В ідеалі, ви повинні зберігати всі селектори або специфічні інструкції, які є унікальними для певної сторінки, в об'єкті сторінки, щоб ви могли запустити свій тест після того, як повністю переробили сторінку.

## Створення Об'єкта Сторінки

Для початку, нам потрібен об'єкт головної сторінки, який ми назвемо `Page.js`. Він буде містити загальні селектори або методи, від яких успадковуватимуться всі об'єкти сторінки.

```js
// Page.js
export default class Page {
    constructor() {
        this.title = 'My Page'
    }

    async open (path) {
        await browser.url(path)
    }
}
```

Ми завжди експортуємо(`export`) екземпляр об'єкта сторінки та ніколи не створюємо його в тесті. Оскільки ми пишемо end-to-end тести, ми завжди розглядаємо сторінку як конструкцію без стану &mdash; так само як кожен HTTP-запит є конструкцією без стану.

Звичайно, браузер може зберігати інформацію про сесію і, відповідно, відображати різні сторінки на основі різних сесій, але це не повинно відображатися в об'єкті сторінки. Такі зміни стану повинні відбуватися у ваших реальних тестах.

Почнімо тестувати першу сторінку. Для демонстрації, як піддослідного кролика, ми використаємо вебсайт [The Internet](http://the-internet.herokuapp.com) від компанії [Elemental Selenium](http://elementalselenium.com). Спробуємо створити приклад об'єкта сторінки для [сторінки входу в систему](http://the-internet.herokuapp.com/login).

## Отримаймо(`Get`) ваші селектори

Перший крок - написати всі важливі селектори, які потрібні в нашому об'єкті `login.page`, як getter-функції:

```js
// login.page.js
import Page from './page'

class LoginPage extends Page {

    get username () { return $('#username') }
    get password () { return $('#password') }
    get submitBtn () { return $('form button[type="submit"]') }
    get flash () { return $('#flash') }
    get headerLinks () { return $$('#header a') }

    async open () {
        await super.open('login')
    }

    async submit () {
        await this.submitBtn.click()
    }

}

export default new LoginPage()
```

Defining selectors in getter functions might look a little weird, but it’s really useful. These functions are evaluated _when you access the property_, not when you generate the object. With that you always request the element before you do an action on it.

## Chaining Commands

WebdriverIO internally remembers the last result of a command. If you chain an element command with an action command, it finds the element from the previous command and uses the result to execute the action. With that you can remove the selector (first parameter) and the command looks as simple as:

```js
await LoginPage.username.setValue('Max Mustermann')
```

Which is basically the same thing as:

```js
let elem = await $('#username')
await elem.setValue('Max Mustermann')
```

or

```js
await $('#username').setValue('Max Mustermann')
```

## Using Page Objects In Your Tests

After you've defined the necessary elements and methods for the page, you can start to write the test for it. All you need to do to use the page object is to `import` (or `require`) it. That's it!

Since you exported an already-created instance of the page object, importing it lets you start using it right away.

If you use an assertion framework, your tests can be even more expressive:

```js
// login.spec.js
import LoginPage from '../pageobjects/login.page'

describe('login form', () => {
    it('should deny access with wrong creds', async () => {
        await LoginPage.open()
        await LoginPage.username.setValue('foo')
        await LoginPage.password.setValue('bar')
        await LoginPage.submit()

        await expect(LoginPage.flash).toHaveText('Your username is invalid!')
    })

    it('should allow access with correct creds', async () => {
        await LoginPage.open()
        await LoginPage.username.setValue('tomsmith')
        await LoginPage.password.setValue('SuperSecretPassword!')
        await LoginPage.submit()

        await expect(LoginPage.flash).toHaveText('You logged into a secure area!')
    })
})
```

From the structural side, it makes sense to separate spec files and page objects into different directories. Additionally you can give each page object the ending: `.page.js`. This makes it more clear that you import a page object.

## Going Further

This is the basic principle of how to write page objects with WebdriverIO. But you can build up way more complex page object structures than this! For example, you might have specific page objects for modals, or split up a huge page object into different classes (each representing a different part of the overall web page) that inherit from the main page object. The pattern really provides a lot of opportunities to separate page information from your tests, which is important to keep your test suite structured and clear in times where the project and number of tests grows.

You can find this example (and even more page object examples) in the [`example` folder](https://github.com/webdriverio/webdriverio/tree/main/examples/pageobject) on GitHub.
