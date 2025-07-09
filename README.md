<div align="center">
  <h1>@runespoorstack/{lib-name}</h1>
  <p>A modern TypeScript library template with production-ready tooling and best practices.</p>
  <div>
     <a href="https://www.buymeacoffee.com/borisshulyak" target="_blank">
      <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >
    </a>
  </div>
  <a href="https://github.com/runespoor-engineering/{repo-name}/blob/main/LICENSE">
    <img alt="GitHub License" src="https://img.shields.io/github/license/runespoor-engineering/{repo-name}">
  </a>
  <a href="https://github.com/runespoor-engineering/{repo-name}/issues">
    <img alt="GitHub issues" src="https://img.shields.io/github/issues/runespoor-engineering/{repo-name}?color=5d2de0">
  </a>
  <a href="https://www.npmjs.com/package/@runespoorstack/{lib-name}">
    <img alt="npm downloads" src="https://img.shields.io/npm/dw/@runespoorstack/{lib-name}">
  </a>
</div>

## 🚀 TS Library Template

This is a comprehensive **TypeScript library template** designed to jumpstart your npm package development with modern tooling, best practices, and production-ready configurations.

## ✨ Features

### 🔧 **Modern Build System**

- **TypeScript** - Full TypeScript support with strict mode and ESNext target
- **tsup** - Fast bundler with CommonJS and ESM output formats
- **Declaration files** - Automatic `.d.ts` generation for TypeScript consumers

### 🧪 **Testing & Quality**

- **Vitest** - Lightning-fast unit testing with coverage reporting
- **Biome** - Ultra-fast linting, formatting, and import organization
- **Coverage reporting** - V8 provider with HTML, LCOV, and JSON outputs
- **Codecov integration** - Automated coverage tracking and reporting

### 🔄 **Development Workflow**

- **Husky** - Git hooks for code quality enforcement
- **lint-staged** - Run linters on staged files only
- **GitHub Actions** - Complete CI/CD workflows for testing and publishing
- **Changelog management** - Automated changelog generation with Runespoor tools

### 📦 **Package Management**

- **pnpm** - Fast, disk space efficient package manager
- **Node.js 20+** - Modern Node.js runtime support
- **ESM/CJS dual exports** - Support for both module systems

## 🏁 Quick Start

### 1. **Use this template**

Click "Use this template" button or clone this repository:

```bash
git clone https://github.com/runespoor-engineering/ts-lib-template.git my-awesome-lib
cd my-awesome-lib
```

### 2. **Replace placeholders**

Replace the following placeholders throughout the project:

- `{lib-name}` - Your library name (e.g., `my-awesome-lib`)
- `{repo-name}` - Your repository name (e.g., `my-awesome-lib`)

**Files to update:**

- `package.json` - Package name, repository URLs
- `README.md` - Title, badges, and links
- `SECURITY.md` - Security policy references
- `CONTRIBUTING.md` - Clone command
- `.github/workflows/reusable-test.yml` - Codecov slug

### 3. **Install dependencies**

```bash
pnpm install
```

### 4. **Create your library**

Create a `src` directory and start building your library:

```bash
mkdir src
echo "export const hello = () => 'Hello, World!';" > src/index.ts
```

### 5. **Start developing**

```bash
# Run tests
pnpm test

# Build your library
pnpm build

# Lint and format
pnpm lint:fix
pnpm format:fix
```

## 📁 Project Structure

```
your-library/
├── src/                     # Your library source code
├── dist/                    # Built output (auto-generated)
├── .github/                 # GitHub workflows and templates
│   ├── workflows/           # CI/CD workflows
│   └── ISSUE_TEMPLATE/      # Issue templates
├── .husky/                  # Git hooks
├── package.json             # Package configuration
├── tsconfig.json            # TypeScript configuration
├── tsup.config.ts           # Build configuration
├── vitest.config.mjs        # Test configuration
├── biome.json               # Linting and formatting config
└── Documentation files      # README, CONTRIBUTING, etc.
```

## 🛠️ Available Scripts

| Script                  | Description                      |
| ----------------------- | -------------------------------- |
| `pnpm build`            | Build the library for production |
| `pnpm test`             | Run all tests                    |
| `pnpm test --ui`        | Run tests with UI                |
| `pnpm lint`             | Check code for linting issues    |
| `pnpm lint:fix`         | Fix linting issues automatically |
| `pnpm format`           | Check code formatting            |
| `pnpm format:fix`       | Fix formatting issues            |
| `pnpm changelog:change` | Add a new changelog entry        |
| `pnpm unimported`       | Find unused dependencies         |

## 🔧 Configuration

### **TypeScript**

- Strict mode enabled
- ESNext target and module
- Declaration files generated
- Source maps included

### **Build Output**

- CommonJS (`dist/index.js`)
- ES Modules (`dist/index.mjs`)
- TypeScript declarations (`dist/index.d.ts`)
- Minified for production

### **Testing**

- Global test environment
- Node.js environment
- Coverage thresholds configured
- HTML and LCOV reports

## 🚀 Publishing

The template includes automated publishing workflows:

1. **Manual publish** - Trigger releases manually
2. **Version management** - Automated version bumping
3. **NPM publishing** - Secure token-based publishing
4. **GitHub releases** - Automatic release notes

## 🏗️ What's Included

- ✅ TypeScript configuration
- ✅ Modern build system (tsup)
- ✅ Testing framework (Vitest)
- ✅ Code quality tools (Biome)
- ✅ Git hooks (Husky + lint-staged)
- ✅ GitHub Actions workflows
- ✅ Code coverage reporting
- ✅ Dependency management
- ✅ Security policies
- ✅ Contributing guidelines
- ✅ Issue templates
- ✅ Funding configuration

## 🛠️ Contributing

See the [CONTRIBUTING.md](https://github.com/runespoor-engineering/runespoorstack/blob/main/CONTRIBUTING.md) document.

## 💕 Special Thanks

- I want to say thank you to the best woman in the world, **my wife Diana** for her love, daily support, motivation and inspiration.

## ❤️ Support or Donate

If you are enjoying this work and feel extra appreciative, you could [buy me a book](https://bmc.link/borisshulyak)
📖 or 3 📖📖📖.
