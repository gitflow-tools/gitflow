# gitflow

An interactive terminal UI that simplifies and accelerates common Git workflows through guided actions, repository setup wizards, and command previews.

## Core Philosophy

gitflow makes common Git workflows faster without hiding Git itself. Every version is built around three principles:

1. **Fast** — reduce repetitive Git workflows
2. **Transparent** — show users what commands or actions will be performed
3. **Safe** — require confirmation before any repository-modifying operation

gitflow never silently performs Git operations.

## Features (v0.1.0)

- ✅ Interactive terminal UI with keyboard navigation
- ✅ Git installation detection on startup
- ✅ Current working directory detection
- ✅ Git repository detection
- ✅ Repository status dashboard
- ✅ Repository initialisation wizard (5-step guided flow)
- ✅ README.md generation
- ✅ `.gitignore` generation (Node.js, Python, Rust, Go, Java)
- ✅ Initial commit creation
- ✅ Action preview and confirmation before modifying repositories
- ✅ Overwrite protection for existing files
- ✅ Git identity error detection with helpful setup instructions
- ✅ Clear error messages for all failure cases

## Screenshots

> _Screenshots coming soon._

## Installation

### Prerequisites

- **Node.js** 20 or later
- **Git** installed and available in your PATH

### Global install (once published to npm)

```bash
npm install -g gitflow
gitflow
```

### From source

```bash
git clone https://github.com/yourname/gitflow.git
cd gitflow
npm install
npm run build
npm link
gitflow
```

## Development Setup

```bash
git clone https://github.com/yourname/gitflow.git
cd gitflow
npm install
```

### Available scripts

| Command                | Description                               |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Run in development mode (no build needed) |
| `npm run build`        | Compile TypeScript to `dist/`             |
| `npm run typecheck`    | Type-check without emitting files         |
| `npm run lint`         | Run ESLint                                |
| `npm run lint:fix`     | Run ESLint and auto-fix issues            |
| `npm run format`       | Format with Prettier                      |
| `npm run format:check` | Check formatting without writing          |
| `npm run test`         | Run the test suite once                   |
| `npm run test:watch`   | Run tests in watch mode                   |

## Usage

### Start the application

```bash
gitflow
```

or during development:

```bash
npm run dev
```

### Main menu

Use **↑ ↓** arrow keys to navigate and **Enter** to select.

- **Initialise Repository** — Launch the 5-step setup wizard
- **Repository Status** — View status of the current repository (only visible when inside a repo)
- **Exit** — Quit the application

### Repository Status

Displays:

- Repository root path
- Current branch
- Working tree state (clean/dirty)
- Number of modified, untracked, and staged files
- Configured remotes
- Most recent commit hash and message

Press **Escape** or **Q** to return to the main menu.

### Initialisation Wizard

A 5-step guided flow:

1. **Directory** — Choose the directory to initialise (defaults to CWD)
2. **Repository Name** — Used as the README title
3. **README** — Optionally generate a `README.md`
4. **.gitignore** — Choose a language template or skip
5. **Commit Message** — Set the initial commit message (default: `Initial commit`)

Before executing, gitflow shows a complete summary of planned actions. Nothing is modified until you explicitly select **Execute Setup**.

If files already exist (`README.md` or `.gitignore`), gitflow asks for confirmation before overwriting them.

## Project Structure

```
gitflow/
├── src/
│   ├── cli/
│   │   └── index.ts          # Entry point, startup checks, Ink render
│   │
│   ├── git/
│   │   ├── client.ts         # simple-git wrapper (all git operations)
│   │   ├── repository.ts     # High-level repository operations
│   │   └── types.ts          # Git domain types
│   │
│   ├── ui/
│   │   ├── App.tsx           # Root component, screen routing
│   │   │
│   │   ├── screens/
│   │   │   ├── MainMenu.tsx
│   │   │   ├── RepositoryStatus.tsx
│   │   │   └── InitWizard.tsx
│   │   │
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── Menu.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── ErrorDisplay.tsx
│   │       └── StatusBadge.tsx
│   │
│   ├── templates/
│   │   └── gitignore.ts      # Language gitignore templates (static strings)
│   │
│   └── utils/
│       ├── paths.ts          # Path helpers
│       └── errors.ts         # Typed error classes
│
├── tests/
│   ├── git/
│   │   ├── client.test.ts
│   │   └── repository.test.ts
│   ├── templates/
│   │   └── gitignore.test.ts
│   └── utils/
│       ├── paths.test.ts
│       └── errors.test.ts
│
├── README.md
├── LICENSE
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.js
├── vitest.config.ts
├── .prettierrc
└── .gitignore
```

## Technology

| Tool                                             | Purpose                                      |
| ------------------------------------------------ | -------------------------------------------- |
| [Ink](https://github.com/vadimdemedes/ink)       | Terminal UI rendering (React for CLIs)       |
| [React](https://react.dev)                       | Component model                              |
| [simple-git](https://github.com/steveukx/git-js) | Safe git operations (no shell interpolation) |
| [TypeScript](https://typescriptlang.org)         | Strict type safety                           |
| [Vitest](https://vitest.dev)                     | Testing                                      |
| [ESLint](https://eslint.org)                     | Linting                                      |
| [Prettier](https://prettier.io)                  | Formatting                                   |

## Safety Philosophy

gitflow treats your repository as precious.

- **No silent operations**: Every action that modifies a repository is shown to the user before execution.
- **Explicit confirmation**: The user must actively select "Execute Setup" — there is no auto-proceed.
- **Overwrite protection**: Existing files (`README.md`, `.gitignore`) trigger a confirmation dialog.
- **No shell interpolation**: All git operations use `simple-git`'s safe argument-array API. User input is never concatenated into shell strings.
- **No destructive operations in v0.1.0**: The only operations are `git init`, `git add`, and `git commit`.

## Roadmap

### v0.2.0

- Branch management (create, switch, list)
- Stage and unstage individual files
- Stash management

### v0.3.0

- Commit history browser
- Interactive staging (hunk selection)
- Branch diff viewer

### Future

- GitHub integration (PRs, issues)
- Repository health diagnostics
- Custom workflow templates
- Plugin system

## Contributing

Contributions are welcome. Please open an issue before submitting a PR for significant changes.

## License

[MIT](LICENSE)
