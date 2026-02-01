import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import logger from '@wdio/logger'

const log = logger('wdio-browserstack-service:helpers')

/**
 * Validate that a git ref (branch name, commit hash, etc.) contains only safe characters
 * to prevent command injection when used in shell commands.
 *
 * Git refs can contain alphanumeric characters, forward slashes, dots, underscores, and hyphens.
 * We explicitly reject any characters that could be used for shell injection.
 */
const SAFE_GIT_REF_PATTERN = /^[a-zA-Z0-9_./-]+$/

function isValidGitRef(ref: string): boolean {
    if (!ref || ref.length === 0 || ref.length > 256) {
        return false
    }
    return SAFE_GIT_REF_PATTERN.test(ref)
}

/**
 * Safely execute a git command using spawnSync to avoid shell injection.
 * This function uses array arguments instead of string interpolation.
 */
function safeGitCommand(args: string[], cwd?: string): string {
    const result = spawnSync('git', args, {
        cwd,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large diffs
    })
    if (result.error) {
        throw result.error
    }
    if (result.status !== 0) {
        throw new Error(result.stderr || `Git command failed with status ${result.status}`)
    }
    return result.stdout.trim()
}

type GitRemote = {
    name: string
    url: string
}

export type GitMetadata = {
    name: string
    sha: string
    short_sha: string
    branch: string
    tag: string
    committer: string
    committer_date: string
    author: string
    author_date: string
    commit_message: string
    root: string
    common_git_dir: string
    worktree_git_dir: string
    last_tag: string
    commits_since_last_tag: string
    remotes: GitRemote[]
}

type GitCommitMessage = {
    message: string
    user: string
}

export type GitAISelectionResult = {
    prId: string
    filesChanged: string[]
    authors: string[]
    prDate: string
    commitMessages: GitCommitMessage[]
    prTitle: string
    prDescription: string
    prRawDiff: string
}

/**
 * Get host information for the test orchestration
 */
export function getHostInfo() {
    return {
        hostname: os.hostname(),
        platform: process.platform,
        architecture: process.arch,
        release: os.release(),
        username: os.userInfo().username
    }
}

/**
 * Check if a git metadata result is valid
 */
function isValidGitResult(result: GitAISelectionResult): boolean {
    return (
        Array.isArray(result.filesChanged) &&
        result.filesChanged.length > 0 &&
        Array.isArray(result.authors) &&
        result.authors.length > 0
    )
}

/**
 * Get base branch from repository
 */
function getBaseBranch(): string | null {
    try {
        // Try to get the default branch from origin/HEAD symbolic ref (works for most providers)
        try {
            const originHeadOutput = safeGitCommand(['symbolic-ref', 'refs/remotes/origin/HEAD'])
            if (originHeadOutput.startsWith('refs/remotes/origin/')) {
                const branch = originHeadOutput.replace('refs/remotes/', '')
                if (isValidGitRef(branch)) {
                    return branch
                }
                log.debug(`Invalid branch name detected: ${branch}`)
            }
        } catch {
            log.debug('Could not determine base branch from origin/HEAD')
        }

        // Fallback: use the first branch in local heads
        try {
            const branchesOutput = safeGitCommand(['branch'])
            const branches = branchesOutput.split('\n').filter(Boolean)
            if (branches.length > 0) {
                // Remove the '* ' from current branch if present and return first branch
                const firstBranch = branches[0].replace(/^\*\s+/, '').trim()
                if (isValidGitRef(firstBranch)) {
                    return firstBranch
                }
                log.debug(`Invalid branch name detected: ${firstBranch}`)
            }
        } catch {
            log.debug('Could not determine base branch from local branches')
        }

        // Fallback: use the first remote branch if available
        try {
            const remoteBranchesOutput = safeGitCommand(['branch', '-r'])
            const remoteBranches = remoteBranchesOutput.split('\n').filter(Boolean)
            for (const branch of remoteBranches) {
                const cleanBranch = branch.trim()
                if (cleanBranch.startsWith('origin/') && !cleanBranch.includes('HEAD')) {
                    if (isValidGitRef(cleanBranch)) {
                        return cleanBranch
                    }
                    log.debug(`Invalid branch name detected: ${cleanBranch}`)
                }
            }
        } catch {
            log.debug('Could not determine base branch from remote branches')
        }
    } catch (e) {
        log.debug(`Error finding base branch: ${e}`)
    }

    return null
}

