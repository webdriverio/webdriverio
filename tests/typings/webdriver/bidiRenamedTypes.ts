import type { local, remote } from 'webdriver'
import { expectType } from 'tsd'

/**
 * types that the WebDriver BiDi spec renamed stay available under their old
 * names (deprecated aliases), see `RENAMED_TYPES` in scripts/bidi/constants.ts
 */
declare const localSuccess: local.ScriptEvaluateResultSuccess
declare const localException: local.ScriptEvaluateResultException
declare const remoteResult: remote.ScriptEvaluateResult
declare const remoteSuccess: remote.ScriptEvaluateResultSuccess
declare const remoteException: remote.ScriptEvaluateResultException

expectType<local.ScriptEvaluationResultSuccess>(localSuccess)
expectType<local.ScriptEvaluationResultException>(localException)
expectType<remote.ScriptEvaluationResult>(remoteResult)
expectType<remote.ScriptEvaluationResultSuccess>(remoteSuccess)
expectType<remote.ScriptEvaluationResultException>(remoteException)
