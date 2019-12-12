---
id: testexecution
title: Test Execution
---
This flowchart explains the test execution process and the interaction between @wdio/runner and the most of the other WebdriverIO packages.
<div id="flowChartGraphDivContainer"></div>
<script src="https://unpkg.com/mermaid@8.4.3/dist/mermaid.min.js"></script>
<script src="/js/flowchart.js"></script>
<script>
    var setupTest = `
    graph TD
        START("@wdio/runner:index called from<br>child process via a run message.")-->
        EXECUTERUN["Execute @wdio/runner:index run()."]-->
        SETUPREPORTER["Initialise BaseReporter object which creates a new<br>@wdio/runner reporter instance.All reporters listed<br>in the wdio.conf.js reporters property are initialised."]-->
        INITTESTFRAMEWORK["Test framework from the wdio.conf. js property is<br>initialised usingthe @wdio/utils initialisePlugin method.<br> <br>Supported frameworks include @wdio/mocha-framework,<br>@wdio/cucumber-framework and @wdio/jasmine-framework."]-->
        INITSERVICES["Initialise services"]-->
        RUNEFORESESSIONHOOK[Run wdio.conf.js beforeSession hook.]-->
        INITSESSION["Call @wdio/runner:index _initSession.<br>@wdio/runner:utils initialiseInstance<br>calls webdriverio:index.js remote()."]-->
        ISPROTOCOLWEBDRIVER{"Is protocol<br>webdriver?"}
        ISPROTOCOLWEBDRIVER-->|Yes|WEBDRIVER
        ISPROTOCOLWEBDRIVER-->|No|DEVTOOLS
        WEBDRIVER["Call webdriver:index newSession<br>1. Start Webdriver session.<br>2. Get protocol commands.<br>3. Create webdriver monad with<br>protocol arguments.<br>4. Return monad session<br>instance to caller."]-->RUNNERRUN
        DEVTOOLS["Create puppeteer instance.<br>Return session instance to caller."]-->RUNNERRUN
        RUNNERRUN["Store instance in<br>global browser variable."]-->
        SETWATCHMODEFLAG["Set watch mode flag"]-->
        INITCOMPLETE[Initialisation successful, send runner:start message to reporter.]-->
        KICKOFFTESTS["Kick off tests in framework by calling the framework's run<br>method, e.g. @wdio/mocha-framework:index run()."]-->
        WAITFORTESTTOFINISH[Wait for test to finish. If watch mode keep session open.]-->
        SENDRESULTS[Send results to reporter instance<br>for processing.]-->
        INTERFACE["@wdio/cli:interface printSummary() called<br>Test results printed to terminal"]-->
        KILLWORKERSESSION[Kill worker session.]      
    `;
    (function(){
        createFlowChart(setupTest);
    })();
</script>