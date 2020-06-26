/**
 * Only respond once with given overwrite.
 *
 * <example>
    :addValue.js
    it('should demonstrate the addValue command', () => {
        const mock = await browser.network.mock('/todos')
        mock.respondOnce([{
            title: 'Injected Todo',
            order: null,
            completed: false,
            url: "http://todo-backend-express-knex.herokuapp.com/916"
        }])
    })
 * </example>
 *
 * @alias mock.respondOnce
 * @param {*} overwrites  payload to overwrite the response
 * @param {*} params      additional respond parameters to overwrite
 */
// actual implementation is located in packages/webdriverio/src/utils/interception
