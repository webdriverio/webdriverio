---
id: wdiocommands
title: WDIO Commands
---
This flowchart provides a high level overview of the @wdio/cli run, repl, config and install commands.
<style type="text/css">
    .toggle {
        margin: auto;
        text-align: center;
    }
</style>
<div>
    <div class="flowcharttogglemenu">
        <span>[</span>
        <a class="flowcharttogglelink" onclick="createFlowChart(runRepl)">run and repl commands</a>
        <span>|</span>
        <a class="flowcharttogglelink" onclick="createFlowChart(installConfig)">install and config commands</a>
        <span>]</span>
    </div>
    <div id="flowChartGraphDiv"></div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/8.3.1/mermaid.min.js"></script>
<script src="/js/helper.js"></script>
<script>
    var runRepl = `graph TD
        REPLCOMMAND[repl]-->
        CREATESESSION[Create a new Webdriver session<br>using webdriverio remote]-->
        ADDGLOBALS["Add browser, $, and $$<br>to global scope"]-->
        LOADREPL[Load the REPL by calling the<br>WebdriverIO debug command]-->
        EXITREPL[Exit when REPL closed]
        STARTWDIO(Execute wdio without command argument<br>or using wdio run.)-->
        WDIOMISSING{wdio.conf.js found?}
        WDIOMISSING-->|Yes|ISWATCHMODE{"Is --watch param set?"}
        ISWATCHMODE-->|Yes|RUNLAUNCHERINWATCHMODE[Run watcher in launch mode]
        ISWATCHMODE-->|No|LAUNCHTESTRUNNER[Launch test runner. See launch test<br>runner flowchart fore more info]
        WDIOMISSING-->|No|SETUPWIZARD[Ask if user wants<br>to create a wdio config file]`;
    var installConfig = `graph TD
        INSTALLCOMMAND[install]-->
        TYPENAMESUPPORTED{Is type and name<br>supported?}
        TYPENAMESUPPORTED-->|No|ERROR[Throw error message]
        TYPENAMESUPPORTED-->|Yes|INSTALLPACKAGE[Install package]
        INSTALLPACKAGE-->ADDSERVICEREPORTER[Add services and<br>reporters to wdio.conf.js]
        CONFIGCOMMAND[config]-->
        EXECUTEWIZARD[Execute setup wizard]-->
        QUESTIONNAIRE[Run questionaire, store<br>answers package variables.]-->
        SYNCMODE{executionMode<br>       is sync?}
        SYNCMODE-->|Yes|INSTALLWDIOSYNC["Install<br>@wdio/sync"]
        INSTALLWDIOSYNC-->YARNCHECK["If --yarn, Install packages using<br>yarn, otherwise use npm"]
        YARNCHECK-->CREATEWDIOCONFIG["Create wdio.conf.js"]   
        SYNCMODE-->|No|ASYNCMODE["Do not install<br>@wdio/sync"]
        ASYNCMODE-->CREATEWDIOCONFIG`;
    (function(){
        createFlowChart(runRepl);
    })();
</script>