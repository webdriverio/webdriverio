/* eslint no-undef: 0 */

import React, { useEffect } from 'react'
import BrowserOnly from '@docusaurus/BrowserOnly'

const parseCLIARGS = `graph TD
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
    `

const runRepl = `graph TD
        CALLRUN("Launch test runner by calling the @wdio/cli:index run()")-->
        LAUNCHTESTRUNNER2[Test runner is launched]-->
        CALLRUNCMDHANDLER("Call @wdio/cli/commands:run launcher()")-->
        INSTANTIATELAUNCHER["Creates @wdio/cli:launcher instance<br>1) Set log level<br>2) Worker count equals number<br>of specs * caps array length<br>3)Create a new runnner instance<br>using @wdio/utils:initializePlugin<br>4. Create CLI Interface instance.<br>5. Setup interface job:start,<br>job:end event listeners"]-->
        CALLLAUNCHERINSTANCERUN["@wdio/cli:launcher run()"]-->
        INITLAUNCHERINSTANCE["Create instance of all services<br>listed in the config services property."] -->
        INIT["Call the runner initialize() method"]-->
        RUNPRETSTTASKS["Run pre-test tasks for runner plugins"]-->
        CONFIGONPREPAREHOOK["wdio.conf.js onPrepare hook"]-->
        SERVICESONPREPAREHOOK["Run the services onPrepare hook<br>e.g. start selenium server."]-->
        RUNMODE("Call @wdio/cli:launcher runMode()")-->
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
    `

const installConfig = `graph TD
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
    `

const startTestInstance = `graph TD
        STARTINSTANCE("@wdio/cli:launcher startInstance()")-->
        CALLRUNNERRUNMETHOD["Call @wdio/local-runner:index.js run()<br>return @wdio/local-runner:worker instance"]-->
        ADDLISTENERS["Add message, error, exit event<br>listeners to worker instance."]-->
        CALLPOSTMESSAGE["Call @wdio/local-runner:worker postMessage().<br>If an instance is not created, call startProcess()<br>and fork a child process."]-->
        FORKCHILDPROCESS["@wdio/local-runner:worker startProcess() forks a<br>child process using the child_process fork() method."]-->
        CREATERUNNERINSTANCE["The args passed to  child_process fork execute the code in the<br>@wdio/local-runner run.js.This action creates a new instance<br>of @wdio/runner index.js. "]-->
        ADDHANDLERS["Add message, error and exit listeners to the forked process.<br>These listeners will process commands."]-->
        RUNWDIORUNNERINDEXJS["@wdio/local-runner postMessage() instructs the child process to<br>run the code @wdio/runner index.js."]-->
        POSTMESSAGE["@wdio/local-runner postMessage() sends child process a message that<br>contains the capability id,'run' command, config file, CLI args,<br>capabilties, config details about automation backend, number of retries.<br>When the child process receives this message, all services, reports and<br>services are setup. The tests are them executed."]-->
        CONTROLPASSEDTORUNNERINDEXJS["Control passed to @wdio/runner:index"]-->
        TESTINITCOMPLETE("All services, reports and services are setup. The tests are them executed.<br>See Test Execution flow chart for more information.")
    `

const setupTest = `graph TD
        START("@wdio/runner:index called from<br>child process via a run message.")-->
        EXECUTERUN["@wdio/runner:index run()"]-->
        SETUPREPORTER["Initialise BaseReporter object which creates a new<br>@wdio/runner reporter instance.All reporters listed<br>in the wdio.conf.js reporters property are initialized."]-->
        INITTESTFRAMEWORK["Test framework from the wdio.conf. js property is<br>initialized usingthe @wdio/utils initializePlugin method.<br> <br>Supported frameworks include @wdio/mocha-framework,<br>@wdio/cucumber-framework and @wdio/jasmine-framework."]-->
        INITSERVICES["Initialise services"]-->
        RUNEFORESESSIONHOOK[Run wdio.conf.js beforeSession hook.]-->
        INITSESSION["Call @wdio/runner:index _initSession.<br>@wdio/runner:utils initializeInstance<br>calls webdriverio:index.js remote()."]-->
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
    `

const graphData = `
    graph LR
        START("Start wdio in the CLI<br> @wdio/cli index / run.js")-->
        LAUNCHER["@wdio/cli launcher.js"]-->
        LOCALRUNNER["@wdio/local-runner"]-->
        RUNNER["@wdio/runner"]
        LISTOFSERVICES["Any package that ends with -service<br>@wdio/appium-service<br>@wdio/applitools-service<br>@wdio/browserstack-service<br>@wdio/crossbrowsertesting-service<br>wdio-lambdatest-service<br>@wdio/lighthouse-service<br>@wdio/firefox-profile-service<br>@wdio/sauce-service<br>@wdio/selenium-standalone-service<br>@wdio/static-server-service<br>@wdio/testingbot-service<br>wdio-chromedriver-service<br>wdio-intercept-service<br>wdio-zafira-listener-service<br>wdio-reportportal-service<br>wdio-docker-service"]-->
        LAUNCHER
        LISTOFSERVICES-->LOCALRUNNER
        LISTOFSERVICES-->RUNNER
        REPORTER["Any package that ends with -reporter<br>@wdio/allure-reporter<br>@wdio/concise-reporter<br>@wdio/dot-reporter<br>@wdio/junit-reporter<br>@wdio/reporter<br>@wdio/spec-reporter<br>@wdio/sumologic-reporter<br>@wdio/json-reporter<br>wdio-reportportal-reporter<br>wdio-video-reporter<br>@rpii/wdio-html-reporter<br>wdio-mochawesome-reporter<br>wdio-timeline-reporter<br>wdio-cucumberjs-json-reporter"]-->RUNNER
        FRAMEWORK["Any package that ends with -framework<br>@wdio/jasmine-framework<br>@wdio/mocha-framework<br>@wdio/cucumber-framework<br>"]-->
        RUNNER
        WEBDRIVER["webdriverio<br>webdriver"]-->
        RUNNER
        GLOBAL["GLOBALS<br>@wdio/sync<br>@wdio/config<br>@wdio/logger<br>@wdio/utils"]
    `

export function CreateFlowcharts({ id }) {

    useEffect(() => {
        // Define the initial _id based on the id prop
        let _id = 'graph TD'

        // Map id values to their corresponding _id values
        const idToIdMapping = {
            createlocalworkerprocess: startTestInstance,
            testexecution: setupTest,
            highleveloverview: graphData,
        }

        // Update _id based on the id prop if it exists in the mapping
        if (idToIdMapping[id]) {
            _id = idToIdMapping[id]
        }

        // Delaying the Flow chart creation to ensure `flowChartGraphDivContainer` element is added to dom.
        setTimeout(() => {
            createFlowChart(_id)
        }, 25)
    }, [id])

    return (
        <BrowserOnly>
            {() => {
                return (
                    <div>
                        {id === 'wdiocommands' && (
                            <div>
                                <div className='flowcharttogglemenu'>
                                    <a className='flowcharttogglelink' onClick={() => createFlowChart(parseCLIARGS)}>
                                        Parse CLI args
                                    </a>
                                    <span>|</span>
                                    <a className='flowcharttogglelink' onClick={() => createFlowChart(runRepl)}>
                                        run command
                                    </a>
                                    <span>|</span>
                                    <a className='flowcharttogglelink' onClick={() => createFlowChart(installConfig)}>
                                        repl, install, and config commands
                                    </a>
                                </div>
                            </div>
                        )}
                        <div id='flowChartGraphDivContainer'></div>
                    </div>
                )
            }}
        </BrowserOnly>
    )
}
