import type { Provider } from './types.js'

const GITHUB = {
    matcher: () => !!process.env.GITHUB_ACTIONS,
    ci: {
        repo: process.env.GITHUB_REPOSITORY ?? '',
        refName: process.env.GITHUB_HEAD_REF ?? process.env.GITHUB_REF_NAME ?? '',
        sha: process.env.GITHUB_SHA ?? '',
        user: process.env.GITHUB_ACTOR ?? '',
    },
}

const GITLAB = {
    matcher: () => !!process.env.GITLAB_CI,
    ci: {
        repo: process.env.CI_PROJECT_PATH ?? '',
        refName: process.env.CI_COMMIT_REF_NAME ?? '',
        sha: process.env.CI_COMMIT_SHA ?? '',
        user: process.env.GITLAB_USER_LOGIN ?? '',
    },
}

const JENKINS = {
    matcher: () => !!process.env.JENKINS_URL,
    ci: {
        repo: process.env.GIT_URL ?? '',
        refName: process.env.GIT_BRANCH ?? '',
        sha: process.env.GIT_COMMIT ?? '',
        user: '',
    },
}

const BITBUCKET = {
    matcher: () => !!process.env.BITBUCKET_BUILD_NUMBER,
    ci: {
        repo: process.env.BITBUCKET_REPO_FULL_NAME ?? '',
        refName: process.env.BITBUCKET_BRANCH ?? '',
        sha: process.env.BITBUCKET_COMMIT ?? '',
        user: process.env.BITBUCKET_STEP_TRIGGERER_UUID ?? '',
    },
}

const CIRCLECI = {
    matcher: () => !!process.env.CIRCLECI,
    ci: {
        repo: process.env.CIRCLE_REPOSITORY_URL ?? '',
        refName: process.env.CIRCLE_BRANCH ?? '',
        sha: process.env.CIRCLE_SHA1 ?? '',
        user: process.env.CIRCLE_USERNAME ?? '',
    },
}

const DEFAULT = {
    matcher: () => true,
    ci: {
        repo: '',
        refName: '',
        sha: '',
        user: '',
    },
}

const providers: Provider[] = [GITHUB, GITLAB, JENKINS, BITBUCKET, CIRCLECI]

const provider = providers.find((p) => p.matcher())

export const CI = provider?.ci ?? DEFAULT.ci
