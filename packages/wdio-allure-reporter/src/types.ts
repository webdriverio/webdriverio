import { WDIOReporterBaseOptions } from '@wdio/reporter'
import Allure from 'allure-js-commons'

/**
 * When you add a new option, please also update the docs at ./packages/wdio-allure-reporter/README.md
 */
export interface AllureReporterOptions extends WDIOReporterBaseOptions {
    /**
     * defaults to `./allure-results`. After a test run is complete, you will find that this directory
     * has been populated with an `.xml` file for each spec, plus a number of `.txt` and `.png`
     * files and other attachments.
     */
    outputDir?: string;
    /**
     * optional parameter (`false` by default), set it to true in order to change the report hierarchy
     * when using cucumber. Try it for yourself and see how it looks.
     */
    useCucumberStepReporter?: boolean;
    /**
     * optional parameter (`false` by default), set it to true in order to not fetch the `before/after`
     * stacktrace/screenshot/result hooks into the Allure Reporter.
     */
    disableMochaHooks?: boolean;
    /**
     * optional parameter(`false` by default), in order to log only custom steps to the reporter.
     */
    disableWebdriverStepsReporting?: boolean;
    /**
     * optional parameter(`false` by default), in order to not attach screenshots to the reporter.
     */
    disableWebdriverScreenshotsReporting?: boolean;
    /**
     * optional parameter, in order to specify the issue link pattern. Reporter will replace `{}` placeholder
     * with value specified in `addIssue(value)` call parameter.
     * Example `https://example.org/issue/{}`
     */
    issueLinkTemplate?: string;
    /**
     * optional parameter, in order to specify the tms link pattern. Reporter will replace `{}` placeholder
     * with value specified in `addTestId(value)` call parameter. Example `https://example.org/tms/{}`
     */
    tmsLinkTemplate?: string;
}

export interface AddLabelEventArgs {
    name: string;
    value: string;
}

export interface AddStoryEventArgs {
    storyName: string;
}

export interface AddFeatureEventArgs {
    featureName: string;
}

export interface AddSeverityEventArgs {
    severity: string;
}

export interface AddIssueEventArgs {
    issue: string;
}

export interface AddTestIdEventArgs {
    testId: string;
}

export interface AddEnvironmentEventArgs {
    name: string;
    value: string;
}

export interface AddDescriptionEventArgs {
    description?: string;
    descriptionType?: Allure.TYPE;
}

export interface AddAttachmentEventArgs {
    name: string;
    content: string | object;
    type: string;
}

