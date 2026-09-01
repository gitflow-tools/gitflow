# gitflow

> A faster, guided way to work with Git.

gitflow is an interactive terminal user interface designed to simplify and accelerate common Git workflows.

Instead of memorising long sequences of Git commands, gitflow guides users through common tasks such as initialising repositories, creating commits, managing branches, configuring remotes, and pushing projects to Git hosting platforms.

gitflow is designed to improve Git workflows without hiding Git itself. Before actions are performed, users can preview the commands that will be executed.

## Features

### Guided Repository Setup

Create and configure a Git repository through an interactive step-by-step wizard.

The setup process can handle:

* Repository initialisation
* Directory selection
* README generation
* `.gitignore` templates
* Default branch configuration
* Initial commits
* Remote repository setup
* Remote URL configuration
* Pushing the initial branch

Example workflow:

```text
Repository Setup

Step 1/6

Directory:

> ~/Projects/my-project


Step 2/6

Repository name:

> my-project


Step 3/6

Create a README?

> Yes


Step 4/6

Select a .gitignore template:

> Node.js
  Python
  Rust
  Go
  Java
  None


Step 5/6

Add a remote repository?

> GitHub
  GitLab
  Custom
  No remote


Step 6/6

Initial commit message:

> Initial project setup
```

Before executing the setup, gitflow displays a summary of the planned actions.

```text
Repository Plan

Directory
~/Projects/my-project

Git
✓ Initialise repository
✓ Create main branch

Files
✓ README.md
✓ .gitignore

Remote
✓ origin

Commit
✓ Initial project setup

Commands:

1. git init
2. git add .
3. git commit -m "Initial project setup"
4. git branch -M main
5. git remote add origin <remote-url>
6. git push -u origin main

> Execute Setup
  Cancel
```

## Repository Dashboard

When gitflow is opened inside an existing repository, it provides an overview of the current repository state.

```text
Repository: gitflow

Branch
main

Changes
3 modified
2 untracked

Remote
origin

Last Commit
feat: add repository setup wizard

What would you like to do?

> View Changes
  Commit Changes
  Push Changes
  Pull Changes
  Branch Management
  Remote Management
```

## Commit Assistant

gitflow provides an interactive workflow for creating commits.

Users can:

* View modified files
* Select files to stage
* Stage all changes
* Enter commit messages
* Use conventional commit prefixes
* Preview the final commit

Example:

```text
Changed Files

> src/git/init.ts
  src/ui/menu.ts
  README.md

Commit Type

> feat
  fix
  docs
  refactor
  test
  chore

Description:

> add repository setup wizard

Commit Preview:

feat: add repository setup wizard
```

## Branch Management

Manage branches through an interactive interface.

Features planned include:

* Create branches
* Switch branches
* Rename branches
* Delete branches
* Merge branches
* View branch information

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

* TypeScript
* Node.js
* Ink
* React
* Git
* simple-git
* GitHub CLI or GitHub API

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
git clone https://github.com/YOUR-USERNAME/gitflow.git
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
│   ├── index.ts
│   │
│   ├── commands/
│   │   ├── init.ts
│   │   ├── status.ts
│   │   ├── commit.ts
│   │   ├── branch.ts
│   │   ├── remote.ts
│   │   └── doctor.ts
│   │
│   ├── git/
│   │   ├── client.ts
│   │   ├── repository.ts
│   │   └── parser.ts
│   │
│   ├── ui/
│   │   ├── app.tsx
│   │   ├── menu.tsx
│   │   ├── wizard.tsx
│   │   └── components/
│   │
│   ├── services/
│   │   ├── github.ts
│   │   └── config.ts
│   │
│   └── utils/
│       ├── logger.ts
│       └── validation.ts
│
├── tests/
├── README.md
├── package.json
└── tsconfig.json
```

## Roadmap

### v0.1.0

* [ ] Basic terminal user interface
* [ ] Git installation detection
* [ ] Repository detection
* [ ] Repository status
* [ ] Repository initialisation

### v0.2.0

* [ ] Guided repository setup
* [ ] Directory selection
* [ ] README generation
* [ ] `.gitignore` templates
* [ ] Initial commit workflow
* [ ] Remote configuration
* [ ] Command previews

### v0.3.0

* [ ] File staging
* [ ] Commit assistant
* [ ] Conventional commit support
* [ ] Push workflow
* [ ] Pull workflow

### v0.4.0

* [ ] Branch creation
* [ ] Branch switching
* [ ] Branch deletion
* [ ] Branch merging
* [ ] Branch information

### v0.5.0

* [ ] Git recipes
* [ ] Repository Doctor
* [ ] Configuration system
* [ ] Themes

### v1.0.0

* [ ] GitHub integration
* [ ] Repository creation
* [ ] GitHub authentication
* [ ] Automated remote setup
* [ ] Release binaries
* [ ] Documentation
* [ ] Full test coverage

## Why gitflow?

Git is an extremely powerful tool, but common workflows often require remembering multiple commands, flags, and arguments.

gitflow aims to reduce the friction involved in these workflows without replacing Git or hiding how Git works.

The goal is simple:

> Make common Git workflows faster while making Git easier to understand.

## License

Gitflow Community License V1.0