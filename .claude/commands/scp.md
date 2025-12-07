# Stage, Commit, and Push

Stage all changes, create a well-formatted commit, and push to the remote repository.

Follow these steps:

1. **Stage all changes:**
   - Run `git add .` to stage all changes

2. **Review changes:**
   - Run `git status` to see what files were staged
   - Run `git diff --staged` to see the actual changes
   - Run `git log -5 --oneline` to see recent commits and understand the commit message style

3. **Create a commit:**
   - Analyze the staged changes and understand what was modified
   - Draft a commit message following the repository's conventions:
     - Use conventional commit format: `type(scope): description`
     - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `style`, `chore`
     - Keep the first line under 72 characters
     - Add a blank line followed by a detailed description if needed
   - Create the commit using a HEREDOC for proper formatting:
     ```bash
     git add . && git commit -m "$(cat <<'EOF'
     type(scope): concise description

     Detailed explanation of changes if needed.
     - Bullet point 1
     - Bullet point 2
     EOF
     )"
     ```

4. **Push to remote:**
   - Run `git push` to push the commit to the remote repository
   - Confirm the push was successful

5. **Report results:**
   - Show the commit hash and message
   - Confirm the push was successful

**Important:**
- If there are no changes to commit, inform the user
- If the push fails (e.g., due to conflicts), explain the issue and suggest next steps
- Never commit files that likely contain secrets (.env, credentials.json, etc.)
