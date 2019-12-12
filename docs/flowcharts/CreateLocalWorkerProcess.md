---
id: createlocalworkerprocess
title: Create worker process
---
This flowchart explains how a worker process is created.
<div id="flowChartGraphDivContainer"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/8.4.3/mermaid.min.js"></script>
<script src="/js/flowchart.js"></script>
<script>
    var startTestInstance = `
    graph TD
        STARTINSTANCE("Call @wdio/cli:launcher startInstance()")-->
        CALLRUNNERRUNMETHOD["Call @wdio/local-runner:index.js run()<br>return @wdio/local-runner:worker instance"]-->
        ADDLISTENERS["Add message, error, exit event<br>listeners to worker instance."]-->
        CALLPOSTMESSAGE["Call @wdio/local-runner:worker postMessage().<br>If an instance is not created, call startProcess()<br>and fork a child process."]-->
        FORKCHILDPROCESS["@wdio/local-runner:worker startProcess() forks a<br>child process using the child_process fork() method."]-->
        CREATERUNNERINSTANCE["The args passed to  child_process fork execute the code in the<br>@wdio-local-runner run.js.This action creates a new instance<br>of @wdio/runner index.js. "]-->
        ADDHANDLERS["Add message, error and exit listeners to the forked process.<br>These listeners will process commands."]-->
        RUNWDIORUNNERINDEXJS["@wdio/local-runner postMessage() instructs the child process to<br>run the code @wdio/runner index.js."]-->
        POSTMESSAGE["@wdio/local-runner postMessage() sends child process a message that<br>contains the capability id,'run' command, config file, CLI args,<br>capabilties, config details about automation backend, number of retries.<br>When the child process receives this message, all services, reports and<br>services are setup. The tests are them executed."]-->
        CONTROLPASSEDTORUNNERINDEXJS["Control passed to @wdio/runner:index"]-->
        TESTINITCOMPLETE("All services, reports and services are setup. The tests are them executed.<br>See Test Execution flow chart for more information.")
    `;
    (function(){
        createFlowChart(startTestInstance);
    })();
</script>