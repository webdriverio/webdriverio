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
