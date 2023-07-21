// mimic types from @cucumber/@cucumber such that users don't install that dependency when not needed

export interface ITestCaseHookParameter {
    gherkinDocument: GherkinDocument;
    pickle: Pickle;
    result?: TestStepResult;
    willBeRetried?: boolean;
    testCaseStartedId: string;
}

export declare class Duration {
    seconds: number
    nanos: number
}

export declare class GherkinDocument {
    uri?: string
    feature?: Feature
    comments: readonly Comment[]
}

export declare class Background {
    location: Location
    keyword: string
    name: string
    description: string
    steps: readonly Step[]
    id: string
}

export declare class DataTable {
    location: Location
    rows: readonly TableRow[]
}

export declare class DocString {
    location: Location
    mediaType?: string
    content: string
    delimiter: string
}

export declare class Examples {
    location: Location
    tags: readonly Tag[]
    keyword: string
    name: string
    description: string
    tableHeader?: TableRow
    tableBody: readonly TableRow[]
    id: string
}

export declare class Feature {
    location: Location
    tags: readonly Tag[]
    language: string
    keyword: string
    name: string
    description: string
    children: readonly FeatureChild[]
}

export declare class FeatureChild {
    rule?: Rule
    background?: Background
    scenario?: Scenario
}

export declare class Rule {
    location: Location
    tags: readonly Tag[]
    keyword: string
    name: string
    description: string
    children: readonly RuleChild[]
    id: string
}

export declare class RuleChild {
    background?: Background
    scenario?: Scenario
}

export declare class Scenario {
    location: Location
    tags: readonly Tag[]
    keyword: string
    name: string
    description: string
    steps: readonly Step[]
    examples: readonly Examples[]
    id: string
}

export declare class Step {
    location: Location
    keyword: string
    keywordType?: StepKeywordType
    text: string
    docString?: DocString
    dataTable?: DataTable
    id: string
}

export declare class TableCell {
    location: Location
    value: string
}

export declare class TableRow {
    location: Location
    cells: readonly TableCell[]
    id: string
}

export declare class Tag {
    location: Location
    name: string
    id: string
}

export declare class Pickle {
    id: string
    uri: string
    name: string
    language: string
    steps: readonly PickleStep[]
    tags: readonly PickleTag[]
    astNodeIds: readonly string[]
}

export declare class PickleDocString {
    mediaType?: string
    content: string
}

export declare class PickleStep {
    argument?: PickleStepArgument
    astNodeIds: readonly string[]
    id: string
    type?: PickleStepType
    text: string
}

export declare class PickleStepArgument {
    docString?: PickleDocString
    dataTable?: PickleTable
}

export declare class PickleTable {
    rows: readonly PickleTableRow[]
}

export declare class PickleTableCell {
    value: string
}

export declare class PickleTableRow {
    cells: readonly PickleTableCell[]
}

export declare class PickleTag {
    name: string
    astNodeId: string
}

export declare class TestStepResult {
    duration: Duration
    message?: string
    status: TestStepResultStatus
}

export declare enum PickleStepType {
    UNKNOWN = 'Unknown',
    CONTEXT = 'Context',
    ACTION = 'Action',
    OUTCOME = 'Outcome'
}

export declare enum StepKeywordType {
    UNKNOWN = 'Unknown',
    CONTEXT = 'Context',
    ACTION = 'Action',
    OUTCOME = 'Outcome',
    CONJUNCTION = 'Conjunction'
}

export declare enum TestStepResultStatus {
    UNKNOWN = 'UNKNOWN',
    PASSED = 'PASSED',
    SKIPPED = 'SKIPPED',
    PENDING = 'PENDING',
    UNDEFINED = 'UNDEFINED',
    AMBIGUOUS = 'AMBIGUOUS',
    FAILED = 'FAILED'
}

export declare class Location {
    line: number
    column?: number
}

export declare class Comment {
    location: Location
    text: string
}
