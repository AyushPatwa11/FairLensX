# Replace remote repo contents with local `fairlens-ai-v3-complete` code

Steps to replace the code in a remote GitHub repository with the local `fairlens-ai-v3-complete` folder.

1. Clone the remote repo (on your machine):

   git clone https://github.com/AyushPatwa11/FairLensX.git my-repo-clone
   cd my-repo-clone

2. From inside the clone, run the replacement script pointing to the local folder containing the new code. Example (run from Git Bash, WSL, or macOS/Linux):

   # path-to-new-code should point to the local copy of fairlens-ai-v3-complete
   ../fairlens-ai-v3-complete/scripts/replace_repo.sh "/full/path/to/fairlens-ai-v3-complete" --push

   If you omit `--push`, the script will commit locally and print the `git push` command for manual review.

3. What the script does:
- Creates a backup branch of the current repo (named `backup-before-replace-<timestamp>`) and attempts to push it.
- Removes all files in the repo (preserving `.git`).
- Copies the contents of the supplied `fairlens-ai-v3-complete` folder into the repo root.
- Commits the replacement locally and (optionally) force-pushes to `origin`.

4. Safety notes:
- The script creates a backup branch before modifying the working tree. Verify that branch on the remote if the push succeeded.
- The final push uses `--force` to ensure remote is replaced; review and ensure this is acceptable for your workflow.

5. Windows / PowerShell notes:
   - Run the script in Git Bash or WSL for best compatibility. In PowerShell you can perform equivalent steps manually:

     - Create a backup branch and push it:
       git checkout -b backup-before-replace-<timestamp>
       git add -A; git commit -m "Backup before replace: <timestamp>"
       git push -u origin backup-before-replace-<timestamp>

     - Remove files (leave .git), copy new folder contents into repo root, commit and push (force) as desired.

6. After pushing:
   - Verify the remote repository contents on GitHub.
   - If anything is wrong, you can restore from the backup branch.
