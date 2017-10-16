module.exports = {
  searchWebdriverIO: function (searchString) {
      return this
        .url('http://webdriver.io')
        .setValue('.ds-input', searchString)
        .pause(1000)
        .keys(['Enter']) //press Enter Key
        .pause(1000);
  }
};
