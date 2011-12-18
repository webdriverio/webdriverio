var assert = require("assert");
var client = require("webdriverjs").remote({
        host: "192.167.5.125"
    });

client
   .init()
   .url("http://localhost/projects/webdriverjs-testsite")
   .getTitle()
   .end();

var counter = 0;
setInterval(function()
{
    console.log(counter++);
}, 1000)