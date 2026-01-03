<div align="center">
  <h1>@runespoorstack/changelog-manager</h1>
  <p>The Runespoor CLI for changelog management and semantic versioning.</p>
  <div>
     <a href="https://www.buymeacoffee.com/borisshulyak" target="_blank">
      <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >
    </a>
  </div>
  <a href="https://github.com/runespoor-engineering/changelog-manager/blob/main/LICENSE">
    <img alt="GitHub License" src="https://img.shields.io/github/license/runespoor-engineering/changelog-manager">
  </a>
  <a href="https://github.com/runespoor-engineering/changelog-manager/issues">
    <img alt="GitHub issues" src="https://img.shields.io/github/issues/runespoor-engineering/changelog-manager?color=5d2de0">
  </a>
  <a href="https://www.npmjs.com/package/@runespoorstack/changelog-manager">
    <img alt="npm downloads" src="https://img.shields.io/npm/dw/@runespoorstack/changelog-manager">
  </a>
</div>

## Overview

In modern development, managing `CHANGELOG.md` files and manual version bumping is a recipe for **merge conflicts** and **human error**.

`@runespoorstack/changelog-manager` (invoked via the `rune` command) is a specialized CLI designed for **Trunk Based Development**. It shifts the responsibility of documenting changes to the moment the code is written, using a "change file" architecture that ensures smooth CI/CD automation and conflict-free merges.

