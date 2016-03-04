module.exports = {
  searchGoogle: function (searchString) {
      return this
        .url('http://www.google.com')
        .click('input[name="q"]')
        .keys(searchString)
        .pause(2000)
        .keys(['Enter']); //press Enter Key
  }
};
