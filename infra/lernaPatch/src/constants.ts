export const CODE_TO_REMOVE = `        if (this.options.npmClient === "pnpm") {
          this.logger.verbose("version", "Updating root pnpm-lock.yaml");
          await execPackageManager(
            "pnpm",
            [
              "install",
              "--lockfile-only",
              !runScriptsOnLockfileUpdate ? "--ignore-scripts" : "",
              ...npmClientArgs
            ].filter(Boolean),
            this.execOpts
          );
          const lockfilePath = import_path27.default.join(this.project.rootPath, "pnpm-lock.yaml");
          changedFiles.add(lockfilePath);
        }`

/**
 * in `sigstore` (used by `libnpmpublish` for provenance): on a 409, read the Rekor entry
 * that exists already (it is the same upload) instead of failing the publish
 */
export const SIGSTORE_CONFLICT_CODE = 'fetchOnConflict: false,'
export const SIGSTORE_CONFLICT_FIX = 'fetchOnConflict: true,'
