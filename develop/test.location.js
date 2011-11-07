var client = require("webdriverjs").remote();

client
   .init()
   .url("http://www.google.com")
   .getLocation("input")
   .end();


