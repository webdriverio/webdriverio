---
id: testrunnerlifecycle
title: Test runner lifecycle
---
This flow chart describes the test runner lifecycle.
<div class="mermaid twographs">
graph TD
    STARTWDIO(Execute wdio)-->
    RUNCOMMAND["If command not provided execute @wdio/cli commmands/run.js"]-->
    WDIOMISSING{wdio.conf.js found?}
    WDIOMISSING-->|No|SETUPWIZARD[Ask if user wants<br>to create a wdio config file]
    WDIOMISSING-->|Yes|ISWATCHMODE{"Is --watch param set?"}
    ISWATCHMODE-->|Yes|RUNLAUNCHERINWATCHMODE[Run watcher in launch mode]
    ISWATCHMODE-->|No|LAUNCHTESTRUNNER[Launch test runner. See launch test<br>runner flowchart fore more info]
    LAUNCHTESTRUNNER2("Launch test runner using<br>@wdio/cli launcher.js")-->
    DEFINEEXITHOOK["Define exit hook which<br>catches CTRL+C event"]-->
    GETCAPS[Get capabilities from config]-->
    INITLAUNCHERINSTANCE["Read wdio.conf.js services property, create a launcher object using the<br>@wdio/utils initialiseServices method. initialiseServices executes the service<br>launcher.js file, e.g. @wdio/selenium-standalone-service launcher.js."]-->
    INIT["Run pre-test tasks for runner plugins<br>by calling the runner's initialise() method."]-->
    ONPREPAREHOOK["Run the onPrepare hook found in both the wdio.conf.js and services packages.<br>For services the onPrepare method is usually found in the launcher.js file,<br>e.g. @wdio/selenium-standalone-service launcher.js"]-->
    RUNMODE["Call @wdio/cli launcher.js runMode() method."]-->
    SCHEDULE["Create the test run schedule. The number of tests (or workers)<br>in the schedule is numberOfCapabilities * specs"]-->
    RUNSPECS["Call @wdio/cli launcher.js runSpecs method. This method runs the tests."]-->
    CREATEWORKERS["Call @wdio/cli launcher.js runSpecs() which starts a new test instance (worker process). Worker<br>instances are created while the  number of running instances is less than config.maxInstances.<br>All test worker processes are created using the @wdio/cli launcher.js startInstance() method.<br>See Create Worker Process flow chart for more information."]-->
    SCHEDULELOOP["When number of running instances and number of specs is zero, exit the @wdio/cli launcher.js<br>runSpecs() method. Pass control back to @wdio/cli launcher.js runMode(). "]-->
    RESOLVERUNMODE["Resolve runMode() promise, pass control back to @wdio/cli launcher.js run() method."]-->
    ONCOMPLETEHOOKS[Run service and config onComplete hooks.]-->
    INTERFACEFINALISE["Call @wdio/cli interface.js finalise() method. This method prints the test results<br>and summary using data from the repoter packages."]-->
    EXIT(Shutdown runner, end test process.)
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