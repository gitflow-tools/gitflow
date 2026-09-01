<p align="center">
  <img src="https://images.guns.lol/a67690a57b1298218a8bc834edbb5f30b77695b8/fEjf3P.png" alt="gitflow logo" width="120" />
</p>

# gitflow

> A faster, guided way to work with Git.

gitflow is an interactive terminal user interface designed to simplify and accelerate common Git workflows.

Instead of memorising long sequences of Git commands, gitflow guides users through common tasks such as initialising repositories, creating commits, managing branches, configuring remotes, and pushing projects to Git hosting platforms.

gitflow is designed to improve Git workflows without hiding Git itself. Before actions are performed, users can preview the commands that will be executed.

## Features

### Guided Repository Setup

Create and configure a Git repository through an interactive step-by-step wizard.

The setup process can handle:

- Repository initialisation
- Directory selection
- README generation
- `.gitignore` templates
- Default branch configuration
- Initial commits
- Remote repository setup
- Remote URL configuration
- Pushing the initial branch

Example workflow:

```text
Step 1/7 — Select Directory
Current directory: ~/Projects
Where would you like to initialise the repository?
> Use current directory
  Enter custom path

Step 2/7 — Repository Details
Repository name:
> my-project

Step 3/7 — README
Create a README?
> Yes
  No

Step 4/7 — .gitignore
Select a .gitignore template:
> Node.js
  Python
  Rust
  Go
  Java
  None

Step 5/7 — Initial Commit
Create an initial commit?
> Yes
  No

Step 6/7 — Remote Repository
Would you like to add a remote?
> Yes
  No

Step 7/7 — Review and Execute
```

Before executing the setup, gitflow displays a summary of the planned actions and commands:

```text
Repository Setup Plan

Directory:
~/Projects/my-project

Repository:
my-project

Files:
✓ README.md
✓ .gitignore (Node.js)

Git:
✓ Initialise repository
✓ Set default branch to main

Commit:
✓ Initial commit

Message:
Initial commit

Remote:
✓ origin
https://github.com/username/my-project.git

Push:
✓ Enabled

────────────────────────────────────────────

Commands and actions:
1. Create README.md
2. Create .gitignore (Node.js)
3. git init
4. git branch -M main
5. git add README.md .gitignore
6. git commit -m "Initial commit"
7. git remote add origin https://github.com/username/my-project.git
8. git push -u origin main

────────────────────────────────────────────

> Execute Setup
  Go Back
  Cancel
```

### Interactive staging

Select and stage individual files or manage all changes at once.

### Commit assistant

Create commits through a guided workflow with previews before execution.

### Conventional commits

Generate structured Conventional Commit messages through an interactive assistant.

### Push and pull workflows

Synchronise repositories through guided push and pull workflows with safety checks.

## Repository Dashboard

When gitflow is opened inside an existing repository, it provides an overview of the current repository state.

```text
Repository: gitflow

Branch
main (tracking origin/main)

Working Tree
3 changes

Staged:
  M  src/index.ts

Modified:
  M  README.md

Untracked:
  ?  src/utils/logger.ts

What would you like to do?

> Status
  Stage Changes
  Commit
  Push
  Pull
  Repository Setup
  Exit
```

## Branch Management

Manage branches through an interactive interface.

Features planned include:

- Create branches
- Switch branches
- Rename branches
- Delete branches
- Merge branches
- View branch information

## Git Recipes

Git recipes allow users to select what they want to achieve instead of remembering the exact Git commands required.

Examples:

```text
What would you like to do?

> Start a new project
  Upload an existing project to GitHub
  Create a feature branch
  Commit changes
  Save work temporarily
  Undo my last commit
  Update my branch
  Resolve a merge conflict
```

gitflow then guides the user through the required steps.

## Command Preview

gitflow is designed to remain transparent.

Before commands are executed, users can preview exactly what will happen.

```text
Commands to execute:

1. git init
2. git add .
3. git commit -m "Initial commit"
4. git branch -M main
5. git remote add origin <url>
6. git push -u origin main

> Execute
  Copy Commands
  Cancel
```

This allows users to learn Git while using gitflow.

## Repository Doctor

A planned repository health checker that analyses common Git configuration issues.

Example:

