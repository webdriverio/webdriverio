var client = require("webdriverjs").remote();

client
   .init()
   .url("http://www.google.com")
   .getText("h1")
   .end();


