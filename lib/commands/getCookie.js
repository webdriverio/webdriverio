/**
 *
 * Retrieve a [cookie](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object)
 * visible to the current page. You can query a specific cookie by providing the cookie name or
 * retrieve all.
 *
 * <example>
    :getCookie.js
    client
        .setCookie({name: 'test', value: '123'})
        .getCookie('test').then(function(cookie) {
            console.log(cookie); // outputs: { name: 'test', value: '123' }
        })
        .getCookie().then(function(cookies) {
            console.log(cookies); // outputs: [{ name: 'test', value: '123' }]
        });
 * </example>
 *
 * @param {String=} name name of requested cookie
 * @returns {Object|null} requested cookie if existing
 *
 * @uses protocol/cookie
 * @type cookie
 *
 */

module.exports = function getCookie (name) {

    /*!
     * paramter check
     */
    if(typeof name !== 'string') {
        name = null;
    }

    return this.cookie().then(function(res) {

        res.value = res.value || [];

        if(typeof name === 'string') {
            return res.value.filter(function(cookie) {
                return cookie.name === name;
            })[0] || null;
        }

        return res.value || (typeof name === 'string' ? null : []);

    });

};