# GitHub Version Workflow

## Goal

Make GitHub the single source of truth for `zoed-signal` version history so every meaningful update is:

- reviewed before upload
- committed with a clear purpose
- pushed to GitHub in a clean state
- easy to compare, roll back, and audit later

## Working Rule

One completed feature, one clean Git update.

Do not wait until many unrelated changes pile up before pushing.

## Default Workflow

### 1. Finish one coherent change

Examples:

- one backend validation improvement
- one UI refinement
- one Supabase schema update
- one content pipeline document update

Avoid mixing unrelated work in the same upload.

### 2. Ask Codex to review the local changes first

Use this kind of request:

```text
帮我检查 zoed-signal 最近改动，并整理成适合提交到 GitHub 的版本
```

Codex should then help:

- inspect changed files
- spot anything that should not be committed
- summarize the scope
- suggest a commit message

### 3. Verify before commit

Before uploading, try to pass the relevant checks:

```bash
npm run lint
npm run build
```

If the change does not need both, still make sure the update has been sanity-checked.

### 4. Commit with a clear message

Preferred commit style:

```text
type: short summary
```

Recommended `type` values:

- `feat`: new feature or meaningful new capability
- `fix`: bug fix
- `refactor`: code cleanup without behavior change
- `docs`: documentation only
- `chore`: maintenance or tooling updates

Examples:

- `feat: add content ingestion validation rules`
- `fix: prevent invalid bookmark writes`
- `refactor: separate data source mode handling`
- `docs: add github version workflow`

### 5. Push immediately after the commit

Once the commit is confirmed clean, push it:

```bash
git push origin main
```

If using a feature branch, push the branch instead.

### 6. End in a clean state

After push, the repository should ideally return to:

```bash
git status
```

Expected result:

```text
nothing to commit, working tree clean
```

## Branch Strategy

### Current default

For now, the project can use:

- `main` as the active branch

This is acceptable while the project is still moving quickly and you are usually working on one clear update at a time.

### When to use feature branches

Switch to one-feature-one-branch when:

- a task will take more than one session
- a feature is risky
- UI and backend are changing together
- you want a safer review checkpoint before merging

Recommended branch naming:

- `feature/content-pipeline`
- `feature/supabase-auth`
- `feature/ui-redesign`
- `fix/bookmark-validation`
- `docs/version-workflow`

## What Must Not Be Committed

Never commit:

- `.env.local`
- real API keys
- Supabase secrets
- temporary debug output
- accidental generated junk
- unfinished unrelated files you do not want in history yet

Commit with care:

- `.env.example`
- schema files
- migration files
- docs that define product or data decisions

## Recommended Session Rhythm

For each meaningful update, use this rhythm:

1. Make the change locally
2. Ask Codex to inspect the changed files
3. Run validation such as `lint` or `build`
4. Create one clean commit
5. Push to GitHub
6. Confirm the repo is clean again

## Suggested Prompts

### A. Pre-upload review

```text
帮我检查 zoed-signal 当前所有改动，看看哪些适合这次一起提交到 GitHub
```

### B. Prepare commit

```text
帮我把这次改动整理成一次清晰的 commit，并检查是否有不该提交的文件
```

### C. Push to GitHub

```text
帮我把这次 commit 推到 GitHub，并确认本地和远程已经同步
```

### D. Branch-based work

```text
帮我为这个新功能开一个分支，并按 GitHub 管理方式推进
```

## Decision For This Project

At the current stage of `zoed.signal`, the fixed default rule is:

1. Every meaningful update should be reviewed before commit.
2. Every commit should represent one clear purpose.
3. Every completed commit should be pushed to GitHub soon after creation.
4. GitHub is the long-term version history center.
5. If a task starts becoming large, switch from `main`-direct updates to a feature branch.
