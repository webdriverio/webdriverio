---
id: wdiocommands
title: WDIO Commands
---
This flowchart provides an overview for the config, install and repl commands.
<style type="text/css">
.twographs {
    width: 900px;
}
</style>
<div class="mermaid onegraph">
graph TD
    STARTWDIO(Execute wdio)-->
    EXECUTECOMMAND[Execute command]-->
    CONFIGCOMMAND[config]-->
    EXECUTEWIZARD[Execute setup wizard]-->
    QUESTIONNAIRE[Run questionaire, store answers package variables.]-->
    SYNCMODE{executionMode = sync?}
    SYNCMODE-->|No|ASYNCMODE["Do not install @wdio/sync"]
    SYNCMODE-->|Yes|INSTALLWDIOSYNC["Install @wdio/sync"]-->
    YARNCHECK["If --yarn, Install packages using yarn, otherwise use npm"]-->
    CREATEWDIOCONFIG["Create wdio.conf.js"]
    EXECUTECOMMAND-->
    INSTALLCOMMAND[install]-->
    TYPENAMESUPPORTED{Is type and name supported?}
    TYPENAMESUPPORTED-->|No|ERROR[Throw error message]
    TYPENAMESUPPORTED-->|Yes|INSTALLPACKAGE[Install package]
    EXECUTECOMMAND-->
    REPLCOMMAND[repl]-->
    CREATESESSION[Create a new Webdriver session using webdriverio remote]-->
    ADDGLOBALS["Add browser, $, and $$ to global scope"]-->
    LOADREPL[Load the REPL by calling the WebdriverIO debug command]-->
    EXITREPL[Exit when REPL closed]
</div>
<script>
    var config = {
        "startOnLoad":true,
        // Enabling htmlLabels = true will add a large amount of padding to the rect.
        "flowchart": {
            "htmlLabels": false 
        }
    }
    mermaid.initialize(config);
</script>