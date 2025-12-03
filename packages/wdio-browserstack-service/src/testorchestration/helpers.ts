import os from 'node:os'
import path from 'node:path'
import { execSync } from 'node:child_process'
import logger from '@wdio/logger'

const log = logger('wdio-browserstack-service:helpers')

// Constants
const MAX_GIT_META_DATA_SIZE_IN_BYTES = 512 * 1024 // 512 KB

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

function createEmptyGitMetadata(): GitMetadata {
    return {
        name: 'git',
        sha: '',
        short_sha: '',
        branch: '',
        tag: '',
        committer: '',
        committer_date: '',
        author: '',
        author_date: '',
        commit_message: '',
        root: '',
        common_git_dir: '',
        worktree_git_dir: '',
        last_tag: '',
        commits_since_last_tag: '',
        remotes: []
    }
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
 * Format git author information
 */
function gitAuthor(name: string, email: string): string {
    if (!name && !email) {
        return ''
    }
    return `${name} (${email})`
}

/**
 * Get the size of a JSON object in bytes
 */
function getSizeOfJsonObjectInBytes(obj: unknown): number {
    try {
        const jsonString = JSON.stringify(obj)
        return Buffer.byteLength(jsonString, 'utf8')
    } catch (e) {
        log.error(`Error calculating object size: ${e}`)
        return 0
    }
}

/**
 * Truncate a string to reduce its size by the specified number of bytes
 */
function truncateString(str: string, bytesToTruncate: number): string {
    if (!str || bytesToTruncate <= 0) {
        return str
    }

    const originalBytes = Buffer.byteLength(str, 'utf8')
    const targetBytes = Math.max(0, originalBytes - bytesToTruncate)

    if (targetBytes >= originalBytes) {
        return str
    }

    // Perform binary search to find the right truncation point
    let left = 0
    let right = str.length

    while (left < right) {
        const mid = Math.floor((left + right) / 2)
        const truncated = str.substring(0, mid)
        const bytes = Buffer.byteLength(truncated, 'utf8')

        if (bytes <= targetBytes) {
            left = mid + 1
        } else {
            right = mid
        }
    }

    return str.substring(0, left - 1) + '...'
}

/**
 * Check and truncate VCS info if needed
 */
function checkAndTruncateVcsInfo(gitMetaData: GitMetadata): GitMetadata {
    const gitMetaDataSizeInBytes = getSizeOfJsonObjectInBytes(gitMetaData)

    if (gitMetaDataSizeInBytes && gitMetaDataSizeInBytes > MAX_GIT_META_DATA_SIZE_IN_BYTES) {
        const truncateSize = gitMetaDataSizeInBytes - MAX_GIT_META_DATA_SIZE_IN_BYTES
        const truncatedCommitMessage = truncateString(gitMetaData.commit_message, truncateSize)
        gitMetaData.commit_message = truncatedCommitMessage
        log.info(`The commit has been truncated. Size of commit after truncation is ${getSizeOfJsonObjectInBytes(gitMetaData) / 1024} KB`)
    }
    return gitMetaData
}

/**
 * Get git metadata
 */
export function getGitMetadata(): GitMetadata {
    try {
        // Find git repo root
        const rootOutput = execSync('git rev-parse --show-toplevel').toString().trim()
        const commonDirOutput = execSync('git rev-parse --git-common-dir').toString().trim()

        // Get basic git info
        const sha = execSync('git rev-parse HEAD').toString().trim()
        const shortSha = execSync('git rev-parse --short HEAD').toString().trim()
        const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()

        let tag = ''
        try {
            tag = execSync('git describe --all --tags --exact-match').toString().trim()
        } catch (error) {
            log.debug(`No exact tag found for current commit: ${error}`)
        }

        // Get commit info
        const commitAuthorName = execSync('git log -1 --pretty=%an').toString().trim()
        const commitAuthorEmail = execSync('git log -1 --pretty=%ae').toString().trim()
        const commitAuthorDate = execSync('git log -1 --pretty=%aI').toString().trim()
        const committerName = execSync('git log -1 --pretty=%cn').toString().trim()
        const committerEmail = execSync('git log -1 --pretty=%ce').toString().trim()
        const committerDate = execSync('git log -1 --pretty=%cI').toString().trim()
        const commitMessage = execSync('git log -1 --pretty=%B').toString().trim()

        // Get last tag and commits since
        let lastTag = ''
        let commitsSinceLastTag = ''
        try {
            lastTag = execSync('git describe --tags --abbrev=0 --always').toString().trim()
            commitsSinceLastTag = execSync(`git rev-list ${sha}..${lastTag} --count`).toString().trim()
        } catch (error) {
            log.debug(`No last tag found : ${error}`)
        }

        // Get remotes
        const remotesOutput = execSync('git remote -v').toString().trim()
        const remoteLines = remotesOutput.split('\n')
        const remotes: GitRemote[] = []
        const processedRemotes = new Set<string>()

        for (const line of remoteLines) {
            const parts = line.split(/\s+/)
            if (parts.length >= 2) {
                const remoteName = parts[0]
                const remoteUrl = parts[1]

                // Only process each remote once (git remote -v shows fetch and push)
                const key = `${remoteName}:${remoteUrl}`
                if (!processedRemotes.has(key)) {
                    processedRemotes.add(key)
                    remotes.push({
                        name: remoteName,
                        url: remoteUrl
                    })
                }
            }
        }

        const info = {
            sha,
            short_sha: shortSha,
            branch,
            tag,
            committer: gitAuthor(committerName, committerEmail),
            committer_date: committerDate,
            author: gitAuthor(commitAuthorName, commitAuthorEmail),
            author_date: commitAuthorDate,
            commit_message: commitMessage,
            root: rootOutput,
            common_git_dir: commonDirOutput,
            worktree_git_dir: commonDirOutput,
            last_tag: lastTag,
            commits_since_last_tag: commitsSinceLastTag
        }

        const gitMetaData: GitMetadata = {
            name: 'git',
            ...info,
            remotes
        }

        return checkAndTruncateVcsInfo(gitMetaData)
    } catch (error) {
        log.error(`Error getting git metadata: ${error}`)
        return createEmptyGitMetadata()
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
            const originHeadOutput = execSync('git symbolic-ref refs/remotes/origin/HEAD').toString().trim()
            if (originHeadOutput.startsWith('refs/remotes/origin/')) {
                return originHeadOutput.replace('refs/remotes/', '')
            }
        } catch {
            log.debug('Could not determine base branch from origin/HEAD')
        }

        // Fallback: use the first branch in local heads
        try {
            const branchesOutput = execSync('git branch').toString().trim()
            const branches = branchesOutput.split('\n').filter(Boolean)
            if (branches.length > 0) {
                // Remove the '* ' from current branch if present and return first branch
                const firstBranch = branches[0].replace(/^\*\s+/, '').trim()
                return firstBranch
            }
        } catch {
            log.debug('Could not determine base branch from local branches')
        }

        // Fallback: use the first remote branch if available
        try {
            const remoteBranchesOutput = execSync('git branch -r').toString().trim()
            const remoteBranches = remoteBranchesOutput.split('\n').filter(Boolean)
            for (const branch of remoteBranches) {
                const cleanBranch = branch.trim()
                if (cleanBranch.startsWith('origin/') && !cleanBranch.includes('HEAD')) {
                    return cleanBranch
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
            try {
                // Check if commit has parents
                const parentsOutput = execSync(`git log -1 --pretty=%P ${commit}`).toString().trim()
                const parents = parentsOutput.split(' ').filter(Boolean)

                for (const parent of parents) {
                    const diffOutput = execSync(`git diff --name-only ${parent} ${commit}`).toString().trim()
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
            const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
            const latestCommit = execSync('git rev-parse HEAD').toString().trim()
            result.prId = latestCommit

            // Find base branch
            const baseBranch = getBaseBranch()
            log.debug(`Base branch for comparison: ${baseBranch}`)

            let commits: string[] = []

            if (baseBranch) {
                try {
                    // Get changed files between base branch and current branch
                    const changedFilesOutput = execSync(`git diff --name-only ${baseBranch}..${currentBranch}`).toString().trim()
                    log.debug(`Changed files between ${baseBranch} and ${currentBranch}: ${changedFilesOutput}`)
                    result.filesChanged = changedFilesOutput.split('\n').filter(f => f.trim())

                    // Get commits between base branch and current branch
                    const commitsOutput = execSync(`git log ${baseBranch}..${currentBranch} --pretty=%H`).toString().trim()
                    commits = commitsOutput.split('\n').filter(Boolean)
                } catch (error) {
                    log.debug(`Failed to get changed files from branch comparison. Falling back to recent commits. Error: ${error}`)
                    // Fallback to recent commits
                    const recentCommitsOutput = execSync('git log -10 --pretty=%H').toString().trim()
                    commits = recentCommitsOutput.split('\n').filter(Boolean)

                    if (commits.length > 0) {
                        result.filesChanged = getChangedFilesFromCommits(commits.slice(0, 5))
                    }
                }
            } else {
                // Fallback to recent commits
                const recentCommitsOutput = execSync('git log -10 --pretty=%H').toString().trim()
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
                    try {
                        const commitMessage = execSync(`git log -1 --pretty=%B ${commit}`).toString().trim()
                        log.debug(`Processing commit: ${commitMessage}`)

                        const authorName = execSync(`git log -1 --pretty=%an ${commit}`).toString().trim()
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
                    const fallbackAuthor = execSync('git config user.name').toString().trim() || 'Unknown'
                    authorsSet.add(fallbackAuthor)
                    log.debug(`Added fallback author: ${fallbackAuthor}`)
                } catch (error) {
                    authorsSet.add('Unknown')
                    log.debug(`Added Unknown as fallback author due to error: ${error}`)
                }
            }

            result.authors = Array.from(authorsSet)
            result.commitMessages = commitMessages

            // Get commit date
            if (latestCommit) {
                const commitDate = execSync(`git log -1 --pretty=%cd --date=format:'%Y-%m-%d' ${latestCommit}`).toString().trim()
                result.prDate = commitDate.replace(/'/g, '')
            }

            // Set PR title and description from latest commit if not already set
            if ((!result.prTitle || result.prTitle.trim() === '') && latestCommit) {
                try {
                    const latestCommitMessage = execSync(`git log -1 --pretty=%B ${latestCommit}`).toString().trim()
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
