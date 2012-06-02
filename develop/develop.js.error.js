var client = require("webdriverjs").remote();

client
    .init()
    .url("http://wdjstest.local/jserror.html")
    .session(function(result) {
        console.log(result);
    })
    //.end();


