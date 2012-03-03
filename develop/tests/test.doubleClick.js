var assert = require("assert");
var client = require("webdriverjs").remote();

client
   .init()
   .url("http://localhost/projects/webdriverjs-testsite")
   .doubleClick("#extra")
   .end();


