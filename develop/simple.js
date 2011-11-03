var client = require("webdriverjs").remote({desiredCapabilities: {
//	browserName: "chrome"
}});

client
   .init()
   .url("http://www.google.com")
   .getText("h1")
   .end();