```text
gitflow doctor

Repository
✓ Valid Git repository

Remote
✓ Origin configured
✓ Remote reachable

Branch
✓ Tracking remote branch

Working Tree
Warning: 12 uncommitted changes

Large Files
Warning: node_modules detected
✓ .gitignore configured

Git Configuration
✓ User name configured
✓ User email configured

Recommended Actions

1. Commit or stash current changes
2. Add node_modules to .gitignore
```

## Principles

### Fast

Reduce repetitive Git workflows into guided actions.

### Transparent

Show the commands being executed instead of hiding Git behind abstractions.

### Safe

Warn users before destructive operations and clearly explain potential consequences.

### Educational

Help users understand Git workflows by exposing the underlying commands and processes.

## Tech Stack

- TypeScript
- Node.js
- Ink
- React
- Git
- simple-git
- GitHub CLI or GitHub API

## Installation

Installation instructions will be added once the first release is available.

```bash
npm install -g gitflow
```

## Usage

Start gitflow:

```bash
gitflow
```

Run gitflow inside an existing repository:

```bash
cd my-project
gitflow
```

## Development

Clone the repository:

```bash
git clone https://github.com/gitflow-tools/gitflow.git
cd gitflow
```

Install dependencies:

```bash
npm install
```

Start the development environment:

```bash
npm run dev
```

## Project Structure

```text
gitflow/
├── src/
│   ├── cli/
│   │   └── index.ts
│   ├── commit/
│   │   └── conventional.ts
│   ├── git/
│   │   ├── client.ts
│   │   ├── remote.ts
│   │   ├── repository.ts
│   │   └── types.ts
│   ├── setup/
│   │   ├── executor.ts
│   │   ├── plan.ts
│   │   ├── types.ts
│   │   └── validation.ts
│   ├── templates/
│   │   ├── gitignore.ts
│   │   └── readme.ts
│   ├── ui/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── CommandPreview.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── ErrorDisplay.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Menu.tsx
│   │   │   ├── ProgressIndicator.tsx
│   │   │   └── StatusBadge.tsx
│   │   └── screens/
│   │       ├── MainMenu.tsx
│   │       ├── RepositoryStatus.tsx
│   │       ├── InitWizard.tsx
│   │       ├── staging/
│   │       │   ├── StagingScreen.tsx
│   │       │   ├── FileSelector.tsx
│   │       │   └── DiffViewer.tsx
│   │       ├── commit/
│   │       │   └── CommitScreen.tsx
│   │       ├── push/
│   │       │   └── PushScreen.tsx
│   │       ├── pull/
│   │       │   └── PullScreen.tsx
│   │       └── setup/
│   │           ├── SetupWizard.tsx
│   │           ├── DirectoryStep.tsx
│   │           ├── RepositoryDetailsStep.tsx
│   │           ├── ReadmeStep.tsx
│   │           ├── GitignoreStep.tsx
│   │           ├── CommitStep.tsx
│   │           ├── RemoteStep.tsx
│   │           ├── ReviewStep.tsx
│   │           └── ExecutionStep.tsx
│   └── utils/
│       ├── errors.ts
│       └── paths.ts
├── tests/
├── README.md
├── package.json
└── tsconfig.json
```

## Roadmap

### v0.1.0

- [x] Basic TUI
- [x] Git detection
- [x] Repository detection
- [x] Repository status
- [x] Repository initialisation

### v0.2.0

- [x] Guided repository setup
- [x] Directory selection
- [x] README generation
- [x] `.gitignore` templates
- [x] Initial commit workflow
- [x] Remote configuration
- [x] Command previews

### v0.3.0

- [x] File staging
- [x] Commit assistant
- [x] Conventional commit support
- [x] Push workflow
- [x] Pull workflow

### v0.4.0

- [ ] Branch creation
- [ ] Branch switching
- [ ] Branch deletion
- [ ] Branch merging
- [ ] Branch information

### v0.5.0

- [ ] Git recipes
- [ ] Repository Doctor
- [ ] Configuration system
- [ ] Themes

### v1.0.0

- [ ] GitHub integration
- [ ] Repository creation
- [ ] GitHub authentication
- [ ] Automated remote setup
- [ ] Release binaries
- [ ] Documentation
- [ ] Full test coverage

## Why gitflow?

Git is an extremely powerful tool, but common workflows often require remembering multiple commands, flags, and arguments.

gitflow aims to reduce the friction involved in these workflows without replacing Git or hiding how Git works.

The goal is simple:

> Make common Git workflows faster while making Git easier to understand.

## License

Gitflow Community License V1.0
