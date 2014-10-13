module.exports = {
  searchGoogle: function () {
        var searchString = arguments[0],
        callback = arguments[1];
    this
        .url('http://www.google.com')
        .click('input[name="q"]')
        .keys([searchString])
        .pause(2000)
        .keys(['\uE006']) //press Enter Key
        .call(callback)
  },
};
