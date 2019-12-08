---
id: testexecution
title: Test Execution
---
This flowchart explains the test execution process and the interaction between @wdio/runner and the most of the other WebdriverIO packages.
<div>
    <div class="flowcharttogglemenu">
        <span>[</span>
        <a class="flowcharttogglelink" onclick="createFlowChart(setupTest)">Setup test</a>
        <span>|</span>
        <a class="flowcharttogglelink" onclick="createFlowChart(runTest)">Run test</a>
        <span>]</span>
    </div>
    <div id="flowChartGraphDiv" style="color: blue; margin-left: auto; margin-right: auto; padding-left: auto; padding-right: auto; text-align: center;"></div>
</div>

<script src="https://unpkg.com/mermaid@8.3.1/dist/mermaid.min.js"></script>
<script src="/js/flowchart.js"></script>
<script>
    var setupTest = `
    graph TD
        START("@wdio/runner:index called from<br>child process via a run message.")-->
        EXECUTERUN["Execute @wdio/runner:index run())."]-->
        PARSECONFIG["Parse config file using an instance of<br>@wdio/config/lib/ConfigParser<br>method.<br>Add to @wdio/runner:index"]-->
        MERGECLIARGS[Merge CLI args and host<br>port changes into config]-->
        SETUPREPORTER["Initialise BaseReporter object which creates a new<br>@wdio/runner reporter instance.All reporters listed<br>in the wdio.conf.js reporters property are initialised."]-->
        INITTESTFRAMEWORK["Test framework from the wdio.conf. js property is<br>initialised usingthe @wdio/utils initialisePlugin method.<br>Supported frameworks are @wdio/mocha-framework,<br>@wdio/cucumber-framework and @wdio/jasmine-framework."]-->
        INITSERVICES["Initialise services"]-->
        RUNEFORESESSIONHOOK[Run wdio.conf.js beforeSession hook.]-->
        INITSESSION[Initialise session TODO DESCRIBE how the webdriver is created and so on, store in browser global variable.]-->
        SYNC['ENTER SYNC UTILS WEBDRIVERIO WEBDRIVERIO CODE HERE ]-->
        SETWATCHMODEFLAG["Set watch mode flag"]-->
        TESTINITCOMPLETE(Test initialization complete)
    `;
    var runTest = `
    graph TD
        INITCOMPLETE[Initialisation successful, send runner:start message to reporter.]-->
        MESSAGECHILDPROCESS[report sessionId and target connection information to worker]-->
        KICKOFFTESTS["Kick off tests in framework by calling the framework's run<br>method, e.g. @wdio/mocha-framework:index run()."]-->
        WAITFORTESTTOFINISH[Wait for test to finish. If watch mode keep session open.]-->
        SENDRESULTS[Send results to reporter instance.]-->
        KILLWORKERSESSION[Kill worker session.]-->
        END(END)
    `;
    (function(){
        createFlowChart(setupTest);
    })();
</script>