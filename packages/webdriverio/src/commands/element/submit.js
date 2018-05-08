/**
 *
 * Submits a form found by given selector. The submit command may also be applied
 * to any element that is a descendant of a `<form>` element.
 *
 * <example>
    :index.html
    <form action="/form.php" method="post" id="loginForm">
        <label for="username">User:</label>
        <input type="text" name="username" id="username">
        <label for="password">Password:</label>
        <input type="password" name="password" id="password">
        <input type="submit" value="Login">
    </form>
    :submitForm.js
    it('should submit login form', function () {
        browser.setValue('#username', 'foobar');
        browser.setValue('#password', 'test123');
        browser.submitForm('#loginForm');
    });
 * </example>
 *
 * @alias browser.submitForm
 * @param {String} selector form element
 * @uses protocol/element, protocol/submit
 * @type action
 *
 */

export default async function submit () {
    /**
     * if not WebDriver protocol use jsonwp which has a submit command
     */
    if (!this.isW3C) {
        return this.elementSubmit(this.elementId)
    }

    /**
     * otherwise find submit button within form (this scope) and click it
     */
    const submitBtn = await this.$('*[type="submit"]')
    return submitBtn.click()
}
