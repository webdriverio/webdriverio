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
    <div id="flowChartGraphDiv"></div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/8.3.1/mermaid.min.js"></script>
<script src="/js/helper.js"></script>
<script>
    var setupTest = `
    graph TD
        START("@wdio/runner index.js called from child process via a run message.")-->
        EXECUTERUN["Execute @wdio/runner index.js run method."]-->
        STOREVARS["Store worker id in cid, specs in specs variable.<br>Store capabilities in caps variable."]-->
        PARSECONFIG["Parse config file using @wdio/config configParser method.<br>Add to @wdio/runner index.js class."]-->
        SETLOGLEVEL[Set log level]-->
        RUNEFORESESSIONHOOK[Run wdio.conf.js beforeSession hook.]-->
        INITSESSION[Initialise session, store in variable named browser.]-->
        SETUPREPORTER["Initialise BaseReporter object. A new instance of the @wdio/runner reporter.js<br>BaseReporter object is created. All reporters listed in the wdio.conf.js reporters<br>property are initialised."]
    `;
    var runTest = `
    graph TD
        INITTEST["Test framework is initialised using the @wdio/utils initialisePlugin method.<br>The test framework defined in the wdio.conf.js framework property.<br>Test frameworks include @wdio/mocha-framework, @wdio/cucumber-framework<br>and @wdio/jasmine-framework packages."]-->
        INITCOMPLETE[Initialisation successful, send runner:start message to reporter.]-->
        MESSAGECHILDPROCESS[report sessionId and target connection information to worker]-->
        KICKOFFTESTS["Kick off tests in framework by calling th e framework's run<br>method, e.g. @wdio/mocha-framework run()."]-->
        WAITFORTESTTOFINISH[Wait for test to finish. If watch mode keep session open.]-->
        SENDRESULTS[Send results to reporter instance.]-->
        KILLWORKERSESSION[Kill worker session.]-->
        END(END)
    `;
    (function(){
        createFlowChart(setupTest);
    })();
</script>