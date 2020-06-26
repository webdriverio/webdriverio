/**
 * Always respond with same overwrite.
 *
 * <example>
    :addValue.js
    it('should demonstrate the addValue command', () => {
        const mock = await browser.network.mock('/todos')
        mock.respond([{
            title: 'Injected Todo',
            order: null,
            completed: false,
            url: "http://todo-backend-express-knex.herokuapp.com/916"
        }])
    })
 * </example>
 *
 * @alias mock.respond
 * @param {*} overwrites  payload to overwrite the response
 * @param {*} params      additional respond parameters to overwrite
 */
// actual implementation is located in packages/webdriverio/src/utils/interception