/**
 * Get changed files from commits
 */
function getChangedFilesFromCommits(commitHashes: string[]): string[] {
    const changedFiles = new Set<string>()

    try {
        for (const commit of commitHashes) {
            // Validate commit hash to prevent injection
            if (!isValidGitRef(commit)) {
                log.debug(`Skipping invalid commit hash: ${commit}`)
                continue
            }

            try {
                // Check if commit has parents
                const parentsOutput = safeGitCommand(['log', '-1', '--pretty=%P', '--', commit])
                const parents = parentsOutput.split(' ').filter(Boolean)

                for (const parent of parents) {
                    // Validate parent hash
                    if (!isValidGitRef(parent)) {
                        log.debug(`Skipping invalid parent hash: ${parent}`)
                        continue
                    }

                    const diffOutput = safeGitCommand(['diff', '--name-only', parent, commit])
                    const files = diffOutput.split('\n').filter(Boolean)

                    for (const file of files) {
                        changedFiles.add(file)
                    }
                }
            } catch (e) {
                log.debug(`Error processing commit ${commit}: ${e}`)
            }
        }
    } catch (e) {
        log.debug(`Error getting changed files from commits: ${e}`)
    }

    return Array.from(changedFiles)
}

/**
 * Get Git metadata for AI selection
 * @param multiRepoSource Array of repository paths for multi-repo setup
 */
