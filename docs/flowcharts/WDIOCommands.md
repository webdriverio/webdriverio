---
id: wdiocommands
title: WDIO Commands
---
This flowchart provides a high level overview of the @wdio/cli run, repl, config and install commands.
<div>
    <div class="flowcharttogglemenu">
        <a class="flowcharttogglelink" onclick="createFlowChart(parseCLIARGS)">Parse CLI args</a>
        <span>|</span>
        <a class="flowcharttogglelink" onclick="createFlowChart(runRepl)">run command</a>
        <span>|</span>
        <a class="flowcharttogglelink" onclick="createFlowChart(installConfig)">repl, install and config commands</a>
    </div>
    <div id="flowChartGraphDivContainer"></div>
</div>
<script src="https://unpkg.com/mermaid@8.4.3/dist/mermaid.min.js"></script>
<script src="/js/flowchart.js"></script>
<script>
    var parseCLIARGS = `graph TD
        STARTWDIO(Execute wdio or wdio run)-->
        PARSECLIARGS[Parse CLI args]
        PARSECLIARGS-->HELPSWITCH["wdio command --help"]-->
        COMMANDINCLUDED{"Command<br>included?"}
        COMMANDINCLUDED-->|Yes|PRINTCMDHELP[Print command help text]
        COMMANDINCLUDED-->|No|PRINTWDIOHELP[Print wdio help]
        PARSECLIARGS-->CONFIGCMD[config]-->
        RUNCONFIG[Run config<br>command code]
        PARSECLIARGS-->REPL[repl]-->
        RUNREPL[Run repl<br>command code]
        PARSECLIARGS-->INSTALL[install]-->
        RUNINSTALL[Run install code]
        PARSECLIARGS-->RUN[run]-->
        LAUNCHRUNNER[Launch test runner]
    `;
    var runRepl = `graph TD
        LAUNCHTESTRUNNER2("Launch test runner by calling<br>the @wdio/cli:index run")-->
        CALLRUNCMDHANDLER["Call @wdio/cli/commands:run launcher()"]-->
        INSTANTIATELAUNCHER["Create @wdio/cli:launcher instance<br>1) Set log level<br>2) Worker count equals number<br>of specs * caps array length<br>3)Create a new runnner instance<br>using @wdio/utils:initialisePlugin<br>4. Create CLI Interface instance.<br>5. Setup interface job:start,<br>job:end event listeners"]-->
        CALLLAUNCHERINSTANCERUN("Call @wdio/cli:launcher run()")-->
        INITLAUNCHERINSTANCE["Create instance of all services<br>listed in the config services property."]-->
        INIT["Run pre-test tasks for runner plugins<br>by calling the runner's initialise() method."]-->
        CONFIGONPREPAREHOOK["Run the wdio.conf.js onPrepare hook"]-->
        SERVICESONPREPAREHOOK["Run the services onPrepare hook<br>e.g. start selenium server."]-->
        RUNMODE["Call @wdio/cli:launcher runMode()."]-->
        RUNMODEPROMISERESOLVED{"runMode() promise resolve?"}
        RUNMODEPROMISERESOLVED-->|No|SCHEDULE["In @wdio/cli:launcher runMode()<br>create a spec execution schedule."]-->
        RUNSPECS["Start test execution by calling<br>@wdio/cli:launcher runSpecs()."]-->
        CREATEWORKERS["Create a new test instance (worker process) by<br>calling @wdio/cli:launcher runSpecs().<br> <br>Call @wdio/cli:launcher startInstance()<br>to create a new worker instance.<br> <br>See Create Worker Process and Test<br>Execution flowcharts for<br>more information on this process."]-->
        ISNUMBERINSTANCESSPECSZERO{"Is number of worker<br>processes less than<br>  config maxInstances?"}
        ISNUMBERINSTANCESSPECSZERO-->|Yes|CREATEWORKERS
        ISNUMBERINSTANCESSPECSZERO-->|No|SCHEDULELOOP["When number of running instances and<br>number of specs is zero, exit runSpecs()."]-->ENDRUNMODE
        RUNMODEPROMISERESOLVED-->|Yes|ENDRUNMODE["Pass control back to<br>@wdio/cli:launcher run()."]-->
        ONCOMPLETEHOOKS[Run service and config onComplete hooks.]-->
        INTERFACEFINALISE["Call @wdio/cli interface.js finalise() method. This method prints the test results<br>and summary using data from the repoter packages."]-->
        EXIT(Shutdown runner, end test process.)
    `;
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
        SYNCMODE-->|No|ASYNCMODE["Do not install<br>@wdio/sync"]
        YARNCHECK-->CREATEWDIOCONFIG["Create wdio.conf.js"]
        ASYNCMODE-->YARNCHECK
        REPLCOMMAND[repl]-->
        CREATESESSION[Create a new Webdriver session<br>using webdriverio remote]-->
        ADDGLOBALS["Add browser, $, and $$<br>to global scope"]-->
        LOADREPL[Load the REPL by calling the<br>WebdriverIO debug command]-->
        EXITREPL[Exit when REPL closed]
    `;
    (function() {
        createFlowChart(parseCLIARGS);
    })();
</script>
