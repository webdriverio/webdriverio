/**
 * Created with JetBrains PhpStorm.
 * User: nicolaibilibin
 * Date: 6/3/12
 * Time: 11:43 PM
 * To change this template use File | Settings | File Templates.
 */
var webdriverjs = require('webdriverjs');
var client;

function main() {

    client = webdriverjs.remote();

    //client = webdriverjs.remote({desiredCapabilities:{browserName:"chrome"}});
    client
        .init()
        .url('http://wdjstest.local/clicktest.html')
        .click("#TestButton")
        .isVisible("#TestButton", function(found){
            if(found)
            {
                client.click("#TestButton");
                console.log("FOUND");
            }
            else
            {
                console.log("NOT FOUND");
            }
        })
}

main();