- [Overview](#overview)
- [Core Workflow](#core-workflow)
- [Command Reference](#command-reference)
  - [1. `rune change`](#1-rune-change)
  - [2. `rune verify`](#2-rune-verify)
  - [3. `rune apply`](#3-rune-apply)
- [Installation \& Setup](#installation--setup)
  - [Install](#install)
  - [Configure Scripts](#configure-scripts)
- [CI/CD Integration (GitHub Actions)](#cicd-integration-github-actions)
  - [Step 1: Verify on Pull Request](#step-1-verify-on-pull-request)
  - [Step 2: Apply on Merge to Main](#step-2-apply-on-merge-to-main)
- [Security: Why do we need a PAT?](#security-why-do-we-need-a-pat)
  - [How to generate a PAT:](#how-to-generate-a-pat)
- [Data Structure](#data-structure)
  - [`CHANGELOG.json`](#changelogjson)
  - [`CHANGELOG.md`](#changelogmd)
- [Support \& Contributing](#support--contributing)
  - [Special Thanks](#special-thanks)

## Core Workflow

The tool operates on a simple three-step lifecycle:

1. **Document (`rune change`)**: The developer describes the change locally. A small JSON "change file" is created.
2. **Verify (`rune verify`)**: The CI ensures that a change file exists before allowing a Merge Request to pass.
3. **Apply (`rune apply`)**: Upon merging to the main branch, the CI consumes all change files, bumps the version, updates the Markdown, and deletes the temporary files.

## Command Reference

### 1. `rune change`

**The "Intent" Phase.** Run this before you commit your code.

It starts an interactive prompt to capture the essence of your work. It checks if your branch is ahead of the target branch and generates a unique file: `<branch-name>_yyyy-mm-dd-hh-mm-ss-ms.json`.

**Change Types Definition:**
| Type | Description | Version Impact |
| :--- | :--- | :--- |
| **MAJOR** | Breaking changes (API renames, removing parameters). | `1.0.0` → `2.0.0` |
| **MINOR** | New features, backward compatible (new APIs). | `1.0.0` → `1.1.0` |
| **PATCH** | Bug fixes or private logic updates. | `1.0.0` → `1.0.1` |
| **NONE** | Tooling, refactoring, or internal config (ESLint, etc). | No Bump |

> [!TIP]
> Use the `--issueLinkPattern` flag (e.g., `https://jira.com/browse/{{issueId}}`) to automatically turn issue IDs into clickable links in your final changelog.

### 2. `rune verify`

**The "Gatekeeper" Phase.** Integrate this into your Pull Request / Merge Request CI.

It validates that the developer has provided documentation for their changes.

* **Success**: If no new commits are found or if a valid change file exists.
* **Failure**: If there are new commits but no change file (or an invalidly named one).

### 3. `rune apply`

**The "Execution" Phase.** Integrate this into your Main Branch CI.

This command performs the heavy lifting:

1. **Calculates** the aggregate version bump (e.g., if there are 5 patches and 1 major, it bumps to the next **Major**).
2. **Updates** `package.json` with the new version.
3. **Appends** entries to `CHANGELOG.md` and `CHANGELOG.json`.
4. **Cleans up** by deleting the processed change files.
5. **Commits and Pushes** the updates back to the repository using `[ci skip]`.

## Installation & Setup

### Install

```shell
npm install --save-dev @runespoorstack/changelog-manager

```

### Configure Scripts

Add the following to your `package.json`:

```json
{
  "scripts": {
    "changelog:change": "rune change --issueLinkPattern https://jira.com/browse/{{issueId}}",
    "changelog:verify": "rune verify",
    "changelog:apply": "rune apply"
  }
}

```

## CI/CD Integration (GitHub Actions)

### Step 1: Verify on Pull Request

Place this at the **beginning** of your pipeline to fail fast if documentation is missing.

```yaml
jobs:
  changelog-verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Verify Documentation
        run: npm run changelog:verify -- --sourceBranch origin/${{ github.head_ref || github.ref_name }} --remoteName origin

```

### Step 2: Apply on Merge to Main

Place this at the **end** of your pipeline after tests have passed.

```yaml
jobs:
  changelog-apply:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.PAT_TOKEN }} # Needs push access
      - run: |
          git config --global user.name "RunespoorBot"
          git config --global user.email "bot@runespoor.com"
      - run: npm ci
      - name: Release Version
        run: npm run changelog:apply

```

## Security: Why do we need a PAT?

The standard `GITHUB_TOKEN` provided by GitHub Actions is designed for "read-only" or limited internal actions to prevent unintended recursive triggers.

We require a **Personal Access Token (PAT)** specifically to **push commits** back to your repository. When `rune apply` updates your `package.json` and `CHANGELOG.md`, it needs write access to the repository to save those changes.

### How to generate a PAT:

1. Go to **[GitHub Settings > Developer settings](https://github.com/settings/tokens)**.
2. Select **Personal access tokens** > **Tokens (classic)**.
3. Click **Generate new token**.
4. Select the **`repo`** scope (this allows the bot to push commits to your repository).
5. Copy the token and save it in your repository under **Settings > Secrets and variables > Actions** as `PAT_TOKEN`.

> [!NOTE]
> For more details, see the official [GitHub Documentation on creating a Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).


## Data Structure

### `CHANGELOG.json`

The tool maintains a structured history for programmatic use:

```json
[
  {
    "version": "1.1.0",
    "date": "Tue, 03 Jan 2026 10:00:00 GMT",
    "type": "minor",
    "comment": "Added high-performance storage engine",
    "author": "BorisShulyak",
    "issueLinks": ["https://jira.com/browse/RS-42"]
  }
]

```

### `CHANGELOG.md`

The generated markdown is clean and human-readable:

```markdown
## 1.1.0
Tue, 03 Jan 2026 10:00:00 GMT

### MINOR
Added high-performance storage engine
Author: **BorisShulyak**
- https://jira.com/browse/RS-42

```

## Support & Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](https://github.com/runespoor-engineering/runespoorstack/blob/main/CONTRIBUTING.md).

If this tool saves you from merge-conflict headaches, consider supporting the maintainer:
📖 [Buy Boris a book](https://bmc.link/borisshulyak)

### Special Thanks

I want to say thank you to the best woman in the world, **my wife Diana** for her love, daily support, motivation and inspiration.
