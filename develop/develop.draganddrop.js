var client = require("webdriverjs").remote();

client
    .init()
    .url("http://wdjstest.local/")
    .dragAndDrop("#item1", "#dropContainer", function(result)
        {
            console.log("DROPPED");
        })
    .end();
   

