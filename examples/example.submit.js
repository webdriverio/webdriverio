var client = require("webdriverjs").remote();

client
    .init()
    .url("http://www.google.com")
    .setValue("#lst-ib", "webdriver")
    .submitForm("#tsf")
    .end();