export function getGitMetadataForAISelection(folders: string[] | null = []): GitAISelectionResult[] {
    if (folders && folders.length === 0) {
        return []
    }
    if (folders === null) {
        folders = [process.cwd()]
    }

    // Deduplicate folders to avoid calculating PR diff multiple times for the same source
    // Normalize paths using path.resolve to handle relative paths, trailing slashes, etc.
    const uniqueFolders = [...new Set(folders.map(f => path.resolve(f)))]
    log.debug(`Processing ${uniqueFolders.length} unique folders out of ${folders.length} total`)

    const results: GitAISelectionResult[] = []

    for (const folder of uniqueFolders) {
        const originalDir = process.cwd()
        try {
            // Initialize the result structure
            const result: GitAISelectionResult = {
                prId: '',
                filesChanged: [],
                authors: [],
                prDate: '',
                commitMessages: [],
                prTitle: '',
                prDescription: '',
                prRawDiff: ''
            }

            // Change directory to the folder
            process.chdir(folder)

            // Get current branch and latest commit
            const currentBranch = safeGitCommand(['rev-parse', '--abbrev-ref', 'HEAD'])
            const latestCommit = safeGitCommand(['rev-parse', 'HEAD'])
            result.prId = latestCommit

            // Validate branch names to prevent command injection
            if (!isValidGitRef(currentBranch)) {
                log.warn(`Invalid current branch name detected: ${currentBranch}. Skipping this folder for security reasons.`)
                process.chdir(originalDir)
                continue
            }

            if (!isValidGitRef(latestCommit)) {
                log.warn(`Invalid commit hash detected: ${latestCommit}. Skipping this folder for security reasons.`)
                process.chdir(originalDir)
                continue
            }

            // Find base branch
            const baseBranch = getBaseBranch()
            log.debug(`Base branch for comparison: ${baseBranch}`)

            let commits: string[] = []

            if (baseBranch && isValidGitRef(baseBranch)) {
                try {
                    // Get changed files between base branch and current branch
                    // Using spawnSync with array arguments to prevent command injection
                    const changedFilesOutput = safeGitCommand(['diff', '--name-only', `${baseBranch}..${currentBranch}`])
                    log.debug(`Changed files between ${baseBranch} and ${currentBranch}: ${changedFilesOutput}`)
                    result.filesChanged = changedFilesOutput.split('\n').filter(f => f.trim())

                    // Get commits between base branch and current branch
                    const commitsOutput = safeGitCommand(['log', `${baseBranch}..${currentBranch}`, '--pretty=%H'])
                    commits = commitsOutput.split('\n').filter(Boolean)
                } catch (error) {
                    log.debug(`Failed to get changed files from branch comparison. Falling back to recent commits. Error: ${error}`)
                    // Fallback to recent commits
                    const recentCommitsOutput = safeGitCommand(['log', '-10', '--pretty=%H'])
                    commits = recentCommitsOutput.split('\n').filter(Boolean)

                    if (commits.length > 0) {
                        result.filesChanged = getChangedFilesFromCommits(commits.slice(0, 5))
                    }
                }
            } else {
                if (baseBranch && !isValidGitRef(baseBranch)) {
                    log.warn(`Invalid base branch name detected: ${baseBranch}. Falling back to recent commits.`)
                }
                // Fallback to recent commits
                const recentCommitsOutput = safeGitCommand(['log', '-10', '--pretty=%H'])
                commits = recentCommitsOutput.split('\n').filter(Boolean)

                if (commits.length > 0) {
                    result.filesChanged = getChangedFilesFromCommits(commits.slice(0, 5))
                }
            }

            // Process commit authors and messages
            const authorsSet = new Set<string>()
            const commitMessages: GitCommitMessage[] = []

            // Only process commits if we have them
            if (commits.length > 0) {
                for (const commit of commits) {
                    // Validate commit hash
                    if (!isValidGitRef(commit)) {
                        log.debug(`Skipping invalid commit hash: ${commit}`)
                        continue
                    }

                    try {
                        const commitMessage = safeGitCommand(['log', '-1', '--pretty=%B', '--', commit])
                        log.debug(`Processing commit: ${commitMessage}`)

                        const authorName = safeGitCommand(['log', '-1', '--pretty=%an', '--', commit])
                        authorsSet.add(authorName || 'Unknown')

                        commitMessages.push({
                            message: commitMessage.trim(),
                            user: authorName || 'Unknown'
                        })
                    } catch (e) {
                        log.debug(`Error processing commit ${commit}: ${e}`)
                    }
                }
            }

            // If we have no commits but have changed files, add a fallback author
            if (commits.length === 0 && result.filesChanged.length > 0) {
                try {
                    // Try to get current git user as fallback
                    const fallbackAuthor = safeGitCommand(['config', 'user.name']) || 'Unknown'
                    authorsSet.add(fallbackAuthor)
                    log.debug(`Added fallback author: ${fallbackAuthor}`)
                } catch (error) {
                    authorsSet.add('Unknown')
                    log.debug(`Added Unknown as fallback author due to error: ${error}`)
                }
            }

            result.authors = Array.from(authorsSet)
            result.commitMessages = commitMessages

            // Get commit date (latestCommit already validated above)
            if (latestCommit) {
                const commitDate = safeGitCommand(['log', '-1', '--pretty=%cd', '--date=format:%Y-%m-%d', '--', latestCommit])
                result.prDate = commitDate.replace(/'/g, '')
            }

            // Set PR title and description from latest commit if not already set
            if ((!result.prTitle || result.prTitle.trim() === '') && latestCommit) {
                try {
                    const latestCommitMessage = safeGitCommand(['log', '-1', '--pretty=%B', '--', latestCommit])
                    const messageLines = latestCommitMessage.trim().split('\n')
                    result.prTitle = messageLines[0] || ''

                    if (messageLines.length > 2) {
                        result.prDescription = messageLines.slice(2).join('\n').trim()
                    }
                } catch (e) {
                    log.debug(`Error extracting commit message for PR title: ${e}`)
                }
            }

            // Reset directory
            process.chdir(originalDir)

            results.push(result)
        } catch (error) {
            log.error(`Exception in populating Git metadata for AI selection (folder: ${folder}): ${error}`)

            // Reset directory if needed
            try {
                process.chdir(originalDir)
            } catch (dirError) {
                log.error(`Error resetting directory: ${dirError}`)
            }
        }
    }

    // Filter out results with empty filesChanged
    const filteredResults = results.filter(isValidGitResult)

    // Map to required output format
    const formattedResults = filteredResults.map((result) => ({
        prId: result.prId || '',
        filesChanged: Array.isArray(result.filesChanged) ? result.filesChanged : [],
        authors: Array.isArray(result.authors) ? result.authors : [],
        prDate: result.prDate || '',
        commitMessages: Array.isArray(result.commitMessages)
            ? result.commitMessages.map((cm: { message?: string, user?: string }) => ({
                message: cm.message || '',
                user: cm.user || ''
            }))
            : [],
        prTitle: result.prTitle || '',
        prDescription: result.prDescription || '',
        prRawDiff: result.prRawDiff || ''
    }))
    return formattedResults

}
