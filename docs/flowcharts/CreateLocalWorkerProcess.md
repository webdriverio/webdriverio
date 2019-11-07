---
id: createlocalworkerprocess
title: Create worker process
---
This flowchart explains how a worker process is created.
<div class="flowcharttogglemenu">
    <span>[</span>
    <a class="flowcharttogglelink" onclick="createFlowChart(startTestInstance)">Start test instance</a>
    <span>|</span>
    <a class="flowcharttogglelink" onclick="createFlowChart(createChildProcess)">Create child process</a>
    <span>]</span>
    <div id="flowChartGraphDiv"></div>
</div>
<script src="https://unpkg.com/mermaid@8.3.1/dist/mermaid.min.js"></script>
<script src="/js/flowchart.js"></script>
<script>
    var startTestInstance = `
    graph TD
        STARTINSTANCE("Call @wdio/cli launcher.js startInstance(). This<br>method starts an test instance in a child process.")-->
        RUNNERID["Get runner id, this value is printed to stdout when<br>running the tests, e.g. [0-12] for worker instance 12."]-->
        PROCESSCLIARGS["Process CLI arguments, assign each CLI arg to three<br>separate buckets: default, debug and capability execution."]-->
        CALLRUNNERRUNMETHOD["Call the runner instance run method. For example when using<br>the local runner, the @wdio/local-runner index.js<br>run() method will be called. "]-->
        CREATEWORKERINSTANCE["@wdio/local-runner index.js run() creates a new worker<br>instance. The instance class is found in @wdio/local-runner<br>worker.js."]-->
        ADDWORKERTOPOOL[Add worker instance to worker pool.]-->
        ENDWORKERSETUP(End setup, create worker.)
    `;
    var createChildProcess = `
    graph TD
        CREATECHILDPROCESS(Create child process)-->
        CALLPOSTMESSAGE["Call @wdio/local-runner postMessage(). If an instance is not created,<br>call startProcess() and fork a child process."]-->
        FORKCHILDPROCESS["@wdio/local-runner worker.js startProcess() forks a child process<br>using the npm child_process fork() method."]-->
        CREATERUNNERINSTANCE["The args passed to  child_process fork execute the code in the<br>@wdio-local-runner run.js.This action creates a new instance<br>of @wdio/runner index.js. "]-->
        ADDHANDLERS["Add message, error and exit listeners to the forked process.<br>These listeners will process commands."]-->
        RUNWDIORUNNERINDEXJS["@wdio/local-runner postMessage() instructs the child process to<br>run the code @wdio/runner index.js."]-->
        POSTMESSAGE["@wdio/local-runner postMessage() sends child process a message that<br>contains the capability id,'run' command, config file, CLI args,<br>capabilties, config details about automation backend, number of retries.<br>When the child process receives this message, all services, reports and<br>services are setup. The tests are them executed."]-->
        CONTROLPASSEDTORUNNERINDEXJS["Control passed to @wdio/runner index.js"]-->
        TESTINITCOMPLETE("All services, reports and services are setup. The tests are them executed.<br>See Test Execution flow chart for more information.")
    `;
    (function(){
        createFlowChart(startTestInstance);
    })();
</script>