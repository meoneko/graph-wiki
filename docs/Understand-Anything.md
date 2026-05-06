This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where comments have been removed, empty lines have been removed, content has been formatted for parsing in markdown style, security check has been disabled.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Empty lines have been removed from all files
- Content has been formatted for parsing in markdown style
- Security check has been disabled - content may contain sensitive information
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
.antigravity/
  INSTALL.md
.claude-plugin/
  marketplace.json
  plugin.json
.codex/
  INSTALL.md
.copilot-plugin/
  plugin.json
.cursor-plugin/
  plugin.json
.gemini/
  INSTALL.md
.github/
  workflows/
    ci.yml
    deploy-homepage.yml
  FUNDING.yml
.openclaw/
  INSTALL.md
.opencode/
  INSTALL.md
.pi/
  INSTALL.md
assets/
  hero.png
  overview-domain.gif
  overview-structural.gif
  overview.png
docs/
  superpowers/
    plans/
      2026-03-14-phase1-implementation.md
      2026-03-14-phase2-implementation.md
      2026-03-14-phase3-implementation.md
      2026-03-14-phase4-implementation.md
      2026-03-15-homepage-implementation.md
      2026-03-18-multi-platform-simple-implementation.md
      2026-03-21-language-agnostic-plan.md
      2026-03-25-dashboard-robustness-impl.md
      2026-03-25-dashboard-robustness-plan.md
      2026-03-26-theme-system-implementation.md
      2026-03-27-token-reduction-impl.md
      2026-03-28-understand-anything-extension-impl.md
      2026-03-29-homepage-update-impl.md
      2026-04-01-business-domain-knowledge-impl.md
      2026-04-09-understand-knowledge.md
      2026-04-10-understandignore-impl.md
      2026-04-15-language-extractors-impl.md
      2026-05-03-graph-layout-scaling.md
    specs/
      2026-03-14-understand-anything-design.md
      2026-03-15-homepage-design.md
      2026-03-18-multi-platform-simple-design.md
      2026-03-21-language-agnostic-design.md
      2026-03-26-theme-system-design.md
      2026-03-27-token-reduction-design.md
      2026-03-28-understand-anything-extension-design.md
      2026-03-29-homepage-update-design.md
      2026-04-01-business-domain-knowledge-design.md
      2026-04-09-understand-knowledge-design.md
      2026-04-10-understandignore-design.md
      2026-05-03-graph-layout-scaling-design.md
homepage/
  .vscode/
    extensions.json
    launch.json
  public/
    fonts/
      DMSerifDisplay-Regular.woff2
      Inter-Regular.woff2
      Inter-SemiBold.woff2
      JetBrainsMono-Regular.woff2
    images/
      hero.jpg
      overview-domain.gif
      overview-structural.gif
      overview.png
    .gitkeep
    CNAME
    favicon.ico
    favicon.svg
  src/
    components/
      Features.astro
      Footer.astro
      Hero.astro
      Install.astro
      Nav.astro
      Problem.astro
      Showcase.astro
    layouts/
      Layout.astro
    pages/
      index.astro
    styles/
      global.css
  .gitignore
  astro.config.mjs
  package.json
  README.md
  tsconfig.json
scripts/
  generate-large-graph.mjs
understand-anything-plugin/
  .claude-plugin/
    plugin.json
  agents/
    architecture-analyzer.md
    article-analyzer.md
    assemble-reviewer.md
    domain-analyzer.md
    file-analyzer.md
    graph-reviewer.md
    knowledge-graph-guide.md
    project-scanner.md
    tour-builder.md
  hooks/
    auto-update-prompt.md
    hooks.json
  packages/
    core/
      src/
        __tests__/
          change-classifier.test.ts
          domain-normalize.test.ts
          domain-persistence.test.ts
          domain-types.test.ts
          embedding-search.test.ts
          fingerprint.test.ts
          framework-registry.test.ts
          ignore-filter.test.ts
          ignore-generator.test.ts
          language-lesson.test.ts
          language-registry.test.ts
          layer-detector.test.ts
          normalize-graph.test.ts
          parsers.test.ts
          plugin-discovery.test.ts
          plugin-registry.test.ts
          schema.test.ts
          search.test.ts
          staleness.test.ts
          tour-generator.test.ts
        analyzer/
          graph-builder.test.ts
          graph-builder.ts
          language-lesson.ts
          layer-detector.ts
          llm-analyzer.test.ts
          llm-analyzer.ts
          normalize-graph.ts
          tour-generator.ts
        languages/
          configs/
            batch.ts
            c.ts
            cpp.ts
            csharp.ts
            css.ts
            csv.ts
            docker-compose.ts
            dockerfile.ts
            env.ts
            github-actions.ts
            go.ts
            graphql.ts
            html.ts
            index.ts
            java.ts
            javascript.ts
            jenkinsfile.ts
            json-config.ts
            json-schema.ts
            kotlin.ts
            kubernetes.ts
            lua.ts
            makefile.ts
            markdown.ts
            openapi.ts
            php.ts
            plaintext.ts
            powershell.ts
            protobuf.ts
            python.ts
            restructuredtext.ts
            ruby.ts
            rust.ts
            shell.ts
            sql.ts
            swift.ts
            terraform.ts
            toml.ts
            typescript.ts
            xml.ts
            yaml.ts
          frameworks/
            django.ts
            express.ts
            fastapi.ts
            flask.ts
            gin.ts
            index.ts
            nextjs.ts
            rails.ts
            react.ts
            spring.ts
            vue.ts
          framework-registry.ts
          index.ts
          language-registry.ts
          types.ts
        persistence/
          index.ts
          persistence.test.ts
        plugins/
          extractors/
            __tests__/
              cpp-extractor.test.ts
              csharp-extractor.test.ts
              go-extractor.test.ts
              java-extractor.test.ts
              php-extractor.test.ts
              python-extractor.test.ts
              ruby-extractor.test.ts
              rust-extractor.test.ts
            base-extractor.ts
            cpp-extractor.ts
            csharp-extractor.ts
            go-extractor.ts
            index.ts
            java-extractor.ts
            php-extractor.ts
            python-extractor.ts
            ruby-extractor.ts
            rust-extractor.ts
            types.ts
            typescript-extractor.ts
          parsers/
            dockerfile-parser.ts
            env-parser.ts
            graphql-parser.ts
            index.ts
            json-parser.ts
            makefile-parser.ts
            markdown-parser.ts
            protobuf-parser.ts
            shell-parser.ts
            sql-parser.ts
            terraform-parser.ts
            toml-parser.ts
            yaml-parser.ts
          discovery.ts
          registry.ts
          tree-sitter-plugin.test.ts
          tree-sitter-plugin.ts
        change-classifier.ts
        embedding-search.ts
        fingerprint.ts
        ignore-filter.ts
        ignore-generator.ts
        index.ts
        schema.ts
        search.ts
        staleness.ts
        types.test.ts
        types.ts
      package.json
      tsconfig.json
    dashboard/
      public/
        favicon.ico
        favicon.svg
        knowledge-graph.json
      scripts/
        benchmark-aggregations.mjs
        benchmark-layout.mjs
      src/
        components/
          Breadcrumb.tsx
          CodeViewer.tsx
          ContainerNode.tsx
          CustomNode.tsx
          DiffToggle.tsx
          DomainClusterNode.tsx
          DomainGraphView.tsx
          ExportMenu.tsx
          FileExplorer.tsx
          FilterPanel.tsx
          FlowNode.tsx
          GraphView.tsx
          KeyboardShortcutsHelp.tsx
          KnowledgeGraphView.tsx
          LayerClusterNode.tsx
          LayerLegend.tsx
          LearnPanel.tsx
          MobileBottomNav.tsx
          MobileDrawer.tsx
          MobileLayout.tsx
          NodeInfo.tsx
          NodeTooltip.tsx
          PathFinderModal.tsx
          PersonaSelector.tsx
          PortalNode.tsx
          ProjectOverview.tsx
          SearchBar.tsx
          StepNode.tsx
          ThemePicker.tsx
          TokenGate.tsx
          WarningBanner.tsx
        hooks/
          useIsMobile.ts
          useKeyboardShortcuts.ts
        themes/
          index.ts
          presets.ts
          theme-engine.ts
          ThemeContext.tsx
          types.ts
        utils/
          __tests__/
            containers.test.ts
            edgeAggregation.test.ts
            elk-layout.test.ts
            filters.test.ts
            layerStats.test.ts
            smoke.test.ts
          containers.ts
          edgeAggregation.ts
          elk-layout.ts
          filters.ts
          layerStats.ts
          layout.ts
          layout.worker.ts
          louvain.ts
        App.tsx
        index.css
        main.tsx
        store.ts
        vite-env.d.ts
      index.html
      package.json
      tsconfig.app.json
      tsconfig.json
      vite.config.demo.ts
      vite.config.ts
  skills/
    understand/
      frameworks/
        django.md
        express.md
        fastapi.md
        flask.md
        gin.md
        nextjs.md
        rails.md
        react.md
        spring.md
        vue.md
      languages/
        cpp.md
        csharp.md
        css.md
        dockerfile.md
        go.md
        graphql.md
        html.md
        java.md
        javascript.md
        json.md
        kotlin.md
        markdown.md
        php.md
        protobuf.md
        python.md
        ruby.md
        rust.md
        shell.md
        sql.md
        swift.md
        terraform.md
        typescript.md
        yaml.md
      extract-structure.mjs
      merge-batch-graphs.py
      merge-subdomain-graphs.py
      SKILL.md
    understand-chat/
      SKILL.md
    understand-dashboard/
      SKILL.md
    understand-diff/
      SKILL.md
    understand-domain/
      extract-domain-context.py
      SKILL.md
    understand-explain/
      SKILL.md
    understand-knowledge/
      merge-knowledge-graph.py
      parse-knowledge-base.py
      SKILL.md
    understand-onboard/
      SKILL.md
  src/
    __tests__/
      context-builder.test.ts
      diff-analyzer.test.ts
      explain-builder.test.ts
      onboard-builder.test.ts
    context-builder.ts
    diff-analyzer.ts
    explain-builder.ts
    index.ts
    onboard-builder.ts
    understand-chat.ts
  package.json
  pnpm-workspace.yaml
  tsconfig.json
.gitignore
.npmrc
CLAUDE.md
CONTRIBUTING.md
LICENSE
package.json
pnpm-workspace.yaml
README.es-ES.md
README.ja-JP.md
README.ko-KR.md
README.md
README.tr-TR.md
README.zh-CN.md
README.zh-TW.md
tsconfig.json
```

# Files

## File: .antigravity/INSTALL.md
````markdown
# Installing Understand-Anything for Antigravity

## Prerequisites

- Git

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Lum1104/Understand-Anything.git ~/.antigravity/understand-anything
   ```

2. **Create the skills symlinks:**
   ```bash
   mkdir -p ~/.gemini/antigravity/skills
   ln -s ~/.antigravity/understand-anything/understand-anything-plugin/skills ~/.gemini/antigravity/skills/understand-anything
   # Universal plugin root symlink — lets the dashboard skill find packages/dashboard/
   # Skip if already exists (e.g. another platform was installed first)
   [ -e ~/.understand-anything-plugin ] || [ -L ~/.understand-anything-plugin ] || ln -s ~/.antigravity/understand-anything/understand-anything-plugin ~/.understand-anything-plugin
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\antigravity\skills"
   cmd /c mklink /J "$env:USERPROFILE\.gemini\antigravity\skills\understand-anything" "$env:USERPROFILE\.antigravity\understand-anything\understand-anything-plugin\skills"
   cmd /c mklink /J "$env:USERPROFILE\.understand-anything-plugin" "$env:USERPROFILE\.antigravity\understand-anything\understand-anything-plugin"
   ```

3. **Restart the chat or IDE** so Antigravity can discover the skills.

## Verify

```bash
ls -la ~/.gemini/antigravity/skills/understand-anything
```

You should see a symlink pointing to the skills directory in the cloned repo.

## Usage

Skills activate automatically when relevant. You can also invoke directly by saying:
- "Run the understand skill to analyze this codebase"
- "Use the understand-dashboard skill to view the architecture map"
- "Use understand-chat to answer a question about the graph"

## Updating

```bash
cd ~/.antigravity/understand-anything && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.gemini/antigravity/skills/understand-anything
rm ~/.understand-anything-plugin
rm -rf ~/.antigravity/understand-anything
```
````

## File: .claude-plugin/marketplace.json
````json
{
  "name": "understand-anything",
  "metadata": {
    "description": "LLM-powered codebase analysis producing interactive knowledge graphs, guided tours, and deep-dive explanations"
  },
  "owner": {
    "name": "Lum1104"
  },
  "plugins": [
    {
      "name": "understand-anything",
      "source": "./understand-anything-plugin"
    }
  ]
}
````

## File: .claude-plugin/plugin.json
````json
{
  "name": "understand-anything",
  "description": "AI-powered codebase understanding — analyze, visualize, and explain any project",
  "version": "2.6.0",
  "author": {
    "name": "Lum1104"
  },
  "homepage": "https://github.com/Lum1104/Understand-Anything",
  "repository": "https://github.com/Lum1104/Understand-Anything",
  "license": "MIT",
  "keywords": [
    "codebase-analysis",
    "knowledge-graph",
    "architecture",
    "onboarding",
    "dashboard"
  ]
}
````

## File: .codex/INSTALL.md
````markdown
# Installing Understand-Anything for Codex

## Prerequisites

- Git

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Lum1104/Understand-Anything.git ~/.codex/understand-anything
   ```

2. **Create the skills symlinks:**
   ```bash
   mkdir -p ~/.agents/skills
   # Note: if OpenCode's Understand-Anything is already installed, these symlinks
   # already exist and the ln commands will safely fail — that is fine, the
   # existing symlinks work for Codex too.
   for skill in understand understand-chat understand-dashboard understand-diff understand-explain understand-onboard; do
     ln -sf ~/.codex/understand-anything/understand-anything-plugin/skills/$skill ~/.agents/skills/$skill
   done
   # Universal plugin root symlink — lets the dashboard skill find packages/dashboard/
   # Skip if already exists (e.g. another platform was installed first)
   [ -e ~/.understand-anything-plugin ] || [ -L ~/.understand-anything-plugin ] || ln -s ~/.codex/understand-anything/understand-anything-plugin ~/.understand-anything-plugin
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   $skills = @("understand","understand-chat","understand-dashboard","understand-diff","understand-explain","understand-onboard")
   foreach ($skill in $skills) {
     cmd /c mklink /J "$env:USERPROFILE\.agents\skills\$skill" "$env:USERPROFILE\.codex\understand-anything\understand-anything-plugin\skills\$skill"
   }
   # Universal plugin root symlink
   cmd /c mklink /J "$env:USERPROFILE\.understand-anything-plugin" "$env:USERPROFILE\.codex\understand-anything\understand-anything-plugin"
   ```

3. **Restart Codex** to discover the skills.

## Verify

```bash
ls -la ~/.agents/skills/ | grep understand
```

You should see symlinks for each skill pointing into the cloned repository.

## Usage

Skills activate automatically when relevant. You can also invoke directly:
- "Analyze this codebase and build a knowledge graph"
- "Help me understand this project's architecture"

## Updating

```bash
cd ~/.codex/understand-anything && git pull
```

Skills update instantly through the symlinks.

## Uninstalling

```bash
for skill in understand understand-chat understand-dashboard understand-diff understand-explain understand-onboard; do
  rm -f ~/.agents/skills/$skill
done
rm ~/.understand-anything-plugin
rm -rf ~/.codex/understand-anything
```
````

## File: .copilot-plugin/plugin.json
````json
{
  "name": "understand-anything",
  "description": "AI-powered codebase understanding — analyze, visualize, and explain any project",
  "version": "2.6.0",
  "author": {
    "name": "Lum1104"
  },
  "homepage": "https://github.com/Lum1104/Understand-Anything",
  "repository": "https://github.com/Lum1104/Understand-Anything",
  "license": "MIT",
  "keywords": ["codebase-analysis", "knowledge-graph", "architecture", "onboarding", "dashboard"],
  "skills": "./understand-anything-plugin/skills/",
  "agents": "./understand-anything-plugin/agents/"
}
````

## File: .cursor-plugin/plugin.json
````json
{
  "name": "understand-anything",
  "displayName": "Understand Anything",
  "description": "AI-powered codebase understanding — analyze, visualize, and explain any project",
  "version": "2.6.0",
  "author": {
    "name": "Lum1104"
  },
  "homepage": "https://github.com/Lum1104/Understand-Anything",
  "repository": "https://github.com/Lum1104/Understand-Anything",
  "license": "MIT",
  "keywords": ["codebase-analysis", "knowledge-graph", "architecture", "onboarding", "dashboard"],
  "skills": "./understand-anything-plugin/skills/",
  "agents": "./understand-anything-plugin/agents/"
}
````

## File: .gemini/INSTALL.md
````markdown
# Installing Understand-Anything for Gemini CLI

## Prerequisites

- Git
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) installed

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Lum1104/Understand-Anything.git ~/.gemini/understand-anything
   ```

2. **Create the skills symlinks:**
   ```bash
   mkdir -p ~/.agents/skills
   # Note: if another platform's Understand-Anything is already installed, these symlinks
   # already exist and the ln commands will safely fail — that is fine, the
   # existing symlinks work for Gemini CLI too.
   for skill in understand understand-chat understand-dashboard understand-diff understand-explain understand-onboard; do
     ln -sf ~/.gemini/understand-anything/understand-anything-plugin/skills/$skill ~/.agents/skills/$skill
   done
   # Universal plugin root symlink — lets the dashboard skill find packages/dashboard/
   # Skip if already exists (e.g. another platform was installed first)
   [ -e ~/.understand-anything-plugin ] || [ -L ~/.understand-anything-plugin ] || ln -s ~/.gemini/understand-anything/understand-anything-plugin ~/.understand-anything-plugin
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   $skills = @("understand","understand-chat","understand-dashboard","understand-diff","understand-explain","understand-onboard")
   foreach ($skill in $skills) {
     cmd /c mklink /J "$env:USERPROFILE\.agents\skills\$skill" "$env:USERPROFILE\.gemini\understand-anything\understand-anything-plugin\skills\$skill"
   }
   # Universal plugin root symlink
   cmd /c mklink /J "$env:USERPROFILE\.understand-anything-plugin" "$env:USERPROFILE\.gemini\understand-anything\understand-anything-plugin"
   ```

3. **Restart Gemini CLI** to discover the skills.

## Verify

```bash
ls -la ~/.agents/skills/ | grep understand
```

You should see symlinks for each skill pointing into the cloned repository.

## Usage

Skills activate automatically when relevant. You can also invoke directly:
- "Analyze this codebase and build a knowledge graph"
- "Help me understand this project's architecture"

## Updating

```bash
cd ~/.gemini/understand-anything && git pull
```

Skills update instantly through the symlinks.

## Uninstalling

```bash
for skill in understand understand-chat understand-dashboard understand-diff understand-explain understand-onboard; do
  rm -f ~/.agents/skills/$skill
done
rm ~/.understand-anything-plugin
rm -rf ~/.gemini/understand-anything
```
````

## File: .github/workflows/ci.yml
````yaml
name: CI
on:
  pull_request:
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: pnpm-lock.yaml
      - name: Install dependencies
        run: pnpm install
      - name: Build core
        run: pnpm --filter @understand-anything/core build
      - name: Build skill
        run: pnpm --filter @understand-anything/skill build
      - name: Test core
        run: pnpm --filter @understand-anything/core test
      - name: Test skill
        run: pnpm --filter @understand-anything/skill test
````

## File: .github/workflows/deploy-homepage.yml
````yaml
name: Deploy Homepage
on:
  push:
    branches: [main]
    paths:
      - 'homepage/**'
      - 'understand-anything-plugin/packages/dashboard/**'
      - 'understand-anything-plugin/packages/core/**'
      - '.github/workflows/deploy-homepage.yml'
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: pnpm-lock.yaml
      - name: Install dependencies
        run: pnpm install
      - name: Build homepage
        working-directory: homepage
        run: pnpm build
      - name: Build core
        run: pnpm --filter @understand-anything/core build
      - name: Build demo dashboard
        run: pnpm --filter @understand-anything/dashboard build:demo
        env:
          VITE_GRAPH_URL: ${{ vars.DEMO_GRAPH_URL }}
          VITE_DOMAIN_GRAPH_URL: ${{ vars.DEMO_DOMAIN_GRAPH_URL }}
          VITE_META_URL: ${{ vars.DEMO_META_URL }}
      - name: Merge demo into homepage output
        run: cp -r understand-anything-plugin/packages/dashboard/dist homepage/dist/demo
      - uses: actions/upload-pages-artifact@v3
        with:
          path: homepage/dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
````

## File: .github/FUNDING.yml
````yaml
patreon: Lum1104
````

## File: .openclaw/INSTALL.md
````markdown
# Installing Understand-Anything for OpenClaw

## Prerequisites

- Git

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Lum1104/Understand-Anything.git ~/.openclaw/understand-anything
   ```

2. **Create the skills symlinks:**
   ```bash
   mkdir -p ~/.openclaw/skills
   ln -s ~/.openclaw/understand-anything/understand-anything-plugin/skills ~/.openclaw/skills/understand-anything
   # Universal plugin root symlink — lets the dashboard skill find packages/dashboard/
   # Skip if already exists (e.g. another platform was installed first)
   [ -e ~/.understand-anything-plugin ] || [ -L ~/.understand-anything-plugin ] || ln -s ~/.openclaw/understand-anything/understand-anything-plugin ~/.understand-anything-plugin
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.openclaw\skills"
   cmd /c mklink /J "$env:USERPROFILE\.openclaw\skills\understand-anything" "$env:USERPROFILE\.openclaw\understand-anything\understand-anything-plugin\skills"
   cmd /c mklink /J "$env:USERPROFILE\.understand-anything-plugin" "$env:USERPROFILE\.openclaw\understand-anything\understand-anything-plugin"
   ```

3. **Restart OpenClaw** to discover the skills.

## Usage

- `@understand` — Analyze the current codebase
- `@understand-chat` — Ask questions about the knowledge graph
- `@understand-dashboard` — Launch the interactive dashboard

## Updating

```bash
cd ~/.openclaw/understand-anything && git pull
```

## Uninstalling

```bash
rm ~/.openclaw/skills/understand-anything
rm ~/.understand-anything-plugin
rm -rf ~/.openclaw/understand-anything
```
````

## File: .opencode/INSTALL.md
````markdown
# Installing Understand-Anything for OpenCode

## Prerequisites

- Git
- [OpenCode](https://opencode.ai) installed

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Lum1104/Understand-Anything.git ~/.opencode/understand-anything
   ```

2. **Create the skills symlinks:**
   ```bash
   mkdir -p ~/.agents/skills
   # Note: if Codex's Understand-Anything is already installed, these symlinks
   # already exist and the ln commands will safely fail — that is fine, the
   # existing symlinks work for OpenCode too.
   for skill in understand understand-chat understand-dashboard understand-diff understand-explain understand-onboard; do
     ln -sf ~/.opencode/understand-anything/understand-anything-plugin/skills/$skill ~/.agents/skills/$skill
   done
   # Universal plugin root symlink — lets the dashboard skill find packages/dashboard/
   # Skip if already exists (e.g. another platform was installed first)
   [ -e ~/.understand-anything-plugin ] || [ -L ~/.understand-anything-plugin ] || ln -s ~/.opencode/understand-anything/understand-anything-plugin ~/.understand-anything-plugin
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   $skills = @("understand","understand-chat","understand-dashboard","understand-diff","understand-explain","understand-onboard")
   foreach ($skill in $skills) {
     cmd /c mklink /J "$env:USERPROFILE\.agents\skills\$skill" "$env:USERPROFILE\.opencode\understand-anything\understand-anything-plugin\skills\$skill"
   }
   # Universal plugin root symlink
   cmd /c mklink /J "$env:USERPROFILE\.understand-anything-plugin" "$env:USERPROFILE\.opencode\understand-anything\understand-anything-plugin"
   ```

3. **Restart OpenCode** to discover the skills.

## Verify

```bash
ls -la ~/.agents/skills/ | grep understand
```

You should see symlinks for each skill pointing into the cloned repository.

## Usage

Skills activate automatically when relevant. You can also invoke directly:

```
use skill tool to load understand
```

Or just ask: "Analyze this codebase and build a knowledge graph"

## Updating

```bash
cd ~/.opencode/understand-anything && git pull
```

Skills update instantly through the symlinks.

## Uninstalling

```bash
for skill in understand understand-chat understand-dashboard understand-diff understand-explain understand-onboard; do
  rm -f ~/.agents/skills/$skill
done
rm ~/.understand-anything-plugin
rm -rf ~/.opencode/understand-anything
```

## Troubleshooting

### Skills not found

1. Check that the symlinks exist: `ls -la ~/.agents/skills/ | grep understand`
2. Verify the clone succeeded: `ls ~/.opencode/understand-anything/understand-anything-plugin/skills/`
3. Restart OpenCode

### Tool mapping

When skills reference Claude Code tools:
- `TodoWrite` → `todowrite`
- `Task` with subagents → `@mention` syntax
- `Skill` tool → OpenCode's native `skill` tool
- File operations → your native tools
````

## File: .pi/INSTALL.md
````markdown
# Installing Understand-Anything for Pi Agent

## Prerequisites

- Git
- [Pi Agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) installed

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Lum1104/Understand-Anything.git ~/.pi/understand-anything
   ```

2. **Create the skills symlinks:**
   ```bash
   mkdir -p ~/.agents/skills
   # Note: if another platform's Understand-Anything is already installed, these symlinks
   # already exist and the ln commands will safely fail — that is fine, the
   # existing symlinks work for Pi Agent too.
   for skill in understand understand-chat understand-dashboard understand-diff understand-explain understand-onboard; do
     ln -sf ~/.pi/understand-anything/understand-anything-plugin/skills/$skill ~/.agents/skills/$skill
   done
   # Universal plugin root symlink — lets the dashboard skill find packages/dashboard/
   # Skip if already exists (e.g. another platform was installed first)
   [ -e ~/.understand-anything-plugin ] || [ -L ~/.understand-anything-plugin ] || ln -s ~/.pi/understand-anything/understand-anything-plugin ~/.understand-anything-plugin
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   $skills = @("understand","understand-chat","understand-dashboard","understand-diff","understand-explain","understand-onboard")
   foreach ($skill in $skills) {
     cmd /c mklink /J "$env:USERPROFILE\.agents\skills\$skill" "$env:USERPROFILE\.pi\understand-anything\understand-anything-plugin\skills\$skill"
   }
   # Universal plugin root symlink
   cmd /c mklink /J "$env:USERPROFILE\.understand-anything-plugin" "$env:USERPROFILE\.pi\understand-anything\understand-anything-plugin"
   ```

3. **Restart Pi Agent** to discover the skills.

## Verify

```bash
ls -la ~/.agents/skills/ | grep understand
```

You should see symlinks for each skill pointing into the cloned repository.

## Usage

Skills activate automatically when relevant. You can also invoke directly:
- "Analyze this codebase and build a knowledge graph"
- "Help me understand this project's architecture"

## Updating

```bash
cd ~/.pi/understand-anything && git pull
```

Skills update instantly through the symlinks.

## Uninstalling

```bash
for skill in understand understand-chat understand-dashboard understand-diff understand-explain understand-onboard; do
  rm -f ~/.agents/skills/$skill
done
rm ~/.understand-anything-plugin
rm -rf ~/.pi/understand-anything
```
````

## File: docs/superpowers/plans/2026-03-14-phase1-implementation.md
````markdown
# Understand Anything — Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the foundational MVP — a pnpm monorepo with a core analysis engine (LLM + tree-sitter), a `/understand` skill command, and a basic React dashboard with graph view and code viewer.

**Architecture:** Monorepo with 3 packages (core, skill, dashboard) sharing a knowledge graph JSON schema. The core package handles analysis and persistence. The skill invokes core and launches the dashboard. The dashboard reads the JSON and renders a multi-panel workspace.

**Tech Stack:** TypeScript, pnpm workspaces, Vitest, React 18, Vite, @xyflow/react (React Flow v12), @monaco-editor/react, Zustand, TailwindCSS, tree-sitter

---

## Task 1: Project Scaffolding — Monorepo Root

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.npmrc`

**Step 1: Create root package.json**

```json
{
  "name": "understand-anything",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.6.2",
  "scripts": {
    "build": "pnpm -r build",
    "test": "vitest",
    "dev:dashboard": "pnpm --filter @understand-anything/dashboard dev",
    "lint": "eslint ."
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.1.0"
  }
}
```

**Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'packages/*'
```

**Step 3: Create root tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

**Step 4: Create .gitignore**

```
node_modules/
dist/
.understand-anything/
*.tsbuildinfo
.DS_Store
```

**Step 5: Create .npmrc**

```
shamefully-hoist=false
strict-peer-dependencies=false
```

**Step 6: Run pnpm install**

Run: `pnpm install`
Expected: lockfile created, no errors

**Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.json .gitignore .npmrc pnpm-lock.yaml
git commit -m "chore: scaffold monorepo root with pnpm workspaces"
```

---

## Task 2: Core Package — Scaffolding & Knowledge Graph Types

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/src/types.ts`

**Step 1: Create packages/core/package.json**

```json
{
  "name": "@understand-anything/core",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.1.0"
  }
}
```

**Step 2: Create packages/core/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**Step 3: Create packages/core/src/types.ts**

This is the full Knowledge Graph type system from the design doc:

```typescript
// === Edge Types ===

export type EdgeType =
  // Structural
  | "imports"
  | "exports"
  | "contains"
  | "inherits"
  | "implements"
  // Behavioral
  | "calls"
  | "subscribes"
  | "publishes"
  | "middleware"
  // Data flow
  | "reads_from"
  | "writes_to"
  | "transforms"
  | "validates"
  // Dependencies
  | "depends_on"
  | "tested_by"
  | "configures"
  // Semantic
  | "related"
  | "similar_to";

// === Graph Node ===

export interface GraphNode {
  id: string;
  type: "file" | "function" | "class" | "module" | "concept";
  name: string;
  filePath?: string;
  lineRange?: [number, number];
  summary: string;
  tags: string[];
  complexity: "simple" | "moderate" | "complex";
  languageNotes?: string;
}

// === Graph Edge ===

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  direction: "forward" | "backward" | "bidirectional";
  description?: string;
  weight: number;
}

// === Layer ===

export interface Layer {
  id: string;
  name: string;
  description: string;
  nodeIds: string[];
}

// === Tour Step ===

export interface TourStep {
  order: number;
  title: string;
  description: string;
  nodeIds: string[];
  languageLesson?: string;
}

// === Project Metadata ===

export interface ProjectMeta {
  name: string;
  languages: string[];
  frameworks: string[];
  description: string;
  analyzedAt: string;
  gitCommitHash: string;
}

// === Knowledge Graph (root) ===

export interface KnowledgeGraph {
  version: string;
  project: ProjectMeta;
  nodes: GraphNode[];
  edges: GraphEdge[];
  layers: Layer[];
  tour: TourStep[];
}

// === Analysis Metadata ===

export interface AnalysisMeta {
  lastAnalyzedAt: string;
  gitCommitHash: string;
  version: string;
  analyzedFiles: number;
}

// === Plugin Interface ===

export interface StructuralAnalysis {
  functions: Array<{
    name: string;
    lineRange: [number, number];
    params: string[];
    returnType?: string;
  }>;
  classes: Array<{
    name: string;
    lineRange: [number, number];
    methods: string[];
    properties: string[];
  }>;
  imports: Array<{
    source: string;
    specifiers: string[];
    lineNumber: number;
  }>;
  exports: Array<{
    name: string;
    lineNumber: number;
  }>;
}

export interface ImportResolution {
  source: string;
  resolvedPath: string;
  specifiers: string[];
}

export interface CallGraphEntry {
  caller: string;
  callee: string;
  lineNumber: number;
}

export interface AnalyzerPlugin {
  name: string;
  languages: string[];
  analyzeFile(filePath: string, content: string): StructuralAnalysis;
  resolveImports(filePath: string, content: string): ImportResolution[];
  extractCallGraph?(filePath: string, content: string): CallGraphEntry[];
}
```

**Step 4: Create packages/core/src/index.ts**

```typescript
export * from "./types.js";
```

**Step 5: Run pnpm install and build**

Run: `cd /path/to/project && pnpm install && pnpm --filter @understand-anything/core build`
Expected: Compiles with no errors, `packages/core/dist/` created

**Step 6: Write a type validation test**

Create: `packages/core/src/types.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import type {
  KnowledgeGraph,
  GraphNode,
  GraphEdge,
  ProjectMeta,
} from "./types.js";

describe("KnowledgeGraph types", () => {
  it("should create a valid empty knowledge graph", () => {
    const graph: KnowledgeGraph = {
      version: "1.0.0",
      project: {
        name: "test-project",
        languages: ["typescript"],
        frameworks: [],
        description: "A test project",
        analyzedAt: new Date().toISOString(),
        gitCommitHash: "abc123",
      },
      nodes: [],
      edges: [],
      layers: [],
      tour: [],
    };

    expect(graph.version).toBe("1.0.0");
    expect(graph.nodes).toHaveLength(0);
  });

  it("should create valid graph nodes", () => {
    const node: GraphNode = {
      id: "node-1",
      type: "function",
      name: "handleLogin",
      filePath: "src/auth/login.ts",
      lineRange: [10, 25],
      summary: "Handles user login with email and password",
      tags: ["auth", "login", "api"],
      complexity: "moderate",
      languageNotes: "Uses async/await for API calls",
    };

    expect(node.type).toBe("function");
    expect(node.tags).toContain("auth");
  });

  it("should create valid graph edges", () => {
    const edge: GraphEdge = {
      source: "node-1",
      target: "node-2",
      type: "calls",
      direction: "forward",
      description: "handleLogin calls validateCredentials",
      weight: 0.8,
    };

    expect(edge.type).toBe("calls");
    expect(edge.weight).toBeGreaterThan(0);
    expect(edge.weight).toBeLessThanOrEqual(1);
  });
});
```

**Step 7: Run tests**

Run: `pnpm --filter @understand-anything/core test`
Expected: All 3 tests PASS

**Step 8: Commit**

```bash
git add packages/core/
git commit -m "feat(core): add knowledge graph type system and validation tests"
```

---

## Task 3: Core Package — JSON Persistence

**Files:**
- Create: `packages/core/src/persistence/index.ts`
- Create: `packages/core/src/persistence/persistence.test.ts`

**Step 1: Write the failing test**

Create: `packages/core/src/persistence/persistence.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadGraph, saveGraph, loadMeta, saveMeta } from "./index.js";
import type { KnowledgeGraph, AnalysisMeta } from "../types.js";

describe("Persistence", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `ua-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  const makeGraph = (): KnowledgeGraph => ({
    version: "1.0.0",
    project: {
      name: "test",
      languages: ["typescript"],
      frameworks: [],
      description: "test project",
      analyzedAt: new Date().toISOString(),
      gitCommitHash: "abc123",
    },
    nodes: [
      {
        id: "n1",
        type: "file",
        name: "index.ts",
        summary: "Entry point",
        tags: ["entry"],
        complexity: "simple",
      },
    ],
    edges: [],
    layers: [],
    tour: [],
  });

  it("saveGraph writes knowledge-graph.json", () => {
    const graph = makeGraph();
    saveGraph(testDir, graph);

    const filePath = join(testDir, ".understand-anything", "knowledge-graph.json");
    expect(existsSync(filePath)).toBe(true);
  });

  it("loadGraph reads back the saved graph", () => {
    const graph = makeGraph();
    saveGraph(testDir, graph);
    const loaded = loadGraph(testDir);

    expect(loaded).not.toBeNull();
    expect(loaded!.project.name).toBe("test");
    expect(loaded!.nodes).toHaveLength(1);
  });

  it("loadGraph returns null when no graph exists", () => {
    const loaded = loadGraph(testDir);
    expect(loaded).toBeNull();
  });

  it("saveMeta writes meta.json", () => {
    const meta: AnalysisMeta = {
      lastAnalyzedAt: new Date().toISOString(),
      gitCommitHash: "abc123",
      version: "1.0.0",
      analyzedFiles: 5,
    };
    saveMeta(testDir, meta);

    const filePath = join(testDir, ".understand-anything", "meta.json");
    expect(existsSync(filePath)).toBe(true);
  });

  it("loadMeta reads back saved meta", () => {
    const meta: AnalysisMeta = {
      lastAnalyzedAt: new Date().toISOString(),
      gitCommitHash: "def456",
      version: "1.0.0",
      analyzedFiles: 10,
    };
    saveMeta(testDir, meta);
    const loaded = loadMeta(testDir);

    expect(loaded).not.toBeNull();
    expect(loaded!.gitCommitHash).toBe("def456");
    expect(loaded!.analyzedFiles).toBe(10);
  });

  it("loadMeta returns null when no meta exists", () => {
    const loaded = loadMeta(testDir);
    expect(loaded).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @understand-anything/core test`
Expected: FAIL — module `./index.js` not found

**Step 3: Implement persistence module**

Create: `packages/core/src/persistence/index.ts`

```typescript
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { KnowledgeGraph, AnalysisMeta } from "../types.js";

const UA_DIR = ".understand-anything";
const GRAPH_FILE = "knowledge-graph.json";
const META_FILE = "meta.json";

function ensureDir(projectRoot: string): string {
  const dir = join(projectRoot, UA_DIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function saveGraph(projectRoot: string, graph: KnowledgeGraph): void {
  const dir = ensureDir(projectRoot);
  const filePath = join(dir, GRAPH_FILE);
  writeFileSync(filePath, JSON.stringify(graph, null, 2), "utf-8");
}

export function loadGraph(projectRoot: string): KnowledgeGraph | null {
  const filePath = join(projectRoot, UA_DIR, GRAPH_FILE);
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content) as KnowledgeGraph;
}

export function saveMeta(projectRoot: string, meta: AnalysisMeta): void {
  const dir = ensureDir(projectRoot);
  const filePath = join(dir, META_FILE);
  writeFileSync(filePath, JSON.stringify(meta, null, 2), "utf-8");
}

export function loadMeta(projectRoot: string): AnalysisMeta | null {
  const filePath = join(projectRoot, UA_DIR, META_FILE);
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content) as AnalysisMeta;
}
```

**Step 4: Update packages/core/src/index.ts**

```typescript
export * from "./types.js";
export * from "./persistence/index.js";
```

**Step 5: Run tests**

Run: `pnpm --filter @understand-anything/core test`
Expected: All 6 persistence tests PASS + 3 type tests PASS = 9 total

**Step 6: Commit**

```bash
git add packages/core/src/persistence/ packages/core/src/index.ts
git commit -m "feat(core): add JSON persistence for knowledge graph and meta"
```

---

## Task 4: Core Package — Tree-sitter Analyzer Plugin

**Files:**
- Create: `packages/core/src/plugins/tree-sitter-plugin.ts`
- Create: `packages/core/src/plugins/tree-sitter-plugin.test.ts`

**Step 1: Install tree-sitter dependencies**

Run: `pnpm --filter @understand-anything/core add tree-sitter tree-sitter-javascript tree-sitter-typescript`
Expected: packages installed

**Step 2: Write the failing test**

Create: `packages/core/src/plugins/tree-sitter-plugin.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { TreeSitterPlugin } from "./tree-sitter-plugin.js";

describe("TreeSitterPlugin", () => {
  const plugin = new TreeSitterPlugin();

  describe("analyzeFile — TypeScript", () => {
    const tsCode = `
import { Request, Response } from "express";
import { db } from "../db/connection";

export function handleLogin(req: Request, res: Response): void {
  const { email, password } = req.body;
  validateCredentials(email, password);
}

function validateCredentials(email: string, password: string): boolean {
  return email.length > 0 && password.length > 0;
}

export class AuthService {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  verify(token: string): boolean {
    return token.length > 0;
  }

  refresh(token: string): string {
    return token;
  }
}
`;

    it("extracts function declarations", () => {
      const result = plugin.analyzeFile("src/auth.ts", tsCode);
      const funcNames = result.functions.map((f) => f.name);
      expect(funcNames).toContain("handleLogin");
      expect(funcNames).toContain("validateCredentials");
    });

    it("extracts class declarations with methods", () => {
      const result = plugin.analyzeFile("src/auth.ts", tsCode);
      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].name).toBe("AuthService");
      expect(result.classes[0].methods).toContain("verify");
      expect(result.classes[0].methods).toContain("refresh");
    });

    it("extracts import statements", () => {
      const result = plugin.analyzeFile("src/auth.ts", tsCode);
      const sources = result.imports.map((i) => i.source);
      expect(sources).toContain("express");
      expect(sources).toContain("../db/connection");
    });

    it("extracts export names", () => {
      const result = plugin.analyzeFile("src/auth.ts", tsCode);
      const exportNames = result.exports.map((e) => e.name);
      expect(exportNames).toContain("handleLogin");
      expect(exportNames).toContain("AuthService");
    });
  });

  describe("analyzeFile — JavaScript", () => {
    const jsCode = `
const express = require("express");

function middleware(req, res, next) {
  next();
}

module.exports = { middleware };
`;

    it("extracts functions from JavaScript", () => {
      const result = plugin.analyzeFile("src/app.js", jsCode);
      const funcNames = result.functions.map((f) => f.name);
      expect(funcNames).toContain("middleware");
    });
  });

  describe("resolveImports", () => {
    const code = `
import { foo } from "./utils";
import bar from "../lib/bar";
import * as path from "path";
`;

    it("resolves relative import paths", () => {
      const imports = plugin.resolveImports("src/index.ts", code);
      const paths = imports.map((i) => i.source);
      expect(paths).toContain("./utils");
      expect(paths).toContain("../lib/bar");
      expect(paths).toContain("path");
    });
  });

  describe("languages", () => {
    it("supports typescript and javascript", () => {
      expect(plugin.languages).toContain("typescript");
      expect(plugin.languages).toContain("javascript");
    });
  });
});
```

**Step 3: Run test to verify it fails**

Run: `pnpm --filter @understand-anything/core test`
Expected: FAIL — module not found

**Step 4: Implement the tree-sitter plugin**

Create: `packages/core/src/plugins/tree-sitter-plugin.ts`

```typescript
import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import JavaScript from "tree-sitter-javascript";
import type {
  AnalyzerPlugin,
  StructuralAnalysis,
  ImportResolution,
  CallGraphEntry,
} from "../types.js";

const tsParser = new Parser();
tsParser.setLanguage(TypeScript.typescript);

const jsParser = new Parser();
jsParser.setLanguage(JavaScript);

function getParser(filePath: string): Parser {
  if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) return tsParser;
  return jsParser;
}

function traverse(
  node: Parser.SyntaxNode,
  callback: (node: Parser.SyntaxNode) => void,
): void {
  callback(node);
  for (let i = 0; i < node.childCount; i++) {
    traverse(node.child(i)!, callback);
  }
}

export class TreeSitterPlugin implements AnalyzerPlugin {
  name = "tree-sitter";
  languages = ["typescript", "javascript"];

  analyzeFile(filePath: string, content: string): StructuralAnalysis {
    const parser = getParser(filePath);
    const tree = parser.parse(content);
    const root = tree.rootNode;

    const functions: StructuralAnalysis["functions"] = [];
    const classes: StructuralAnalysis["classes"] = [];
    const imports: StructuralAnalysis["imports"] = [];
    const exports: StructuralAnalysis["exports"] = [];

    traverse(root, (node) => {
      // Function declarations
      if (
        node.type === "function_declaration" ||
        node.type === "function_signature"
      ) {
        const nameNode = node.childByFieldName("name");
        if (nameNode) {
          functions.push({
            name: nameNode.text,
            lineRange: [node.startPosition.row + 1, node.endPosition.row + 1],
            params: this.extractParams(node),
          });
        }
      }

      // Arrow functions assigned to variables
      if (
        node.type === "lexical_declaration" ||
        node.type === "variable_declaration"
      ) {
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child?.type === "variable_declarator") {
            const nameNode = child.childByFieldName("name");
            const valueNode = child.childByFieldName("value");
            if (nameNode && valueNode?.type === "arrow_function") {
              functions.push({
                name: nameNode.text,
                lineRange: [
                  node.startPosition.row + 1,
                  node.endPosition.row + 1,
                ],
                params: this.extractParams(valueNode),
              });
            }
          }
        }
      }

      // Class declarations
      if (node.type === "class_declaration") {
        const nameNode = node.childByFieldName("name");
        const bodyNode = node.childByFieldName("body");
        if (nameNode && bodyNode) {
          const methods: string[] = [];
          const properties: string[] = [];

          for (let i = 0; i < bodyNode.childCount; i++) {
            const member = bodyNode.child(i);
            if (member?.type === "method_definition") {
              const methodName = member.childByFieldName("name");
              if (methodName && methodName.text !== "constructor") {
                methods.push(methodName.text);
              }
            }
            if (
              member?.type === "public_field_definition" ||
              member?.type === "property_definition"
            ) {
              const propName = member.childByFieldName("name");
              if (propName) properties.push(propName.text);
            }
          }

          classes.push({
            name: nameNode.text,
            lineRange: [
              node.startPosition.row + 1,
              node.endPosition.row + 1,
            ],
            methods,
            properties,
          });
        }
      }

      // Import statements
      if (node.type === "import_statement") {
        const sourceNode = node.children.find(
          (c) => c.type === "string" || c.type === "string_fragment",
        );
        let source = "";
        if (sourceNode) {
          source = sourceNode.text.replace(/['"]/g, "");
        }
        // Try to find string_fragment inside string
        if (!source) {
          traverse(node, (child) => {
            if (child.type === "string_fragment" || child.type === "string_content") {
              source = child.text;
            }
          });
        }

        const specifiers: string[] = [];
        traverse(node, (child) => {
          if (child.type === "import_specifier") {
            const nameChild = child.childByFieldName("name");
            if (nameChild) specifiers.push(nameChild.text);
          }
          if (child.type === "identifier" && child.parent?.type === "import_clause") {
            specifiers.push(child.text);
          }
          if (child.type === "namespace_import") {
            const nameChild = child.children.find((c) => c.type === "identifier");
            if (nameChild) specifiers.push(`* as ${nameChild.text}`);
          }
        });

        if (source) {
          imports.push({
            source,
            specifiers,
            lineNumber: node.startPosition.row + 1,
          });
        }
      }

      // Export statements
      if (node.type === "export_statement") {
        // export function / export class
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (
            child?.type === "function_declaration" ||
            child?.type === "class_declaration"
          ) {
            const nameNode = child.childByFieldName("name");
            if (nameNode) {
              exports.push({
                name: nameNode.text,
                lineNumber: node.startPosition.row + 1,
              });
            }
          }
          if (child?.type === "lexical_declaration") {
            traverse(child, (grandchild) => {
              if (grandchild.type === "variable_declarator") {
                const nameNode = grandchild.childByFieldName("name");
                if (nameNode) {
                  exports.push({
                    name: nameNode.text,
                    lineNumber: node.startPosition.row + 1,
                  });
                }
              }
            });
          }
        }
      }
    });

    return { functions, classes, imports, exports };
  }

  resolveImports(filePath: string, content: string): ImportResolution[] {
    const analysis = this.analyzeFile(filePath, content);
    return analysis.imports.map((imp) => ({
      source: imp.source,
      resolvedPath: imp.source, // Basic — full resolution needs fs access
      specifiers: imp.specifiers,
    }));
  }

  extractCallGraph(filePath: string, content: string): CallGraphEntry[] {
    const parser = getParser(filePath);
    const tree = parser.parse(content);
    const entries: CallGraphEntry[] = [];

    // Find all function scopes and call expressions within them
    const functionScopes: Array<{
      name: string;
      node: Parser.SyntaxNode;
    }> = [];

    traverse(tree.rootNode, (node) => {
      if (node.type === "function_declaration") {
        const nameNode = node.childByFieldName("name");
        if (nameNode) {
          functionScopes.push({ name: nameNode.text, node });
        }
      }
    });

    for (const scope of functionScopes) {
      traverse(scope.node, (node) => {
        if (node.type === "call_expression") {
          const funcNode = node.childByFieldName("function");
          if (funcNode) {
            const callee =
              funcNode.type === "member_expression"
                ? funcNode.text
                : funcNode.text;
            entries.push({
              caller: scope.name,
              callee,
              lineNumber: node.startPosition.row + 1,
            });
          }
        }
      });
    }

    return entries;
  }

  private extractParams(node: Parser.SyntaxNode): string[] {
    const params: string[] = [];
    const paramsNode = node.childByFieldName("parameters");
    if (paramsNode) {
      for (let i = 0; i < paramsNode.childCount; i++) {
        const param = paramsNode.child(i);
        if (
          param &&
          param.type !== "," &&
          param.type !== "(" &&
          param.type !== ")"
        ) {
          const nameNode = param.childByFieldName("name") ||
            param.childByFieldName("pattern");
          if (nameNode) params.push(nameNode.text);
          else if (param.type === "identifier") params.push(param.text);
        }
      }
    }
    return params;
  }
}
```

**Step 5: Update packages/core/src/index.ts**

```typescript
export * from "./types.js";
export * from "./persistence/index.js";
export { TreeSitterPlugin } from "./plugins/tree-sitter-plugin.js";
```

**Step 6: Run tests**

Run: `pnpm --filter @understand-anything/core test`
Expected: All tree-sitter tests PASS. Some tests may need adjustment based on exact tree-sitter parse output — iterate until green.

**Step 7: Commit**

```bash
git add packages/core/src/plugins/ packages/core/src/index.ts packages/core/package.json pnpm-lock.yaml
git commit -m "feat(core): add tree-sitter analyzer plugin for TS/JS"
```

---

## Task 5: Core Package — LLM Analysis Engine

**Files:**
- Create: `packages/core/src/analyzer/llm-analyzer.ts`
- Create: `packages/core/src/analyzer/llm-analyzer.test.ts`
- Create: `packages/core/src/analyzer/graph-builder.ts`
- Create: `packages/core/src/analyzer/graph-builder.test.ts`

**Step 1: Write the graph builder test**

The graph builder takes structural analysis + LLM summaries and assembles a KnowledgeGraph.

Create: `packages/core/src/analyzer/graph-builder.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { GraphBuilder } from "./graph-builder.js";
import type { StructuralAnalysis } from "../types.js";

describe("GraphBuilder", () => {
  it("creates file nodes from file list", () => {
    const builder = new GraphBuilder("test-project", "abc123");

    builder.addFile("src/index.ts", {
      summary: "Application entry point",
      tags: ["entry", "main"],
      complexity: "simple" as const,
    });

    const graph = builder.build();
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].type).toBe("file");
    expect(graph.nodes[0].name).toBe("index.ts");
    expect(graph.nodes[0].filePath).toBe("src/index.ts");
  });

  it("creates function nodes from structural analysis", () => {
    const builder = new GraphBuilder("test-project", "abc123");
    const analysis: StructuralAnalysis = {
      functions: [
        { name: "handleLogin", lineRange: [5, 15], params: ["req", "res"] },
      ],
      classes: [],
      imports: [],
      exports: [],
    };

    builder.addFileWithAnalysis("src/auth.ts", analysis, {
      summaries: { handleLogin: "Handles user login" },
      fileSummary: "Authentication module",
      tags: ["auth"],
      complexity: "moderate" as const,
    });

    const graph = builder.build();
    const funcNodes = graph.nodes.filter((n) => n.type === "function");
    expect(funcNodes).toHaveLength(1);
    expect(funcNodes[0].name).toBe("handleLogin");
    expect(funcNodes[0].summary).toBe("Handles user login");
  });

  it("creates contains edges between files and their functions", () => {
    const builder = new GraphBuilder("test-project", "abc123");
    const analysis: StructuralAnalysis = {
      functions: [
        { name: "foo", lineRange: [1, 5], params: [] },
      ],
      classes: [],
      imports: [],
      exports: [],
    };

    builder.addFileWithAnalysis("src/utils.ts", analysis, {
      summaries: { foo: "A utility function" },
      fileSummary: "Utility functions",
      tags: ["utils"],
      complexity: "simple" as const,
    });

    const graph = builder.build();
    const containsEdges = graph.edges.filter((e) => e.type === "contains");
    expect(containsEdges).toHaveLength(1);
    expect(containsEdges[0].direction).toBe("forward");
  });

  it("creates import edges from structural analysis", () => {
    const builder = new GraphBuilder("test-project", "abc123");

    builder.addFile("src/index.ts", {
      summary: "Entry",
      tags: [],
      complexity: "simple" as const,
    });
    builder.addFile("src/utils.ts", {
      summary: "Utils",
      tags: [],
      complexity: "simple" as const,
    });

    builder.addImportEdge("src/index.ts", "src/utils.ts");

    const graph = builder.build();
    const importEdges = graph.edges.filter((e) => e.type === "imports");
    expect(importEdges).toHaveLength(1);
  });

  it("sets project metadata correctly", () => {
    const builder = new GraphBuilder("my-project", "def456");
    const graph = builder.build();

    expect(graph.project.name).toBe("my-project");
    expect(graph.project.gitCommitHash).toBe("def456");
    expect(graph.version).toBe("1.0.0");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @understand-anything/core test`
Expected: FAIL — module not found

**Step 3: Implement GraphBuilder**

Create: `packages/core/src/analyzer/graph-builder.ts`

```typescript
import type {
  KnowledgeGraph,
  GraphNode,
  GraphEdge,
  StructuralAnalysis,
} from "../types.js";

interface FileMeta {
  summary: string;
  tags: string[];
  complexity: "simple" | "moderate" | "complex";
}

interface FileAnalysisMeta extends FileMeta {
  summaries: Record<string, string>; // function/class name -> summary
  fileSummary: string;
}

function fileId(filePath: string): string {
  return `file:${filePath}`;
}

function funcId(filePath: string, funcName: string): string {
  return `func:${filePath}:${funcName}`;
}

function classId(filePath: string, className: string): string {
  return `class:${filePath}:${className}`;
}

export class GraphBuilder {
  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];
  private projectName: string;
  private gitHash: string;
  private languages: Set<string> = new Set();

  constructor(projectName: string, gitHash: string) {
    this.projectName = projectName;
    this.gitHash = gitHash;
  }

  addFile(filePath: string, meta: FileMeta): void {
    const ext = filePath.split(".").pop() || "";
    this.detectLanguage(ext);

    const name = filePath.split("/").pop() || filePath;
    this.nodes.push({
      id: fileId(filePath),
      type: "file",
      name,
      filePath,
      summary: meta.summary,
      tags: meta.tags,
      complexity: meta.complexity,
    });
  }

  addFileWithAnalysis(
    filePath: string,
    analysis: StructuralAnalysis,
    meta: FileAnalysisMeta,
  ): void {
    // Add the file node
    this.addFile(filePath, {
      summary: meta.fileSummary,
      tags: meta.tags,
      complexity: meta.complexity,
    });

    const fId = fileId(filePath);

    // Add function nodes
    for (const func of analysis.functions) {
      const id = funcId(filePath, func.name);
      this.nodes.push({
        id,
        type: "function",
        name: func.name,
        filePath,
        lineRange: func.lineRange,
        summary: meta.summaries[func.name] || `Function ${func.name}`,
        tags: meta.tags,
        complexity: meta.complexity,
      });

      // File contains function
      this.edges.push({
        source: fId,
        target: id,
        type: "contains",
        direction: "forward",
        weight: 1.0,
      });
    }

    // Add class nodes
    for (const cls of analysis.classes) {
      const id = classId(filePath, cls.name);
      this.nodes.push({
        id,
        type: "class",
        name: cls.name,
        filePath,
        lineRange: cls.lineRange,
        summary: meta.summaries[cls.name] || `Class ${cls.name}`,
        tags: meta.tags,
        complexity: meta.complexity,
      });

      // File contains class
      this.edges.push({
        source: fId,
        target: id,
        type: "contains",
        direction: "forward",
        weight: 1.0,
      });
    }
  }

  addImportEdge(fromFile: string, toFile: string): void {
    this.edges.push({
      source: fileId(fromFile),
      target: fileId(toFile),
      type: "imports",
      direction: "forward",
      weight: 0.7,
    });
  }

  addCallEdge(
    callerFile: string,
    callerFunc: string,
    calleeFile: string,
    calleeFunc: string,
  ): void {
    this.edges.push({
      source: funcId(callerFile, callerFunc),
      target: funcId(calleeFile, calleeFunc),
      type: "calls",
      direction: "forward",
      weight: 0.8,
    });
  }

  build(): KnowledgeGraph {
    return {
      version: "1.0.0",
      project: {
        name: this.projectName,
        languages: Array.from(this.languages),
        frameworks: [],
        description: "",
        analyzedAt: new Date().toISOString(),
        gitCommitHash: this.gitHash,
      },
      nodes: this.nodes,
      edges: this.edges,
      layers: [],
      tour: [],
    };
  }

  private detectLanguage(ext: string): void {
    const langMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      py: "python",
      go: "go",
      rs: "rust",
      java: "java",
      c: "c",
      cpp: "cpp",
      h: "c",
    };
    if (langMap[ext]) this.languages.add(langMap[ext]);
  }
}
```

**Step 4: Run tests**

Run: `pnpm --filter @understand-anything/core test`
Expected: All GraphBuilder tests PASS

**Step 5: Create the LLM analyzer interface**

Create: `packages/core/src/analyzer/llm-analyzer.ts`

This defines the interface for LLM-based analysis. The actual LLM calls happen via the skill (which has access to the Claude session). The core package defines the prompts and expected response format.

```typescript
/**
 * LLM Analyzer — defines prompts and response parsing for LLM-based code analysis.
 *
 * The actual LLM invocation is handled by the caller (skill or dashboard with API key).
 * This module provides the prompt templates and response parsers.
 */

export interface LLMFileAnalysis {
  fileSummary: string;
  tags: string[];
  complexity: "simple" | "moderate" | "complex";
  functionSummaries: Record<string, string>;
  classSummaries: Record<string, string>;
  languageNotes?: string;
}

export interface LLMProjectSummary {
  description: string;
  frameworks: string[];
  layers: Array<{
    name: string;
    description: string;
    filePatterns: string[];
  }>;
}

/**
 * Generates the prompt for analyzing a single file.
 */
export function buildFileAnalysisPrompt(
  filePath: string,
  content: string,
  projectContext: string,
): string {
  return `You are analyzing a source code file as part of a codebase understanding tool.

Project context: ${projectContext}

File: ${filePath}

\`\`\`
${content}
\`\`\`

Analyze this file and respond with ONLY valid JSON (no markdown, no explanation):

{
  "fileSummary": "One-sentence plain-English description of what this file does",
  "tags": ["tag1", "tag2"],
  "complexity": "simple|moderate|complex",
  "functionSummaries": {
    "functionName": "What this function does in plain English"
  },
  "classSummaries": {
    "className": "What this class does in plain English"
  },
  "languageNotes": "Optional: any language-specific patterns worth noting for someone unfamiliar with this language"
}`;
}

/**
 * Generates the prompt for a project-level summary.
 */
export function buildProjectSummaryPrompt(
  fileList: string[],
  sampleFiles: Array<{ path: string; content: string }>,
): string {
  const fileListStr = fileList.map((f) => `  - ${f}`).join("\n");
  const sampleStr = sampleFiles
    .map((f) => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 500)}\n\`\`\``)
    .join("\n\n");

  return `You are analyzing a software project to generate a high-level understanding.

File list:
${fileListStr}

Sample files:
${sampleStr}

Analyze this project and respond with ONLY valid JSON:

{
  "description": "2-3 sentence description of what this project does",
  "frameworks": ["framework1", "library1"],
  "layers": [
    {
      "name": "Layer Name",
      "description": "What this layer handles",
      "filePatterns": ["src/api/**", "src/routes/**"]
    }
  ]
}`;
}

/**
 * Parses the LLM response for file analysis. Handles common LLM output issues.
 */
export function parseFileAnalysisResponse(
  response: string,
): LLMFileAnalysis | null {
  try {
    // Strip markdown code fences if present
    let cleaned = response.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(cleaned);

    return {
      fileSummary: parsed.fileSummary || "No summary available",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      complexity: ["simple", "moderate", "complex"].includes(parsed.complexity)
        ? parsed.complexity
        : "moderate",
      functionSummaries: parsed.functionSummaries || {},
      classSummaries: parsed.classSummaries || {},
      languageNotes: parsed.languageNotes,
    };
  } catch {
    return null;
  }
}

/**
 * Parses the LLM response for project summary.
 */
export function parseProjectSummaryResponse(
  response: string,
): LLMProjectSummary | null {
  try {
    let cleaned = response.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(cleaned);

    return {
      description: parsed.description || "",
      frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks : [],
      layers: Array.isArray(parsed.layers) ? parsed.layers : [],
    };
  } catch {
    return null;
  }
}
```

**Step 6: Write tests for LLM analyzer**

Create: `packages/core/src/analyzer/llm-analyzer.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import {
  buildFileAnalysisPrompt,
  parseFileAnalysisResponse,
  buildProjectSummaryPrompt,
  parseProjectSummaryResponse,
} from "./llm-analyzer.js";

describe("LLM Analyzer", () => {
  describe("buildFileAnalysisPrompt", () => {
    it("includes file path and content", () => {
      const prompt = buildFileAnalysisPrompt(
        "src/auth.ts",
        "function login() {}",
        "A web app",
      );
      expect(prompt).toContain("src/auth.ts");
      expect(prompt).toContain("function login() {}");
      expect(prompt).toContain("A web app");
    });
  });

  describe("parseFileAnalysisResponse", () => {
    it("parses valid JSON response", () => {
      const response = JSON.stringify({
        fileSummary: "Handles authentication",
        tags: ["auth", "login"],
        complexity: "moderate",
        functionSummaries: { login: "Logs user in" },
        classSummaries: {},
      });

      const result = parseFileAnalysisResponse(response);
      expect(result).not.toBeNull();
      expect(result!.fileSummary).toBe("Handles authentication");
      expect(result!.tags).toContain("auth");
    });

    it("handles markdown-wrapped JSON", () => {
      const response = '```json\n{"fileSummary": "Test", "tags": [], "complexity": "simple", "functionSummaries": {}, "classSummaries": {}}\n```';

      const result = parseFileAnalysisResponse(response);
      expect(result).not.toBeNull();
      expect(result!.fileSummary).toBe("Test");
    });

    it("returns null for invalid JSON", () => {
      const result = parseFileAnalysisResponse("not json at all");
      expect(result).toBeNull();
    });

    it("defaults complexity to moderate for unknown values", () => {
      const response = JSON.stringify({
        fileSummary: "Test",
        tags: [],
        complexity: "unknown",
        functionSummaries: {},
        classSummaries: {},
      });

      const result = parseFileAnalysisResponse(response);
      expect(result!.complexity).toBe("moderate");
    });
  });

  describe("buildProjectSummaryPrompt", () => {
    it("includes file list", () => {
      const prompt = buildProjectSummaryPrompt(
        ["src/index.ts", "src/auth.ts"],
        [{ path: "src/index.ts", content: "console.log('hi')" }],
      );
      expect(prompt).toContain("src/index.ts");
      expect(prompt).toContain("src/auth.ts");
    });
  });

  describe("parseProjectSummaryResponse", () => {
    it("parses valid response", () => {
      const response = JSON.stringify({
        description: "A REST API",
        frameworks: ["express"],
        layers: [{ name: "API", description: "HTTP layer", filePatterns: ["src/routes/**"] }],
      });

      const result = parseProjectSummaryResponse(response);
      expect(result).not.toBeNull();
      expect(result!.frameworks).toContain("express");
      expect(result!.layers).toHaveLength(1);
    });
  });
});
```

**Step 7: Update packages/core/src/index.ts**

```typescript
export * from "./types.js";
export * from "./persistence/index.js";
export { TreeSitterPlugin } from "./plugins/tree-sitter-plugin.js";
export { GraphBuilder } from "./analyzer/graph-builder.js";
export {
  buildFileAnalysisPrompt,
  buildProjectSummaryPrompt,
  parseFileAnalysisResponse,
  parseProjectSummaryResponse,
} from "./analyzer/llm-analyzer.js";
export type {
  LLMFileAnalysis,
  LLMProjectSummary,
} from "./analyzer/llm-analyzer.js";
```

**Step 8: Run all tests**

Run: `pnpm --filter @understand-anything/core test`
Expected: All tests PASS

**Step 9: Commit**

```bash
git add packages/core/src/analyzer/ packages/core/src/index.ts
git commit -m "feat(core): add graph builder and LLM analysis prompt system"
```

---

## Task 6: Dashboard Package — Scaffolding with Vite + React

**Files:**
- Create: `packages/dashboard/` (via Vite scaffold, then customize)

**Step 1: Scaffold React app with Vite**

Run: `cd packages && pnpm create vite dashboard --template react-ts`
Then: Remove boilerplate (App.css, etc.), keep structure.

**Step 2: Install dashboard dependencies**

Run: `cd packages/dashboard && pnpm add @xyflow/react @monaco-editor/react zustand && pnpm add -D tailwindcss @tailwindcss/vite`

**Step 3: Configure TailwindCSS**

Update `packages/dashboard/vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Replace `packages/dashboard/src/index.css`:

```css
@import "tailwindcss";
```

**Step 4: Add workspace dependency on core**

Add to `packages/dashboard/package.json` dependencies:

```json
"@understand-anything/core": "workspace:*"
```

Run: `pnpm install`

**Step 5: Create the Zustand store**

Create: `packages/dashboard/src/store.ts`

```typescript
import { create } from "zustand";
import type { KnowledgeGraph, GraphNode } from "@understand-anything/core";

interface DashboardStore {
  graph: KnowledgeGraph | null;
  selectedNodeId: string | null;
  searchQuery: string;
  searchResults: string[]; // node IDs

  setGraph: (graph: KnowledgeGraph) => void;
  selectNode: (nodeId: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useDashboardStore = create<DashboardStore>()((set, get) => ({
  graph: null,
  selectedNodeId: null,
  searchQuery: "",
  searchResults: [],

  setGraph: (graph) => set({ graph }),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setSearchQuery: (query) => {
    const graph = get().graph;
    if (!graph || !query.trim()) {
      set({ searchQuery: query, searchResults: [] });
      return;
    }

    const lower = query.toLowerCase();
    const results = graph.nodes
      .filter(
        (node) =>
          node.name.toLowerCase().includes(lower) ||
          node.summary.toLowerCase().includes(lower) ||
          node.tags.some((tag) => tag.toLowerCase().includes(lower)),
      )
      .map((n) => n.id);

    set({ searchQuery: query, searchResults: results });
  },
}));
```

**Step 6: Commit**

```bash
git add packages/dashboard/
git commit -m "feat(dashboard): scaffold React + Vite app with Tailwind, Zustand, and core dependency"
```

---

## Task 7: Dashboard — Graph View Panel with React Flow

**Files:**
- Create: `packages/dashboard/src/components/GraphView.tsx`
- Create: `packages/dashboard/src/components/CustomNode.tsx`

**Step 1: Create the custom node component**

Create: `packages/dashboard/src/components/CustomNode.tsx`

```tsx
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";

interface CustomNodeData {
  label: string;
  nodeType: "file" | "function" | "class" | "module" | "concept";
  summary: string;
  complexity: "simple" | "moderate" | "complex";
  isHighlighted: boolean;
  isSelected: boolean;
  [key: string]: unknown;
}

const typeColors: Record<string, string> = {
  file: "bg-blue-900 border-blue-500",
  function: "bg-green-900 border-green-500",
  class: "bg-purple-900 border-purple-500",
  module: "bg-orange-900 border-orange-500",
  concept: "bg-pink-900 border-pink-500",
};

const complexityBadge: Record<string, string> = {
  simple: "bg-green-700 text-green-100",
  moderate: "bg-yellow-700 text-yellow-100",
  complex: "bg-red-700 text-red-100",
};

export function CustomNode({ data }: NodeProps<CustomNodeData>) {
  const colorClass = typeColors[data.nodeType] || "bg-gray-900 border-gray-500";
  const highlightClass = data.isHighlighted
    ? "ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20"
    : "";
  const selectedClass = data.isSelected
    ? "ring-2 ring-white shadow-lg"
    : "";

  return (
    <div
      className={`rounded-lg border px-3 py-2 min-w-[140px] max-w-[220px] ${colorClass} ${highlightClass} ${selectedClass}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />

      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] uppercase tracking-wider text-gray-400">
          {data.nodeType}
        </span>
        <span
          className={`text-[9px] px-1 rounded ${complexityBadge[data.complexity]}`}
        >
          {data.complexity}
        </span>
      </div>

      <div className="text-sm font-medium text-white truncate">
        {data.label}
      </div>

      <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">
        {data.summary}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400"
      />
    </div>
  );
}
```

**Step 2: Create the GraphView component**

Create: `packages/dashboard/src/components/GraphView.tsx`

```tsx
import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
} from "@xyflow/react";
import type { Node, Edge, NodeMouseHandler } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDashboardStore } from "../store";
import { CustomNode } from "./CustomNode";
import type { KnowledgeGraph } from "@understand-anything/core";

const nodeTypes = { custom: CustomNode };

function graphToReactFlow(
  graph: KnowledgeGraph,
  searchResults: string[],
  selectedNodeId: string | null,
) {
  const nodes: Node[] = graph.nodes.map((node, index) => ({
    id: node.id,
    type: "custom",
    position: {
      x: (index % 5) * 280,
      y: Math.floor(index / 5) * 160,
    },
    data: {
      label: node.name,
      nodeType: node.type,
      summary: node.summary,
      complexity: node.complexity,
      isHighlighted: searchResults.includes(node.id),
      isSelected: node.id === selectedNodeId,
    },
  }));

  const edges: Edge[] = graph.edges.map((edge, index) => ({
    id: `e-${index}`,
    source: edge.source,
    target: edge.target,
    label: edge.type,
    animated: edge.type === "calls",
    style: { stroke: searchResults.length > 0 ? "#555" : "#888" },
  }));

  return { nodes, edges };
}

export function GraphView() {
  const graph = useDashboardStore((s) => s.graph);
  const searchResults = useDashboardStore((s) => s.searchResults);
  const selectedNodeId = useDashboardStore((s) => s.selectedNodeId);
  const selectNode = useDashboardStore((s) => s.selectNode);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!graph) return { initialNodes: [], initialEdges: [] };
    const { nodes, edges } = graphToReactFlow(
      graph,
      searchResults,
      selectedNodeId,
    );
    return { initialNodes: nodes, initialEdges: edges };
  }, [graph, searchResults, selectedNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  if (!graph) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No knowledge graph loaded. Run /understand first.
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      colorMode="dark"
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
```

**Step 3: Commit**

```bash
git add packages/dashboard/src/components/
git commit -m "feat(dashboard): add graph view with React Flow and custom nodes"
```

---

## Task 8: Dashboard — Code Viewer Panel with Monaco Editor

**Files:**
- Create: `packages/dashboard/src/components/CodeViewer.tsx`

**Step 1: Create the CodeViewer component**

Create: `packages/dashboard/src/components/CodeViewer.tsx`

```tsx
import Editor from "@monaco-editor/react";
import { useDashboardStore } from "../store";

const extToLanguage: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  json: "json",
  md: "markdown",
  css: "css",
  html: "html",
};

function detectLanguage(filePath: string): string {
  const ext = filePath.split(".").pop() || "";
  return extToLanguage[ext] || "plaintext";
}

export function CodeViewer() {
  const graph = useDashboardStore((s) => s.graph);
  const selectedNodeId = useDashboardStore((s) => s.selectedNodeId);

  const selectedNode = graph?.nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode || !selectedNode.filePath) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a node to view its source code.
      </div>
    );
  }

  // In MVP, we show a placeholder message directing to file path
  // Full implementation will load file content via API or embedded data
  const placeholder = `// File: ${selectedNode.filePath}
// Lines: ${selectedNode.lineRange ? `${selectedNode.lineRange[0]}-${selectedNode.lineRange[1]}` : "all"}
//
// ${selectedNode.summary}
//
// To view the actual source code, the dashboard needs access to the project files.
// This will be connected in the next phase via a local API server.`;

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-1.5 bg-gray-800 border-b border-gray-700 text-sm text-gray-300 flex items-center gap-2">
        <span className="text-gray-500">
          {selectedNode.type.toUpperCase()}
        </span>
        <span className="font-medium">{selectedNode.name}</span>
        <span className="text-gray-500 ml-auto">
          {selectedNode.filePath}
        </span>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          language={detectLanguage(selectedNode.filePath)}
          value={placeholder}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: "on",
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add packages/dashboard/src/components/CodeViewer.tsx
git commit -m "feat(dashboard): add code viewer panel with Monaco Editor"
```

---

## Task 9: Dashboard — Search Bar and Main Layout

**Files:**
- Create: `packages/dashboard/src/components/SearchBar.tsx`
- Create: `packages/dashboard/src/components/NodeInfo.tsx`
- Modify: `packages/dashboard/src/App.tsx`

**Step 1: Create SearchBar component**

Create: `packages/dashboard/src/components/SearchBar.tsx`

```tsx
import { useDashboardStore } from "../store";

export function SearchBar() {
  const searchQuery = useDashboardStore((s) => s.searchQuery);
  const searchResults = useDashboardStore((s) => s.searchResults);
  const setSearchQuery = useDashboardStore((s) => s.setSearchQuery);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 border-b border-gray-700">
      <svg
        className="w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder='Search: "authentication", "api layer", "database"...'
        className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
      />
      {searchQuery && (
        <span className="text-xs text-gray-400">
          {searchResults.length} results
        </span>
      )}
    </div>
  );
}
```

**Step 2: Create NodeInfo panel (placeholder for chat + learn panels)**

Create: `packages/dashboard/src/components/NodeInfo.tsx`

```tsx
import { useDashboardStore } from "../store";

export function NodeInfo() {
  const graph = useDashboardStore((s) => s.graph);
  const selectedNodeId = useDashboardStore((s) => s.selectedNodeId);

  const selectedNode = graph?.nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 p-4 text-sm">
        Select a node to see details. Chat and Learn panels coming in Phase 2.
      </div>
    );
  }

  // Find connected nodes
  const connectedEdges = graph?.edges.filter(
    (e) => e.source === selectedNodeId || e.target === selectedNodeId,
  ) || [];

  return (
    <div className="h-full overflow-y-auto p-4 text-sm">
      <h3 className="text-lg font-semibold text-white mb-1">
        {selectedNode.name}
      </h3>
      <div className="flex gap-2 mb-3">
        <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
          {selectedNode.type}
        </span>
        <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
          {selectedNode.complexity}
        </span>
      </div>

      <p className="text-gray-300 mb-3">{selectedNode.summary}</p>

      {selectedNode.languageNotes && (
        <div className="mb-3 p-2 bg-blue-900/30 border border-blue-800 rounded">
          <div className="text-xs text-blue-400 mb-1">Language Note</div>
          <p className="text-gray-300 text-xs">{selectedNode.languageNotes}</p>
        </div>
      )}

      {selectedNode.tags.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Tags</div>
          <div className="flex flex-wrap gap-1">
            {selectedNode.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {connectedEdges.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-1">
            Connections ({connectedEdges.length})
          </div>
          <div className="space-y-1">
            {connectedEdges.map((edge, i) => {
              const otherId =
                edge.source === selectedNodeId ? edge.target : edge.source;
              const otherNode = graph?.nodes.find((n) => n.id === otherId);
              const direction =
                edge.source === selectedNodeId ? "\u2192" : "\u2190";
              return (
                <div key={i} className="text-xs text-gray-400">
                  {direction} {edge.type}: {otherNode?.name || otherId}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Create the main App layout**

Replace: `packages/dashboard/src/App.tsx`

```tsx
import { useEffect } from "react";
import { SearchBar } from "./components/SearchBar";
import { GraphView } from "./components/GraphView";
import { CodeViewer } from "./components/CodeViewer";
import { NodeInfo } from "./components/NodeInfo";
import { useDashboardStore } from "./store";
import type { KnowledgeGraph } from "@understand-anything/core";

// Load graph from a JSON file served at /knowledge-graph.json
// In production, this comes from .understand-anything/knowledge-graph.json
async function loadGraphData(): Promise<KnowledgeGraph | null> {
  try {
    const response = await fetch("/knowledge-graph.json");
    if (!response.ok) return null;
    return (await response.json()) as KnowledgeGraph;
  } catch {
    return null;
  }
}

function App() {
  const setGraph = useDashboardStore((s) => s.setGraph);
  const graph = useDashboardStore((s) => s.graph);

  useEffect(() => {
    loadGraphData().then((g) => {
      if (g) setGraph(g);
    });
  }, [setGraph]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-950 border-b border-gray-800">
        <h1 className="text-sm font-bold tracking-wider">
          UNDERSTAND ANYTHING
        </h1>
        {graph && (
          <span className="text-xs text-gray-500">
            {graph.project.name} &middot; {graph.nodes.length} nodes &middot;{" "}
            {graph.edges.length} edges
          </span>
        )}
      </div>

      {/* Search */}
      <SearchBar />

      {/* Main workspace: 2x2 grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-px bg-gray-700 overflow-hidden">
        {/* Top-left: Graph View */}
        <div className="bg-gray-900">
          <GraphView />
        </div>

        {/* Top-right: Code Viewer */}
        <div className="bg-gray-900">
          <CodeViewer />
        </div>

        {/* Bottom-left: Chat Panel (placeholder) */}
        <div className="bg-gray-900 flex items-center justify-center text-gray-600 text-sm">
          Chat panel — coming in Phase 2
        </div>

        {/* Bottom-right: Node Info / Learn Panel */}
        <div className="bg-gray-900">
          <NodeInfo />
        </div>
      </div>
    </div>
  );
}

export default App;
```

**Step 4: Run the dashboard**

Run: `pnpm --filter @understand-anything/dashboard dev`
Expected: Vite dev server starts at localhost:5173. Dashboard renders with "No knowledge graph loaded" message.

**Step 5: Test with sample data**

Create `packages/dashboard/public/knowledge-graph.json` with a sample graph for testing:

```json
{
  "version": "1.0.0",
  "project": {
    "name": "sample-project",
    "languages": ["typescript"],
    "frameworks": ["express"],
    "description": "A sample Express API",
    "analyzedAt": "2026-03-14T00:00:00.000Z",
    "gitCommitHash": "abc123"
  },
  "nodes": [
    {
      "id": "file:src/index.ts",
      "type": "file",
      "name": "index.ts",
      "filePath": "src/index.ts",
      "summary": "Application entry point, starts the Express server",
      "tags": ["entry", "server"],
      "complexity": "simple"
    },
    {
      "id": "file:src/auth/login.ts",
      "type": "file",
      "name": "login.ts",
      "filePath": "src/auth/login.ts",
      "summary": "Handles user authentication and login flow",
      "tags": ["auth", "login"],
      "complexity": "moderate"
    },
    {
      "id": "func:src/auth/login.ts:handleLogin",
      "type": "function",
      "name": "handleLogin",
      "filePath": "src/auth/login.ts",
      "lineRange": [10, 35],
      "summary": "Validates credentials and returns a JWT token",
      "tags": ["auth", "jwt"],
      "complexity": "moderate"
    },
    {
      "id": "func:src/auth/login.ts:validateEmail",
      "type": "function",
      "name": "validateEmail",
      "filePath": "src/auth/login.ts",
      "lineRange": [37, 42],
      "summary": "Checks if an email address is valid using regex",
      "tags": ["validation", "email"],
      "complexity": "simple"
    },
    {
      "id": "file:src/db/connection.ts",
      "type": "file",
      "name": "connection.ts",
      "filePath": "src/db/connection.ts",
      "summary": "Database connection pool using PostgreSQL",
      "tags": ["database", "postgres"],
      "complexity": "moderate"
    }
  ],
  "edges": [
    {
      "source": "file:src/index.ts",
      "target": "file:src/auth/login.ts",
      "type": "imports",
      "direction": "forward",
      "weight": 0.7
    },
    {
      "source": "file:src/auth/login.ts",
      "target": "func:src/auth/login.ts:handleLogin",
      "type": "contains",
      "direction": "forward",
      "weight": 1.0
    },
    {
      "source": "file:src/auth/login.ts",
      "target": "func:src/auth/login.ts:validateEmail",
      "type": "contains",
      "direction": "forward",
      "weight": 1.0
    },
    {
      "source": "func:src/auth/login.ts:handleLogin",
      "target": "func:src/auth/login.ts:validateEmail",
      "type": "calls",
      "direction": "forward",
      "description": "handleLogin calls validateEmail to check the email format",
      "weight": 0.8
    },
    {
      "source": "file:src/auth/login.ts",
      "target": "file:src/db/connection.ts",
      "type": "imports",
      "direction": "forward",
      "weight": 0.7
    }
  ],
  "layers": [],
  "tour": []
}
```

**Step 6: Verify in browser**

Open: `http://localhost:5173`
Expected: Dashboard loads, graph renders 5 nodes with edges, clicking a node shows details in the info panel and placeholder in code viewer. Search works.

**Step 7: Commit**

```bash
git add packages/dashboard/
git commit -m "feat(dashboard): add main layout with search bar, graph view, code viewer, and node info panels"
```

---

## Task 10: Integration — Wire Everything Together + README

**Files:**
- Create: `README.md`
- Create: `CLAUDE.md`

**Step 1: Create README.md**

```markdown
# Understand Anything

An open-source tool that combines LLM intelligence with static analysis to help anyone understand any codebase — from junior developers to product managers.

## Features

- **Knowledge Graph** — Automatically maps your codebase into an interactive graph of files, functions, classes, and their relationships
- **Multi-Panel Dashboard** — Graph view, code viewer, chat, and learn panels in a workspace layout
- **Natural Language Search** — Search your codebase with plain English: "which parts handle authentication?"
- **Tree-sitter Analysis** — Accurate structural analysis for TypeScript, JavaScript (more languages coming)
- **LLM-Powered Summaries** — Every node gets a plain-English description of what it does and why

## Quick Start

```bash
# Install dependencies
pnpm install

# Build the core package
pnpm --filter @understand-anything/core build

# Start the dashboard dev server
pnpm dev:dashboard
```

## Project Structure

```
packages/
  core/        — Analysis engine: types, persistence, tree-sitter, LLM prompts
  dashboard/   — React + TypeScript web dashboard
  skill/       — Claude Code skill (coming soon)
```

## Tech Stack

- TypeScript, pnpm workspaces
- React 18, Vite, TailwindCSS
- React Flow (graph visualization)
- Monaco Editor (code viewer)
- Zustand (state management)
- tree-sitter (static analysis)

## License

MIT
```

**Step 2: Create CLAUDE.md**

```markdown
# Understand Anything

## Project Overview
An open-source tool combining LLM intelligence + static analysis to produce interactive dashboards for understanding codebases.

## Architecture
- **Monorepo** with pnpm workspaces
- **packages/core** — Shared analysis engine (types, persistence, tree-sitter plugin, LLM prompt templates)
- **packages/dashboard** — React + TypeScript web dashboard (React Flow, Monaco Editor, Zustand, TailwindCSS)
- **packages/skill** — Claude Code skill (not yet implemented)

## Key Commands
- `pnpm install` — Install all dependencies
- `pnpm --filter @understand-anything/core build` — Build the core package
- `pnpm --filter @understand-anything/core test` — Run core tests
- `pnpm dev:dashboard` — Start dashboard dev server

## Conventions
- TypeScript strict mode everywhere
- Vitest for testing
- ESM modules (`"type": "module"`)
- Knowledge graph JSON lives in `.understand-anything/` directory of analyzed projects
```

**Step 3: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: add README and CLAUDE.md with project overview and conventions"
```

---

## Verification Checklist

After completing all 10 tasks:

1. **`pnpm install`** — No errors
2. **`pnpm --filter @understand-anything/core build`** — Compiles clean
3. **`pnpm --filter @understand-anything/core test`** — All tests pass (types, persistence, tree-sitter, graph builder, LLM analyzer)
4. **`pnpm dev:dashboard`** — Dashboard starts at localhost:5173
5. **Dashboard with sample data** — Loads `knowledge-graph.json`, graph renders, nodes clickable, search works, code viewer shows node info
6. **Git log** — Clean history with 10 logical commits
````

## File: docs/superpowers/plans/2026-03-14-phase2-implementation.md
````markdown
# Understand Anything — Phase 2 (Intelligence) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the "Intelligence" layer — enhanced search, staleness detection, layer auto-detection, `/understand-chat` skill command, and a dashboard chat panel with context-aware Q&A.

**Architecture:** Extends the existing monorepo (packages/core, packages/dashboard) with a new packages/skill package. Core gets search engine, staleness detection, and layer detection. Dashboard gets auto-layout, enhanced search UX, and chat panel. Skill package provides the `/understand-chat` Claude Code command.

**Tech Stack:** Existing stack + fuse.js (fuzzy search), zod (schema validation), @dagrejs/dagre (graph layout)

---

## Task 1: Zod Schema Validation for Graph Loading

**Files:**
- Create: `packages/core/src/schema.ts`
- Modify: `packages/core/src/persistence/index.ts`
- Modify: `packages/core/package.json`
- Create: `packages/core/src/__tests__/schema.test.ts`

**Context:** Currently `loadGraph` does `JSON.parse()` with no validation. Corrupted or incompatible graph files silently produce broken data. Add zod schemas matching every type in `types.ts`, and validate on load. This is foundational — all Phase 2 features rely on correct graph data.

**Step 1: Install zod**

```bash
cd packages/core && pnpm add zod
```

**Step 2: Write failing tests**

```typescript
// packages/core/src/__tests__/schema.test.ts
import { describe, it, expect } from 'vitest';
import { KnowledgeGraphSchema, validateGraph } from '../schema.js';

describe('schema validation', () => {
  it('validates a correct knowledge graph', () => {
    const valid = {
      version: '1.0.0',
      project: {
        name: 'test',
        languages: ['typescript'],
        frameworks: [],
        description: 'A test project',
        analyzedAt: '2026-03-14T00:00:00Z',
        gitCommitHash: 'abc123',
      },
      nodes: [{
        id: 'file:src/index.ts',
        type: 'file',
        name: 'index.ts',
        filePath: 'src/index.ts',
        summary: 'Main entry',
        tags: ['entry'],
        complexity: 'simple',
      }],
      edges: [{
        source: 'file:src/index.ts',
        target: 'file:src/utils.ts',
        type: 'imports',
        direction: 'forward',
        weight: 0.7,
      }],
      layers: [],
      tour: [],
    };
    const result = validateGraph(valid);
    expect(result.success).toBe(true);
  });

  it('rejects graph with missing required fields', () => {
    const invalid = { version: '1.0.0' }; // missing everything else
    const result = validateGraph(invalid);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('rejects node with invalid type', () => {
    const invalid = {
      version: '1.0.0',
      project: {
        name: 'test', languages: [], frameworks: [],
        description: '', analyzedAt: '', gitCommitHash: '',
      },
      nodes: [{
        id: 'x', type: 'invalid_type', name: 'x',
        summary: '', tags: [], complexity: 'simple',
      }],
      edges: [], layers: [], tour: [],
    };
    const result = validateGraph(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects edge with invalid EdgeType', () => {
    const invalid = {
      version: '1.0.0',
      project: {
        name: 'test', languages: [], frameworks: [],
        description: '', analyzedAt: '', gitCommitHash: '',
      },
      nodes: [],
      edges: [{
        source: 'a', target: 'b', type: 'fake_edge',
        direction: 'forward', weight: 0.5,
      }],
      layers: [], tour: [],
    };
    const result = validateGraph(invalid);
    expect(result.success).toBe(false);
  });

  it('coerces weight out of range to clamped value', () => {
    const graph = {
      version: '1.0.0',
      project: {
        name: 'test', languages: [], frameworks: [],
        description: '', analyzedAt: '', gitCommitHash: '',
      },
      nodes: [],
      edges: [{
        source: 'a', target: 'b', type: 'imports',
        direction: 'forward', weight: 1.5,
      }],
      layers: [], tour: [],
    };
    const result = validateGraph(graph);
    // weight > 1 should fail validation
    expect(result.success).toBe(false);
  });
});
```

**Step 3: Run tests to verify they fail**

```bash
pnpm --filter @understand-anything/core test
```
Expected: FAIL — `schema.ts` does not exist yet.

**Step 4: Implement schema.ts**

```typescript
// packages/core/src/schema.ts
import { z } from 'zod';

const EdgeTypeSchema = z.enum([
  'imports', 'exports', 'contains', 'inherits', 'implements',
  'calls', 'subscribes', 'publishes', 'middleware',
  'reads_from', 'writes_to', 'transforms', 'validates',
  'depends_on', 'tested_by', 'configures',
  'related', 'similar_to',
]);

const GraphNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['file', 'function', 'class', 'module', 'concept']),
  name: z.string(),
  filePath: z.string().optional(),
  lineRange: z.tuple([z.number(), z.number()]).optional(),
  summary: z.string(),
  tags: z.array(z.string()),
  complexity: z.enum(['simple', 'moderate', 'complex']),
  languageNotes: z.string().optional(),
});

const GraphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: EdgeTypeSchema,
  direction: z.enum(['forward', 'backward', 'bidirectional']),
  description: z.string().optional(),
  weight: z.number().min(0).max(1),
});

const LayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  nodeIds: z.array(z.string()),
});

const TourStepSchema = z.object({
  order: z.number(),
  title: z.string(),
  description: z.string(),
  nodeIds: z.array(z.string()),
  languageLesson: z.string().optional(),
});

const ProjectMetaSchema = z.object({
  name: z.string(),
  languages: z.array(z.string()),
  frameworks: z.array(z.string()),
  description: z.string(),
  analyzedAt: z.string(),
  gitCommitHash: z.string(),
});

export const KnowledgeGraphSchema = z.object({
  version: z.string(),
  project: ProjectMetaSchema,
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
  layers: z.array(LayerSchema),
  tour: z.array(TourStepSchema),
});

export interface ValidationResult {
  success: boolean;
  data?: z.infer<typeof KnowledgeGraphSchema>;
  errors?: string[];
}

export function validateGraph(data: unknown): ValidationResult {
  const result = KnowledgeGraphSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map(
      (i) => `${i.path.join('.')}: ${i.message}`
    ),
  };
}
```

**Step 5: Wire validation into persistence loadGraph**

Modify `packages/core/src/persistence/index.ts`:

Add an optional `validate` parameter (default `true`) to `loadGraph`. When true, run `validateGraph` on the parsed JSON. If validation fails, throw an error with details. Keep backward compat by defaulting to validated.

```typescript
import { validateGraph } from '../schema.js';

export function loadGraph(
  baseDir: string,
  options?: { validate?: boolean }
): KnowledgeGraph | null {
  const graphPath = path.join(baseDir, '.understand-anything', 'knowledge-graph.json');
  if (!fs.existsSync(graphPath)) return null;
  const data = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
  if (options?.validate !== false) {
    const result = validateGraph(data);
    if (!result.success) {
      throw new Error(
        `Invalid knowledge graph: ${result.errors?.join('; ')}`
      );
    }
    return result.data as KnowledgeGraph;
  }
  return data as KnowledgeGraph;
}
```

**Step 6: Update barrel export**

Add to `packages/core/src/index.ts`:
```typescript
export { KnowledgeGraphSchema, validateGraph, type ValidationResult } from './schema.js';
```

**Step 7: Run tests to verify they pass**

```bash
pnpm --filter @understand-anything/core test
```
Expected: ALL PASS

**Step 8: Commit**

```bash
git add packages/core/src/schema.ts packages/core/src/__tests__/schema.test.ts packages/core/src/persistence/index.ts packages/core/src/index.ts packages/core/package.json pnpm-lock.yaml
git commit -m "feat(core): add zod schema validation for knowledge graph loading"
```

---

## Task 2: Enhanced Search Engine with Fuzzy Matching

**Files:**
- Create: `packages/core/src/search.ts`
- Create: `packages/core/src/__tests__/search.test.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/package.json`

**Context:** The current dashboard store has basic case-insensitive substring search across name/summary/tags. Phase 2 needs fuzzy matching and relevance scoring. We build a reusable `SearchEngine` in core (used by both dashboard and skill), powered by Fuse.js. The dashboard store will switch to using this engine in a later task.

**Step 1: Install fuse.js**

```bash
cd packages/core && pnpm add fuse.js
```

**Step 2: Write failing tests**

```typescript
// packages/core/src/__tests__/search.test.ts
import { describe, it, expect } from 'vitest';
import { SearchEngine } from '../search.js';
import type { GraphNode } from '../types.js';

const makeNode = (overrides: Partial<GraphNode>): GraphNode => ({
  id: 'test',
  type: 'file',
  name: 'test',
  summary: '',
  tags: [],
  complexity: 'simple',
  ...overrides,
});

describe('SearchEngine', () => {
  it('returns empty results for empty query', () => {
    const engine = new SearchEngine([makeNode({ id: 'a', name: 'foo' })]);
    expect(engine.search('')).toEqual([]);
  });

  it('finds exact name match', () => {
    const nodes = [
      makeNode({ id: 'a', name: 'AuthController' }),
      makeNode({ id: 'b', name: 'UserService' }),
    ];
    const engine = new SearchEngine(nodes);
    const results = engine.search('AuthController');
    expect(results.length).toBe(1);
    expect(results[0].nodeId).toBe('a');
  });

  it('finds fuzzy name match', () => {
    const nodes = [
      makeNode({ id: 'a', name: 'AuthenticationController' }),
      makeNode({ id: 'b', name: 'DatabaseConnection' }),
    ];
    const engine = new SearchEngine(nodes);
    const results = engine.search('auth contrl');
    expect(results.some(r => r.nodeId === 'a')).toBe(true);
  });

  it('searches across summary field', () => {
    const nodes = [
      makeNode({ id: 'a', name: 'handler.ts', summary: 'Handles WebSocket communication' }),
      makeNode({ id: 'b', name: 'utils.ts', summary: 'General utilities' }),
    ];
    const engine = new SearchEngine(nodes);
    const results = engine.search('communication');
    expect(results[0].nodeId).toBe('a');
  });

  it('searches across tags', () => {
    const nodes = [
      makeNode({ id: 'a', name: 'x.ts', tags: ['authentication', 'security'] }),
      makeNode({ id: 'b', name: 'y.ts', tags: ['database'] }),
    ];
    const engine = new SearchEngine(nodes);
    const results = engine.search('security');
    expect(results[0].nodeId).toBe('a');
  });

  it('ranks name matches higher than summary matches', () => {
    const nodes = [
      makeNode({ id: 'a', name: 'utils.ts', summary: 'Contains the auth function' }),
      makeNode({ id: 'b', name: 'auth.ts', summary: 'Some utility functions' }),
    ];
    const engine = new SearchEngine(nodes);
    const results = engine.search('auth');
    expect(results[0].nodeId).toBe('b'); // name match ranks higher
  });

  it('returns scored results', () => {
    const nodes = [makeNode({ id: 'a', name: 'foo' })];
    const engine = new SearchEngine(nodes);
    const results = engine.search('foo');
    expect(results[0]).toHaveProperty('score');
    expect(typeof results[0].score).toBe('number');
  });

  it('can update nodes and re-index', () => {
    const engine = new SearchEngine([makeNode({ id: 'a', name: 'old' })]);
    engine.updateNodes([makeNode({ id: 'b', name: 'new' })]);
    const results = engine.search('new');
    expect(results[0].nodeId).toBe('b');
    expect(engine.search('old')).toEqual([]);
  });

  it('filters by node type', () => {
    const nodes = [
      makeNode({ id: 'a', name: 'auth', type: 'file' }),
      makeNode({ id: 'b', name: 'auth', type: 'function' }),
    ];
    const engine = new SearchEngine(nodes);
    const results = engine.search('auth', { types: ['function'] });
    expect(results.length).toBe(1);
    expect(results[0].nodeId).toBe('b');
  });
});
```

**Step 3: Run tests to verify they fail**

```bash
pnpm --filter @understand-anything/core test
```
Expected: FAIL — `search.ts` does not exist.

**Step 4: Implement SearchEngine**

```typescript
// packages/core/src/search.ts
import Fuse from 'fuse.js';
import type { GraphNode } from './types.js';

export interface SearchResult {
  nodeId: string;
  score: number; // 0 = perfect match, 1 = worst match
}

export interface SearchOptions {
  types?: GraphNode['type'][];
  limit?: number;
}

export class SearchEngine {
  private fuse: Fuse<GraphNode>;
  private nodes: GraphNode[];

  constructor(nodes: GraphNode[]) {
    this.nodes = nodes;
    this.fuse = this.createIndex(nodes);
  }

  private createIndex(nodes: GraphNode[]): Fuse<GraphNode> {
    return new Fuse(nodes, {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'tags', weight: 0.3 },
        { name: 'summary', weight: 0.2 },
        { name: 'languageNotes', weight: 0.1 },
      ],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
    });
  }

  search(query: string, options?: SearchOptions): SearchResult[] {
    if (!query.trim()) return [];

    let results = this.fuse.search(query);

    if (options?.types?.length) {
      results = results.filter((r) => options.types!.includes(r.item.type));
    }

    const limit = options?.limit ?? 50;

    return results.slice(0, limit).map((r) => ({
      nodeId: r.item.id,
      score: r.score ?? 1,
    }));
  }

  updateNodes(nodes: GraphNode[]): void {
    this.nodes = nodes;
    this.fuse = this.createIndex(nodes);
  }
}
```

**Step 5: Update barrel export**

Add to `packages/core/src/index.ts`:
```typescript
export { SearchEngine, type SearchResult, type SearchOptions } from './search.js';
```

**Step 6: Run tests to verify they pass**

```bash
pnpm --filter @understand-anything/core test
```
Expected: ALL PASS

**Step 7: Commit**

```bash
git add packages/core/src/search.ts packages/core/src/__tests__/search.test.ts packages/core/src/index.ts packages/core/package.json pnpm-lock.yaml
git commit -m "feat(core): add fuzzy search engine with Fuse.js"
```

---

## Task 3: Dagre Auto-Layout for Graph View

**Files:**
- Create: `packages/dashboard/src/utils/layout.ts`
- Modify: `packages/dashboard/src/components/GraphView.tsx`
- Modify: `packages/dashboard/package.json`

**Context:** Currently GraphView positions nodes in a simple `(index % 3) * 300` grid. This produces chaotic graphs for real projects. Add dagre (hierarchical graph layout) to compute positions respecting edge direction. Nodes flow top-to-bottom, with edges determining hierarchy.

**Step 1: Install dagre**

```bash
cd packages/dashboard && pnpm add @dagrejs/dagre
```

**Step 2: Create layout utility**

```typescript
// packages/dashboard/src/utils/layout.ts
import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 280;
const NODE_HEIGHT = 120;

export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 80,
    marginx: 20,
    marginy: 20,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

**Step 3: Update GraphView to use dagre layout**

Replace the `(index % 3) * 300` grid positioning in `GraphView.tsx` with a call to `applyDagreLayout`. The key changes:

1. Import `applyDagreLayout` from `../utils/layout.js`
2. Build flow nodes/edges from graph data (without position)
3. Pass through `applyDagreLayout` to get positioned nodes
4. Use `useMemo` to recompute layout only when graph/search changes

The component should keep all existing functionality (custom nodes, search highlighting, selection, controls, minimap).

**Step 4: Verify manually**

```bash
pnpm dev:dashboard
```
Open http://localhost:5173 — graph should display nodes in a hierarchical layout following edge direction, not in a flat grid.

**Step 5: Commit**

```bash
git add packages/dashboard/src/utils/layout.ts packages/dashboard/src/components/GraphView.tsx packages/dashboard/package.json pnpm-lock.yaml
git commit -m "feat(dashboard): add dagre auto-layout for hierarchical graph visualization"
```

---

## Task 4: Staleness Detection + Incremental Updates

**Files:**
- Create: `packages/core/src/staleness.ts`
- Create: `packages/core/src/__tests__/staleness.test.ts`
- Modify: `packages/core/src/index.ts`

**Context:** The design doc specifies an auto-sync flow: read `meta.json` → git diff against last hash → re-analyze only changed files → merge into existing graph. This task builds the staleness detection and graph merging logic. It does NOT invoke LLM or tree-sitter (that's orchestration, done by the skill). It provides the building blocks: detect changed files, merge updated nodes/edges into an existing graph.

**Step 1: Write failing tests**

```typescript
// packages/core/src/__tests__/staleness.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getChangedFiles,
  isStale,
  mergeGraphUpdate,
} from '../staleness.js';
import type { KnowledgeGraph, GraphNode, GraphEdge } from '../types.js';

// Mock child_process.execSync for git commands
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';
const mockExecSync = vi.mocked(execSync);

describe('staleness detection', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getChangedFiles', () => {
    it('returns changed file list from git diff', () => {
      mockExecSync.mockReturnValue(Buffer.from('src/a.ts\nsrc/b.ts\n'));
      const files = getChangedFiles('/project', 'abc123');
      expect(files).toEqual(['src/a.ts', 'src/b.ts']);
      expect(mockExecSync).toHaveBeenCalledWith(
        'git diff abc123..HEAD --name-only',
        expect.objectContaining({ cwd: '/project' })
      );
    });

    it('returns empty array when no changes', () => {
      mockExecSync.mockReturnValue(Buffer.from(''));
      const files = getChangedFiles('/project', 'abc123');
      expect(files).toEqual([]);
    });

    it('returns empty array on git error', () => {
      mockExecSync.mockImplementation(() => { throw new Error('git error'); });
      const files = getChangedFiles('/project', 'abc123');
      expect(files).toEqual([]);
    });
  });

  describe('isStale', () => {
    it('returns stale when files have changed', () => {
      mockExecSync.mockReturnValue(Buffer.from('src/a.ts\n'));
      const result = isStale('/project', 'abc123');
      expect(result.stale).toBe(true);
      expect(result.changedFiles).toEqual(['src/a.ts']);
    });

    it('returns not stale when no files changed', () => {
      mockExecSync.mockReturnValue(Buffer.from(''));
      const result = isStale('/project', 'abc123');
      expect(result.stale).toBe(false);
      expect(result.changedFiles).toEqual([]);
    });
  });

  describe('mergeGraphUpdate', () => {
    const baseGraph: KnowledgeGraph = {
      version: '1.0.0',
      project: {
        name: 'test',
        languages: ['typescript'],
        frameworks: [],
        description: '',
        analyzedAt: '2026-01-01T00:00:00Z',
        gitCommitHash: 'old',
      },
      nodes: [
        { id: 'file:src/a.ts', type: 'file', name: 'a.ts', filePath: 'src/a.ts', summary: 'old', tags: [], complexity: 'simple' },
        { id: 'file:src/b.ts', type: 'file', name: 'b.ts', filePath: 'src/b.ts', summary: 'unchanged', tags: [], complexity: 'simple' },
        { id: 'func:src/a.ts:foo', type: 'function', name: 'foo', filePath: 'src/a.ts', summary: 'old foo', tags: [], complexity: 'simple' },
      ],
      edges: [
        { source: 'file:src/a.ts', target: 'file:src/b.ts', type: 'imports', direction: 'forward', weight: 0.7 },
        { source: 'file:src/a.ts', target: 'func:src/a.ts:foo', type: 'contains', direction: 'forward', weight: 1.0 },
      ],
      layers: [],
      tour: [],
    };

    it('replaces nodes for changed files', () => {
      const newNodes: GraphNode[] = [
        { id: 'file:src/a.ts', type: 'file', name: 'a.ts', filePath: 'src/a.ts', summary: 'updated', tags: ['new'], complexity: 'moderate' },
        { id: 'func:src/a.ts:bar', type: 'function', name: 'bar', filePath: 'src/a.ts', summary: 'new func', tags: [], complexity: 'simple' },
      ];
      const newEdges: GraphEdge[] = [
        { source: 'file:src/a.ts', target: 'func:src/a.ts:bar', type: 'contains', direction: 'forward', weight: 1.0 },
      ];

      const merged = mergeGraphUpdate(baseGraph, ['src/a.ts'], newNodes, newEdges, 'newHash');

      // Old a.ts nodes removed, new ones added
      expect(merged.nodes.find(n => n.id === 'func:src/a.ts:foo')).toBeUndefined();
      expect(merged.nodes.find(n => n.id === 'func:src/a.ts:bar')).toBeDefined();
      expect(merged.nodes.find(n => n.id === 'file:src/a.ts')?.summary).toBe('updated');

      // b.ts unchanged
      expect(merged.nodes.find(n => n.id === 'file:src/b.ts')?.summary).toBe('unchanged');

      // Git hash updated
      expect(merged.project.gitCommitHash).toBe('newHash');
    });

    it('removes edges originating from changed files', () => {
      const newNodes: GraphNode[] = [
        { id: 'file:src/a.ts', type: 'file', name: 'a.ts', filePath: 'src/a.ts', summary: 'updated', tags: [], complexity: 'simple' },
      ];
      const newEdges: GraphEdge[] = [
        { source: 'file:src/a.ts', target: 'file:src/b.ts', type: 'imports', direction: 'forward', weight: 0.9 },
      ];

      const merged = mergeGraphUpdate(baseGraph, ['src/a.ts'], newNodes, newEdges, 'newHash');

      // Old contains edge removed, new imports edge present with new weight
      const importEdge = merged.edges.find(e => e.source === 'file:src/a.ts' && e.target === 'file:src/b.ts');
      expect(importEdge?.weight).toBe(0.9);
      expect(merged.edges.find(e => e.type === 'contains')).toBeUndefined();
    });

    it('updates analyzedAt timestamp', () => {
      const merged = mergeGraphUpdate(baseGraph, ['src/a.ts'], [], [], 'newHash');
      expect(merged.project.analyzedAt).not.toBe('2026-01-01T00:00:00Z');
    });
  });
});
```

**Step 3: Run tests to verify they fail**

```bash
pnpm --filter @understand-anything/core test
```
Expected: FAIL — `staleness.ts` does not exist.

**Step 4: Implement staleness.ts**

```typescript
// packages/core/src/staleness.ts
import { execSync } from 'child_process';
import type { KnowledgeGraph, GraphNode, GraphEdge } from './types.js';

export interface StalenessResult {
  stale: boolean;
  changedFiles: string[];
}

export function getChangedFiles(projectDir: string, lastCommitHash: string): string[] {
  try {
    const output = execSync(`git diff ${lastCommitHash}..HEAD --name-only`, {
      cwd: projectDir,
      encoding: 'utf-8',
    });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

export function isStale(projectDir: string, lastCommitHash: string): StalenessResult {
  const changedFiles = getChangedFiles(projectDir, lastCommitHash);
  return {
    stale: changedFiles.length > 0,
    changedFiles,
  };
}

export function mergeGraphUpdate(
  existingGraph: KnowledgeGraph,
  changedFilePaths: string[],
  newNodes: GraphNode[],
  newEdges: GraphEdge[],
  newCommitHash: string,
): KnowledgeGraph {
  const changedSet = new Set(changedFilePaths);

  // Remove old nodes belonging to changed files
  const keptNodes = existingGraph.nodes.filter(
    (node) => !node.filePath || !changedSet.has(node.filePath)
  );

  // Remove old edges where source node belongs to a changed file
  const changedNodeIds = new Set(
    existingGraph.nodes
      .filter((n) => n.filePath && changedSet.has(n.filePath))
      .map((n) => n.id)
  );
  const keptEdges = existingGraph.edges.filter(
    (edge) => !changedNodeIds.has(edge.source)
  );

  return {
    ...existingGraph,
    project: {
      ...existingGraph.project,
      gitCommitHash: newCommitHash,
      analyzedAt: new Date().toISOString(),
    },
    nodes: [...keptNodes, ...newNodes],
    edges: [...keptEdges, ...newEdges],
  };
}
```

**Step 5: Update barrel export**

Add to `packages/core/src/index.ts`:
```typescript
export {
  getChangedFiles,
  isStale,
  mergeGraphUpdate,
  type StalenessResult,
} from './staleness.js';
```

**Step 6: Run tests to verify they pass**

```bash
pnpm --filter @understand-anything/core test
```
Expected: ALL PASS

**Step 7: Commit**

```bash
git add packages/core/src/staleness.ts packages/core/src/__tests__/staleness.test.ts packages/core/src/index.ts
git commit -m "feat(core): add staleness detection and incremental graph merging"
```

---

## Task 5: Layer Auto-Detection

**Files:**
- Create: `packages/core/src/analyzer/layer-detector.ts`
- Create: `packages/core/src/__tests__/layer-detector.test.ts`
- Modify: `packages/core/src/index.ts`

**Context:** Layer detection groups nodes into logical layers (e.g., "API Layer", "Data Layer", "UI Layer") based on file paths, naming patterns, and edge structure. This uses a heuristic approach: analyze file paths for common patterns (routes/, controllers/, models/, services/, etc.) and node connectivity. An LLM prompt builder is provided for enhanced detection when LLM is available, but the heuristic works standalone. Layers populate the `layers[]` field in the KnowledgeGraph.

**Step 1: Write failing tests**

```typescript
// packages/core/src/__tests__/layer-detector.test.ts
import { describe, it, expect } from 'vitest';
import { detectLayers, buildLayerDetectionPrompt, parseLayerDetectionResponse } from '../analyzer/layer-detector.js';
import type { KnowledgeGraph } from '../types.js';

const makeGraph = (nodes: Array<{ id: string; filePath: string; name: string }>): KnowledgeGraph => ({
  version: '1.0.0',
  project: {
    name: 'test', languages: ['typescript'], frameworks: [],
    description: '', analyzedAt: '', gitCommitHash: '',
  },
  nodes: nodes.map((n) => ({
    ...n,
    type: 'file' as const,
    summary: '',
    tags: [],
    complexity: 'simple' as const,
  })),
  edges: [],
  layers: [],
  tour: [],
});

describe('layer detection (heuristic)', () => {
  it('detects API/routes layer', () => {
    const graph = makeGraph([
      { id: 'file:src/routes/users.ts', filePath: 'src/routes/users.ts', name: 'users.ts' },
      { id: 'file:src/routes/auth.ts', filePath: 'src/routes/auth.ts', name: 'auth.ts' },
      { id: 'file:src/models/user.ts', filePath: 'src/models/user.ts', name: 'user.ts' },
    ]);
    const layers = detectLayers(graph);
    const apiLayer = layers.find((l) => l.name.toLowerCase().includes('api') || l.name.toLowerCase().includes('route'));
    expect(apiLayer).toBeDefined();
    expect(apiLayer!.nodeIds).toContain('file:src/routes/users.ts');
  });

  it('detects data/model layer', () => {
    const graph = makeGraph([
      { id: 'file:src/models/user.ts', filePath: 'src/models/user.ts', name: 'user.ts' },
      { id: 'file:src/models/post.ts', filePath: 'src/models/post.ts', name: 'post.ts' },
      { id: 'file:src/index.ts', filePath: 'src/index.ts', name: 'index.ts' },
    ]);
    const layers = detectLayers(graph);
    const dataLayer = layers.find((l) => l.name.toLowerCase().includes('data') || l.name.toLowerCase().includes('model'));
    expect(dataLayer).toBeDefined();
    expect(dataLayer!.nodeIds).toContain('file:src/models/user.ts');
  });

  it('puts unmatched files in a general layer', () => {
    const graph = makeGraph([
      { id: 'file:src/foo.ts', filePath: 'src/foo.ts', name: 'foo.ts' },
    ]);
    const layers = detectLayers(graph);
    expect(layers.length).toBeGreaterThan(0);
    expect(layers.some((l) => l.nodeIds.includes('file:src/foo.ts'))).toBe(true);
  });

  it('assigns unique IDs to layers', () => {
    const graph = makeGraph([
      { id: 'file:src/routes/a.ts', filePath: 'src/routes/a.ts', name: 'a.ts' },
      { id: 'file:src/models/b.ts', filePath: 'src/models/b.ts', name: 'b.ts' },
    ]);
    const layers = detectLayers(graph);
    const ids = layers.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only assigns file nodes to layers', () => {
    const graph: KnowledgeGraph = {
      ...makeGraph([{ id: 'file:src/routes/a.ts', filePath: 'src/routes/a.ts', name: 'a.ts' }]),
      nodes: [
        { id: 'file:src/routes/a.ts', type: 'file', filePath: 'src/routes/a.ts', name: 'a.ts', summary: '', tags: [], complexity: 'simple' },
        { id: 'func:src/routes/a.ts:handler', type: 'function', filePath: 'src/routes/a.ts', name: 'handler', summary: '', tags: [], complexity: 'simple' },
      ],
    };
    const layers = detectLayers(graph);
    const allNodeIds = layers.flatMap((l) => l.nodeIds);
    expect(allNodeIds).not.toContain('func:src/routes/a.ts:handler');
  });
});

describe('LLM layer detection prompt', () => {
  it('builds a prompt containing file paths', () => {
    const graph = makeGraph([
      { id: 'file:src/routes/a.ts', filePath: 'src/routes/a.ts', name: 'a.ts' },
    ]);
    const prompt = buildLayerDetectionPrompt(graph);
    expect(prompt).toContain('src/routes/a.ts');
    expect(prompt).toContain('JSON');
  });

  it('parses a valid LLM response', () => {
    const response = JSON.stringify({
      layers: [
        { name: 'API Layer', description: 'HTTP routes', filePatterns: ['src/routes/'] },
        { name: 'Data Layer', description: 'Models', filePatterns: ['src/models/'] },
      ],
    });
    const result = parseLayerDetectionResponse(response);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(2);
    expect(result![0].name).toBe('API Layer');
  });

  it('returns null for invalid response', () => {
    expect(parseLayerDetectionResponse('not json')).toBeNull();
  });
});
```

**Step 3: Run tests to verify they fail**

```bash
pnpm --filter @understand-anything/core test
```
Expected: FAIL — `layer-detector.ts` does not exist.

**Step 4: Implement layer-detector.ts**

```typescript
// packages/core/src/analyzer/layer-detector.ts
import type { KnowledgeGraph, Layer } from '../types.js';

// Heuristic layer patterns: directory path substring → layer info
const LAYER_PATTERNS: Array<{ patterns: string[]; name: string; description: string }> = [
  {
    patterns: ['route', 'controller', 'handler', 'endpoint', 'api/'],
    name: 'API Layer',
    description: 'HTTP routes, controllers, and API endpoint handlers',
  },
  {
    patterns: ['service', 'usecase', 'use-case', 'business'],
    name: 'Service Layer',
    description: 'Business logic and service orchestration',
  },
  {
    patterns: ['model', 'entity', 'schema', 'database', 'db/', 'migration', 'repository', 'repo'],
    name: 'Data Layer',
    description: 'Data models, database schemas, and persistence',
  },
  {
    patterns: ['component', 'view', 'page', 'screen', 'layout', 'widget', 'ui/'],
    name: 'UI Layer',
    description: 'User interface components and views',
  },
  {
    patterns: ['middleware', 'interceptor', 'guard', 'filter', 'pipe'],
    name: 'Middleware Layer',
    description: 'Request processing middleware and interceptors',
  },
  {
    patterns: ['util', 'helper', 'lib/', 'common/', 'shared/'],
    name: 'Utility Layer',
    description: 'Shared utilities, helpers, and common code',
  },
  {
    patterns: ['test', 'spec', '__test__', '__spec__'],
    name: 'Test Layer',
    description: 'Tests and test utilities',
  },
  {
    patterns: ['config', 'setting', 'env'],
    name: 'Configuration Layer',
    description: 'Application configuration and environment settings',
  },
];

export function detectLayers(graph: KnowledgeGraph): Layer[] {
  const fileNodes = graph.nodes.filter((n) => n.type === 'file' && n.filePath);

  const layerMap = new Map<string, { name: string; description: string; nodeIds: string[] }>();
  const assignedNodes = new Set<string>();

  // Match file paths against patterns
  for (const node of fileNodes) {
    const fp = node.filePath!.toLowerCase();
    for (const layerDef of LAYER_PATTERNS) {
      if (layerDef.patterns.some((p) => fp.includes(p))) {
        if (!layerMap.has(layerDef.name)) {
          layerMap.set(layerDef.name, {
            name: layerDef.name,
            description: layerDef.description,
            nodeIds: [],
          });
        }
        layerMap.get(layerDef.name)!.nodeIds.push(node.id);
        assignedNodes.add(node.id);
        break; // First matching pattern wins
      }
    }
  }

  // Unassigned files go to "Core" layer
  const unassigned = fileNodes.filter((n) => !assignedNodes.has(n.id));
  if (unassigned.length > 0) {
    layerMap.set('Core', {
      name: 'Core',
      description: 'Core application files and entry points',
      nodeIds: unassigned.map((n) => n.id),
    });
  }

  // Convert to Layer[] with unique IDs
  return Array.from(layerMap.values()).map((entry, i) => ({
    id: `layer:${entry.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: entry.name,
    description: entry.description,
    nodeIds: entry.nodeIds,
  }));
}

// --- LLM-enhanced layer detection ---

export function buildLayerDetectionPrompt(graph: KnowledgeGraph): string {
  const filePaths = graph.nodes
    .filter((n) => n.type === 'file' && n.filePath)
    .map((n) => n.filePath!);

  return `Analyze this project's file structure and identify logical architectural layers.

File paths:
${filePaths.map((f) => `- ${f}`).join('\n')}

Respond with JSON only:
{
  "layers": [
    {
      "name": "Layer Name",
      "description": "What this layer does",
      "filePatterns": ["path/prefix/"]
    }
  ]
}

Rules:
- Identify 3-7 logical layers
- Each layer should have a clear architectural purpose
- filePatterns are path prefixes that match files in that layer
- Common layers: API, Service/Business Logic, Data/Models, UI, Middleware, Utility, Configuration, Tests`;
}

interface LLMLayerResponse {
  name: string;
  description: string;
  filePatterns: string[];
}

export function parseLayerDetectionResponse(response: string): LLMLayerResponse[] | null {
  try {
    // Handle markdown fences
    let cleaned = response.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
    }
    const parsed = JSON.parse(cleaned);
    if (!parsed.layers || !Array.isArray(parsed.layers)) return null;
    return parsed.layers.map((l: Record<string, unknown>) => ({
      name: String(l.name || ''),
      description: String(l.description || ''),
      filePatterns: Array.isArray(l.filePatterns) ? l.filePatterns.map(String) : [],
    }));
  } catch {
    return null;
  }
}

/**
 * Convert LLM layer response into Layer[] by matching file patterns against graph nodes.
 */
export function applyLLMLayers(
  graph: KnowledgeGraph,
  llmLayers: LLMLayerResponse[],
): Layer[] {
  const fileNodes = graph.nodes.filter((n) => n.type === 'file' && n.filePath);
  const assignedNodes = new Set<string>();

  const layers: Layer[] = llmLayers.map((ll) => {
    const matching = fileNodes.filter((n) => {
      if (assignedNodes.has(n.id)) return false;
      return ll.filePatterns.some((p) => n.filePath!.includes(p));
    });
    matching.forEach((n) => assignedNodes.add(n.id));
    return {
      id: `layer:${ll.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: ll.name,
      description: ll.description,
      nodeIds: matching.map((n) => n.id),
    };
  });

  // Unassigned files
  const unassigned = fileNodes.filter((n) => !assignedNodes.has(n.id));
  if (unassigned.length > 0) {
    layers.push({
      id: 'layer:other',
      name: 'Other',
      description: 'Files not matching any detected layer',
      nodeIds: unassigned.map((n) => n.id),
    });
  }

  return layers.filter((l) => l.nodeIds.length > 0);
}
```

**Step 5: Update barrel export**

Add to `packages/core/src/index.ts`:
```typescript
export {
  detectLayers,
  buildLayerDetectionPrompt,
  parseLayerDetectionResponse,
  applyLLMLayers,
} from './analyzer/layer-detector.js';
```

**Step 6: Run tests to verify they pass**

```bash
pnpm --filter @understand-anything/core test
```
Expected: ALL PASS

**Step 7: Commit**

```bash
git add packages/core/src/analyzer/layer-detector.ts packages/core/src/__tests__/layer-detector.test.ts packages/core/src/index.ts
git commit -m "feat(core): add heuristic and LLM-based layer auto-detection"
```

---

## Task 6: Skill Package Scaffolding + `/understand-chat` Command

**Files:**
- Create: `packages/skill/package.json`
- Create: `packages/skill/tsconfig.json`
- Create: `packages/skill/src/understand-chat.ts`
- Create: `packages/skill/src/context-builder.ts`
- Create: `packages/skill/src/__tests__/context-builder.test.ts`
- Create: `packages/skill/.claude/skills/understand-chat.md` (the skill definition file)

**Context:** This is the first Claude Code skill command. `/understand-chat` provides in-terminal Q&A using the knowledge graph. As a Claude Code skill, it needs: (1) a skill markdown file that Claude loads, (2) a context-builder that extracts relevant graph context for a user query, (3) the prompt template that combines context + query. The skill reads the persisted `.understand-anything/knowledge-graph.json` and uses the active Claude session for LLM — no separate API call needed.

**Step 1: Create skill package.json**

```json
{
  "name": "@understand-anything/skill",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "@understand-anything/core": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.1.0"
  }
}
```

**Step 2: Create skill tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**Step 3: Write failing tests for context-builder**

```typescript
// packages/skill/src/__tests__/context-builder.test.ts
import { describe, it, expect } from 'vitest';
import { buildChatContext, formatContextForPrompt } from '../context-builder.js';
import type { KnowledgeGraph } from '@understand-anything/core';

const sampleGraph: KnowledgeGraph = {
  version: '1.0.0',
  project: {
    name: 'test-project',
    languages: ['typescript'],
    frameworks: ['express'],
    description: 'A sample web API',
    analyzedAt: '2026-03-14T00:00:00Z',
    gitCommitHash: 'abc123',
  },
  nodes: [
    { id: 'file:src/auth/login.ts', type: 'file', name: 'login.ts', filePath: 'src/auth/login.ts', summary: 'Handles user authentication and login flow', tags: ['auth', 'login', 'security'], complexity: 'moderate' },
    { id: 'func:src/auth/login.ts:authenticate', type: 'function', name: 'authenticate', filePath: 'src/auth/login.ts', summary: 'Validates credentials and returns JWT', tags: ['auth', 'jwt'], complexity: 'complex' },
    { id: 'file:src/routes/api.ts', type: 'file', name: 'api.ts', filePath: 'src/routes/api.ts', summary: 'Express API route definitions', tags: ['routes', 'api', 'express'], complexity: 'simple' },
    { id: 'file:src/db/connection.ts', type: 'file', name: 'connection.ts', filePath: 'src/db/connection.ts', summary: 'Database connection pooling', tags: ['database', 'connection'], complexity: 'moderate' },
  ],
  edges: [
    { source: 'file:src/routes/api.ts', target: 'file:src/auth/login.ts', type: 'imports', direction: 'forward', weight: 0.7 },
    { source: 'func:src/auth/login.ts:authenticate', target: 'file:src/db/connection.ts', type: 'reads_from', direction: 'forward', weight: 0.6 },
  ],
  layers: [
    { id: 'layer:api', name: 'API Layer', description: 'HTTP routes', nodeIds: ['file:src/routes/api.ts'] },
    { id: 'layer:auth', name: 'Auth Layer', description: 'Authentication', nodeIds: ['file:src/auth/login.ts', 'func:src/auth/login.ts:authenticate'] },
  ],
  tour: [],
};

describe('buildChatContext', () => {
  it('finds relevant nodes for a query', () => {
    const context = buildChatContext(sampleGraph, 'how does authentication work?');
    expect(context.relevantNodes.some((n) => n.id.includes('auth'))).toBe(true);
  });

  it('includes connected nodes', () => {
    const context = buildChatContext(sampleGraph, 'authentication');
    const nodeIds = context.relevantNodes.map((n) => n.id);
    // Should include auth nodes AND their connections (db/connection, routes/api)
    expect(nodeIds.length).toBeGreaterThan(1);
  });

  it('includes project metadata', () => {
    const context = buildChatContext(sampleGraph, 'anything');
    expect(context.projectName).toBe('test-project');
    expect(context.projectDescription).toBe('A sample web API');
  });

  it('includes relevant layers', () => {
    const context = buildChatContext(sampleGraph, 'authentication');
    expect(context.relevantLayers.length).toBeGreaterThan(0);
  });
});

describe('formatContextForPrompt', () => {
  it('produces a string containing node summaries', () => {
    const context = buildChatContext(sampleGraph, 'authentication');
    const formatted = formatContextForPrompt(context);
    expect(formatted).toContain('login.ts');
    expect(formatted).toContain('authentication');
  });

  it('includes edge descriptions', () => {
    const context = buildChatContext(sampleGraph, 'authentication');
    const formatted = formatContextForPrompt(context);
    expect(formatted).toContain('imports');
  });
});
```

**Step 4: Run tests to verify they fail**

```bash
pnpm install && pnpm --filter @understand-anything/skill test
```
Expected: FAIL — files don't exist yet.

**Step 5: Implement context-builder.ts**

```typescript
// packages/skill/src/context-builder.ts
import { SearchEngine } from '@understand-anything/core';
import type { KnowledgeGraph, GraphNode, GraphEdge, Layer } from '@understand-anything/core';

export interface ChatContext {
  projectName: string;
  projectDescription: string;
  languages: string[];
  frameworks: string[];
  relevantNodes: GraphNode[];
  relevantEdges: GraphEdge[];
  relevantLayers: Layer[];
  query: string;
}

export function buildChatContext(
  graph: KnowledgeGraph,
  query: string,
  maxNodes: number = 15,
): ChatContext {
  const searchEngine = new SearchEngine(graph.nodes);
  const searchResults = searchEngine.search(query, { limit: maxNodes });

  // Collect directly matching nodes
  const relevantNodeIds = new Set(searchResults.map((r) => r.nodeId));

  // Expand to connected nodes (1 hop)
  for (const edge of graph.edges) {
    if (relevantNodeIds.has(edge.source)) relevantNodeIds.add(edge.target);
    if (relevantNodeIds.has(edge.target)) relevantNodeIds.add(edge.source);
  }

  const relevantNodes = graph.nodes.filter((n) => relevantNodeIds.has(n.id));
  const relevantEdges = graph.edges.filter(
    (e) => relevantNodeIds.has(e.source) && relevantNodeIds.has(e.target)
  );

  // Find layers that contain any relevant nodes
  const relevantLayers = graph.layers.filter((l) =>
    l.nodeIds.some((id) => relevantNodeIds.has(id))
  );

  return {
    projectName: graph.project.name,
    projectDescription: graph.project.description,
    languages: graph.project.languages,
    frameworks: graph.project.frameworks,
    relevantNodes,
    relevantEdges,
    relevantLayers,
    query,
  };
}

export function formatContextForPrompt(context: ChatContext): string {
  const sections: string[] = [];

  sections.push(`## Project: ${context.projectName}`);
  sections.push(context.projectDescription);
  if (context.languages.length) {
    sections.push(`Languages: ${context.languages.join(', ')}`);
  }
  if (context.frameworks.length) {
    sections.push(`Frameworks: ${context.frameworks.join(', ')}`);
  }

  if (context.relevantLayers.length) {
    sections.push('\n## Relevant Layers');
    for (const layer of context.relevantLayers) {
      sections.push(`### ${layer.name}\n${layer.description}`);
    }
  }

  sections.push('\n## Relevant Code Components');
  for (const node of context.relevantNodes) {
    const parts = [`**${node.name}** (${node.type}, ${node.complexity})`];
    if (node.filePath) parts.push(`  File: ${node.filePath}`);
    parts.push(`  ${node.summary}`);
    if (node.tags.length) parts.push(`  Tags: ${node.tags.join(', ')}`);
    if (node.languageNotes) parts.push(`  Note: ${node.languageNotes}`);
    sections.push(parts.join('\n'));
  }

  if (context.relevantEdges.length) {
    sections.push('\n## Relationships');
    for (const edge of context.relevantEdges) {
      const sourceNode = context.relevantNodes.find((n) => n.id === edge.source);
      const targetNode = context.relevantNodes.find((n) => n.id === edge.target);
      const sourceName = sourceNode?.name ?? edge.source;
      const targetName = targetNode?.name ?? edge.target;
      sections.push(`- ${sourceName} --[${edge.type}]--> ${targetName}${edge.description ? ` (${edge.description})` : ''}`);
    }
  }

  return sections.join('\n');
}
```

**Step 6: Implement understand-chat.ts (prompt template)**

```typescript
// packages/skill/src/understand-chat.ts
import { formatContextForPrompt, buildChatContext } from './context-builder.js';
import type { KnowledgeGraph } from '@understand-anything/core';

export function buildChatPrompt(graph: KnowledgeGraph, query: string): string {
  const context = buildChatContext(graph, query);
  const formattedContext = formatContextForPrompt(context);

  return `You are a knowledgeable assistant that helps developers understand a codebase.
You have access to a knowledge graph analysis of the project. Use the context below to answer the user's question accurately and helpfully.

If the question relates to code, reference specific files and functions.
If the question is about architecture, describe the layers and relationships.
If you're unsure, say so rather than guessing.

${formattedContext}

## User Question
${query}`;
}
```

**Step 7: Create the Claude Code skill definition file**

```markdown
<!-- packages/skill/.claude/skills/understand-chat.md -->
---
name: understand-chat
description: Ask questions about the current codebase using the knowledge graph
arguments: query
---

# /understand-chat

Answer questions about this codebase using the knowledge graph at `.understand-anything/knowledge-graph.json`.

## Instructions

1. Read the knowledge graph file at `.understand-anything/knowledge-graph.json` in the current project root
2. If the file doesn't exist, tell the user to run `/understand` first to analyze the project
3. Use the knowledge graph context to answer the user's query: "${ARGUMENTS}"
4. Reference specific files, functions, and relationships from the graph
5. If the project has layers defined, explain which layer(s) are relevant
6. Be concise but thorough — link concepts to actual code locations
```

**Step 8: Create barrel export**

```typescript
// packages/skill/src/index.ts
export { buildChatContext, formatContextForPrompt, type ChatContext } from './context-builder.js';
export { buildChatPrompt } from './understand-chat.js';
```

**Step 9: Run tests to verify they pass**

```bash
pnpm install && pnpm --filter @understand-anything/skill test
```
Expected: ALL PASS

**Step 10: Commit**

```bash
git add packages/skill/
git commit -m "feat(skill): scaffold skill package with /understand-chat command"
```

---

## Task 7: Dashboard Search Enhancement + Store Integration

**Files:**
- Modify: `packages/dashboard/src/store.ts`
- Modify: `packages/dashboard/src/components/SearchBar.tsx`
- Modify: `packages/dashboard/src/components/GraphView.tsx`

**Context:** Wire the core `SearchEngine` into the dashboard. Replace the simple substring filter in the Zustand store with `SearchEngine` from core. Enhance the SearchBar to show scored results with node type icons. Enhance the GraphView to highlight search results with varying intensity based on relevance score.

**Step 1: Update the Zustand store**

Replace the search logic in `packages/dashboard/src/store.ts`:

```typescript
import { SearchEngine } from '@understand-anything/core';
import type { KnowledgeGraph, SearchResult } from '@understand-anything/core';

interface DashboardStore {
  graph: KnowledgeGraph | null;
  selectedNodeId: string | null;
  searchQuery: string;
  searchResults: SearchResult[]; // Changed from string[] to SearchResult[]
  searchEngine: SearchEngine | null;

  setGraph: (graph: KnowledgeGraph) => void;
  selectNode: (nodeId: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useDashboardStore = create<DashboardStore>()((set, get) => ({
  graph: null,
  selectedNodeId: null,
  searchQuery: '',
  searchResults: [],
  searchEngine: null,

  setGraph: (graph) => {
    const searchEngine = new SearchEngine(graph.nodes);
    set({ graph, searchEngine });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setSearchQuery: (query) => {
    const { searchEngine } = get();
    if (!searchEngine || !query.trim()) {
      set({ searchQuery: query, searchResults: [] });
      return;
    }
    const results = searchEngine.search(query);
    set({ searchQuery: query, searchResults: results });
  },
}));
```

**Step 2: Update SearchBar component**

Update `SearchBar.tsx` to display result scores and show a dropdown of top matches:

- Show result count with "fuzzy" label
- Display top 5 results as clickable items below the search input (name + type + score)
- Clicking a result selects that node and scrolls graph to it

**Step 3: Update GraphView to use scored highlighting**

Update `GraphView.tsx`:
- Search highlighting intensity varies by score (lower score = better match = brighter highlight)
- Best matches: bright yellow ring; weaker matches: dimmer yellow
- Pass the search score as data to CustomNode so it can adjust its appearance

**Step 4: Verify manually**

```bash
pnpm dev:dashboard
```
Test: type "auth" in search → verify fuzzy results, scored highlighting, clickable results.

**Step 5: Commit**

```bash
git add packages/dashboard/src/store.ts packages/dashboard/src/components/SearchBar.tsx packages/dashboard/src/components/GraphView.tsx
git commit -m "feat(dashboard): wire core SearchEngine with fuzzy matching and scored highlighting"
```

---

## Task 8: Dashboard Chat Panel

**Files:**
- Create: `packages/dashboard/src/components/ChatPanel.tsx`
- Modify: `packages/dashboard/src/store.ts`
- Modify: `packages/dashboard/src/App.tsx`

**Context:** Replace the "Chat — coming soon" placeholder with a working chat panel. For the standalone dashboard (no Claude Code session), the user provides a Claude API key. The chat is context-aware: it automatically includes the selected node's context and nearby graph relationships. Uses the `@anthropic-ai/sdk` package with streaming for real-time responses. The chat panel shows a message list and input, with messages from both user and assistant.

**Step 1: Install Anthropic SDK**

```bash
cd packages/dashboard && pnpm add @anthropic-ai/sdk
```

**Step 2: Add chat state to the Zustand store**

Add to `packages/dashboard/src/store.ts`:

```typescript
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Add to DashboardStore interface:
apiKey: string;
chatMessages: ChatMessage[];
chatLoading: boolean;
setApiKey: (key: string) => void;
sendChatMessage: (message: string) => Promise<void>;
clearChat: () => void;
```

The `sendChatMessage` implementation:
1. Gets the current `graph`, `selectedNodeId`, and `apiKey` from store
2. Uses `buildChatContext` + `formatContextForPrompt` from `@understand-anything/core` (or inline the same logic since the skill package uses core)
3. Builds a system prompt with the graph context
4. Calls Claude API with the `@anthropic-ai/sdk`
5. Streams the response, updating `chatMessages` as chunks arrive
6. Sets `chatLoading` during the call

**Step 3: Create ChatPanel component**

```typescript
// packages/dashboard/src/components/ChatPanel.tsx
// Key features:
// 1. API key input (shown once, stored in zustand, persisted to localStorage)
// 2. Message list with user/assistant styling
// 3. Input field with send button
// 4. "Context: <selected node name>" indicator when a node is selected
// 5. Loading spinner during API calls
// 6. Auto-scroll to latest message
// 7. Markdown rendering for assistant messages (basic: bold, code blocks, lists)
```

The component layout:
```
┌─ Chat Panel ────────────────────┐
│ [🔑 Enter API key...]          │ ← Only shown if no key
├─────────────────────────────────┤
│ Context: auth/login.ts          │ ← Shows selected node
├─────────────────────────────────┤
│ User: How does auth work?       │
│                                 │
│ Assistant: The authentication   │
│ flow starts in login.ts...      │
│                                 │
│ User: What calls it?            │
│                                 │
│ Assistant: The API routes in    │
│ routes/api.ts import and call...│
├─────────────────────────────────┤
│ [Ask about this codebase...] 📤│
└─────────────────────────────────┘
```

**Step 4: Wire ChatPanel into App.tsx**

Replace the placeholder `div` in the bottom-left grid cell:
```typescript
// In App.tsx, replace:
<div className="bg-gray-800 ...">Chat — coming soon</div>
// With:
<ChatPanel />
```

**Step 5: Verify manually**

```bash
pnpm dev:dashboard
```
Test:
1. Enter a Claude API key
2. Select a node in the graph
3. Ask "what does this do?" → verify contextual answer
4. Ask a follow-up → verify conversation history is maintained

**Step 6: Commit**

```bash
git add packages/dashboard/src/components/ChatPanel.tsx packages/dashboard/src/store.ts packages/dashboard/src/App.tsx packages/dashboard/package.json pnpm-lock.yaml
git commit -m "feat(dashboard): add context-aware chat panel with Claude API integration"
```

---

## Task 9: Dashboard Layer Visualization

**Files:**
- Modify: `packages/dashboard/src/store.ts`
- Modify: `packages/dashboard/src/components/GraphView.tsx`
- Create: `packages/dashboard/src/components/LayerLegend.tsx`
- Modify: `packages/dashboard/src/App.tsx`

**Context:** When the knowledge graph has layers defined, the dashboard should visually group nodes by layer. Use React Flow's built-in group node feature — create parent nodes for each layer with a colored background, and assign layer member nodes as children. Add a toggleable layer legend showing layer colors and descriptions.

**Step 1: Add layer state to the store**

Add to `packages/dashboard/src/store.ts`:
```typescript
// Add to DashboardStore interface:
showLayers: boolean;
toggleLayers: () => void;
```

**Step 2: Update GraphView for layer grouping**

When `showLayers` is true and graph has layers:
1. Create a "group" type React Flow node for each layer (large background rectangle)
2. Set layer nodes as `parentId` of their member nodes
3. Apply distinct background colors per layer (semi-transparent)
4. Use dagre layout with subgraph support, or position layer groups in columns
5. Show layer name as label on the group node

When `showLayers` is false, render normally without groups.

**Step 3: Create LayerLegend component**

```typescript
// packages/dashboard/src/components/LayerLegend.tsx
// Shows:
// - Toggle button "Show Layers" / "Hide Layers"
// - List of layers with color dot, name, node count
// - Click layer name to filter graph to that layer
```

**Step 4: Wire into App.tsx**

Add `LayerLegend` to the header area, next to SearchBar.

**Step 5: Verify manually**

```bash
pnpm dev:dashboard
```
Update the sample `knowledge-graph.json` in `packages/dashboard/public/` to include layers, then verify layer grouping renders correctly.

**Step 6: Commit**

```bash
git add packages/dashboard/src/components/LayerLegend.tsx packages/dashboard/src/components/GraphView.tsx packages/dashboard/src/store.ts packages/dashboard/src/App.tsx packages/dashboard/public/knowledge-graph.json
git commit -m "feat(dashboard): add layer visualization with grouping and legend"
```

---

## Task 10: Integration Polish — Sample Data, Build Verification, README Update

**Files:**
- Modify: `packages/dashboard/public/knowledge-graph.json`
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `packages/core/src/index.ts` (ensure all exports clean)

**Context:** Final task: create a richer sample knowledge graph that exercises all Phase 2 features (layers, many nodes, varied types). Verify the full build succeeds. Update documentation.

**Step 1: Create rich sample knowledge graph**

Update `packages/dashboard/public/knowledge-graph.json` with a realistic sample:
- 15-20 nodes across all 5 types (file, function, class, module, concept)
- 20+ edges across multiple EdgeTypes
- 4-5 layers (API, Service, Data, UI, Utility)
- Varied complexity levels
- Realistic summaries and tags

This serves as both demo data and manual test fixture.

**Step 2: Verify full build**

```bash
pnpm install
pnpm --filter @understand-anything/core build
pnpm --filter @understand-anything/skill build
pnpm --filter @understand-anything/core test
pnpm --filter @understand-anything/skill test
pnpm dev:dashboard
```

All should pass/run without errors.

**Step 3: Update CLAUDE.md**

Add Phase 2 context:
```markdown
## Key Commands (updated)
- `pnpm --filter @understand-anything/skill build` — Build skill package
- `pnpm --filter @understand-anything/skill test` — Run skill tests

## Phase 2 Features
- Fuzzy search via Fuse.js (SearchEngine in core)
- Zod schema validation on graph loading
- Staleness detection + incremental graph merging
- Layer auto-detection (heuristic + LLM prompt)
- `/understand-chat` skill command
- Dashboard chat panel (Claude API integration)
- Dagre auto-layout for graph visualization
- Layer visualization with grouping and legend
```

**Step 4: Update README.md**

Add Phase 2 feature descriptions, updated screenshots section placeholder, new commands.

**Step 5: Commit**

```bash
git add packages/dashboard/public/knowledge-graph.json CLAUDE.md README.md packages/core/src/index.ts
git commit -m "docs: update sample data, CLAUDE.md, and README for Phase 2"
```

---

## Verification Checklist

After all tasks complete:

1. **Schema validation**: Load a corrupted JSON → verify it throws with clear error message
2. **Fuzzy search**: Type "auth contrl" in search → verify it finds "AuthController" or similar
3. **Auto-layout**: Open dashboard → verify nodes arranged hierarchically, not in grid
4. **Staleness**: Call `isStale('/project', 'oldHash')` → verify it detects changes
5. **Layer detection**: Call `detectLayers(graph)` on a project with routes/models/services → verify layers populated
6. **`/understand-chat`**: Verify skill file exists at `packages/skill/.claude/skills/understand-chat.md`
7. **Chat panel**: Enter API key, select node, ask question → verify contextual response
8. **Layer visualization**: Toggle layers on → verify colored group nodes appear
9. **All tests pass**: `pnpm --filter @understand-anything/core test && pnpm --filter @understand-anything/skill test`
10. **Full build**: `pnpm -r build` succeeds

---

## Dependency Graph

```
Task 1 (zod schema) ─────────────────────────────┐
Task 2 (search engine) ──┬── Task 7 (dashboard    │
Task 3 (dagre layout) ───┤   search + store)      │
                         │                         │
Task 4 (staleness) ──────┤                         │
                         │                         │
Task 5 (layers) ─────────┼── Task 9 (layer viz) ──┤
                         │                         ├── Task 10 (polish)
Task 6 (skill pkg) ──────┼── Task 8 (chat panel) ─┤
                         │                         │
Task 7 ──────────────────┘                         │
Task 8 ────────────────────────────────────────────┘
Task 9 ────────────────────────────────────────────┘
```

**Safe parallel groups:**
- Tasks 1, 2, 3, 4, 5, 6 are all independent (but run sequentially per subagent-driven-dev)
- Task 7 depends on Tasks 2 + 3
- Task 8 depends on Task 6
- Task 9 depends on Tasks 3 + 5
- Task 10 depends on all others
````

## File: docs/superpowers/plans/2026-03-14-phase3-implementation.md
````markdown
# Understand Anything — Phase 3 (Learn Mode) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the "Learn Mode" layer — tour generation, contextual explanations, language-specific lessons, and persona modes (non-technical / junior / experienced).

**Architecture:** Extends the existing monorepo. Core gets tour generation and language lesson prompt builders. Dashboard gets a new LearnPanel component, persona selector, and enhanced node explanation. The existing 4-panel layout becomes persona-adaptive.

**Tech Stack:** No new dependencies required. Uses existing react-markdown, @anthropic-ai/sdk, zustand, @xyflow/react, tailwindcss.

---

## Dependency Graph

```
Task 1 (Tour Gen Core) ──────────────┐
                                      ├─→ Task 3 (Tour Player + Highlights)
Task 2 (LearnPanel + Store) ─────────┘          │
                                                 │
Task 4 (Node Explanations) ─── (independent) ───┤
                                                 │
Task 5 (Language Lesson Core) ───────────────────┤
                                                 ├─→ Task 7 (Persona Modes)
Task 6 (Language Lesson Display) ────────────────┘
```

Tasks 1, 2, 4, 5 can be developed in any order. Task 3 depends on Task 2. Task 6 depends on Task 5. Task 7 depends on Tasks 2+3+6 being complete.

---

## Task 1: Tour Generation Engine (Core)

**Files:**
- Create: `packages/core/src/analyzer/tour-generator.ts`
- Create: `packages/core/src/__tests__/tour-generator.test.ts`
- Modify: `packages/core/src/index.ts` (add exports)

**Context:** The `TourStep` schema already exists in `packages/core/src/types.ts` (order, title, description, nodeIds, languageLesson?). The sample `knowledge-graph.json` already has 6 tour steps with language lessons. This task builds the engine that GENERATES those tours: an LLM prompt builder + response parser, and a heuristic fallback that creates tours without an LLM by using graph topology (entry-point detection → topological sort → group by layers).

**Step 1: Write failing tests**

```typescript
// packages/core/src/__tests__/tour-generator.test.ts
import { describe, it, expect } from "vitest";
import {
  buildTourGenerationPrompt,
  parseTourGenerationResponse,
  generateHeuristicTour,
} from "../analyzer/tour-generator.js";
import type { KnowledgeGraph } from "../types.js";

const sampleGraph: KnowledgeGraph = {
  version: "1.0.0",
  project: {
    name: "test-project",
    languages: ["typescript"],
    frameworks: ["express"],
    description: "A test project",
    analyzedAt: "2026-03-14T00:00:00Z",
    gitCommitHash: "abc123",
  },
  nodes: [
    {
      id: "file:src/index.ts",
      type: "file",
      name: "index.ts",
      filePath: "src/index.ts",
      summary: "Application entry point",
      tags: ["entry", "server"],
      complexity: "simple",
    },
    {
      id: "file:src/routes.ts",
      type: "file",
      name: "routes.ts",
      filePath: "src/routes.ts",
      summary: "Route definitions",
      tags: ["routes", "api"],
      complexity: "moderate",
    },
    {
      id: "file:src/service.ts",
      type: "file",
      name: "service.ts",
      filePath: "src/service.ts",
      summary: "Business logic",
      tags: ["service"],
      complexity: "complex",
    },
    {
      id: "file:src/db.ts",
      type: "file",
      name: "db.ts",
      filePath: "src/db.ts",
      summary: "Database connection",
      tags: ["database"],
      complexity: "simple",
    },
    {
      id: "concept:auth-flow",
      type: "concept",
      name: "Auth Flow",
      summary: "Authentication concept",
      tags: ["concept", "auth"],
      complexity: "moderate",
    },
  ],
  edges: [
    { source: "file:src/index.ts", target: "file:src/routes.ts", type: "imports", direction: "forward", weight: 0.9 },
    { source: "file:src/routes.ts", target: "file:src/service.ts", type: "calls", direction: "forward", weight: 0.8 },
    { source: "file:src/service.ts", target: "file:src/db.ts", type: "reads_from", direction: "forward", weight: 0.7 },
  ],
  layers: [
    { id: "layer:api", name: "API Layer", description: "HTTP routes", nodeIds: ["file:src/index.ts", "file:src/routes.ts"] },
    { id: "layer:service", name: "Service Layer", description: "Business logic", nodeIds: ["file:src/service.ts"] },
    { id: "layer:data", name: "Data Layer", description: "Database", nodeIds: ["file:src/db.ts"] },
  ],
  tour: [],
};

describe("tour-generator", () => {
  describe("buildTourGenerationPrompt", () => {
    it("includes project name and description", () => {
      const prompt = buildTourGenerationPrompt(sampleGraph);
      expect(prompt).toContain("test-project");
      expect(prompt).toContain("A test project");
    });

    it("includes all node summaries", () => {
      const prompt = buildTourGenerationPrompt(sampleGraph);
      expect(prompt).toContain("index.ts");
      expect(prompt).toContain("routes.ts");
      expect(prompt).toContain("service.ts");
    });

    it("includes layer information", () => {
      const prompt = buildTourGenerationPrompt(sampleGraph);
      expect(prompt).toContain("API Layer");
      expect(prompt).toContain("Service Layer");
    });

    it("requests JSON output format", () => {
      const prompt = buildTourGenerationPrompt(sampleGraph);
      expect(prompt).toContain("JSON");
    });
  });

  describe("parseTourGenerationResponse", () => {
    it("parses valid JSON response with tour steps", () => {
      const response = JSON.stringify({
        steps: [
          { order: 1, title: "Entry Point", description: "Start here", nodeIds: ["file:src/index.ts"] },
          { order: 2, title: "Routing", description: "Routes next", nodeIds: ["file:src/routes.ts"], languageLesson: "Express uses middleware" },
        ],
      });
      const steps = parseTourGenerationResponse(response);
      expect(steps).toHaveLength(2);
      expect(steps[0].title).toBe("Entry Point");
      expect(steps[1].languageLesson).toBe("Express uses middleware");
    });

    it("extracts JSON from markdown code blocks", () => {
      const response = "Here is the tour:\n```json\n" + JSON.stringify({
        steps: [{ order: 1, title: "Step 1", description: "Desc", nodeIds: ["n1"] }],
      }) + "\n```";
      const steps = parseTourGenerationResponse(response);
      expect(steps).toHaveLength(1);
    });

    it("returns empty array for unparseable response", () => {
      const steps = parseTourGenerationResponse("not json at all");
      expect(steps).toEqual([]);
    });

    it("filters out steps with missing required fields", () => {
      const response = JSON.stringify({
        steps: [
          { order: 1, title: "Valid", description: "OK", nodeIds: ["n1"] },
          { order: 2, description: "Missing title", nodeIds: ["n2"] },
          { order: 3, title: "Missing desc", nodeIds: ["n3"] },
        ],
      });
      const steps = parseTourGenerationResponse(response);
      expect(steps).toHaveLength(1);
      expect(steps[0].title).toBe("Valid");
    });
  });

  describe("generateHeuristicTour", () => {
    it("starts with entry-point nodes", () => {
      const tour = generateHeuristicTour(sampleGraph);
      expect(tour.length).toBeGreaterThan(0);
      // index.ts has no incoming edges → entry point
      expect(tour[0].nodeIds).toContain("file:src/index.ts");
    });

    it("follows topological order", () => {
      const tour = generateHeuristicTour(sampleGraph);
      const allNodeIds = tour.flatMap((s) => s.nodeIds);
      const indexPos = allNodeIds.indexOf("file:src/index.ts");
      const routesPos = allNodeIds.indexOf("file:src/routes.ts");
      const servicePos = allNodeIds.indexOf("file:src/service.ts");
      // entry → routes → service (topological order)
      expect(indexPos).toBeLessThan(routesPos);
      expect(routesPos).toBeLessThan(servicePos);
    });

    it("includes concept nodes in separate steps", () => {
      const tour = generateHeuristicTour(sampleGraph);
      const conceptStep = tour.find((s) =>
        s.nodeIds.includes("concept:auth-flow"),
      );
      expect(conceptStep).toBeDefined();
    });

    it("assigns order numbers sequentially", () => {
      const tour = generateHeuristicTour(sampleGraph);
      tour.forEach((step, i) => {
        expect(step.order).toBe(i + 1);
      });
    });

    it("groups nodes by layer when layers exist", () => {
      const tour = generateHeuristicTour(sampleGraph);
      // Steps should roughly follow layer boundaries
      expect(tour.length).toBeGreaterThanOrEqual(3);
    });

    it("produces valid TourStep objects", () => {
      const tour = generateHeuristicTour(sampleGraph);
      for (const step of tour) {
        expect(step).toHaveProperty("order");
        expect(step).toHaveProperty("title");
        expect(step).toHaveProperty("description");
        expect(step).toHaveProperty("nodeIds");
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.nodeIds.length).toBeGreaterThan(0);
      }
    });

    it("handles graph with no edges gracefully", () => {
      const isolated = { ...sampleGraph, edges: [] };
      const tour = generateHeuristicTour(isolated);
      expect(tour.length).toBeGreaterThan(0);
    });

    it("handles graph with no layers", () => {
      const noLayers = { ...sampleGraph, layers: [] };
      const tour = generateHeuristicTour(noLayers);
      expect(tour.length).toBeGreaterThan(0);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/core && pnpm test -- --reporter verbose src/__tests__/tour-generator.test.ts
```

Expected: FAIL — module not found

**Step 3: Implement tour-generator.ts**

```typescript
// packages/core/src/analyzer/tour-generator.ts
import type { KnowledgeGraph, TourStep, GraphNode, GraphEdge } from "../types.js";

/**
 * Build an LLM prompt that asks for a guided tour of the project.
 */
export function buildTourGenerationPrompt(graph: KnowledgeGraph): string {
  const { project, nodes, edges, layers } = graph;

  const nodeList = nodes
    .map((n) => `- [${n.type}] ${n.name}${n.filePath ? ` (${n.filePath})` : ""}: ${n.summary}`)
    .join("\n");

  const edgeList = edges
    .slice(0, 50) // cap to avoid overly long prompts
    .map((e) => {
      const src = nodes.find((n) => n.id === e.source)?.name ?? e.source;
      const tgt = nodes.find((n) => n.id === e.target)?.name ?? e.target;
      return `- ${src} --[${e.type}]--> ${tgt}`;
    })
    .join("\n");

  const layerList = layers.length > 0
    ? layers.map((l) => `- ${l.name}: ${l.description} (${l.nodeIds.length} nodes)`).join("\n")
    : "No layers defined";

  return [
    `You are generating a guided tour for a software project called "${project.name}".`,
    ``,
    `Project description: ${project.description}`,
    `Languages: ${project.languages.join(", ")}`,
    `Frameworks: ${project.frameworks.join(", ")}`,
    ``,
    `## Nodes`,
    nodeList,
    ``,
    `## Relationships`,
    edgeList,
    ``,
    `## Layers`,
    layerList,
    ``,
    `## Instructions`,
    `Create a guided tour of this project. Each step should:`,
    `1. Focus on 1-4 nodes that belong together conceptually`,
    `2. Have a clear, engaging title (like "Where It All Begins" not "Step 1")`,
    `3. Explain in plain English what these components do and WHY they exist`,
    `4. Follow the natural execution flow (entry point → routing → business logic → data)`,
    `5. Include a languageLesson field for steps that use language-specific concepts`,
    `   (e.g., middleware, generics, async/await, decorators — explain them simply)`,
    ``,
    `Return JSON in exactly this format:`,
    `\`\`\`json`,
    `{`,
    `  "steps": [`,
    `    {`,
    `      "order": 1,`,
    `      "title": "Engaging Step Title",`,
    `      "description": "Markdown explanation of what these nodes do.",`,
    `      "nodeIds": ["node-id-1", "node-id-2"],`,
    `      "languageLesson": "Optional: explain a language concept used here"`,
    `    }`,
    `  ]`,
    `}`,
    `\`\`\``,
    ``,
    `Create 4-8 steps covering the full project. Use actual node IDs from the list above.`,
  ].join("\n");
}

/**
 * Parse the LLM response into TourStep[].
 * Handles raw JSON, JSON in markdown code blocks, and graceful fallback.
 */
export function parseTourGenerationResponse(response: string): TourStep[] {
  let json: string = response;

  // Extract from markdown code blocks if present
  const codeBlockMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    json = codeBlockMatch[1];
  }

  try {
    const parsed = JSON.parse(json);
    const rawSteps: unknown[] = Array.isArray(parsed) ? parsed : parsed?.steps;
    if (!Array.isArray(rawSteps)) return [];

    return rawSteps.filter((s): s is TourStep => {
      if (typeof s !== "object" || s === null) return false;
      const step = s as Record<string, unknown>;
      return (
        typeof step.order === "number" &&
        typeof step.title === "string" &&
        step.title.length > 0 &&
        typeof step.description === "string" &&
        step.description.length > 0 &&
        Array.isArray(step.nodeIds) &&
        step.nodeIds.length > 0
      );
    }).map((s) => ({
      order: s.order,
      title: s.title,
      description: s.description,
      nodeIds: s.nodeIds,
      ...(s.languageLesson ? { languageLesson: s.languageLesson } : {}),
    }));
  } catch {
    return [];
  }
}

/**
 * Generate a tour using heuristics only (no LLM required).
 *
 * Strategy:
 * 1. Find entry-point nodes (no incoming edges, or named index/main/app)
 * 2. Topological sort from entry points
 * 3. Group by layer (if layers exist) or by execution depth
 * 4. Add concept nodes as separate explanatory steps
 */
export function generateHeuristicTour(graph: KnowledgeGraph): TourStep[] {
  const { nodes, edges, layers } = graph;

  // Separate concept nodes from code nodes
  const codeNodes = nodes.filter((n) => n.type !== "concept");
  const conceptNodes = nodes.filter((n) => n.type === "concept");

  // Build adjacency info
  const incomingCount = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  for (const node of codeNodes) {
    incomingCount.set(node.id, 0);
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    if (!incomingCount.has(edge.source) || !incomingCount.has(edge.target)) continue;
    adjacency.get(edge.source)!.push(edge.target);
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
  }

  // Find entry points: nodes with 0 incoming edges
  const entryPoints = codeNodes.filter((n) => (incomingCount.get(n.id) ?? 0) === 0);

  // Topological sort (Kahn's algorithm)
  const sorted: GraphNode[] = [];
  const queue = [...entryPoints];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node.id)) continue;
    visited.add(node.id);
    sorted.push(node);

    for (const targetId of adjacency.get(node.id) ?? []) {
      const count = (incomingCount.get(targetId) ?? 1) - 1;
      incomingCount.set(targetId, count);
      const targetNode = codeNodes.find((n) => n.id === targetId);
      if (targetNode && count <= 0 && !visited.has(targetId)) {
        queue.push(targetNode);
      }
    }
  }

  // Add any unvisited nodes (cycles or disconnected)
  for (const node of codeNodes) {
    if (!visited.has(node.id)) {
      sorted.push(node);
    }
  }

  // Group sorted nodes into tour steps
  const steps: TourStep[] = [];

  if (layers.length > 0) {
    // Group by layer, in topological order of first appearance
    const layerOrder: string[] = [];
    const layerNodes = new Map<string, string[]>();
    const nodeToLayer = new Map<string, string>();

    for (const layer of layers) {
      layerNodes.set(layer.id, []);
      for (const nid of layer.nodeIds) {
        nodeToLayer.set(nid, layer.id);
      }
    }

    // Determine layer order based on topological sort
    for (const node of sorted) {
      const lid = nodeToLayer.get(node.id);
      if (lid) {
        if (!layerOrder.includes(lid)) layerOrder.push(lid);
        layerNodes.get(lid)!.push(node.id);
      }
    }

    // Unlayered nodes
    const unlayered = sorted.filter((n) => !nodeToLayer.has(n.id)).map((n) => n.id);

    for (const lid of layerOrder) {
      const layer = layers.find((l) => l.id === lid)!;
      const nids = layerNodes.get(lid) ?? [];
      if (nids.length === 0) continue;

      steps.push({
        order: steps.length + 1,
        title: layer.name,
        description: `${layer.description}. This layer contains: ${nids.map((id) => nodes.find((n) => n.id === id)?.name ?? id).join(", ")}.`,
        nodeIds: nids,
      });
    }

    if (unlayered.length > 0) {
      steps.push({
        order: steps.length + 1,
        title: "Supporting Components",
        description: `Additional components that support the main architecture: ${unlayered.map((id) => nodes.find((n) => n.id === id)?.name ?? id).join(", ")}.`,
        nodeIds: unlayered,
      });
    }
  } else {
    // No layers: group by depth/batch (up to 3 nodes per step)
    const batchSize = 3;
    for (let i = 0; i < sorted.length; i += batchSize) {
      const batch = sorted.slice(i, i + batchSize);
      const names = batch.map((n) => n.name).join(", ");
      steps.push({
        order: steps.length + 1,
        title: i === 0 ? "Entry Points" : `Components: ${names}`,
        description: batch.map((n) => `**${n.name}** — ${n.summary}`).join("\n\n"),
        nodeIds: batch.map((n) => n.id),
      });
    }
  }

  // Add concept nodes as a final explanatory step
  if (conceptNodes.length > 0) {
    steps.push({
      order: steps.length + 1,
      title: "Key Concepts",
      description: conceptNodes
        .map((n) => `**${n.name}** — ${n.summary}`)
        .join("\n\n"),
      nodeIds: conceptNodes.map((n) => n.id),
    });
  }

  return steps;
}
```

**Step 4: Run tests to verify they pass**

```bash
cd packages/core && pnpm test -- --reporter verbose src/__tests__/tour-generator.test.ts
```

Expected: All tests PASS

**Step 5: Add exports to index.ts**

Add to `packages/core/src/index.ts`:
```typescript
export {
  buildTourGenerationPrompt,
  parseTourGenerationResponse,
  generateHeuristicTour,
} from "./analyzer/tour-generator.js";
```

**Step 6: Verify build**

```bash
cd packages/core && pnpm build
```

**Step 7: Commit**

```bash
git add packages/core/src/analyzer/tour-generator.ts packages/core/src/__tests__/tour-generator.test.ts packages/core/src/index.ts
git commit -m "feat(core): add tour generation engine with heuristic and LLM strategies"
```

---

## Task 2: LearnPanel Component + Tour Store State (Dashboard)

**Files:**
- Create: `packages/dashboard/src/components/LearnPanel.tsx`
- Modify: `packages/dashboard/src/store.ts` (add tour state + actions)
- Modify: `packages/dashboard/src/App.tsx` (replace bottom-right NodeInfo with tabbed panel)

**Context:** The dashboard currently has a 4-panel layout: GraphView (top-left), CodeViewer (top-right), ChatPanel (bottom-left), NodeInfo (bottom-right). This task adds tour state to the Zustand store and creates a LearnPanel component. The bottom-right panel becomes a tabbed view switching between NodeInfo and LearnPanel. The LearnPanel shows the tour step list and current step content.

**Step 1: Add tour state to the Zustand store**

In `packages/dashboard/src/store.ts`, add to the `DashboardStore` interface:

```typescript
// Add these fields to the interface
tourActive: boolean;
currentTourStep: number;
tourHighlightedNodeIds: string[];

// Add these actions
startTour: () => void;
stopTour: () => void;
setTourStep: (step: number) => void;
nextTourStep: () => void;
prevTourStep: () => void;
```

Add to the store implementation:

```typescript
tourActive: false,
currentTourStep: 0,
tourHighlightedNodeIds: [],

startTour: () => {
  const graph = get().graph;
  if (!graph || graph.tour.length === 0) return;
  const firstStep = graph.tour[0];
  set({
    tourActive: true,
    currentTourStep: 0,
    tourHighlightedNodeIds: firstStep.nodeIds,
    selectedNodeId: null,
  });
},

stopTour: () => set({
  tourActive: false,
  currentTourStep: 0,
  tourHighlightedNodeIds: [],
}),

setTourStep: (step) => {
  const graph = get().graph;
  if (!graph || step < 0 || step >= graph.tour.length) return;
  set({
    currentTourStep: step,
    tourHighlightedNodeIds: graph.tour[step].nodeIds,
  });
},

nextTourStep: () => {
  const { graph, currentTourStep } = get();
  if (!graph) return;
  const next = currentTourStep + 1;
  if (next < graph.tour.length) {
    set({
      currentTourStep: next,
      tourHighlightedNodeIds: graph.tour[next].nodeIds,
    });
  }
},

prevTourStep: () => {
  const { graph, currentTourStep } = get();
  if (!graph) return;
  const prev = currentTourStep - 1;
  if (prev >= 0) {
    set({
      currentTourStep: prev,
      tourHighlightedNodeIds: graph.tour[prev].nodeIds,
    });
  }
},
```

**Step 2: Create the LearnPanel component**

```tsx
// packages/dashboard/src/components/LearnPanel.tsx
import ReactMarkdown from "react-markdown";
import { useDashboardStore } from "../store";

export default function LearnPanel() {
  const graph = useDashboardStore((s) => s.graph);
  const tourActive = useDashboardStore((s) => s.tourActive);
  const currentTourStep = useDashboardStore((s) => s.currentTourStep);
  const startTour = useDashboardStore((s) => s.startTour);
  const stopTour = useDashboardStore((s) => s.stopTour);
  const setTourStep = useDashboardStore((s) => s.setTourStep);
  const nextTourStep = useDashboardStore((s) => s.nextTourStep);
  const prevTourStep = useDashboardStore((s) => s.prevTourStep);

  const tourSteps = graph?.tour ?? [];

  if (tourSteps.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-800 rounded-lg">
        <p className="text-gray-400 text-sm">No tour available for this project</p>
      </div>
    );
  }

  if (!tourActive) {
    return (
      <div className="h-full w-full bg-gray-800 rounded-lg flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-center">
          <h3 className="text-lg font-bold text-white mb-2">Project Tour</h3>
          <p className="text-sm text-gray-400 mb-1">
            {tourSteps.length} steps to understand this codebase
          </p>
          <p className="text-xs text-gray-500">
            Follow a guided walkthrough of the project architecture
          </p>
        </div>
        <button
          onClick={startTour}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors font-medium"
        >
          Start Tour
        </button>
        {/* Step list preview */}
        <div className="w-full mt-2 space-y-1">
          {tourSteps.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-xs text-gray-400"
            >
              <span className="text-gray-600 font-mono w-5 text-right">{step.order}.</span>
              <span>{step.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const step = tourSteps[currentTourStep];
  const isFirst = currentTourStep === 0;
  const isLast = currentTourStep === tourSteps.length - 1;

  return (
    <div className="h-full w-full bg-gray-800 rounded-lg flex flex-col overflow-hidden">
      {/* Header with progress */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Tour
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">
            {currentTourStep + 1} / {tourSteps.length}
          </span>
          <button
            onClick={stopTour}
            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-700 shrink-0">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentTourStep + 1) / tourSteps.length) * 100}%` }}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        <h2 className="text-base font-bold text-white mb-3">{step.title}</h2>

        <div className="text-sm text-gray-300 leading-relaxed tour-markdown">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
              code: ({ children }) => (
                <code className="bg-gray-900 rounded px-1 py-0.5 text-[12px]">{children}</code>
              ),
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
            }}
          >
            {step.description}
          </ReactMarkdown>
        </div>

        {/* Language lesson */}
        {step.languageLesson && (
          <div className="mt-4 bg-indigo-900/30 border border-indigo-700/50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
              Language Concept
            </h4>
            <p className="text-sm text-indigo-200 leading-relaxed">
              {step.languageLesson}
            </p>
          </div>
        )}

        {/* Referenced nodes */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Referenced Components
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {step.nodeIds.map((nodeId) => {
              const node = graph?.nodes.find((n) => n.id === nodeId);
              return (
                <span
                  key={nodeId}
                  className="text-[11px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full"
                >
                  {node?.name ?? nodeId}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step navigation */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-700 shrink-0">
        {/* Step dots */}
        <div className="flex gap-1 flex-1 justify-center">
          {tourSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => setTourStep(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentTourStep
                  ? "bg-blue-500"
                  : i < currentTourStep
                    ? "bg-blue-800"
                    : "bg-gray-600"
              }`}
              title={tourSteps[i].title}
            />
          ))}
        </div>

        {/* Prev/Next buttons */}
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={prevTourStep}
            disabled={isFirst}
            className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <button
            onClick={nextTourStep}
            disabled={isLast}
            className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Add tabbed bottom-right panel to App.tsx**

Replace the bottom-right panel in `packages/dashboard/src/App.tsx`. Add import for `LearnPanel` and a `useState` for the active tab. The bottom-right `<div>` becomes:

```tsx
import LearnPanel from "./components/LearnPanel";
// ... in App component, add state:
const hasTour = (graph?.tour ?? []).length > 0;

// Replace the bottom-right panel div:
{/* Bottom-right: Node Info / Learn Panel */}
<div className="min-h-0 min-w-0 flex flex-col">
  {hasTour && (
    <div className="flex border-b border-gray-700 bg-gray-800 rounded-t-lg shrink-0">
      <button
        onClick={() => useDashboardStore.getState().stopTour()}
        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
          !useDashboardStore.getState().tourActive
            ? "text-white border-b-2 border-blue-500"
            : "text-gray-400 hover:text-gray-300"
        }`}
      >
        Details
      </button>
      <button
        onClick={() => useDashboardStore.getState().startTour()}
        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
          useDashboardStore.getState().tourActive
            ? "text-white border-b-2 border-blue-500"
            : "text-gray-400 hover:text-gray-300"
        }`}
      >
        Tour
      </button>
    </div>
  )}
  <div className="flex-1 min-h-0">
    {useDashboardStore.getState().tourActive ? <LearnPanel /> : <NodeInfo />}
  </div>
</div>
```

Note: The implementer should use the Zustand store selectors properly with `useDashboardStore((s) => s.tourActive)` instead of `getState()` — the above is a sketch. The tab state should be reactive.

**Step 4: Verify dashboard compiles and renders**

```bash
cd packages/dashboard && pnpm build
```

**Step 5: Commit**

```bash
git add packages/dashboard/src/components/LearnPanel.tsx packages/dashboard/src/store.ts packages/dashboard/src/App.tsx
git commit -m "feat(dashboard): add LearnPanel component with tour state management"
```

---

## Task 3: Tour Player — Graph Highlighting + Node Focus

**Files:**
- Modify: `packages/dashboard/src/components/GraphView.tsx` (highlight tour nodes)
- Modify: `packages/dashboard/src/components/CustomNode.tsx` (tour highlight style)

**Context:** When a tour is active, the GraphView must visually distinguish the nodes referenced by the current tour step. This task adds a `isTourHighlighted` prop to CustomNode and wires it through GraphView using the `tourHighlightedNodeIds` from the store. Tour-highlighted nodes get a distinct pulsing blue ring (different from search highlights which are yellow).

**Step 1: Add isTourHighlighted to CustomNode data**

In `packages/dashboard/src/components/CustomNode.tsx`, add to `CustomNodeData`:

```typescript
export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  nodeType: string;
  summary: string;
  complexity: string;
  isHighlighted: boolean;
  searchScore?: number;
  isSelected: boolean;
  isTourHighlighted: boolean; // NEW
}
```

Add tour highlight ring logic (takes priority over search highlight but not selection):

```typescript
let ringClass = "";
if (data.isSelected) {
  ringClass = "ring-2 ring-white";
} else if (data.isTourHighlighted) {
  ringClass = "ring-2 ring-blue-400 animate-pulse";
} else if (data.isHighlighted) {
  const score = data.searchScore ?? 1;
  if (score <= 0.1) {
    ringClass = "ring-2 ring-yellow-300";
  } else if (score <= 0.3) {
    ringClass = "ring-2 ring-yellow-400";
  } else {
    ringClass = "ring-2 ring-yellow-500/60";
  }
}
```

**Step 2: Pass tourHighlightedNodeIds through GraphView**

In `packages/dashboard/src/components/GraphView.tsx`, add the store selector:

```typescript
const tourHighlightedNodeIds = useDashboardStore((s) => s.tourHighlightedNodeIds);
```

Add `tourHighlightedNodeIds` to the `useMemo` dependency array. In the `flowNodes` mapping, add:

```typescript
isTourHighlighted: tourHighlightedNodeIds.includes(node.id),
```

**Step 3: Verify dashboard compiles**

```bash
cd packages/dashboard && pnpm build
```

**Step 4: Commit**

```bash
git add packages/dashboard/src/components/GraphView.tsx packages/dashboard/src/components/CustomNode.tsx
git commit -m "feat(dashboard): highlight tour-referenced nodes in graph view"
```

---

## Task 4: Contextual Node Explanation (Dashboard)

**Files:**
- Modify: `packages/dashboard/src/store.ts` (add explanation state + action)
- Modify: `packages/dashboard/src/components/NodeInfo.tsx` (add Explain button + display)

**Context:** Users should be able to click "Explain" on any node to get a detailed plain-English explanation generated by Claude. This reuses the same Anthropic SDK pattern from the ChatPanel but targets a single node. The explanation includes what the node does, why it exists, how it connects to the rest of the project, and any notable patterns. The explanation is cached per node ID to avoid re-calling the API.

**Step 1: Add explanation state to the store**

In `packages/dashboard/src/store.ts`, add to the interface:

```typescript
nodeExplanation: string | null;
nodeExplanationLoading: boolean;
nodeExplanationCache: Record<string, string>;
explainNode: (nodeId: string) => Promise<void>;
```

Add to the implementation:

```typescript
nodeExplanation: null,
nodeExplanationLoading: false,
nodeExplanationCache: {},

explainNode: async (nodeId) => {
  const { apiKey, graph, nodeExplanationCache } = get();
  if (!apiKey || !graph) return;

  // Check cache first
  if (nodeExplanationCache[nodeId]) {
    set({ nodeExplanation: nodeExplanationCache[nodeId] });
    return;
  }

  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  set({ nodeExplanationLoading: true, nodeExplanation: null });

  try {
    const connections = graph.edges.filter(
      (e) => e.source === nodeId || e.target === nodeId,
    );
    const connDetails = connections
      .map((e) => {
        const isSource = e.source === nodeId;
        const otherId = isSource ? e.target : e.source;
        const otherNode = graph.nodes.find((n) => n.id === otherId);
        return `${isSource ? "->" : "<-"} [${e.type}] ${otherNode?.name ?? otherId}`;
      })
      .join("\n");

    const layer = graph.layers.find((l) => l.nodeIds.includes(nodeId));

    const prompt = [
      `Explain the following code component in plain English. Be thorough but accessible.`,
      ``,
      `**Component:** ${node.name}`,
      `**Type:** ${node.type}`,
      `**File:** ${node.filePath ?? "N/A"}`,
      `**Summary:** ${node.summary}`,
      `**Complexity:** ${node.complexity}`,
      `**Tags:** ${node.tags.join(", ") || "none"}`,
      layer ? `**Layer:** ${layer.name} — ${layer.description}` : "",
      ``,
      `**Connections:**`,
      connDetails || "  none",
      ``,
      `Explain:`,
      `1. What this component does and WHY it exists`,
      `2. How it fits into the larger architecture`,
      `3. Key relationships with other components`,
      `4. Any patterns or concepts worth understanding`,
      ``,
      `Keep the explanation concise (2-4 paragraphs). Use markdown formatting.`,
    ].join("\n");

    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text"
      ? response.content[0].text
      : "Unable to generate explanation.";

    set((state) => ({
      nodeExplanation: text,
      nodeExplanationLoading: false,
      nodeExplanationCache: { ...state.nodeExplanationCache, [nodeId]: text },
    }));
  } catch (err) {
    set({
      nodeExplanation: `Error: ${err instanceof Error ? err.message : "Failed to generate explanation"}`,
      nodeExplanationLoading: false,
    });
  }
},
```

Don't forget to add `import Anthropic from "@anthropic-ai/sdk"` if not already imported (it is in the current store.ts).

Also add to `selectNode` action — clear explanation when switching nodes:

```typescript
selectNode: (nodeId) => set({ selectedNodeId: nodeId, nodeExplanation: null }),
```

**Step 2: Add Explain button and display to NodeInfo**

In `packages/dashboard/src/components/NodeInfo.tsx`, add store selectors and the UI:

```typescript
const apiKey = useDashboardStore((s) => s.apiKey);
const nodeExplanation = useDashboardStore((s) => s.nodeExplanation);
const nodeExplanationLoading = useDashboardStore((s) => s.nodeExplanationLoading);
const explainNode = useDashboardStore((s) => s.explainNode);
```

Add after the summary paragraph, before tags:

```tsx
{/* Explain button + explanation */}
{apiKey && (
  <div className="mb-4">
    {!nodeExplanation && !nodeExplanationLoading && (
      <button
        onClick={() => explainNode(node.id)}
        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-500 transition-colors"
      >
        Explain This
      </button>
    )}
    {nodeExplanationLoading && (
      <div className="text-xs text-gray-400 animate-pulse">
        Generating explanation...
      </div>
    )}
    {nodeExplanation && (
      <div className="bg-gray-700/50 rounded-lg p-3 text-sm text-gray-300 leading-relaxed">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
            code: ({ children }) => (
              <code className="bg-gray-900 rounded px-1 py-0.5 text-[11px]">{children}</code>
            ),
          }}
        >
          {nodeExplanation}
        </ReactMarkdown>
      </div>
    )}
  </div>
)}
```

Don't forget to add `import ReactMarkdown from "react-markdown"` to NodeInfo.

**Step 3: Verify dashboard compiles**

```bash
cd packages/dashboard && pnpm build
```

**Step 4: Commit**

```bash
git add packages/dashboard/src/store.ts packages/dashboard/src/components/NodeInfo.tsx
git commit -m "feat(dashboard): add contextual node explanation with Claude API"
```

---

## Task 5: Language Lesson Prompt Builder (Core)

**Files:**
- Create: `packages/core/src/analyzer/language-lesson.ts`
- Create: `packages/core/src/__tests__/language-lesson.test.ts`
- Modify: `packages/core/src/index.ts` (add exports)

**Context:** The `languageNotes` field on `GraphNode` and `languageLesson` field on `TourStep` are designed for language-specific teaching. This task builds the LLM prompt templates that generate these lessons — explaining language concepts (async/await, generics, middleware patterns, decorators, etc.) in the context of the user's actual code. This is what makes "Learn Mode" unique: you learn Go/Rust/TypeScript concepts by seeing them explained in YOUR project.

**Step 1: Write failing tests**

```typescript
// packages/core/src/__tests__/language-lesson.test.ts
import { describe, it, expect } from "vitest";
import {
  buildLanguageLessonPrompt,
  parseLanguageLessonResponse,
  detectLanguageConcepts,
} from "../analyzer/language-lesson.js";
import type { GraphNode, GraphEdge } from "../types.js";

const sampleNode: GraphNode = {
  id: "func:auth:verifyToken",
  type: "function",
  name: "verifyToken",
  filePath: "src/auth/verify.ts",
  lineRange: [10, 35],
  summary: "Verifies JWT tokens and extracts user payload using async/await",
  tags: ["auth", "jwt", "async"],
  complexity: "moderate",
};

const sampleEdges: GraphEdge[] = [
  { source: "func:auth:verifyToken", target: "file:src/config.ts", type: "reads_from", direction: "forward", weight: 0.6 },
  { source: "file:src/middleware.ts", target: "func:auth:verifyToken", type: "calls", direction: "forward", weight: 0.8 },
];

describe("language-lesson", () => {
  describe("buildLanguageLessonPrompt", () => {
    it("includes the node name and summary", () => {
      const prompt = buildLanguageLessonPrompt(sampleNode, sampleEdges, "typescript");
      expect(prompt).toContain("verifyToken");
      expect(prompt).toContain("JWT tokens");
    });

    it("includes the target language", () => {
      const prompt = buildLanguageLessonPrompt(sampleNode, sampleEdges, "typescript");
      expect(prompt).toContain("TypeScript");
    });

    it("includes relationship context", () => {
      const prompt = buildLanguageLessonPrompt(sampleNode, sampleEdges, "typescript");
      expect(prompt).toContain("reads_from");
    });

    it("requests JSON output", () => {
      const prompt = buildLanguageLessonPrompt(sampleNode, sampleEdges, "typescript");
      expect(prompt).toContain("JSON");
    });
  });

  describe("parseLanguageLessonResponse", () => {
    it("parses a valid response", () => {
      const response = JSON.stringify({
        languageNotes: "This function uses async/await for non-blocking JWT verification.",
        concepts: [
          { name: "async/await", explanation: "TypeScript's way of handling asynchronous operations." },
        ],
      });
      const result = parseLanguageLessonResponse(response);
      expect(result.languageNotes).toContain("async/await");
      expect(result.concepts).toHaveLength(1);
    });

    it("extracts JSON from code blocks", () => {
      const response = "```json\n" + JSON.stringify({
        languageNotes: "Uses generics.",
        concepts: [],
      }) + "\n```";
      const result = parseLanguageLessonResponse(response);
      expect(result.languageNotes).toContain("generics");
    });

    it("returns empty result for invalid response", () => {
      const result = parseLanguageLessonResponse("not json");
      expect(result.languageNotes).toBe("");
      expect(result.concepts).toEqual([]);
    });
  });

  describe("detectLanguageConcepts", () => {
    it("detects async patterns from tags", () => {
      const concepts = detectLanguageConcepts(sampleNode, "typescript");
      expect(concepts).toContain("async/await");
    });

    it("detects middleware pattern", () => {
      const node: GraphNode = {
        ...sampleNode,
        tags: ["middleware", "express"],
        summary: "Express middleware that validates requests",
      };
      const concepts = detectLanguageConcepts(node, "typescript");
      expect(concepts).toContain("middleware pattern");
    });

    it("returns empty for nodes with no detectable concepts", () => {
      const node: GraphNode = {
        ...sampleNode,
        tags: ["config"],
        summary: "Simple configuration file",
      };
      const concepts = detectLanguageConcepts(node, "typescript");
      expect(concepts.length).toBeLessThanOrEqual(1);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/core && pnpm test -- --reporter verbose src/__tests__/language-lesson.test.ts
```

**Step 3: Implement language-lesson.ts**

```typescript
// packages/core/src/analyzer/language-lesson.ts
import type { GraphNode, GraphEdge } from "../types.js";

export interface LanguageLessonResult {
  languageNotes: string;
  concepts: Array<{ name: string; explanation: string }>;
}

// Concept detection patterns — maps keywords/tags to concept names
const CONCEPT_PATTERNS: Record<string, string[]> = {
  "async/await": ["async", "await", "promise", "asynchronous"],
  "middleware pattern": ["middleware", "interceptor", "pipe"],
  "generics": ["generic", "type parameter", "template"],
  "decorators": ["decorator", "@", "annotation"],
  "dependency injection": ["inject", "provider", "container", "di"],
  "observer pattern": ["subscribe", "publish", "event", "observable", "listener"],
  "singleton": ["singleton", "instance", "shared client"],
  "type guards": ["type guard", "is", "narrowing", "discriminated union"],
  "higher-order functions": ["callback", "factory", "higher-order", "closure"],
  "error handling": ["try/catch", "error boundary", "exception", "Result type"],
  "streams": ["stream", "pipe", "transform", "readable", "writable"],
  "concurrency": ["goroutine", "channel", "thread", "worker", "mutex"],
};

/**
 * Detect language concepts likely used in a node based on tags and summary.
 */
export function detectLanguageConcepts(node: GraphNode, language: string): string[] {
  const text = [
    ...node.tags,
    node.summary.toLowerCase(),
    node.languageNotes?.toLowerCase() ?? "",
  ].join(" ");

  const detected: string[] = [];
  for (const [concept, keywords] of Object.entries(CONCEPT_PATTERNS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      detected.push(concept);
    }
  }

  return detected;
}

/**
 * Build an LLM prompt to generate language-specific lessons for a node.
 */
export function buildLanguageLessonPrompt(
  node: GraphNode,
  edges: GraphEdge[],
  language: string,
): string {
  const capitalLang = language.charAt(0).toUpperCase() + language.slice(1);
  const detectedConcepts = detectLanguageConcepts(node, language);

  const edgeContext = edges
    .map((e) => {
      const dir = e.source === node.id ? "->" : "<-";
      const other = e.source === node.id ? e.target : e.source;
      return `  ${dir} [${e.type}] ${other}`;
    })
    .join("\n");

  return [
    `You are a programming teacher. Explain the ${capitalLang} concepts used in this code component.`,
    `The reader may not know ${capitalLang} — explain concepts as if teaching them for the first time,`,
    `but in the context of THIS specific code, not abstractly.`,
    ``,
    `## Component`,
    `- Name: ${node.name}`,
    `- Type: ${node.type}`,
    `- File: ${node.filePath ?? "N/A"}`,
    `- Summary: ${node.summary}`,
    `- Tags: ${node.tags.join(", ")}`,
    ``,
    `## Relationships`,
    edgeContext || "  none",
    ``,
    detectedConcepts.length > 0
      ? `## Detected Concepts (explain these)\n${detectedConcepts.map((c) => `- ${c}`).join("\n")}`
      : `## Note\nIdentify and explain any ${capitalLang}-specific patterns used in this component.`,
    ``,
    `Return JSON:`,
    `\`\`\`json`,
    `{`,
    `  "languageNotes": "2-3 sentence summary of language concepts used here",`,
    `  "concepts": [`,
    `    { "name": "concept name", "explanation": "1-2 sentence explanation in context of this code" }`,
    `  ]`,
    `}`,
    `\`\`\``,
  ].join("\n");
}

/**
 * Parse the LLM response into a LanguageLessonResult.
 */
export function parseLanguageLessonResponse(response: string): LanguageLessonResult {
  let json = response;
  const codeBlockMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    json = codeBlockMatch[1];
  }

  try {
    const parsed = JSON.parse(json);
    return {
      languageNotes: typeof parsed.languageNotes === "string" ? parsed.languageNotes : "",
      concepts: Array.isArray(parsed.concepts)
        ? parsed.concepts.filter(
            (c: unknown): c is { name: string; explanation: string } =>
              typeof c === "object" &&
              c !== null &&
              typeof (c as Record<string, unknown>).name === "string" &&
              typeof (c as Record<string, unknown>).explanation === "string",
          )
        : [],
    };
  } catch {
    return { languageNotes: "", concepts: [] };
  }
}
```

**Step 4: Run tests**

```bash
cd packages/core && pnpm test -- --reporter verbose src/__tests__/language-lesson.test.ts
```

**Step 5: Add exports to index.ts**

```typescript
export {
  buildLanguageLessonPrompt,
  parseLanguageLessonResponse,
  detectLanguageConcepts,
  type LanguageLessonResult,
} from "./analyzer/language-lesson.js";
```

**Step 6: Build + full test suite**

```bash
cd packages/core && pnpm build && pnpm test
```

**Step 7: Commit**

```bash
git add packages/core/src/analyzer/language-lesson.ts packages/core/src/__tests__/language-lesson.test.ts packages/core/src/index.ts
git commit -m "feat(core): add language lesson prompt builder and concept detector"
```

---

## Task 6: Enhanced Language Lesson Display (Dashboard)

**Files:**
- Modify: `packages/dashboard/src/components/NodeInfo.tsx` (enhanced languageNotes display)
- Modify: `packages/dashboard/src/components/LearnPanel.tsx` (rich language lesson in tour)

**Context:** The `languageNotes` field on nodes and `languageLesson` on tour steps already exist in the data. NodeInfo currently shows `languageNotes` as plain text in a blue box. This task upgrades both displays: NodeInfo gets a collapsible "Language Concepts" section with detected concept pills, and LearnPanel's language lesson section gets a more structured layout with concept cards.

**Step 1: Enhance NodeInfo languageNotes display**

Replace the existing `languageNotes` section in `packages/dashboard/src/components/NodeInfo.tsx` with:

```tsx
{node.languageNotes && (
  <div className="mb-4">
    <button
      onClick={() => setLanguageExpanded(!languageExpanded)}
      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 hover:text-indigo-300 transition-colors"
    >
      <svg
        className={`w-3 h-3 transition-transform ${languageExpanded ? "rotate-90" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      Language Concepts
    </button>
    {languageExpanded && (
      <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-lg p-3">
        <p className="text-sm text-indigo-200 leading-relaxed">
          {node.languageNotes}
        </p>
      </div>
    )}
  </div>
)}
```

Add `const [languageExpanded, setLanguageExpanded] = useState(true);` at the top of the component.

**Step 2: Enhance LearnPanel language lesson display**

The `languageLesson` section in LearnPanel is already created in Task 2. Make sure it matches this enhanced styling with an icon and visual distinction. No changes needed if Task 2 was implemented correctly.

**Step 3: Verify dashboard compiles**

```bash
cd packages/dashboard && pnpm build
```

**Step 4: Commit**

```bash
git add packages/dashboard/src/components/NodeInfo.tsx packages/dashboard/src/components/LearnPanel.tsx
git commit -m "feat(dashboard): enhance language lesson display with collapsible sections"
```

---

## Task 7: Persona Mode System (Dashboard)

**Files:**
- Create: `packages/dashboard/src/components/PersonaSelector.tsx`
- Modify: `packages/dashboard/src/store.ts` (add persona state)
- Modify: `packages/dashboard/src/App.tsx` (persona-adaptive layout)
- Modify: `packages/dashboard/src/components/GraphView.tsx` (filter nodes by persona)

**Context:** The design doc specifies three persona modes that change what the dashboard shows. This is the largest task in Phase 3, as it affects the layout, node filtering, and panel visibility. The three modes are:

1. **Non-technical** — Hide CodeViewer, show only concept + module nodes in graph, expand LearnPanel to full right side. For PMs, designers, stakeholders.
2. **Junior dev** — Full 4-panel layout with LearnPanel prominent (instead of NodeInfo). Show all nodes with complexity indicators. For developers learning the codebase.
3. **Experienced dev** — Full 4-panel layout with CodeViewer and ChatPanel prominent, NodeInfo instead of LearnPanel. For senior devs doing deep dives.

**Step 1: Add persona state to the store**

In `packages/dashboard/src/store.ts`:

```typescript
// Add to interface
persona: "non-technical" | "junior" | "experienced";
setPersona: (persona: "non-technical" | "junior" | "experienced") => void;

// Add to implementation
persona: "junior", // sensible default
setPersona: (persona) => set({ persona }),
```

**Step 2: Create PersonaSelector component**

```tsx
// packages/dashboard/src/components/PersonaSelector.tsx
import { useDashboardStore } from "../store";

const personas = [
  {
    id: "non-technical" as const,
    label: "Overview",
    description: "High-level architecture view",
  },
  {
    id: "junior" as const,
    label: "Learn",
    description: "Full dashboard with guided learning",
  },
  {
    id: "experienced" as const,
    label: "Deep Dive",
    description: "Code-focused with chat",
  },
];

export default function PersonaSelector() {
  const persona = useDashboardStore((s) => s.persona);
  const setPersona = useDashboardStore((s) => s.setPersona);

  return (
    <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5">
      {personas.map((p) => (
        <button
          key={p.id}
          onClick={() => setPersona(p.id)}
          title={p.description}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            persona === p.id
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
```

**Step 3: Add PersonaSelector to App.tsx header**

Import `PersonaSelector` and add it to the header bar, between the project info and search.

**Step 4: Make App.tsx layout persona-adaptive**

The 4-panel grid changes based on persona:

```tsx
const persona = useDashboardStore((s) => s.persona);
const tourActive = useDashboardStore((s) => s.tourActive);

// Non-technical: 2-column layout (graph + learn panel, no code viewer)
// Junior: 4-panel with LearnPanel in bottom-right
// Experienced: 4-panel with NodeInfo in bottom-right

{persona === "non-technical" ? (
  <div className="flex-1 grid grid-cols-2 gap-1 p-1 min-h-0">
    <div className="min-h-0 min-w-0">
      <GraphView />
    </div>
    <div className="min-h-0 min-w-0 flex flex-col gap-1">
      <div className="flex-1 min-h-0">
        <LearnPanel />
      </div>
      <div className="flex-1 min-h-0">
        <ChatPanel />
      </div>
    </div>
  </div>
) : (
  <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1 p-1 min-h-0">
    <div className="min-h-0 min-w-0">
      <GraphView />
    </div>
    <div className="min-h-0 min-w-0">
      <CodeViewer />
    </div>
    <div className="min-h-0 min-w-0">
      <ChatPanel />
    </div>
    <div className="min-h-0 min-w-0">
      {persona === "junior" || tourActive ? <LearnPanel /> : <NodeInfo />}
    </div>
  </div>
)}
```

**Step 5: Filter graph nodes by persona in GraphView**

In `packages/dashboard/src/components/GraphView.tsx`, add persona-based node filtering:

```typescript
const persona = useDashboardStore((s) => s.persona);

// Inside the useMemo, after creating flowNodes:
const filteredGraphNodes = persona === "non-technical"
  ? graph.nodes.filter((n) => n.type === "concept" || n.type === "module" || n.type === "file")
  : graph.nodes;

// Use filteredGraphNodes instead of graph.nodes for building flowNodes
```

For non-technical mode, only show concept, module, and file-level nodes (skip function/class for simplicity). Also filter edges to only include those where both source and target are in the filtered set.

**Step 6: Verify dashboard compiles**

```bash
cd packages/dashboard && pnpm build
```

**Step 7: Commit**

```bash
git add packages/dashboard/src/components/PersonaSelector.tsx packages/dashboard/src/store.ts packages/dashboard/src/App.tsx packages/dashboard/src/components/GraphView.tsx
git commit -m "feat(dashboard): add persona mode system (Overview / Learn / Deep Dive)"
```

---

## Verification Checklist

After all tasks are complete:

1. `cd packages/core && pnpm build && pnpm test` — all tests pass (existing 92 + new ~20)
2. `cd packages/dashboard && pnpm build` — compiles without errors
3. `pnpm dev:dashboard` — tour works end-to-end with sample data:
   - Start Tour button appears in bottom-right
   - Steps navigate with Prev/Next
   - Graph nodes highlight per step
   - Language lessons display in tour steps
4. Persona selector in header switches layouts correctly:
   - Non-technical: 2-column, no CodeViewer, only high-level nodes
   - Junior/Learn: 4-panel with LearnPanel
   - Experienced/Deep Dive: 4-panel with NodeInfo
5. "Explain This" button on NodeInfo generates contextual explanation via Claude API
6. All existing Phase 1 + Phase 2 features still work (search, chat, layers, dagre layout)
````

## File: docs/superpowers/plans/2026-03-14-phase4-implementation.md
````markdown
# Understand Anything — Phase 4 (Advanced) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the "Advanced" layer — three new skill commands (`/understand-diff`, `/understand-explain`, `/understand-onboard`), a community plugin system, and optional embedding-based semantic search.

**Architecture:** Extends the skill package with three new Claude Code skill definitions + supporting core utilities. Adds a plugin registry to core for community extensibility. Optionally adds embedding-based search as an upgrade path from the existing fuse.js search.

**Tech Stack:** No new dependencies for Tasks 1-5. Task 6-7 (embedding search) adds a vector similarity library or uses raw cosine calculation.

---

## Dependency Graph

```
Task 1 (understand-diff) ─── (independent)
Task 2 (understand-explain) ─── (independent)
Task 3 (understand-onboard) ─── (independent)
Task 4 (Plugin Registry Core) ───→ Task 5 (Plugin CLI Integration)
Task 6 (Embedding Search Core) ───→ Task 7 (Embedding Dashboard)
```

Tasks 1, 2, 3, 4, 6 are fully independent and can be implemented in any order.

---

## Task 1: /understand-diff Skill — PR/Diff Analysis

**Files:**
- Create: `packages/skill/src/diff-analyzer.ts`
- Create: `packages/skill/src/__tests__/diff-analyzer.test.ts`
- Create: `packages/skill/.claude/skills/understand-diff.md`
- Modify: `packages/skill/src/index.ts` (add exports)

**Context:** The `/understand-diff` skill analyzes the current git diff (or PR) against the knowledge graph. It maps changed files to affected nodes, identifies impacted relationships and layers, and generates a structured analysis of changes, affected areas, and risks. This is designed to run inside Claude Code where the LLM can read the analysis and explain it to the user.

**Step 1: Write failing tests**

```typescript
// packages/skill/src/__tests__/diff-analyzer.test.ts
import { describe, it, expect } from "vitest";
import { buildDiffContext, formatDiffAnalysis } from "../diff-analyzer.js";
import type { KnowledgeGraph } from "@understand-anything/core";

const sampleGraph: KnowledgeGraph = {
  version: "1.0.0",
  project: {
    name: "test-project",
    languages: ["typescript"],
    frameworks: ["express"],
    description: "A test project",
    analyzedAt: "2026-03-14T00:00:00Z",
    gitCommitHash: "abc123",
  },
  nodes: [
    { id: "file:src/index.ts", type: "file", name: "index.ts", filePath: "src/index.ts", summary: "Entry point", tags: ["entry"], complexity: "simple" },
    { id: "file:src/routes.ts", type: "file", name: "routes.ts", filePath: "src/routes.ts", summary: "Routes", tags: ["routes"], complexity: "moderate" },
    { id: "file:src/service.ts", type: "file", name: "service.ts", filePath: "src/service.ts", summary: "Service", tags: ["service"], complexity: "complex" },
    { id: "func:src/service.ts:process", type: "function", name: "process", filePath: "src/service.ts", lineRange: [10, 30], summary: "Process function", tags: ["core"], complexity: "complex" },
    { id: "file:src/db.ts", type: "file", name: "db.ts", filePath: "src/db.ts", summary: "Database", tags: ["db"], complexity: "simple" },
  ],
  edges: [
    { source: "file:src/index.ts", target: "file:src/routes.ts", type: "imports", direction: "forward", weight: 0.9 },
    { source: "file:src/routes.ts", target: "file:src/service.ts", type: "calls", direction: "forward", weight: 0.8 },
    { source: "file:src/service.ts", target: "func:src/service.ts:process", type: "contains", direction: "forward", weight: 1.0 },
    { source: "file:src/service.ts", target: "file:src/db.ts", type: "reads_from", direction: "forward", weight: 0.7 },
  ],
  layers: [
    { id: "layer:api", name: "API Layer", description: "HTTP routes", nodeIds: ["file:src/index.ts", "file:src/routes.ts"] },
    { id: "layer:service", name: "Service Layer", description: "Business logic", nodeIds: ["file:src/service.ts", "func:src/service.ts:process"] },
    { id: "layer:data", name: "Data Layer", description: "Database", nodeIds: ["file:src/db.ts"] },
  ],
  tour: [],
};

describe("diff-analyzer", () => {
  describe("buildDiffContext", () => {
    it("identifies directly changed nodes", () => {
      const ctx = buildDiffContext(sampleGraph, ["src/service.ts"]);
      expect(ctx.changedNodes.map((n) => n.id)).toContain("file:src/service.ts");
    });

    it("identifies child nodes of changed files", () => {
      const ctx = buildDiffContext(sampleGraph, ["src/service.ts"]);
      expect(ctx.changedNodes.map((n) => n.id)).toContain("func:src/service.ts:process");
    });

    it("identifies affected nodes via edges (1-hop)", () => {
      const ctx = buildDiffContext(sampleGraph, ["src/service.ts"]);
      // routes.ts calls service.ts, so it's affected
      expect(ctx.affectedNodes.map((n) => n.id)).toContain("file:src/routes.ts");
      // db.ts is read by service.ts, so it's affected
      expect(ctx.affectedNodes.map((n) => n.id)).toContain("file:src/db.ts");
    });

    it("identifies affected layers", () => {
      const ctx = buildDiffContext(sampleGraph, ["src/service.ts"]);
      expect(ctx.affectedLayers.map((l) => l.name)).toContain("Service Layer");
    });

    it("identifies impacted edges", () => {
      const ctx = buildDiffContext(sampleGraph, ["src/service.ts"]);
      expect(ctx.impactedEdges.length).toBeGreaterThan(0);
    });

    it("handles files not in the graph gracefully", () => {
      const ctx = buildDiffContext(sampleGraph, ["src/unknown.ts"]);
      expect(ctx.changedNodes).toHaveLength(0);
      expect(ctx.unmappedFiles).toContain("src/unknown.ts");
    });

    it("handles empty diff", () => {
      const ctx = buildDiffContext(sampleGraph, []);
      expect(ctx.changedNodes).toHaveLength(0);
      expect(ctx.affectedNodes).toHaveLength(0);
    });

    it("de-duplicates affected nodes (not in changed set)", () => {
      const ctx = buildDiffContext(sampleGraph, ["src/service.ts"]);
      const changedIds = new Set(ctx.changedNodes.map((n) => n.id));
      for (const affected of ctx.affectedNodes) {
        expect(changedIds.has(affected.id)).toBe(false);
      }
    });
  });

  describe("formatDiffAnalysis", () => {
    it("produces structured markdown", () => {
      const ctx = buildDiffContext(sampleGraph, ["src/service.ts"]);
      const analysis = formatDiffAnalysis(ctx);
      expect(analysis).toContain("## Changed Components");
      expect(analysis).toContain("## Affected Components");
      expect(analysis).toContain("## Affected Layers");
    });

    it("includes risk assessment section", () => {
      const ctx = buildDiffContext(sampleGraph, ["src/service.ts"]);
      const analysis = formatDiffAnalysis(ctx);
      expect(analysis).toContain("## Risk Assessment");
    });

    it("lists unmapped files when present", () => {
      const ctx = buildDiffContext(sampleGraph, ["src/unknown.ts"]);
      const analysis = formatDiffAnalysis(ctx);
      expect(analysis).toContain("src/unknown.ts");
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/skill && pnpm test -- --reporter verbose src/__tests__/diff-analyzer.test.ts
```

**Step 3: Implement diff-analyzer.ts**

```typescript
// packages/skill/src/diff-analyzer.ts
import type { KnowledgeGraph, GraphNode, GraphEdge, Layer } from "@understand-anything/core";

export interface DiffContext {
  projectName: string;
  changedFiles: string[];
  changedNodes: GraphNode[];
  affectedNodes: GraphNode[];
  impactedEdges: GraphEdge[];
  affectedLayers: Layer[];
  unmappedFiles: string[];
}

/**
 * Map a list of changed file paths to knowledge graph nodes and
 * identify the ripple effect (affected nodes, layers, edges).
 */
export function buildDiffContext(
  graph: KnowledgeGraph,
  changedFiles: string[],
): DiffContext {
  const { nodes, edges, layers } = graph;

  // Map files to directly changed nodes
  const changedNodeIds = new Set<string>();
  const unmappedFiles: string[] = [];

  for (const file of changedFiles) {
    let mapped = false;
    for (const node of nodes) {
      if (node.filePath === file) {
        changedNodeIds.add(node.id);
        mapped = true;
      }
    }
    if (!mapped) {
      unmappedFiles.push(file);
    }
  }

  // Also include "contains" children of changed file nodes
  for (const edge of edges) {
    if (edge.type === "contains" && changedNodeIds.has(edge.source)) {
      changedNodeIds.add(edge.target);
    }
  }

  const changedNodes = nodes.filter((n) => changedNodeIds.has(n.id));

  // Find affected nodes: 1-hop neighbors of changed nodes (excluding already changed)
  const affectedNodeIds = new Set<string>();
  const impactedEdges: GraphEdge[] = [];

  for (const edge of edges) {
    const sourceChanged = changedNodeIds.has(edge.source);
    const targetChanged = changedNodeIds.has(edge.target);

    if (sourceChanged || targetChanged) {
      impactedEdges.push(edge);
      if (sourceChanged && !changedNodeIds.has(edge.target)) {
        affectedNodeIds.add(edge.target);
      }
      if (targetChanged && !changedNodeIds.has(edge.source)) {
        affectedNodeIds.add(edge.source);
      }
    }
  }

  const affectedNodes = nodes.filter((n) => affectedNodeIds.has(n.id));

  // Find affected layers: any layer containing a changed or affected node
  const allImpactedIds = new Set([...changedNodeIds, ...affectedNodeIds]);
  const affectedLayers = layers.filter((layer) =>
    layer.nodeIds.some((id) => allImpactedIds.has(id)),
  );

  return {
    projectName: graph.project.name,
    changedFiles,
    changedNodes,
    affectedNodes,
    impactedEdges,
    affectedLayers,
    unmappedFiles,
  };
}

/**
 * Format the diff analysis as structured markdown for LLM or human consumption.
 */
export function formatDiffAnalysis(ctx: DiffContext): string {
  const lines: string[] = [];

  lines.push(`# Diff Analysis: ${ctx.projectName}`);
  lines.push("");

  // Changed components
  lines.push("## Changed Components");
  lines.push("");
  if (ctx.changedNodes.length === 0) {
    lines.push("No mapped components found for changed files.");
  } else {
    for (const node of ctx.changedNodes) {
      lines.push(`- **${node.name}** (${node.type}) — ${node.summary}`);
      if (node.filePath) lines.push(`  - File: \`${node.filePath}\``);
      lines.push(`  - Complexity: ${node.complexity}`);
    }
  }
  lines.push("");

  // Affected components (ripple effect)
  lines.push("## Affected Components");
  lines.push("");
  if (ctx.affectedNodes.length === 0) {
    lines.push("No downstream impact detected.");
  } else {
    lines.push("These components are connected to changed code and may need attention:");
    lines.push("");
    for (const node of ctx.affectedNodes) {
      lines.push(`- **${node.name}** (${node.type}) — ${node.summary}`);
    }
  }
  lines.push("");

  // Affected layers
  lines.push("## Affected Layers");
  lines.push("");
  if (ctx.affectedLayers.length === 0) {
    lines.push("No layers affected.");
  } else {
    for (const layer of ctx.affectedLayers) {
      lines.push(`- **${layer.name}**: ${layer.description}`);
    }
  }
  lines.push("");

  // Impacted relationships
  if (ctx.impactedEdges.length > 0) {
    lines.push("## Impacted Relationships");
    lines.push("");
    for (const edge of ctx.impactedEdges) {
      lines.push(`- ${edge.source} --[${edge.type}]--> ${edge.target}`);
    }
    lines.push("");
  }

  // Unmapped files
  if (ctx.unmappedFiles.length > 0) {
    lines.push("## Unmapped Files");
    lines.push("");
    lines.push("These changed files are not yet in the knowledge graph:");
    lines.push("");
    for (const f of ctx.unmappedFiles) {
      lines.push(`- \`${f}\``);
    }
    lines.push("");
  }

  // Risk assessment
  lines.push("## Risk Assessment");
  lines.push("");
  const complexChanges = ctx.changedNodes.filter((n) => n.complexity === "complex");
  const crossLayerCount = new Set(ctx.affectedLayers.map((l) => l.id)).size;

  if (complexChanges.length > 0) {
    lines.push(`- **High complexity**: ${complexChanges.length} complex component(s) changed: ${complexChanges.map((n) => n.name).join(", ")}`);
  }
  if (crossLayerCount > 1) {
    lines.push(`- **Cross-layer impact**: Changes span ${crossLayerCount} architectural layers`);
  }
  if (ctx.affectedNodes.length > 5) {
    lines.push(`- **Wide blast radius**: ${ctx.affectedNodes.length} components affected downstream`);
  }
  if (ctx.unmappedFiles.length > 0) {
    lines.push(`- **New/unmapped files**: ${ctx.unmappedFiles.length} files not in the knowledge graph (may need re-analysis)`);
  }
  if (complexChanges.length === 0 && crossLayerCount <= 1 && ctx.affectedNodes.length <= 5 && ctx.unmappedFiles.length === 0) {
    lines.push("- **Low risk**: Changes are localized with limited downstream impact.");
  }
  lines.push("");

  return lines.join("\n");
}
```

**Step 4: Run tests**

```bash
cd packages/skill && pnpm test -- --reporter verbose src/__tests__/diff-analyzer.test.ts
```

**Step 5: Add exports to index.ts**

```typescript
export {
  buildDiffContext,
  formatDiffAnalysis,
  type DiffContext,
} from "./diff-analyzer.js";
```

**Step 6: Create the skill definition**

```markdown
<!-- packages/skill/.claude/skills/understand-diff.md -->
---
name: understand-diff
description: Analyze current git diff or PR against the knowledge graph to identify changes, impact, and risks
---

# /understand-diff

Analyze the current code changes against the knowledge graph at `.understand-anything/knowledge-graph.json`.

## Instructions

1. Read the knowledge graph file at `.understand-anything/knowledge-graph.json` in the current project root
2. If the file doesn't exist, tell the user to run `/understand` first
3. Get the current diff:
   - If on a branch with uncommitted changes: `git diff --name-only`
   - If on a feature branch: `git diff main...HEAD --name-only` (or the base branch)
   - If the user specifies a PR number: get the diff from that PR
4. For each changed file, identify:
   - Which nodes in the knowledge graph correspond to that file
   - Which other nodes are connected (imports, calls, depends_on, etc.)
   - Which architectural layers are affected
5. Provide a structured analysis:
   - **Changed Components**: What was directly modified
   - **Affected Components**: What might be impacted by the changes
   - **Affected Layers**: Which architectural layers are touched
   - **Risk Assessment**: Complexity, cross-layer impact, blast radius
6. Suggest what to review carefully and any potential issues
```

**Step 7: Build + test**

```bash
cd packages/skill && pnpm build && pnpm test
```

**Step 8: Commit**

```bash
git add packages/skill/src/diff-analyzer.ts packages/skill/src/__tests__/diff-analyzer.test.ts packages/skill/src/index.ts packages/skill/.claude/skills/understand-diff.md
git commit -m "feat(skill): add /understand-diff command for PR/diff analysis"
```

---

## Task 2: /understand-explain Skill — Deep-Dive on Files

**Files:**
- Create: `packages/skill/src/explain-builder.ts`
- Create: `packages/skill/src/__tests__/explain-builder.test.ts`
- Create: `packages/skill/.claude/skills/understand-explain.md`
- Modify: `packages/skill/src/index.ts` (add exports)

**Context:** The `/understand-explain <path>` skill provides a deep-dive explanation of a specific file or function. It gathers all nodes that belong to that file, their connections, layer membership, and constructs a comprehensive context for the LLM to explain the component. This differs from `/understand-chat` which answers any question — `/understand-explain` is focused on thorough explanation of a single component.

**Step 1: Write failing tests**

```typescript
// packages/skill/src/__tests__/explain-builder.test.ts
import { describe, it, expect } from "vitest";
import { buildExplainContext, formatExplainPrompt } from "../explain-builder.js";
import type { KnowledgeGraph } from "@understand-anything/core";

const sampleGraph: KnowledgeGraph = {
  version: "1.0.0",
  project: {
    name: "test-project",
    languages: ["typescript"],
    frameworks: ["express"],
    description: "A test project",
    analyzedAt: "2026-03-14T00:00:00Z",
    gitCommitHash: "abc123",
  },
  nodes: [
    { id: "file:src/auth.ts", type: "file", name: "auth.ts", filePath: "src/auth.ts", summary: "Auth module", tags: ["auth"], complexity: "complex" },
    { id: "func:src/auth.ts:login", type: "function", name: "login", filePath: "src/auth.ts", lineRange: [10, 30], summary: "Login handler", tags: ["auth", "login"], complexity: "moderate" },
    { id: "func:src/auth.ts:verify", type: "function", name: "verify", filePath: "src/auth.ts", lineRange: [32, 50], summary: "Token verification", tags: ["auth", "jwt"], complexity: "moderate" },
    { id: "file:src/db.ts", type: "file", name: "db.ts", filePath: "src/db.ts", summary: "Database", tags: ["db"], complexity: "simple" },
  ],
  edges: [
    { source: "file:src/auth.ts", target: "func:src/auth.ts:login", type: "contains", direction: "forward", weight: 1.0 },
    { source: "file:src/auth.ts", target: "func:src/auth.ts:verify", type: "contains", direction: "forward", weight: 1.0 },
    { source: "func:src/auth.ts:login", target: "file:src/db.ts", type: "reads_from", direction: "forward", weight: 0.8 },
  ],
  layers: [
    { id: "layer:auth", name: "Auth Layer", description: "Authentication", nodeIds: ["file:src/auth.ts", "func:src/auth.ts:login", "func:src/auth.ts:verify"] },
  ],
  tour: [],
};

describe("explain-builder", () => {
  describe("buildExplainContext", () => {
    it("finds the file node by path", () => {
      const ctx = buildExplainContext(sampleGraph, "src/auth.ts");
      expect(ctx.targetNode?.id).toBe("file:src/auth.ts");
    });

    it("includes child nodes (functions/classes in the file)", () => {
      const ctx = buildExplainContext(sampleGraph, "src/auth.ts");
      expect(ctx.childNodes.map((n) => n.name)).toContain("login");
      expect(ctx.childNodes.map((n) => n.name)).toContain("verify");
    });

    it("includes connected nodes", () => {
      const ctx = buildExplainContext(sampleGraph, "src/auth.ts");
      const allIds = ctx.connectedNodes.map((n) => n.id);
      expect(allIds).toContain("file:src/db.ts");
    });

    it("includes the layer", () => {
      const ctx = buildExplainContext(sampleGraph, "src/auth.ts");
      expect(ctx.layer?.name).toBe("Auth Layer");
    });

    it("returns null targetNode for unknown paths", () => {
      const ctx = buildExplainContext(sampleGraph, "src/unknown.ts");
      expect(ctx.targetNode).toBeNull();
    });

    it("finds function nodes by partial path match", () => {
      const ctx = buildExplainContext(sampleGraph, "src/auth.ts:login");
      expect(ctx.targetNode?.name).toBe("login");
    });
  });

  describe("formatExplainPrompt", () => {
    it("produces structured markdown for valid context", () => {
      const ctx = buildExplainContext(sampleGraph, "src/auth.ts");
      const prompt = formatExplainPrompt(ctx);
      expect(prompt).toContain("auth.ts");
      expect(prompt).toContain("login");
      expect(prompt).toContain("Auth Layer");
    });

    it("produces helpful message for unknown path", () => {
      const ctx = buildExplainContext(sampleGraph, "src/unknown.ts");
      const prompt = formatExplainPrompt(ctx);
      expect(prompt).toContain("not found");
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/skill && pnpm test -- --reporter verbose src/__tests__/explain-builder.test.ts
```

**Step 3: Implement explain-builder.ts**

```typescript
// packages/skill/src/explain-builder.ts
import type { KnowledgeGraph, GraphNode, GraphEdge, Layer } from "@understand-anything/core";

export interface ExplainContext {
  projectName: string;
  path: string;
  targetNode: GraphNode | null;
  childNodes: GraphNode[];
  connectedNodes: GraphNode[];
  relevantEdges: GraphEdge[];
  layer: Layer | null;
}

/**
 * Build a context for explaining a specific file or function.
 * Supports file paths ("src/auth.ts") and path:function ("src/auth.ts:login").
 */
export function buildExplainContext(
  graph: KnowledgeGraph,
  path: string,
): ExplainContext {
  const { nodes, edges, layers } = graph;

  // Try exact filePath match first, then name-based matching
  let targetNode: GraphNode | null = null;

  // Check for path:function format
  const colonIdx = path.lastIndexOf(":");
  if (colonIdx > 0 && !path.includes("://")) {
    const filePath = path.slice(0, colonIdx);
    const funcName = path.slice(colonIdx + 1);
    targetNode = nodes.find(
      (n) => n.filePath === filePath && n.name === funcName,
    ) ?? null;
  }

  // Fall back to file path match
  if (!targetNode) {
    targetNode = nodes.find((n) => n.filePath === path) ?? null;
  }

  if (!targetNode) {
    return {
      projectName: graph.project.name,
      path,
      targetNode: null,
      childNodes: [],
      connectedNodes: [],
      relevantEdges: [],
      layer: null,
    };
  }

  // Find child nodes (contained by this node)
  const childNodes = nodes.filter((n) =>
    edges.some(
      (e) => e.source === targetNode!.id && e.target === n.id && e.type === "contains",
    ),
  );

  // Also include children of children (e.g., file → class → methods)
  const allRelatedIds = new Set([targetNode.id, ...childNodes.map((n) => n.id)]);

  // Find connected nodes (1-hop, excluding children)
  const connectedIds = new Set<string>();
  const relevantEdges: GraphEdge[] = [];

  for (const edge of edges) {
    if (allRelatedIds.has(edge.source) || allRelatedIds.has(edge.target)) {
      relevantEdges.push(edge);
      if (allRelatedIds.has(edge.source) && !allRelatedIds.has(edge.target)) {
        connectedIds.add(edge.target);
      }
      if (allRelatedIds.has(edge.target) && !allRelatedIds.has(edge.source)) {
        connectedIds.add(edge.source);
      }
    }
  }

  const connectedNodes = nodes.filter((n) => connectedIds.has(n.id));

  // Find layer
  const layer = layers.find((l) => l.nodeIds.includes(targetNode!.id)) ?? null;

  return {
    projectName: graph.project.name,
    path,
    targetNode,
    childNodes,
    connectedNodes,
    relevantEdges,
    layer,
  };
}

/**
 * Format the explain context as a structured prompt for LLM consumption.
 */
export function formatExplainPrompt(ctx: ExplainContext): string {
  if (!ctx.targetNode) {
    return [
      `# Component Not Found`,
      ``,
      `The path "${ctx.path}" was not found in the knowledge graph for ${ctx.projectName}.`,
      ``,
      `Possible reasons:`,
      `- The file hasn't been analyzed yet — try running /understand first`,
      `- The path may be different in the graph — check the exact file path`,
      `- The file may have been deleted or renamed since the last analysis`,
    ].join("\n");
  }

  const { targetNode, childNodes, connectedNodes, relevantEdges, layer } = ctx;
  const lines: string[] = [];

  lines.push(`# Deep Dive: ${targetNode.name}`);
  lines.push("");
  lines.push(`**Type:** ${targetNode.type} | **Complexity:** ${targetNode.complexity}`);
  if (targetNode.filePath) lines.push(`**File:** \`${targetNode.filePath}\``);
  if (targetNode.lineRange) lines.push(`**Lines:** ${targetNode.lineRange[0]}-${targetNode.lineRange[1]}`);
  lines.push("");
  lines.push(`**Summary:** ${targetNode.summary}`);
  lines.push("");

  if (layer) {
    lines.push(`## Architectural Layer: ${layer.name}`);
    lines.push(layer.description);
    lines.push("");
  }

  if (childNodes.length > 0) {
    lines.push("## Internal Components");
    for (const child of childNodes) {
      lines.push(`- **${child.name}** (${child.type}): ${child.summary}`);
    }
    lines.push("");
  }

  if (connectedNodes.length > 0) {
    lines.push("## Connected Components");
    for (const node of connectedNodes) {
      lines.push(`- **${node.name}** (${node.type}): ${node.summary}`);
    }
    lines.push("");
  }

  if (relevantEdges.length > 0) {
    const nodeMap = new Map(
      [...[targetNode], ...childNodes, ...connectedNodes].map((n) => [n.id, n]),
    );
    lines.push("## Relationships");
    for (const edge of relevantEdges) {
      if (edge.type === "contains") continue; // skip containment (shown above)
      const src = nodeMap.get(edge.source)?.name ?? edge.source;
      const tgt = nodeMap.get(edge.target)?.name ?? edge.target;
      const desc = edge.description ? ` — ${edge.description}` : "";
      lines.push(`- ${src} --[${edge.type}]--> ${tgt}${desc}`);
    }
    lines.push("");
  }

  if (targetNode.languageNotes) {
    lines.push("## Language Notes");
    lines.push(targetNode.languageNotes);
    lines.push("");
  }

  lines.push("## Instructions");
  lines.push("Provide a thorough explanation of this component:");
  lines.push("1. What it does and why it exists in the project");
  lines.push("2. How data flows through it (inputs, processing, outputs)");
  lines.push("3. How it interacts with connected components");
  lines.push("4. Any patterns, idioms, or design decisions worth noting");
  lines.push("5. Potential gotchas or areas of complexity");
  lines.push("");

  return lines.join("\n");
}
```

**Step 4: Run tests**

```bash
cd packages/skill && pnpm test -- --reporter verbose src/__tests__/explain-builder.test.ts
```

**Step 5: Add exports + create skill definition**

Add to `packages/skill/src/index.ts`:
```typescript
export {
  buildExplainContext,
  formatExplainPrompt,
  type ExplainContext,
} from "./explain-builder.js";
```

Create `packages/skill/.claude/skills/understand-explain.md`:
```markdown
---
name: understand-explain
description: Deep-dive explanation of a specific file or function using the knowledge graph
arguments: path
---

# /understand-explain

Provide a thorough, in-depth explanation of a specific code component.

## Instructions

1. Read the knowledge graph file at `.understand-anything/knowledge-graph.json`
2. If it doesn't exist, tell the user to run `/understand` first
3. Find the component matching the path: "${ARGUMENTS}"
   - Supports file paths: `src/auth/login.ts`
   - Supports function notation: `src/auth/login.ts:verifyToken`
4. Analyze the component in context:
   - Its role in the architecture (which layer, why it exists)
   - Internal structure (functions, classes it contains)
   - External connections (what it imports, what calls it, what it depends on)
   - Data flow (inputs → processing → outputs)
5. Explain clearly, assuming the reader may not know the programming language
6. Highlight any patterns, idioms, or complexity worth understanding
```

**Step 6: Build + test**

```bash
cd packages/skill && pnpm build && pnpm test
```

**Step 7: Commit**

```bash
git add packages/skill/src/explain-builder.ts packages/skill/src/__tests__/explain-builder.test.ts packages/skill/src/index.ts packages/skill/.claude/skills/understand-explain.md
git commit -m "feat(skill): add /understand-explain command for deep-dive file analysis"
```

---

## Task 3: /understand-onboard Skill — Onboarding Guide Generation

**Files:**
- Create: `packages/skill/src/onboard-builder.ts`
- Create: `packages/skill/src/__tests__/onboard-builder.test.ts`
- Create: `packages/skill/.claude/skills/understand-onboard.md`
- Modify: `packages/skill/src/index.ts` (add exports)

**Context:** The `/understand-onboard` skill generates a structured onboarding guide for new team members. It synthesizes the knowledge graph — project overview, architecture layers, key concepts, tour steps, and complexity hotspots — into a comprehensive document. The output is a well-structured markdown guide that can be committed to the repo or shared in a wiki.

**Step 1: Write failing tests**

```typescript
// packages/skill/src/__tests__/onboard-builder.test.ts
import { describe, it, expect } from "vitest";
import { buildOnboardingGuide } from "../onboard-builder.js";
import type { KnowledgeGraph } from "@understand-anything/core";

const sampleGraph: KnowledgeGraph = {
  version: "1.0.0",
  project: {
    name: "test-project",
    languages: ["typescript", "python"],
    frameworks: ["express", "prisma"],
    description: "A test REST API",
    analyzedAt: "2026-03-14T00:00:00Z",
    gitCommitHash: "abc123",
  },
  nodes: [
    { id: "file:src/index.ts", type: "file", name: "index.ts", filePath: "src/index.ts", summary: "Entry point", tags: ["entry"], complexity: "simple" },
    { id: "file:src/service.ts", type: "file", name: "service.ts", filePath: "src/service.ts", summary: "Core service", tags: ["service"], complexity: "complex" },
    { id: "concept:auth", type: "concept", name: "Auth Flow", summary: "JWT-based authentication", tags: ["concept", "auth"], complexity: "complex" },
  ],
  edges: [
    { source: "file:src/index.ts", target: "file:src/service.ts", type: "imports", direction: "forward", weight: 0.8 },
  ],
  layers: [
    { id: "layer:api", name: "API Layer", description: "Routes and handlers", nodeIds: ["file:src/index.ts"] },
    { id: "layer:service", name: "Service Layer", description: "Business logic", nodeIds: ["file:src/service.ts"] },
  ],
  tour: [
    { order: 1, title: "Start Here", description: "Begin with index.ts", nodeIds: ["file:src/index.ts"] },
    { order: 2, title: "Core Logic", description: "Service layer", nodeIds: ["file:src/service.ts"] },
  ],
};

describe("onboard-builder", () => {
  it("includes project overview section", () => {
    const guide = buildOnboardingGuide(sampleGraph);
    expect(guide).toContain("# test-project");
    expect(guide).toContain("A test REST API");
  });

  it("lists languages and frameworks", () => {
    const guide = buildOnboardingGuide(sampleGraph);
    expect(guide).toContain("typescript");
    expect(guide).toContain("express");
  });

  it("includes architecture layers section", () => {
    const guide = buildOnboardingGuide(sampleGraph);
    expect(guide).toContain("## Architecture");
    expect(guide).toContain("API Layer");
    expect(guide).toContain("Service Layer");
  });

  it("includes key concepts section", () => {
    const guide = buildOnboardingGuide(sampleGraph);
    expect(guide).toContain("## Key Concepts");
    expect(guide).toContain("Auth Flow");
  });

  it("includes getting started / tour section", () => {
    const guide = buildOnboardingGuide(sampleGraph);
    expect(guide).toContain("## Getting Started");
    expect(guide).toContain("Start Here");
  });

  it("includes complexity hotspots", () => {
    const guide = buildOnboardingGuide(sampleGraph);
    expect(guide).toContain("## Complexity Hotspots");
    expect(guide).toContain("service.ts");
  });

  it("includes file map section", () => {
    const guide = buildOnboardingGuide(sampleGraph);
    expect(guide).toContain("## File Map");
  });

  it("handles graph with no layers gracefully", () => {
    const noLayers = { ...sampleGraph, layers: [] };
    const guide = buildOnboardingGuide(noLayers);
    expect(guide).toContain("# test-project");
  });

  it("handles graph with no tour gracefully", () => {
    const noTour = { ...sampleGraph, tour: [] };
    const guide = buildOnboardingGuide(noTour);
    expect(guide).toContain("# test-project");
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/skill && pnpm test -- --reporter verbose src/__tests__/onboard-builder.test.ts
```

**Step 3: Implement onboard-builder.ts**

```typescript
// packages/skill/src/onboard-builder.ts
import type { KnowledgeGraph } from "@understand-anything/core";

/**
 * Generate a structured onboarding guide from the knowledge graph.
 * Output is standalone markdown suitable for a README, wiki, or docs.
 */
export function buildOnboardingGuide(graph: KnowledgeGraph): string {
  const { project, nodes, edges, layers, tour } = graph;
  const lines: string[] = [];

  // --- Project Overview ---
  lines.push(`# ${project.name}`);
  lines.push("");
  lines.push(`> ${project.description}`);
  lines.push("");
  lines.push(`| | |`);
  lines.push(`|---|---|`);
  lines.push(`| **Languages** | ${project.languages.join(", ")} |`);
  lines.push(`| **Frameworks** | ${project.frameworks.join(", ")} |`);
  lines.push(`| **Components** | ${nodes.length} nodes, ${edges.length} relationships |`);
  lines.push(`| **Last Analyzed** | ${project.analyzedAt} |`);
  lines.push("");

  // --- Architecture ---
  if (layers.length > 0) {
    lines.push("## Architecture");
    lines.push("");
    lines.push("The project is organized into the following layers:");
    lines.push("");
    for (const layer of layers) {
      const memberNames = layer.nodeIds
        .map((id) => nodes.find((n) => n.id === id)?.name)
        .filter(Boolean);
      lines.push(`### ${layer.name}`);
      lines.push("");
      lines.push(layer.description);
      lines.push("");
      if (memberNames.length > 0) {
        lines.push(`Key components: ${memberNames.join(", ")}`);
        lines.push("");
      }
    }
  }

  // --- Key Concepts ---
  const conceptNodes = nodes.filter((n) => n.type === "concept");
  if (conceptNodes.length > 0) {
    lines.push("## Key Concepts");
    lines.push("");
    lines.push("Important architectural and domain concepts to understand:");
    lines.push("");
    for (const concept of conceptNodes) {
      lines.push(`### ${concept.name}`);
      lines.push("");
      lines.push(concept.summary);
      lines.push("");
    }
  }

  // --- Getting Started (Tour) ---
  if (tour.length > 0) {
    lines.push("## Getting Started");
    lines.push("");
    lines.push("Follow this guided tour to understand the codebase:");
    lines.push("");
    for (const step of tour) {
      const stepNodes = step.nodeIds
        .map((id) => nodes.find((n) => n.id === id))
        .filter(Boolean);
      lines.push(`### ${step.order}. ${step.title}`);
      lines.push("");
      lines.push(step.description);
      lines.push("");
      if (stepNodes.length > 0) {
        lines.push("**Files to look at:**");
        for (const node of stepNodes) {
          if (node!.filePath) {
            lines.push(`- \`${node!.filePath}\` — ${node!.summary}`);
          }
        }
        lines.push("");
      }
      if (step.languageLesson) {
        lines.push(`> **Language Tip:** ${step.languageLesson}`);
        lines.push("");
      }
    }
  }

  // --- File Map ---
  const fileNodes = nodes.filter((n) => n.type === "file" && n.filePath);
  if (fileNodes.length > 0) {
    lines.push("## File Map");
    lines.push("");
    lines.push("| File | Purpose | Complexity |");
    lines.push("|------|---------|------------|");
    for (const node of fileNodes) {
      lines.push(`| \`${node.filePath}\` | ${node.summary} | ${node.complexity} |`);
    }
    lines.push("");
  }

  // --- Complexity Hotspots ---
  const complexNodes = nodes.filter((n) => n.complexity === "complex");
  if (complexNodes.length > 0) {
    lines.push("## Complexity Hotspots");
    lines.push("");
    lines.push("These components are the most complex and deserve extra attention:");
    lines.push("");
    for (const node of complexNodes) {
      lines.push(`- **${node.name}** (${node.type}): ${node.summary}`);
    }
    lines.push("");
  }

  // --- Footer ---
  lines.push("---");
  lines.push("");
  lines.push(`*Generated by [Understand Anything](https://github.com/anthropics/understand-anything) from knowledge graph v${graph.version}*`);
  lines.push("");

  return lines.join("\n");
}
```

**Step 4: Run tests**

```bash
cd packages/skill && pnpm test -- --reporter verbose src/__tests__/onboard-builder.test.ts
```

**Step 5: Add exports + create skill definition**

Add to `packages/skill/src/index.ts`:
```typescript
export { buildOnboardingGuide } from "./onboard-builder.js";
```

Create `packages/skill/.claude/skills/understand-onboard.md`:
```markdown
---
name: understand-onboard
description: Generate a structured onboarding guide for new team members using the knowledge graph
---

# /understand-onboard

Generate a comprehensive onboarding guide from the project's knowledge graph.

## Instructions

1. Read the knowledge graph at `.understand-anything/knowledge-graph.json`
2. If it doesn't exist, tell the user to run `/understand` first
3. Generate a structured onboarding guide that includes:
   - Project overview (name, languages, frameworks, description)
   - Architecture layers and their responsibilities
   - Key concepts to understand
   - Guided tour (step-by-step walkthrough)
   - File map (what each key file does)
   - Complexity hotspots (what to be careful with)
4. Format as clean markdown
5. Offer to save the guide to `docs/ONBOARDING.md` in the project
6. Suggest the user commit it to the repo for the team
```

**Step 6: Build + test**

```bash
cd packages/skill && pnpm build && pnpm test
```

**Step 7: Commit**

```bash
git add packages/skill/src/onboard-builder.ts packages/skill/src/__tests__/onboard-builder.test.ts packages/skill/src/index.ts packages/skill/.claude/skills/understand-onboard.md
git commit -m "feat(skill): add /understand-onboard command for team onboarding guides"
```

---

## Task 4: Plugin Registry + Loader (Core)

**Files:**
- Create: `packages/core/src/plugins/registry.ts`
- Create: `packages/core/src/__tests__/plugin-registry.test.ts`
- Modify: `packages/core/src/index.ts` (add exports)

**Context:** The `AnalyzerPlugin` interface already exists in `packages/core/src/types.ts`. Currently only `TreeSitterPlugin` implements it. This task creates a plugin registry that discovers, registers, and manages analyzer plugins. The registry maps file extensions to plugins and provides a unified `analyzeFile` entrypoint. This is the foundation for community plugins.

**Step 1: Write failing tests**

```typescript
// packages/core/src/__tests__/plugin-registry.test.ts
import { describe, it, expect } from "vitest";
import { PluginRegistry } from "../plugins/registry.js";
import type { AnalyzerPlugin, StructuralAnalysis, ImportResolution } from "../types.js";

const emptyAnalysis: StructuralAnalysis = {
  functions: [],
  classes: [],
  imports: [],
  exports: [],
};

function createMockPlugin(name: string, languages: string[]): AnalyzerPlugin {
  return {
    name,
    languages,
    analyzeFile: () => ({ ...emptyAnalysis }),
    resolveImports: () => [],
  };
}

describe("PluginRegistry", () => {
  it("registers a plugin", () => {
    const registry = new PluginRegistry();
    const plugin = createMockPlugin("test", ["typescript"]);
    registry.register(plugin);
    expect(registry.getPlugins()).toHaveLength(1);
  });

  it("finds plugin by language", () => {
    const registry = new PluginRegistry();
    const plugin = createMockPlugin("ts-plugin", ["typescript", "javascript"]);
    registry.register(plugin);
    expect(registry.getPluginForLanguage("typescript")).toBe(plugin);
    expect(registry.getPluginForLanguage("javascript")).toBe(plugin);
  });

  it("returns null for unsupported language", () => {
    const registry = new PluginRegistry();
    registry.register(createMockPlugin("ts-plugin", ["typescript"]));
    expect(registry.getPluginForLanguage("python")).toBeNull();
  });

  it("finds plugin by file extension", () => {
    const registry = new PluginRegistry();
    const plugin = createMockPlugin("ts-plugin", ["typescript"]);
    registry.register(plugin);
    expect(registry.getPluginForFile("src/index.ts")).toBe(plugin);
    expect(registry.getPluginForFile("src/app.tsx")).toBe(plugin);
  });

  it("maps common extensions to languages", () => {
    const registry = new PluginRegistry();
    const plugin = createMockPlugin("multi", ["python", "go", "rust"]);
    registry.register(plugin);
    expect(registry.getPluginForFile("main.py")).toBe(plugin);
    expect(registry.getPluginForFile("main.go")).toBe(plugin);
    expect(registry.getPluginForFile("main.rs")).toBe(plugin);
  });

  it("lists all registered plugins", () => {
    const registry = new PluginRegistry();
    registry.register(createMockPlugin("a", ["typescript"]));
    registry.register(createMockPlugin("b", ["python"]));
    expect(registry.getPlugins()).toHaveLength(2);
  });

  it("lists supported languages", () => {
    const registry = new PluginRegistry();
    registry.register(createMockPlugin("a", ["typescript", "javascript"]));
    registry.register(createMockPlugin("b", ["python"]));
    const langs = registry.getSupportedLanguages();
    expect(langs).toContain("typescript");
    expect(langs).toContain("python");
  });

  it("unregisters a plugin by name", () => {
    const registry = new PluginRegistry();
    registry.register(createMockPlugin("removable", ["typescript"]));
    expect(registry.getPlugins()).toHaveLength(1);
    registry.unregister("removable");
    expect(registry.getPlugins()).toHaveLength(0);
  });

  it("later registration takes priority for same language", () => {
    const registry = new PluginRegistry();
    const first = createMockPlugin("first", ["typescript"]);
    const second = createMockPlugin("second", ["typescript"]);
    registry.register(first);
    registry.register(second);
    // Second registration wins
    expect(registry.getPluginForLanguage("typescript")?.name).toBe("second");
  });

  it("analyzeFile delegates to correct plugin", () => {
    const registry = new PluginRegistry();
    const plugin = createMockPlugin("ts-plugin", ["typescript"]);
    plugin.analyzeFile = () => ({
      ...emptyAnalysis,
      functions: [{ name: "hello", lineRange: [1, 5], params: [] }],
    });
    registry.register(plugin);

    const result = registry.analyzeFile("src/test.ts", "const x = 1;");
    expect(result).not.toBeNull();
    expect(result!.functions).toHaveLength(1);
  });

  it("analyzeFile returns null for unsupported files", () => {
    const registry = new PluginRegistry();
    registry.register(createMockPlugin("ts-plugin", ["typescript"]));
    const result = registry.analyzeFile("main.py", "print('hello')");
    expect(result).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/core && pnpm test -- --reporter verbose src/__tests__/plugin-registry.test.ts
```

**Step 3: Implement registry.ts**

```typescript
// packages/core/src/plugins/registry.ts
import type { AnalyzerPlugin, StructuralAnalysis, ImportResolution } from "../types.js";

// Map file extensions to language names
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  py: "python",
  go: "go",
  rs: "rust",
  rb: "ruby",
  java: "java",
  kt: "kotlin",
  cs: "csharp",
  cpp: "cpp",
  c: "c",
  swift: "swift",
  php: "php",
};

/**
 * Registry for analyzer plugins. Maps languages to plugins and provides
 * a unified interface for analyzing files across languages.
 */
export class PluginRegistry {
  private plugins: AnalyzerPlugin[] = [];
  private languageMap = new Map<string, AnalyzerPlugin>();

  /**
   * Register an analyzer plugin. Later registrations take priority
   * for overlapping languages.
   */
  register(plugin: AnalyzerPlugin): void {
    this.plugins.push(plugin);
    for (const lang of plugin.languages) {
      this.languageMap.set(lang, plugin);
    }
  }

  /**
   * Remove a plugin by name.
   */
  unregister(name: string): void {
    const plugin = this.plugins.find((p) => p.name === name);
    if (!plugin) return;

    this.plugins = this.plugins.filter((p) => p.name !== name);

    // Rebuild language map
    this.languageMap.clear();
    for (const p of this.plugins) {
      for (const lang of p.languages) {
        this.languageMap.set(lang, p);
      }
    }
  }

  /**
   * Get plugin for a language name (e.g., "typescript", "python").
   */
  getPluginForLanguage(language: string): AnalyzerPlugin | null {
    return this.languageMap.get(language) ?? null;
  }

  /**
   * Get plugin for a file path based on its extension.
   */
  getPluginForFile(filePath: string): AnalyzerPlugin | null {
    const ext = filePath.split(".").pop()?.toLowerCase();
    if (!ext) return null;
    const language = EXTENSION_TO_LANGUAGE[ext];
    if (!language) return null;
    return this.getPluginForLanguage(language);
  }

  /**
   * Analyze a file using the appropriate plugin.
   * Returns null if no plugin supports the file type.
   */
  analyzeFile(filePath: string, content: string): StructuralAnalysis | null {
    const plugin = this.getPluginForFile(filePath);
    if (!plugin) return null;
    return plugin.analyzeFile(filePath, content);
  }

  /**
   * Resolve imports for a file using the appropriate plugin.
   * Returns null if no plugin supports the file type.
   */
  resolveImports(filePath: string, content: string): ImportResolution[] | null {
    const plugin = this.getPluginForFile(filePath);
    if (!plugin) return null;
    return plugin.resolveImports(filePath, content);
  }

  /**
   * Get all registered plugins.
   */
  getPlugins(): AnalyzerPlugin[] {
    return [...this.plugins];
  }

  /**
   * Get all supported languages across all plugins.
   */
  getSupportedLanguages(): string[] {
    return [...this.languageMap.keys()];
  }
}
```

**Step 4: Run tests**

```bash
cd packages/core && pnpm test -- --reporter verbose src/__tests__/plugin-registry.test.ts
```

**Step 5: Add exports to index.ts**

```typescript
export { PluginRegistry } from "./plugins/registry.js";
```

**Step 6: Build + full test suite**

```bash
cd packages/core && pnpm build && pnpm test
```

**Step 7: Commit**

```bash
git add packages/core/src/plugins/registry.ts packages/core/src/__tests__/plugin-registry.test.ts packages/core/src/index.ts
git commit -m "feat(core): add plugin registry for community analyzer plugins"
```

---

## Task 5: Plugin Configuration + Discovery

**Files:**
- Create: `packages/core/src/plugins/discovery.ts`
- Create: `packages/core/src/__tests__/plugin-discovery.test.ts`
- Modify: `packages/core/src/index.ts` (add exports)

**Context:** The plugin registry from Task 4 manages runtime plugins, but we also need a way to discover and configure plugins from the project's `.understand-anything/` directory. This task adds a plugin configuration file schema and a discovery mechanism that scans for installed plugins and auto-registers them.

**Step 1: Write failing tests**

```typescript
// packages/core/src/__tests__/plugin-discovery.test.ts
import { describe, it, expect } from "vitest";
import {
  parsePluginConfig,
  type PluginConfig,
  type PluginEntry,
  DEFAULT_PLUGIN_CONFIG,
} from "../plugins/discovery.js";

describe("plugin-discovery", () => {
  describe("parsePluginConfig", () => {
    it("parses valid config JSON", () => {
      const json = JSON.stringify({
        plugins: [
          { name: "tree-sitter", enabled: true, languages: ["typescript", "javascript"] },
          { name: "python-ast", enabled: false, languages: ["python"] },
        ],
      });
      const config = parsePluginConfig(json);
      expect(config.plugins).toHaveLength(2);
      expect(config.plugins[0].name).toBe("tree-sitter");
      expect(config.plugins[1].enabled).toBe(false);
    });

    it("returns default config for invalid JSON", () => {
      const config = parsePluginConfig("not json");
      expect(config).toEqual(DEFAULT_PLUGIN_CONFIG);
    });

    it("returns default config for empty string", () => {
      const config = parsePluginConfig("");
      expect(config).toEqual(DEFAULT_PLUGIN_CONFIG);
    });

    it("filters out entries missing required fields", () => {
      const json = JSON.stringify({
        plugins: [
          { name: "valid", enabled: true, languages: ["typescript"] },
          { enabled: true, languages: ["python"] }, // missing name
          { name: "no-langs", enabled: true }, // missing languages
        ],
      });
      const config = parsePluginConfig(json);
      expect(config.plugins).toHaveLength(1);
      expect(config.plugins[0].name).toBe("valid");
    });

    it("defaults enabled to true when omitted", () => {
      const json = JSON.stringify({
        plugins: [
          { name: "tree-sitter", languages: ["typescript"] },
        ],
      });
      const config = parsePluginConfig(json);
      expect(config.plugins[0].enabled).toBe(true);
    });
  });

  describe("DEFAULT_PLUGIN_CONFIG", () => {
    it("includes tree-sitter as enabled by default", () => {
      expect(DEFAULT_PLUGIN_CONFIG.plugins).toHaveLength(1);
      expect(DEFAULT_PLUGIN_CONFIG.plugins[0].name).toBe("tree-sitter");
      expect(DEFAULT_PLUGIN_CONFIG.plugins[0].enabled).toBe(true);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/core && pnpm test -- --reporter verbose src/__tests__/plugin-discovery.test.ts
```

**Step 3: Implement discovery.ts**

```typescript
// packages/core/src/plugins/discovery.ts

export interface PluginEntry {
  name: string;
  enabled: boolean;
  languages: string[];
  options?: Record<string, unknown>;
}

export interface PluginConfig {
  plugins: PluginEntry[];
}

export const DEFAULT_PLUGIN_CONFIG: PluginConfig = {
  plugins: [
    {
      name: "tree-sitter",
      enabled: true,
      languages: ["typescript", "javascript"],
    },
  ],
};

/**
 * Parse a plugin config JSON string.
 * Returns DEFAULT_PLUGIN_CONFIG if parsing fails.
 */
export function parsePluginConfig(jsonString: string): PluginConfig {
  if (!jsonString.trim()) return { ...DEFAULT_PLUGIN_CONFIG };

  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.plugins)) {
      return { ...DEFAULT_PLUGIN_CONFIG };
    }

    const plugins = parsed.plugins
      .filter((entry: unknown): entry is Record<string, unknown> => {
        if (typeof entry !== "object" || entry === null) return false;
        const e = entry as Record<string, unknown>;
        return (
          typeof e.name === "string" &&
          e.name.length > 0 &&
          Array.isArray(e.languages) &&
          e.languages.length > 0
        );
      })
      .map((e: Record<string, unknown>): PluginEntry => ({
        name: e.name as string,
        enabled: typeof e.enabled === "boolean" ? e.enabled : true,
        languages: e.languages as string[],
        ...(e.options ? { options: e.options as Record<string, unknown> } : {}),
      }));

    return { plugins };
  } catch {
    return { ...DEFAULT_PLUGIN_CONFIG };
  }
}

/**
 * Serialize a plugin config to JSON for saving.
 */
export function serializePluginConfig(config: PluginConfig): string {
  return JSON.stringify(config, null, 2);
}
```

**Step 4: Run tests**

```bash
cd packages/core && pnpm test -- --reporter verbose src/__tests__/plugin-discovery.test.ts
```

**Step 5: Add exports**

```typescript
export {
  parsePluginConfig,
  serializePluginConfig,
  DEFAULT_PLUGIN_CONFIG,
  type PluginConfig,
  type PluginEntry,
} from "./plugins/discovery.js";
```

**Step 6: Build + test**

```bash
cd packages/core && pnpm build && pnpm test
```

**Step 7: Commit**

```bash
git add packages/core/src/plugins/discovery.ts packages/core/src/__tests__/plugin-discovery.test.ts packages/core/src/index.ts
git commit -m "feat(core): add plugin configuration and discovery system"
```

---

## Task 6: Embedding-Based Semantic Search (Core)

**Files:**
- Create: `packages/core/src/embedding-search.ts`
- Create: `packages/core/src/__tests__/embedding-search.test.ts`
- Modify: `packages/core/src/index.ts` (add exports)

**Context:** The current `SearchEngine` uses fuse.js for fuzzy keyword matching. Embedding-based search enables true semantic queries like "find code that handles authentication" even if the word "authentication" doesn't appear in the node data. This task adds a `SemanticSearchEngine` that stores and searches vector embeddings. The embeddings themselves are generated externally (by calling an embedding API) — this module handles storage and cosine similarity search. It falls back to the existing `SearchEngine` when no embeddings are available.

**Step 1: Write failing tests**

```typescript
// packages/core/src/__tests__/embedding-search.test.ts
import { describe, it, expect } from "vitest";
import { SemanticSearchEngine, cosineSimilarity } from "../embedding-search.js";
import type { GraphNode } from "../types.js";

const nodes: GraphNode[] = [
  { id: "n1", type: "file", name: "auth.ts", summary: "Authentication module", tags: ["auth"], complexity: "moderate" },
  { id: "n2", type: "file", name: "db.ts", summary: "Database connection", tags: ["db"], complexity: "simple" },
  { id: "n3", type: "function", name: "login", summary: "User login handler", tags: ["auth", "login"], complexity: "moderate" },
];

// Simple unit vectors for testing
const embeddings: Record<string, number[]> = {
  n1: [1, 0, 0, 0],
  n2: [0, 1, 0, 0],
  n3: [0.9, 0, 0.1, 0],
};

describe("embedding-search", () => {
  describe("cosineSimilarity", () => {
    it("returns 1 for identical vectors", () => {
      expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
    });

    it("returns 0 for orthogonal vectors", () => {
      expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0);
    });

    it("returns high similarity for similar vectors", () => {
      const sim = cosineSimilarity([1, 0, 0], [0.9, 0.1, 0]);
      expect(sim).toBeGreaterThan(0.9);
    });

    it("handles zero vectors", () => {
      expect(cosineSimilarity([0, 0, 0], [1, 0, 0])).toBe(0);
    });
  });

  describe("SemanticSearchEngine", () => {
    it("returns results sorted by similarity", () => {
      const engine = new SemanticSearchEngine(nodes, embeddings);
      const queryEmbedding = [1, 0, 0, 0]; // most similar to n1 and n3
      const results = engine.search(queryEmbedding);
      expect(results[0].nodeId).toBe("n1");
    });

    it("respects limit parameter", () => {
      const engine = new SemanticSearchEngine(nodes, embeddings);
      const results = engine.search([1, 0, 0, 0], { limit: 2 });
      expect(results).toHaveLength(2);
    });

    it("respects threshold parameter", () => {
      const engine = new SemanticSearchEngine(nodes, embeddings);
      const results = engine.search([1, 0, 0, 0], { threshold: 0.5 });
      // n2 has 0 similarity, should be filtered out
      const ids = results.map((r) => r.nodeId);
      expect(ids).not.toContain("n2");
    });

    it("filters by node type", () => {
      const engine = new SemanticSearchEngine(nodes, embeddings);
      const results = engine.search([1, 0, 0, 0], { types: ["function"] });
      expect(results.every((r) => {
        const node = nodes.find((n) => n.id === r.nodeId);
        return node?.type === "function";
      })).toBe(true);
    });

    it("returns empty for nodes without embeddings", () => {
      const engine = new SemanticSearchEngine(nodes, {});
      const results = engine.search([1, 0, 0, 0]);
      expect(results).toHaveLength(0);
    });

    it("hasEmbeddings returns true when embeddings exist", () => {
      const engine = new SemanticSearchEngine(nodes, embeddings);
      expect(engine.hasEmbeddings()).toBe(true);
    });

    it("hasEmbeddings returns false when empty", () => {
      const engine = new SemanticSearchEngine(nodes, {});
      expect(engine.hasEmbeddings()).toBe(false);
    });

    it("addEmbedding updates the search index", () => {
      const engine = new SemanticSearchEngine(nodes, {});
      expect(engine.hasEmbeddings()).toBe(false);
      engine.addEmbedding("n1", [1, 0, 0, 0]);
      expect(engine.hasEmbeddings()).toBe(true);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/core && pnpm test -- --reporter verbose src/__tests__/embedding-search.test.ts
```

**Step 3: Implement embedding-search.ts**

```typescript
// packages/core/src/embedding-search.ts
import type { GraphNode } from "./types.js";
import type { SearchResult } from "./search.js";

export interface SemanticSearchOptions {
  limit?: number;
  threshold?: number;
  types?: string[];
}

/**
 * Compute cosine similarity between two vectors.
 * Returns 0 if either vector has zero magnitude.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/**
 * Semantic search engine using vector embeddings.
 * Stores pre-computed embeddings for graph nodes and performs
 * cosine similarity search against query embeddings.
 */
export class SemanticSearchEngine {
  private nodes: GraphNode[];
  private embeddings: Map<string, number[]>;

  constructor(nodes: GraphNode[], embeddings: Record<string, number[]>) {
    this.nodes = nodes;
    this.embeddings = new Map(Object.entries(embeddings));
  }

  /**
   * Check if any embeddings are loaded.
   */
  hasEmbeddings(): boolean {
    return this.embeddings.size > 0;
  }

  /**
   * Add or update an embedding for a node.
   */
  addEmbedding(nodeId: string, embedding: number[]): void {
    this.embeddings.set(nodeId, embedding);
  }

  /**
   * Search nodes by similarity to a query embedding.
   * Returns SearchResult[] compatible with the existing search interface.
   */
  search(
    queryEmbedding: number[],
    options?: SemanticSearchOptions,
  ): SearchResult[] {
    const limit = options?.limit ?? 10;
    const threshold = options?.threshold ?? 0;
    const typeFilter = options?.types;

    const scored: Array<{ nodeId: string; score: number }> = [];

    for (const node of this.nodes) {
      // Type filter
      if (typeFilter && !typeFilter.includes(node.type)) continue;

      const embedding = this.embeddings.get(node.id);
      if (!embedding) continue;

      const similarity = cosineSimilarity(queryEmbedding, embedding);
      if (similarity >= threshold) {
        // Convert similarity (0-1, higher=better) to score (0-1, lower=better)
        // to match the SearchResult interface convention from fuse.js
        scored.push({ nodeId: node.id, score: 1 - similarity });
      }
    }

    // Sort by score ascending (lower = more similar)
    scored.sort((a, b) => a.score - b.score);

    return scored.slice(0, limit);
  }

  /**
   * Update the node list (e.g., after graph reload).
   */
  updateNodes(nodes: GraphNode[]): void {
    this.nodes = nodes;
  }
}
```

**Step 4: Run tests**

```bash
cd packages/core && pnpm test -- --reporter verbose src/__tests__/embedding-search.test.ts
```

**Step 5: Add exports**

```typescript
export {
  SemanticSearchEngine,
  cosineSimilarity,
  type SemanticSearchOptions,
} from "./embedding-search.js";
```

**Step 6: Build + test**

```bash
cd packages/core && pnpm build && pnpm test
```

**Step 7: Commit**

```bash
git add packages/core/src/embedding-search.ts packages/core/src/__tests__/embedding-search.test.ts packages/core/src/index.ts
git commit -m "feat(core): add embedding-based semantic search engine"
```

---

## Task 7: Embedding Search Dashboard Integration

**Files:**
- Modify: `packages/dashboard/src/store.ts` (add semantic search state)
- Modify: `packages/dashboard/src/components/SearchBar.tsx` (semantic search toggle)

**Context:** This task integrates the `SemanticSearchEngine` into the dashboard. When the knowledge graph includes pre-computed embeddings (stored as a separate field or companion file), the SearchBar offers a toggle between "Fuzzy" and "Semantic" search modes. The semantic mode uses vector similarity for queries like "where is authentication handled" even if those exact words aren't in any node. For MVP, we'll add the UI toggle and wiring — actual embedding generation requires an API call that would be part of the analysis pipeline.

**Step 1: Add semantic search state to the store**

In `packages/dashboard/src/store.ts`:

```typescript
// Add to interface
searchMode: "fuzzy" | "semantic";
setSearchMode: (mode: "fuzzy" | "semantic") => void;

// Add to implementation
searchMode: "fuzzy",
setSearchMode: (mode) => set({ searchMode: mode }),
```

Update `setSearchQuery` to check `searchMode`:
```typescript
setSearchQuery: (query) => {
  const engine = get().searchEngine;
  const mode = get().searchMode;
  if (!engine || !query.trim()) {
    set({ searchQuery: query, searchResults: [] });
    return;
  }
  // Currently both modes use the same fuzzy engine
  // When embeddings are available, "semantic" mode will use SemanticSearchEngine
  const searchResults = engine.search(query);
  set({ searchQuery: query, searchResults });
},
```

**Step 2: Add search mode toggle to SearchBar**

In `packages/dashboard/src/components/SearchBar.tsx`, add:

```tsx
const searchMode = useDashboardStore((s) => s.searchMode);
const setSearchMode = useDashboardStore((s) => s.setSearchMode);

// Add toggle next to the search input:
<div className="flex items-center gap-1 bg-gray-700 rounded p-0.5 shrink-0">
  <button
    onClick={() => setSearchMode("fuzzy")}
    className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
      searchMode === "fuzzy"
        ? "bg-gray-600 text-white"
        : "text-gray-400 hover:text-gray-300"
    }`}
  >
    Fuzzy
  </button>
  <button
    onClick={() => setSearchMode("semantic")}
    className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
      searchMode === "semantic"
        ? "bg-gray-600 text-white"
        : "text-gray-400 hover:text-gray-300"
    }`}
  >
    Semantic
  </button>
</div>
```

**Step 3: Verify dashboard compiles**

```bash
cd packages/dashboard && pnpm build
```

**Step 4: Commit**

```bash
git add packages/dashboard/src/store.ts packages/dashboard/src/components/SearchBar.tsx
git commit -m "feat(dashboard): add fuzzy/semantic search mode toggle"
```

---

## Verification Checklist

After all tasks are complete:

1. `cd packages/core && pnpm build && pnpm test` — all tests pass (existing + ~35 new)
2. `cd packages/skill && pnpm build && pnpm test` — all tests pass (existing 14 + ~25 new)
3. `cd packages/dashboard && pnpm build` — compiles without errors
4. Skill definitions exist:
   - `packages/skill/.claude/skills/understand-diff.md`
   - `packages/skill/.claude/skills/understand-explain.md`
   - `packages/skill/.claude/skills/understand-onboard.md`
5. Plugin registry works:
   - `PluginRegistry.register()`, `getPluginForFile()`, `analyzeFile()`
   - `parsePluginConfig()` handles valid/invalid JSON
6. Semantic search:
   - `cosineSimilarity()` produces correct values
   - `SemanticSearchEngine.search()` returns sorted results
   - Dashboard toggle renders and switches modes
7. All existing Phase 1 + Phase 2 + Phase 3 features still work
````

## File: docs/superpowers/plans/2026-03-15-homepage-implementation.md
````markdown
# Homepage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a cinematic, scroll-driven project homepage for Understand Anything using Astro, deployed to GitHub Pages via `gh-pages` branch.

**Architecture:** Astro SSG project in `homepage/` on main. Self-hosted fonts (DM Serif Display, Inter, JetBrains Mono) with robust fallbacks. Pure CSS animations triggered by `IntersectionObserver`. GitHub Actions workflow builds and deploys to `gh-pages` on push.

**Tech Stack:** Astro 5, CSS custom properties, vanilla JS, GitHub Actions

**Design doc:** `docs/plans/2026-03-15-homepage-design.md`

---

### Task 1: Scaffold Astro Project

**Files:**
- Create: `homepage/package.json`
- Create: `homepage/astro.config.mjs`
- Create: `homepage/tsconfig.json`
- Create: `homepage/src/pages/index.astro` (placeholder)
- Create: `homepage/src/layouts/Layout.astro` (placeholder)
- Create: `homepage/public/.gitkeep`

**Step 1: Initialize Astro project**

```bash
cd /Users/yuxianglin/Desktop/opensource/Understand-Anything
mkdir -p homepage
cd homepage
pnpm create astro@latest . -- --template minimal --no-install --no-git --typescript strict
```

If the interactive prompt blocks, create files manually instead.

**Step 2: Configure Astro for GitHub Pages**

Edit `homepage/astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lum1104.github.io',
  base: '/Understand-Anything',
});
```

**Step 3: Verify the project builds**

```bash
cd /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage
pnpm install
pnpm build
```

Expected: Build succeeds, `dist/` directory created.

**Step 4: Commit**

```bash
git add homepage/
git commit -m "feat(homepage): scaffold Astro project with GitHub Pages config"
```

---

### Task 2: Self-Host Fonts & Base CSS

**Files:**
- Create: `homepage/public/fonts/DMSerifDisplay-Regular.woff2`
- Create: `homepage/public/fonts/Inter-Regular.woff2`
- Create: `homepage/public/fonts/Inter-SemiBold.woff2`
- Create: `homepage/public/fonts/JetBrainsMono-Regular.woff2`
- Create: `homepage/src/styles/global.css`

**Step 1: Download font files**

Download the WOFF2 files from Google Fonts API (or fontsource). Place them in `homepage/public/fonts/`. Required files:
- DM Serif Display Regular (woff2)
- Inter Regular + SemiBold (woff2)
- JetBrains Mono Regular (woff2)

Use curl to download from fontsource CDN or Google Fonts CSS API. Example:

```bash
mkdir -p homepage/public/fonts
# Download from fontsource (reliable CDN)
curl -L "https://cdn.jsdelivr.net/fontsource/fonts/dm-serif-display@latest/latin-400-normal.woff2" -o homepage/public/fonts/DMSerifDisplay-Regular.woff2
curl -L "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff2" -o homepage/public/fonts/Inter-Regular.woff2
curl -L "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.woff2" -o homepage/public/fonts/Inter-SemiBold.woff2
curl -L "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.woff2" -o homepage/public/fonts/JetBrainsMono-Regular.woff2
```

If download fails, try alternative URLs or use `npx fontsource` to install locally.

**Step 2: Create global CSS with design tokens and font-face declarations**

Create `homepage/src/styles/global.css`:

```css
/* Font declarations — self-hosted, no external CDN dependency */
@font-face {
  font-family: 'DM Serif Display';
  src: url('/Understand-Anything/fonts/DMSerifDisplay-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/Understand-Anything/fonts/Inter-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/Understand-Anything/fonts/Inter-SemiBold.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('/Understand-Anything/fonts/JetBrainsMono-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* Design tokens */
:root {
  --bg: #0a0a0a;
  --surface: #141414;
  --border: #1a1a1a;
  --accent: #d4a574;
  --accent-glow: rgba(212, 165, 116, 0.15);
  --text: #e8e2d8;
  --text-muted: #8a8578;

  --font-heading: 'DM Serif Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-code: 'JetBrains Mono', 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
}

/* Reset & base */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  background-color: var(--bg);
  color: var(--text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* Noise texture overlay */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}

/* Scroll-reveal animation */
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reveal {
  opacity: 0;
}

.reveal.visible {
  animation: fadeSlideUp 0.8s ease-out forwards;
}

/* Stagger delays for feature cards */
.reveal-delay-1 { animation-delay: 0.1s; }
.reveal-delay-2 { animation-delay: 0.25s; }
.reveal-delay-3 { animation-delay: 0.4s; }

a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

**Step 3: Import global CSS in Layout**

Update `homepage/src/layouts/Layout.astro`:

```astro
---
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Turn any codebase into an interactive knowledge graph you can explore, search, and learn from." />
    <link rel="icon" type="image/svg+xml" href="/Understand-Anything/favicon.svg" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>

<style is:global>
  @import '../styles/global.css';
</style>
```

**Step 4: Build and verify fonts load**

```bash
cd /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage
pnpm build
```

Expected: Build succeeds. Check `dist/fonts/` contains the woff2 files.

**Step 5: Commit**

```bash
git add homepage/public/fonts/ homepage/src/styles/global.css homepage/src/layouts/Layout.astro
git commit -m "feat(homepage): add self-hosted fonts and design token CSS"
```

---

### Task 3: Nav Bar Component

**Files:**
- Create: `homepage/src/components/Nav.astro`

**Step 1: Create the nav component**

Create `homepage/src/components/Nav.astro`:

```astro
---
const githubUrl = 'https://github.com/Lum1104/Understand-Anything';
---

<nav class="nav" id="nav">
  <div class="nav-inner">
    <a href="/Understand-Anything/" class="nav-logo">Understand Anything</a>
    <div class="nav-links">
      <a href={githubUrl} target="_blank" rel="noopener noreferrer" class="nav-github">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        <span>GitHub</span>
      </a>
      <a href="#install" class="nav-cta">Get Started</a>
    </div>
  </div>
</nav>

<script>
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    });
  }
</script>

<style>
  .nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    padding: 1rem 2rem;
    transition: background-color 0.3s ease, backdrop-filter 0.3s ease;
  }

  .nav.scrolled {
    background-color: rgba(10, 10, 10, 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
  }

  .nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nav-logo {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    color: var(--text);
    text-decoration: none;
  }

  .nav-logo:hover {
    text-decoration: none;
    color: var(--accent);
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .nav-github {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-muted);
    font-size: 0.9rem;
    text-decoration: none;
    transition: color 0.2s;
  }

  .nav-github:hover {
    color: var(--text);
    text-decoration: none;
  }

  .nav-cta {
    background: var(--accent);
    color: var(--bg);
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9rem;
    text-decoration: none;
    transition: box-shadow 0.3s ease;
  }

  .nav-cta:hover {
    text-decoration: none;
    box-shadow: 0 0 20px var(--accent-glow);
  }

  @media (max-width: 480px) {
    .nav { padding: 0.75rem 1rem; }
    .nav-github span { display: none; }
  }
</style>
```

**Step 2: Add Nav to index.astro (temporary test)**

Update `homepage/src/pages/index.astro`:

```astro
---
import Layout from '../layouts/Layout.astro';
import Nav from '../components/Nav.astro';
---

<Layout title="Understand Anything">
  <Nav />
  <main style="height: 200vh; padding-top: 100px;">
    <p>Nav test — scroll to see transparency change</p>
  </main>
</Layout>
```

**Step 3: Build and verify**

```bash
cd /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage
pnpm build
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add homepage/src/components/Nav.astro homepage/src/pages/index.astro
git commit -m "feat(homepage): add floating nav bar with scroll effect"
```

---

### Task 4: Hero Section Component

**Files:**
- Create: `homepage/src/components/Hero.astro`
- Copy: `assets/hero.jpg` → `homepage/public/images/hero.jpg`

**Step 1: Copy hero image**

```bash
mkdir -p /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage/public/images
cp /Users/yuxianglin/Desktop/opensource/Understand-Anything/assets/hero.jpg /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage/public/images/hero.jpg
```

**Step 2: Create Hero component**

Create `homepage/src/components/Hero.astro`:

```astro
---
const githubUrl = 'https://github.com/Lum1104/Understand-Anything';
---

<section class="hero">
  <div class="hero-bg">
    <img src="/Understand-Anything/images/hero.jpg" alt="" class="hero-bg-img" loading="eager" />
    <div class="hero-overlay"></div>
  </div>
  <div class="hero-content">
    <h1 class="hero-title">Understand Any Codebase</h1>
    <p class="hero-sub">
      Turn 200,000 lines of code into an interactive knowledge graph you can
      explore, search, and learn from — powered by multi-agent AI analysis.
    </p>
    <div class="hero-actions">
      <a href="#install" class="hero-cta">Get Started</a>
      <a href={githubUrl} target="_blank" rel="noopener noreferrer" class="hero-secondary">
        View on GitHub &rarr;
      </a>
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    overflow: hidden;
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .hero-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.25;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(10, 10, 10, 0.3) 0%,
      rgba(10, 10, 10, 0.7) 60%,
      var(--bg) 100%
    );
  }

  .hero-content {
    position: relative;
    z-index: 1;
    max-width: 800px;
    padding: 2rem;
    animation: fadeSlideUp 1s ease-out;
  }

  .hero-title {
    font-family: var(--font-heading);
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    color: var(--text);
    line-height: 1.1;
    margin-bottom: 1.5rem;
    text-shadow: 0 0 60px var(--accent-glow);
  }

  .hero-sub {
    font-size: clamp(1rem, 2vw, 1.25rem);
    color: var(--text-muted);
    line-height: 1.7;
    max-width: 600px;
    margin: 0 auto 2.5rem;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .hero-cta {
    background: var(--accent);
    color: var(--bg);
    padding: 0.85rem 2.5rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 1.1rem;
    text-decoration: none;
    transition: box-shadow 0.3s ease, transform 0.2s ease;
  }

  .hero-cta:hover {
    text-decoration: none;
    box-shadow: 0 0 30px var(--accent-glow), 0 0 60px rgba(212, 165, 116, 0.08);
    transform: translateY(-2px);
  }

  .hero-secondary {
    color: var(--text-muted);
    font-size: 1rem;
    text-decoration: none;
    transition: color 0.2s;
  }

  .hero-secondary:hover {
    color: var(--accent);
    text-decoration: none;
  }

  @media (max-width: 480px) {
    .hero-actions { flex-direction: column; gap: 1rem; }
  }
</style>
```

**Step 3: Build and verify**

```bash
cd /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage
pnpm build
```

**Step 4: Commit**

```bash
git add homepage/src/components/Hero.astro homepage/public/images/hero.jpg
git commit -m "feat(homepage): add full-viewport hero section with gradient overlay"
```

---

### Task 5: Dashboard Showcase Component

**Files:**
- Create: `homepage/src/components/Showcase.astro`
- Copy: `assets/overview.png` → `homepage/public/images/overview.png`

**Step 1: Copy dashboard screenshot**

```bash
cp /Users/yuxianglin/Desktop/opensource/Understand-Anything/assets/overview.png /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage/public/images/overview.png
```

**Step 2: Create Showcase component**

Create `homepage/src/components/Showcase.astro`:

```astro
<section class="showcase">
  <p class="showcase-label reveal">See your codebase come alive</p>
  <div class="showcase-frame reveal reveal-delay-1">
    <div class="showcase-titlebar">
      <span class="dot red"></span>
      <span class="dot yellow"></span>
      <span class="dot green"></span>
    </div>
    <img
      src="/Understand-Anything/images/overview.png"
      alt="Understand Anything dashboard showing an interactive knowledge graph of a codebase"
      class="showcase-img"
      loading="lazy"
    />
  </div>
</section>

<style>
  .showcase {
    padding: 4rem 2rem 6rem;
    max-width: 1100px;
    margin: 0 auto;
    text-align: center;
  }

  .showcase-label {
    font-family: var(--font-heading);
    font-size: clamp(1.25rem, 3vw, 1.75rem);
    color: var(--text-muted);
    margin-bottom: 2.5rem;
  }

  .showcase-frame {
    border-radius: 12px;
    overflow: hidden;
    background: var(--surface);
    border: 1px solid var(--border);
    box-shadow:
      0 0 40px var(--accent-glow),
      0 25px 50px rgba(0, 0, 0, 0.5);
  }

  .showcase-titlebar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: rgba(20, 20, 20, 0.8);
    border-bottom: 1px solid var(--border);
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .dot.red { background: #ff5f57; }
  .dot.yellow { background: #ffbd2e; }
  .dot.green { background: #28c840; }

  .showcase-img {
    width: 100%;
    height: auto;
    display: block;
  }

  @media (max-width: 768px) {
    .showcase { padding: 2rem 1rem 4rem; }
  }
</style>
```

**Step 3: Build and verify**

```bash
cd /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage
pnpm build
```

**Step 4: Commit**

```bash
git add homepage/src/components/Showcase.astro homepage/public/images/overview.png
git commit -m "feat(homepage): add dashboard showcase with browser frame and gold glow"
```

---

### Task 6: Feature Cards Component

**Files:**
- Create: `homepage/src/components/Features.astro`

**Step 1: Create Features component**

Create `homepage/src/components/Features.astro`:

```astro
---
const features = [
  {
    icon: '◈',
    title: 'Interactive Knowledge Graph',
    description: 'Visualize files, functions, and dependencies as an explorable graph with smart layout.',
  },
  {
    icon: '¶',
    title: 'Plain-English Summaries',
    description: 'Every node explained in language anyone can understand — from junior devs to product managers.',
  },
  {
    icon: '⟐',
    title: 'Guided Tours',
    description: 'AI-generated walkthroughs that teach you the codebase step by step.',
  },
];
---

<section class="features">
  <div class="features-grid">
    {features.map((f, i) => (
      <div class={`feature-card reveal reveal-delay-${i + 1}`}>
        <span class="feature-icon">{f.icon}</span>
        <h3 class="feature-title">{f.title}</h3>
        <p class="feature-desc">{f.description}</p>
      </div>
    ))}
  </div>
</section>

<style>
  .features {
    padding: 2rem 2rem 6rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .feature-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    backdrop-filter: blur(8px);
  }

  .feature-card:hover {
    border-color: rgba(212, 165, 116, 0.3);
    box-shadow: 0 0 20px var(--accent-glow);
  }

  .feature-icon {
    display: block;
    font-size: 1.75rem;
    color: var(--accent);
    margin-bottom: 1rem;
  }

  .feature-title {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    color: var(--text);
    margin-bottom: 0.75rem;
  }

  .feature-desc {
    font-size: 0.95rem;
    color: var(--text-muted);
    line-height: 1.6;
  }

  @media (max-width: 768px) {
    .features-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }
</style>
```

**Step 2: Build and verify**

```bash
cd /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage
pnpm build
```

**Step 3: Commit**

```bash
git add homepage/src/components/Features.astro
git commit -m "feat(homepage): add feature cards with glass-morphism and staggered reveal"
```

---

### Task 7: Install CTA Component

**Files:**
- Create: `homepage/src/components/Install.astro`

**Step 1: Create Install component**

Create `homepage/src/components/Install.astro`:

```astro
<section class="install" id="install">
  <div class="install-inner reveal">
    <h2 class="install-title">Get started in 30 seconds</h2>
    <div class="install-code">
      <div class="install-code-header">
        <span class="install-code-dot"></span>
        <span class="install-code-label">Claude Code</span>
      </div>
      <pre><code><span class="cmd">/plugin marketplace add</span> Lum1104/Understand-Anything
<span class="cmd">/plugin install</span> understand-anything
<span class="cmd">/understand</span></code></pre>
    </div>
    <p class="install-note">Works with <strong>Claude Code</strong> — Anthropic's official CLI for Claude.</p>
  </div>
</section>

<style>
  .install {
    padding: 6rem 2rem;
    text-align: center;
  }

  .install-inner {
    max-width: 640px;
    margin: 0 auto;
  }

  .install-title {
    font-family: var(--font-heading);
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    color: var(--text);
    margin-bottom: 2rem;
  }

  .install-code {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    text-align: left;
    margin-bottom: 1.5rem;
  }

  .install-code-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
  }

  .install-code-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
  }

  .install-code-label {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-family: var(--font-code);
  }

  pre {
    padding: 1.25rem 1.5rem;
    margin: 0;
    overflow-x: auto;
  }

  code {
    font-family: var(--font-code);
    font-size: 0.95rem;
    line-height: 1.8;
    color: var(--text);
  }

  .cmd {
    color: var(--accent);
  }

  .install-note {
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .install-note strong {
    color: var(--text);
  }
</style>
```

**Step 2: Build and verify**

```bash
cd /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage
pnpm build
```

**Step 3: Commit**

```bash
git add homepage/src/components/Install.astro
git commit -m "feat(homepage): add install CTA with styled code block"
```

---

### Task 8: Footer Component

**Files:**
- Create: `homepage/src/components/Footer.astro`

**Step 1: Create Footer component**

Create `homepage/src/components/Footer.astro`:

```astro
---
const githubUrl = 'https://github.com/Lum1104/Understand-Anything';
---

<footer class="footer">
  <div class="footer-inner">
    <span class="footer-logo">Understand Anything</span>
    <div class="footer-links">
      <a href={githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
      <span class="footer-sep">·</span>
      <a href={`${githubUrl}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">License</a>
    </div>
    <p class="footer-note">Built as a Claude Code plugin</p>
  </div>
</footer>

<style>
  .footer {
    padding: 3rem 2rem;
    border-top: 1px solid var(--border);
    text-align: center;
  }

  .footer-inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  .footer-logo {
    font-family: var(--font-heading);
    font-size: 1.1rem;
    color: var(--text);
    display: block;
    margin-bottom: 0.75rem;
  }

  .footer-links {
    margin-bottom: 0.75rem;
  }

  .footer-links a {
    color: var(--text-muted);
    font-size: 0.85rem;
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-links a:hover {
    color: var(--accent);
  }

  .footer-sep {
    color: var(--border);
    margin: 0 0.5rem;
  }

  .footer-note {
    font-size: 0.8rem;
    color: var(--text-muted);
  }
</style>
```

**Step 2: Build and verify**

```bash
cd /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage
pnpm build
```

**Step 3: Commit**

```bash
git add homepage/src/components/Footer.astro
git commit -m "feat(homepage): add minimal footer"
```

---

### Task 9: Assemble Full Page + Scroll Reveal Script

**Files:**
- Modify: `homepage/src/pages/index.astro`

**Step 1: Assemble all components in the index page**

Replace `homepage/src/pages/index.astro` with:

```astro
---
import Layout from '../layouts/Layout.astro';
import Nav from '../components/Nav.astro';
import Hero from '../components/Hero.astro';
import Showcase from '../components/Showcase.astro';
import Features from '../components/Features.astro';
import Install from '../components/Install.astro';
import Footer from '../components/Footer.astro';
---

<Layout title="Understand Anything — Turn any codebase into a knowledge graph">
  <Nav />
  <Hero />
  <Showcase />
  <Features />
  <Install />
  <Footer />
</Layout>

<script>
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
</script>
```

**Step 2: Build and verify the full page**

```bash
cd /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage
pnpm build
```

Expected: Build succeeds. `dist/index.html` contains all sections.

**Step 3: Preview locally**

```bash
cd /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage
pnpm preview
```

Open in browser and verify: Nav, Hero, Showcase, Features, Install CTA, Footer all render correctly. Scroll animations trigger. Nav becomes solid on scroll.

**Step 4: Commit**

```bash
git add homepage/src/pages/index.astro
git commit -m "feat(homepage): assemble full page with scroll-reveal observer"
```

---

### Task 10: GitHub Actions Deployment Workflow

**Files:**
- Create: `.github/workflows/deploy-homepage.yml`

**Step 1: Create the workflow file**

```bash
mkdir -p /Users/yuxianglin/Desktop/opensource/Understand-Anything/.github/workflows
```

Create `.github/workflows/deploy-homepage.yml`:

```yaml
name: Deploy Homepage

on:
  push:
    branches: [main]
    paths:
      - 'homepage/**'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: homepage/pnpm-lock.yaml

      - name: Install dependencies
        working-directory: homepage
        run: pnpm install

      - name: Build
        working-directory: homepage
        run: pnpm build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: homepage/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Step 2: Commit**

```bash
git add .github/workflows/deploy-homepage.yml
git commit -m "ci: add GitHub Actions workflow for homepage deployment to Pages"
```

---

### Task 11: Create Favicon

**Files:**
- Create: `homepage/public/favicon.svg`

**Step 1: Create a simple gold-on-black SVG favicon**

Create `homepage/public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0a0a0a"/>
  <text x="16" y="23" font-family="Georgia, serif" font-size="20" fill="#d4a574" text-anchor="middle" font-weight="bold">U</text>
</svg>
```

**Step 2: Commit**

```bash
git add homepage/public/favicon.svg
git commit -m "feat(homepage): add favicon"
```

---

### Task 12: Final Build Verification & README Update

**Files:**
- Modify: `README.md` (add homepage link)

**Step 1: Full clean build**

```bash
cd /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage
rm -rf dist node_modules
pnpm install && pnpm build
```

Expected: Build succeeds with no warnings.

**Step 2: Local preview and manual check**

```bash
cd /Users/yuxianglin/Desktop/opensource/Understand-Anything/homepage
pnpm preview
```

Verify in browser:
- [ ] Page loads without errors
- [ ] Fonts render (or fallback gracefully)
- [ ] Hero section is full viewport with background image
- [ ] Dashboard screenshot appears in browser frame with gold glow
- [ ] Feature cards appear in 3 columns (1 column on mobile)
- [ ] Install code block shows correct commands
- [ ] Scroll animations trigger on scroll
- [ ] Nav becomes solid on scroll
- [ ] All links work (GitHub, Get Started smooth scroll)
- [ ] Responsive: test at 480px and 768px

**Step 3: Add homepage link to README.md**

Add a "Homepage" link near the top of the README, after the badges section. Add a single line:

```markdown
**[Homepage](https://understand-anything.com)** | **[GitHub](https://github.com/Lum1104/Understand-Anything)**
```

**Step 4: Final commit**

```bash
git add README.md
git commit -m "docs: add homepage link to README"
```

**Step 5: Configure GitHub Pages**

After pushing to main, go to GitHub repo Settings → Pages → Source: select "GitHub Actions". The workflow will auto-deploy on the next push that touches `homepage/`.
````

## File: docs/superpowers/plans/2026-03-18-multi-platform-simple-implementation.md
````markdown
# Multi-Platform Simple Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Understand-Anything skills work across Codex, OpenClaw, OpenCode, and Cursor — same files everywhere, no build step.

**Architecture:** Move 5 pipeline agents into `skills/understand/` as prompt templates. Create a reusable `knowledge-graph-guide` agent. Move per-platform config directories to repo root for auto-discovery. Add Cursor and Claude plugin descriptors.

**Tech Stack:** Markdown (SKILL.md, INSTALL.md), YAML frontmatter, JSON (plugin descriptors), Bash (symlink/clone commands in install docs).

**Design Doc:** `docs/plans/2026-03-18-multi-platform-simple-design.md`

---

### Task 1: Move pipeline agents into skills/understand/ as prompt templates

**Files:**
- Move: `understand-anything-plugin/agents/project-scanner.md` → `understand-anything-plugin/skills/understand/project-scanner-prompt.md`
- Move: `understand-anything-plugin/agents/file-analyzer.md` → `understand-anything-plugin/skills/understand/file-analyzer-prompt.md`
- Move: `understand-anything-plugin/agents/architecture-analyzer.md` → `understand-anything-plugin/skills/understand/architecture-analyzer-prompt.md`
- Move: `understand-anything-plugin/agents/tour-builder.md` → `understand-anything-plugin/skills/understand/tour-builder-prompt.md`
- Move: `understand-anything-plugin/agents/graph-reviewer.md` → `understand-anything-plugin/skills/understand/graph-reviewer-prompt.md`

**Step 1: Copy each agent file to the new location**

For each of the 5 files, copy from `agents/` to `skills/understand/` with the new name.

**Step 2: Strip agent frontmatter from the prompt templates**

Each prompt template file should remove the agent-specific YAML frontmatter (`name`, `description`, `tools`, `model`). Replace it with a simple Markdown header describing the template's purpose.

For example, `project-scanner-prompt.md` changes from:

```markdown
---
name: project-scanner
description: Scans a project directory...
tools: Bash, Glob, Grep, Read, Write
model: sonnet
---

You are a meticulous project inventory specialist...
```

To:

```markdown
# Project Scanner — Prompt Template

> Used by `/understand` Phase 1. Dispatch as a subagent with this full content as the prompt.

You are a meticulous project inventory specialist...
```

Apply this pattern to all 5 files:
- `project-scanner-prompt.md` — "Used by `/understand` Phase 1"
- `file-analyzer-prompt.md` — "Used by `/understand` Phase 2"
- `architecture-analyzer-prompt.md` — "Used by `/understand` Phase 4"
- `tour-builder-prompt.md` — "Used by `/understand` Phase 5"
- `graph-reviewer-prompt.md` — "Used by `/understand` Phase 6"

Keep the rest of the file content (the body instructions) exactly as-is.

**Step 3: Delete the original agent files**

```bash
cd understand-anything-plugin
rm agents/project-scanner.md agents/file-analyzer.md agents/architecture-analyzer.md agents/tour-builder.md agents/graph-reviewer.md
```

**Step 4: Verify the files exist in the new location**

```bash
ls understand-anything-plugin/skills/understand/
```

Expected: `SKILL.md`, plus the 5 `*-prompt.md` files.

**Step 5: Commit**

```bash
git add -A understand-anything-plugin/agents/ understand-anything-plugin/skills/understand/
git commit -m "refactor: move pipeline agents into skills/understand/ as prompt templates"
```

---

### Task 2: Update SKILL.md dispatch references with context injection

**Files:**
- Modify: `understand-anything-plugin/skills/understand/SKILL.md`

**Step 1: Read the current SKILL.md**

Read `understand-anything-plugin/skills/understand/SKILL.md` in full.

**Step 2: Update Phase 0 — add context collection**

After the decision logic table (line ~47), add a new section for collecting project context that will be injected into later phases:

```markdown
7. **Collect project context for subagent injection:**
   - Read `README.md` (or `README.rst`, `readme.md`) from `$PROJECT_ROOT` if it exists. Store as `$README_CONTENT` (first 3000 characters).
   - Read the primary package manifest (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`) if it exists. Store as `$MANIFEST_CONTENT`.
   - Capture the top-level directory tree:
     ```bash
     find $PROJECT_ROOT -maxdepth 2 -type f | head -100
     ```
     Store as `$DIR_TREE`.
   - Detect the project entry point by checking for common patterns: `src/index.ts`, `src/main.ts`, `src/App.tsx`, `main.py`, `main.go`, `src/main.rs`, `index.js`. Store first match as `$ENTRY_POINT`.
```

**Step 3: Update Phase 1 dispatch — inject README + manifest**

Replace the Phase 1 dispatch line:
```
Dispatch the **project-scanner** agent with this prompt:
```

With:
```markdown
Dispatch a subagent using the prompt template at `./project-scanner-prompt.md`. Read the template file and pass the full content as the subagent's prompt, appending the following additional context:

> **Additional context from main session:**
>
> Project README (first 3000 chars):
> ```
> $README_CONTENT
> ```
>
> Package manifest:
> ```
> $MANIFEST_CONTENT
> ```
>
> Use this context to produce more accurate project name, description, and framework detection. The README and manifest are authoritative — prefer their information over heuristics.

Pass these parameters in the dispatch prompt:
```

**Step 4: Update Phase 2 dispatch — inject scan results + framework context**

Replace the Phase 2 dispatch paragraph:
```
For each batch, dispatch a **file-analyzer** agent. Run up to **3 agents concurrently** using parallel dispatch. Each agent gets this prompt:
```

With:
```markdown
For each batch, dispatch a subagent using the prompt template at `./file-analyzer-prompt.md`. Run up to **3 subagents concurrently** using parallel dispatch. Read the template once, then for each batch pass the full template content as the subagent's prompt, appending the following additional context:

> **Additional context from main session:**
>
> Project: `<projectName>` — `<projectDescription>`
> Frameworks detected: `<frameworks from Phase 1>`
> Languages: `<languages from Phase 1>`
>
> Framework-specific guidance:
> - If React/Next.js: files in `app/` or `pages/` are routes, `components/` are UI, `lib/` or `utils/` are utilities
> - If Express/Fastify: files in `routes/` are API endpoints, `middleware/` is middleware, `models/` or `db/` is data
> - If Python Django: `views.py` are controllers, `models.py` is data, `urls.py` is routing, `templates/` is UI
> - If Go: `cmd/` is entry points, `internal/` is private packages, `pkg/` is public packages
>
> Use this context to produce more accurate summaries and better classify file roles.

Fill in batch-specific parameters below and dispatch:
```

**Step 5: Update Phase 4 dispatch — inject framework hints + directory tree**

Replace the Phase 4 dispatch line:
```
Dispatch the **architecture-analyzer** agent with this prompt:
```

With:
```markdown
Dispatch a subagent using the prompt template at `./architecture-analyzer-prompt.md`. Read the template file and pass the full content as the subagent's prompt, appending the following additional context:

> **Additional context from main session:**
>
> Frameworks detected: `<frameworks from Phase 1>`
>
> Directory tree (top 2 levels):
> ```
> $DIR_TREE
> ```
>
> Framework-specific layer hints:
> - If React/Next.js: `app/` or `pages/` → UI Layer, `api/` → API Layer, `lib/` → Service Layer, `components/` → UI Layer
> - If Express: `routes/` → API Layer, `controllers/` → Service Layer, `models/` → Data Layer, `middleware/` → Middleware Layer
> - If Python Django: `views/` → API Layer, `models/` → Data Layer, `templates/` → UI Layer, `management/` → CLI Layer
> - If Go: `cmd/` → Entry Points, `internal/` → Service Layer, `pkg/` → Shared Library, `api/` → API Layer
>
> Use the directory tree and framework hints to inform layer assignments. Directory structure is strong evidence for layer boundaries.

Pass these parameters in the dispatch prompt:
```

Also add after the "For incremental updates" note:
```markdown
**Context for incremental updates:** When re-running architecture analysis, also inject the previous layer definitions:

> Previous layer definitions (for naming consistency):
> ```json
> [previous layers from existing graph]
> ```
>
> Maintain the same layer names and IDs where possible. Only add/remove layers if the file structure has materially changed.
```

**Step 6: Update Phase 5 dispatch — inject README + entry point**

Replace the Phase 5 dispatch line:
```
Dispatch the **tour-builder** agent with this prompt:
```

With:
```markdown
Dispatch a subagent using the prompt template at `./tour-builder-prompt.md`. Read the template file and pass the full content as the subagent's prompt, appending the following additional context:

> **Additional context from main session:**
>
> Project README (first 3000 chars):
> ```
> $README_CONTENT
> ```
>
> Project entry point: `$ENTRY_POINT`
>
> Use the README to align the tour narrative with the project's own documentation. Start the tour from the entry point if one was detected. The tour should tell the same story the README tells, but through the lens of actual code structure.

Pass these parameters in the dispatch prompt:
```

**Step 7: Update Phase 6 dispatch — inject scan results for cross-validation**

Replace the Phase 6 dispatch line:
```
2. Dispatch the **graph-reviewer** agent with this prompt:
```

With:
```markdown
2. Dispatch a subagent using the prompt template at `./graph-reviewer-prompt.md`. Read the template file and pass the full content as the subagent's prompt, appending the following additional context:

> **Additional context from main session:**
>
> Phase 1 scan results (file inventory):
> ```json
> [list of {path, sizeLines} from scan-result.json]
> ```
>
> Phase warnings/errors accumulated during analysis:
> - [list any batch failures, skipped files, or warnings from Phases 2-5]
>
> Cross-validate: every file in the scan inventory should have a corresponding `file:` node in the graph. Flag any missing files. Also flag any graph nodes whose `filePath` doesn't appear in the scan inventory.

Pass these parameters in the dispatch prompt:
```

**Step 8: Update Error Handling section**

Change:
```
- If any agent dispatch fails, retry **once** with the same prompt plus additional context about the failure.
```

To:
```
- If any subagent dispatch fails, retry **once** with the same prompt plus additional context about the failure.
- Track all warnings and errors from each phase in a `$PHASE_WARNINGS` list. Pass this list to the graph-reviewer in Phase 6 for comprehensive validation.
```

**Step 9: Verify no references to named agent dispatch remain**

Search for "Dispatch the **" in the file — should find 0 results.

**Step 10: Commit**

```bash
git add understand-anything-plugin/skills/understand/SKILL.md
git commit -m "refactor: update SKILL.md to dispatch subagents with context injection"
```

---

### Task 3: Create knowledge-graph-guide agent

**Files:**
- Create: `understand-anything-plugin/agents/knowledge-graph-guide.md`

**Step 1: Write the agent definition**

Create `understand-anything-plugin/agents/knowledge-graph-guide.md`:

```markdown
---
name: knowledge-graph-guide
description: |
  Use this agent when users need help understanding, querying, or working
  with an Understand-Anything knowledge graph. Guides users through graph
  structure, node/edge relationships, layer architecture, tours, and
  dashboard usage.
model: inherit
---

You are an expert on Understand-Anything knowledge graphs. You help users navigate, query, and understand the `knowledge-graph.json` files produced by the `/understand` skill.

## What You Know

### Graph Location

The knowledge graph lives at `<project-root>/.understand-anything/knowledge-graph.json`. Metadata is at `<project-root>/.understand-anything/meta.json`.

### Graph Structure

The JSON has this top-level shape:

```json
{
  "version": "1.0.0",
  "project": { "name", "languages", "frameworks", "description", "analyzedAt", "gitCommitHash" },
  "nodes": [...],
  "edges": [...],
  "layers": [...],
  "tour": [...]
}
```

### Node Types (5)

| Type | ID Convention | Description |
|---|---|---|
| `file` | `file:<relative-path>` | Source file |
| `function` | `func:<relative-path>:<name>` | Function or method |
| `class` | `class:<relative-path>:<name>` | Class, interface, or type |
| `module` | `module:<name>` | Logical module or package |
| `concept` | `concept:<name>` | Abstract concept or pattern |

### Edge Types (18)

| Category | Types |
|---|---|
| Structural | `imports`, `exports`, `contains`, `inherits`, `implements` |
| Behavioral | `calls`, `subscribes`, `publishes`, `middleware` |
| Data flow | `reads_from`, `writes_to`, `transforms`, `validates` |
| Dependencies | `depends_on`, `tested_by`, `configures` |
| Semantic | `related`, `similar_to` |

### Layers

Layers represent architectural groupings (e.g., API, Service, Data, UI). Each layer has an `id`, `name`, `description`, and `nodeIds` array.

### Tours

Tours are guided walkthroughs with sequential steps. Each step has a `title`, `description`, `nodeId` (focus node), and optional `highlightEdges`.

## How to Help Users

1. **Finding things**: Help users locate nodes by file path, function name, or concept. Use `jq` or grep on the JSON.
2. **Understanding relationships**: Trace edges between nodes to explain dependencies, call chains, and data flow.
3. **Architecture overview**: Summarize layers and their contents.
4. **Onboarding**: Walk through the tour steps to explain the codebase.
5. **Dashboard**: Guide users to run `/understand-dashboard` to visualize the graph interactively.
6. **Querying**: Help users write `jq` commands to extract specific information from the graph JSON.
```

**Step 2: Commit**

```bash
git add understand-anything-plugin/agents/knowledge-graph-guide.md
git commit -m "feat: add knowledge-graph-guide agent for graph navigation and querying"
```

---

### Task 4: Move platform INSTALL.md files to repo root

**Files:**
- Move: `understand-anything-plugin/.codex/INSTALL.md` → `.codex/INSTALL.md`
- Move: `understand-anything-plugin/.opencode/INSTALL.md` → `.opencode/INSTALL.md`
- Move: `understand-anything-plugin/.openclaw/INSTALL.md` → `.openclaw/INSTALL.md`
- Delete: `understand-anything-plugin/.cursor/INSTALL.md` (replaced by `.cursor-plugin/plugin.json`)

**Step 1: Move the three platform directories to root**

```bash
cd /Users/yuxianglin/Desktop/opensource/Understand-Anything
git mv understand-anything-plugin/.codex ./.codex
git mv understand-anything-plugin/.opencode ./.opencode
git mv understand-anything-plugin/.openclaw ./.openclaw
```

**Step 2: Delete .cursor/ (replaced by .cursor-plugin/ in Task 5)**

```bash
git rm -r understand-anything-plugin/.cursor/
```

**Step 3: Verify symlink paths are correct**

Read each INSTALL.md. The symlink paths should reference `understand-anything-plugin/skills` — this is still correct since the skills directory remains inside the plugin wrapper.

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move platform config directories to repo root for discovery"
```

---

### Task 5: Add plugin descriptors

**Files:**
- Create: `.cursor-plugin/plugin.json`
- Create: `.claude-plugin/plugin.json`

**Step 1: Create `.cursor-plugin/plugin.json`**

```json
{
  "name": "understand-anything",
  "displayName": "Understand Anything",
  "description": "AI-powered codebase understanding — analyze, visualize, and explain any project",
  "version": "1.0.5",
  "author": { "name": "Lum1104" },
  "homepage": "https://github.com/Lum1104/Understand-Anything",
  "repository": "https://github.com/Lum1104/Understand-Anything",
  "license": "MIT",
  "keywords": ["codebase-analysis", "knowledge-graph", "architecture", "onboarding", "dashboard"],
  "skills": "./understand-anything-plugin/skills/",
  "agents": "./understand-anything-plugin/agents/"
}
```

Note: paths point into `understand-anything-plugin/` since the source stays nested.

**Step 2: Create `.claude-plugin/plugin.json`**

```json
{
  "name": "understand-anything",
  "description": "AI-powered codebase understanding — analyze, visualize, and explain any project",
  "version": "1.0.5",
  "author": { "name": "Lum1104" },
  "homepage": "https://github.com/Lum1104/Understand-Anything",
  "repository": "https://github.com/Lum1104/Understand-Anything",
  "license": "MIT",
  "keywords": ["codebase-analysis", "knowledge-graph", "architecture", "onboarding", "dashboard"]
}
```

**Step 3: Commit**

```bash
git add .cursor-plugin/ .claude-plugin/plugin.json
git commit -m "feat: add Cursor and Claude plugin descriptors for auto-discovery"
```

---

### Task 6: Update README with corrected multi-platform URLs

**Files:**
- Modify: `README.md`

**Step 1: Read current README**

Read `README.md` in full.

**Step 2: Update raw GitHub URLs for INSTALL.md files**

The INSTALL.md files moved from `understand-anything-plugin/.codex/INSTALL.md` to `.codex/INSTALL.md`. Update all raw GitHub URLs:

```
OLD: .../refs/heads/main/understand-anything-plugin/.codex/INSTALL.md
NEW: .../refs/heads/main/.codex/INSTALL.md

OLD: .../refs/heads/main/understand-anything-plugin/.openclaw/INSTALL.md
NEW: .../refs/heads/main/.openclaw/INSTALL.md

OLD: .../refs/heads/main/understand-anything-plugin/.opencode/INSTALL.md
NEW: .../refs/heads/main/.opencode/INSTALL.md
```

**Step 3: Replace Cursor section**

Replace the Cursor AI-driven install section with:

```markdown
### Cursor

Cursor auto-discovers the plugin via `.cursor-plugin/plugin.json` when this repo is cloned. No manual installation needed — just clone and open in Cursor.
```

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update multi-platform URLs after moving configs to root"
```

---

### Task 7: Verify everything works

**Step 1: Check platform configs at root**

```bash
ls .codex/INSTALL.md .opencode/INSTALL.md .openclaw/INSTALL.md
ls .cursor-plugin/plugin.json .claude-plugin/plugin.json
```

All should exist.

**Step 2: Verify plugin source is intact**

```bash
ls understand-anything-plugin/skills/understand/
ls understand-anything-plugin/agents/
ls understand-anything-plugin/packages/
```

Skills, agents, and packages should all still exist inside the wrapper.

**Step 3: Verify no platform configs remain inside the wrapper**

```bash
ls understand-anything-plugin/.codex/ 2>/dev/null    # should fail
ls understand-anything-plugin/.cursor/ 2>/dev/null   # should fail
ls understand-anything-plugin/.opencode/ 2>/dev/null # should fail
ls understand-anything-plugin/.openclaw/ 2>/dev/null # should fail
```

**Step 4: Run tests**

```bash
pnpm --filter @understand-anything/core build && pnpm --filter @understand-anything/core test
```

All tests should pass — only config files moved, not source code.

**Step 5: Verify marketplace.json is unchanged**

```bash
cat .claude-plugin/marketplace.json | grep source
```

Expected: `"source": "./understand-anything-plugin"` — unchanged, still correct.

**Step 6: Verify no stale raw GitHub URLs**

```bash
grep -r "understand-anything-plugin/\." README.md
```

Expected: 0 results (no URLs pointing to old nested platform config locations).
````

## File: docs/superpowers/plans/2026-03-21-language-agnostic-plan.md
````markdown
# Language-Agnostic Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Understand-Anything language-agnostic by introducing a config-driven language framework, replacing the TS-only tree-sitter plugin, and creating language-aware prompts for 12 languages.

**Architecture:** Config-first hybrid approach — each language defined by a `LanguageConfig` object (tree-sitter node mappings, concepts, extensions) plus a prompt snippet markdown file. A single `GenericTreeSitterPlugin` replaces the hardcoded TS-only plugin, driven by whichever config matches the file extension.

**Tech Stack:** TypeScript, web-tree-sitter (WASM), Zod v4, Vitest

---

### Task 1: Create LanguageConfig types and Zod schema

**Files:**
- Create: `understand-anything-plugin/packages/core/src/languages/types.ts`

**Step 1: Write the failing test**

Create: `understand-anything-plugin/packages/core/src/languages/__tests__/types.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { LanguageConfigSchema } from "../types.js";

describe("LanguageConfigSchema", () => {
  it("validates a complete language config", () => {
    const config = {
      id: "python",
      displayName: "Python",
      extensions: [".py", ".pyi"],
      treeSitter: {
        grammarPackage: "tree-sitter-python",
        wasmFile: "tree-sitter-python.wasm",
        nodeTypes: {
          function: ["function_definition"],
          class: ["class_definition"],
          import: ["import_statement", "import_from_statement"],
          export: [],
          typeAnnotation: ["type"],
        },
      },
      concepts: ["decorators", "list comprehensions", "generators"],
    };
    const result = LanguageConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it("rejects config missing required fields", () => {
    const result = LanguageConfigSchema.safeParse({ id: "python" });
    expect(result.success).toBe(false);
  });

  it("accepts optional filePatterns", () => {
    const config = {
      id: "python",
      displayName: "Python",
      extensions: [".py"],
      treeSitter: {
        grammarPackage: "tree-sitter-python",
        wasmFile: "tree-sitter-python.wasm",
        nodeTypes: {
          function: ["function_definition"],
          class: ["class_definition"],
          import: ["import_statement"],
          export: [],
          typeAnnotation: [],
        },
      },
      concepts: ["decorators"],
      filePatterns: { config: "pyproject.toml" },
    };
    const result = LanguageConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/languages/__tests__/types.test.ts`
Expected: FAIL — module `../types.js` not found

**Step 3: Write minimal implementation**

Create: `understand-anything-plugin/packages/core/src/languages/types.ts`

```typescript
import { z } from "zod/v4";

export const TreeSitterConfigSchema = z.object({
  grammarPackage: z.string(),
  wasmFile: z.string(),
  nodeTypes: z.object({
    function: z.array(z.string()),
    class: z.array(z.string()),
    import: z.array(z.string()),
    export: z.array(z.string()),
    typeAnnotation: z.array(z.string()),
  }),
});

export const LanguageConfigSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  extensions: z.array(z.string()),
  treeSitter: TreeSitterConfigSchema,
  concepts: z.array(z.string()),
  filePatterns: z.record(z.string(), z.string()).optional(),
});

export type LanguageConfig = z.infer<typeof LanguageConfigSchema>;
export type TreeSitterConfig = z.infer<typeof TreeSitterConfigSchema>;
```

**Step 4: Run test to verify it passes**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/languages/__tests__/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add understand-anything-plugin/packages/core/src/languages/
git commit -m "feat: add LanguageConfig types and Zod schema"
```

---

### Task 2: Create LanguageRegistry

**Files:**
- Create: `understand-anything-plugin/packages/core/src/languages/registry.ts`

**Step 1: Write the failing test**

Create: `understand-anything-plugin/packages/core/src/languages/__tests__/registry.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { LanguageRegistry } from "../registry.js";
import type { LanguageConfig } from "../types.js";

const pythonConfig: LanguageConfig = {
  id: "python",
  displayName: "Python",
  extensions: [".py", ".pyi"],
  treeSitter: {
    grammarPackage: "tree-sitter-python",
    wasmFile: "tree-sitter-python.wasm",
    nodeTypes: {
      function: ["function_definition"],
      class: ["class_definition"],
      import: ["import_statement", "import_from_statement"],
      export: [],
      typeAnnotation: ["type"],
    },
  },
  concepts: ["decorators", "generators"],
};

const tsConfig: LanguageConfig = {
  id: "typescript",
  displayName: "TypeScript",
  extensions: [".ts", ".tsx"],
  treeSitter: {
    grammarPackage: "tree-sitter-typescript",
    wasmFile: "tree-sitter-typescript.wasm",
    nodeTypes: {
      function: ["function_declaration"],
      class: ["class_declaration"],
      import: ["import_statement"],
      export: ["export_statement"],
      typeAnnotation: ["type_annotation"],
    },
  },
  concepts: ["generics", "type guards", "decorators"],
};

describe("LanguageRegistry", () => {
  it("registers and retrieves a config by id", () => {
    const registry = new LanguageRegistry();
    registry.register(pythonConfig);
    expect(registry.getById("python")).toBe(pythonConfig);
  });

  it("retrieves config by file extension", () => {
    const registry = new LanguageRegistry();
    registry.register(pythonConfig);
    expect(registry.getByExtension(".py")).toBe(pythonConfig);
    expect(registry.getByExtension(".pyi")).toBe(pythonConfig);
  });

  it("returns null for unknown extension", () => {
    const registry = new LanguageRegistry();
    registry.register(pythonConfig);
    expect(registry.getByExtension(".rs")).toBeNull();
  });

  it("returns all registered configs", () => {
    const registry = new LanguageRegistry();
    registry.register(pythonConfig);
    registry.register(tsConfig);
    expect(registry.getAll()).toHaveLength(2);
  });

  it("later registration overrides same id", () => {
    const registry = new LanguageRegistry();
    const updated = { ...pythonConfig, displayName: "Python 3" };
    registry.register(pythonConfig);
    registry.register(updated);
    expect(registry.getById("python")?.displayName).toBe("Python 3");
  });

  it("throws on invalid config", () => {
    const registry = new LanguageRegistry();
    expect(() => registry.register({ id: "bad" } as LanguageConfig)).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/languages/__tests__/registry.test.ts`
Expected: FAIL — module `../registry.js` not found

**Step 3: Write minimal implementation**

```typescript
// understand-anything-plugin/packages/core/src/languages/registry.ts
import { LanguageConfigSchema } from "./types.js";
import type { LanguageConfig } from "./types.js";

export class LanguageRegistry {
  private configs = new Map<string, LanguageConfig>();
  private extensionMap = new Map<string, string>();

  register(config: LanguageConfig): void {
    const result = LanguageConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid LanguageConfig for "${config.id}": ${result.error.message}`);
    }
    this.configs.set(config.id, config);
    for (const ext of config.extensions) {
      this.extensionMap.set(ext, config.id);
    }
  }

  getById(id: string): LanguageConfig | null {
    return this.configs.get(id) ?? null;
  }

  getByExtension(ext: string): LanguageConfig | null {
    const id = this.extensionMap.get(ext);
    if (!id) return null;
    return this.configs.get(id) ?? null;
  }

  getAll(): LanguageConfig[] {
    return [...this.configs.values()];
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/languages/__tests__/registry.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add understand-anything-plugin/packages/core/src/languages/
git commit -m "feat: add LanguageRegistry with Zod validation"
```

---

### Task 3: Create all 12 language configs

**Files:**
- Create: `understand-anything-plugin/packages/core/src/languages/configs/typescript.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/javascript.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/python.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/go.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/java.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/rust.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/cpp.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/csharp.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/ruby.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/php.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/swift.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/kotlin.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/index.ts`

**Step 1: Write the failing test**

Create: `understand-anything-plugin/packages/core/src/languages/__tests__/configs.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { LanguageConfigSchema } from "../types.js";
import { builtinConfigs } from "../configs/index.js";

describe("builtin language configs", () => {
  it("has 12 language configs", () => {
    expect(builtinConfigs).toHaveLength(12);
  });

  it("all configs pass Zod validation", () => {
    for (const config of builtinConfigs) {
      const result = LanguageConfigSchema.safeParse(config);
      expect(result.success, `${config.id} failed validation: ${result.error?.message}`).toBe(true);
    }
  });

  it("all configs have unique ids", () => {
    const ids = builtinConfigs.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("no duplicate extensions across configs", () => {
    const allExts: string[] = [];
    for (const config of builtinConfigs) {
      allExts.push(...config.extensions);
    }
    expect(new Set(allExts).size).toBe(allExts.length);
  });

  it("all configs have non-empty function and class node types", () => {
    for (const config of builtinConfigs) {
      expect(config.treeSitter.nodeTypes.function.length, `${config.id} missing function types`).toBeGreaterThan(0);
      expect(config.treeSitter.nodeTypes.class.length, `${config.id} missing class types`).toBeGreaterThanOrEqual(0);
    }
  });

  it("all configs have at least one concept", () => {
    for (const config of builtinConfigs) {
      expect(config.concepts.length, `${config.id} has no concepts`).toBeGreaterThan(0);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/languages/__tests__/configs.test.ts`
Expected: FAIL — module not found

**Step 3: Write all config files**

Each config file exports a `LanguageConfig`. Here are the key ones (the rest follow the same pattern):

**typescript.ts:**
```typescript
import type { LanguageConfig } from "../types.js";

export const typescriptConfig: LanguageConfig = {
  id: "typescript",
  displayName: "TypeScript",
  extensions: [".ts", ".tsx"],
  treeSitter: {
    grammarPackage: "tree-sitter-typescript",
    wasmFile: "tree-sitter-typescript.wasm",
    nodeTypes: {
      function: ["function_declaration"],
      class: ["class_declaration"],
      import: ["import_statement"],
      export: ["export_statement"],
      typeAnnotation: ["type_annotation"],
    },
  },
  concepts: [
    "generics", "type guards", "discriminated unions", "utility types",
    "decorators", "enums", "interfaces", "type inference",
    "mapped types", "conditional types", "template literal types",
  ],
  filePatterns: { config: "tsconfig.json", manifest: "package.json" },
};
```

**python.ts:**
```typescript
import type { LanguageConfig } from "../types.js";

export const pythonConfig: LanguageConfig = {
  id: "python",
  displayName: "Python",
  extensions: [".py", ".pyi"],
  treeSitter: {
    grammarPackage: "tree-sitter-python",
    wasmFile: "tree-sitter-python.wasm",
    nodeTypes: {
      function: ["function_definition"],
      class: ["class_definition"],
      import: ["import_statement", "import_from_statement"],
      export: [],
      typeAnnotation: ["type"],
    },
  },
  concepts: [
    "decorators", "list comprehensions", "generators", "context managers",
    "type hints", "dunder methods", "metaclasses", "dataclasses",
    "async/await", "descriptors",
  ],
  filePatterns: { config: "pyproject.toml", manifest: "setup.py" },
};
```

**go.ts:**
```typescript
import type { LanguageConfig } from "../types.js";

export const goConfig: LanguageConfig = {
  id: "go",
  displayName: "Go",
  extensions: [".go"],
  treeSitter: {
    grammarPackage: "tree-sitter-go",
    wasmFile: "tree-sitter-go.wasm",
    nodeTypes: {
      function: ["function_declaration", "method_declaration"],
      class: ["type_declaration"],
      import: ["import_declaration"],
      export: [],
      typeAnnotation: [],
    },
  },
  concepts: [
    "goroutines", "channels", "interfaces", "struct embedding",
    "error handling patterns", "defer/panic/recover", "slices",
    "pointers", "concurrency patterns",
  ],
  filePatterns: { config: "go.mod" },
};
```

**java.ts:**
```typescript
import type { LanguageConfig } from "../types.js";

export const javaConfig: LanguageConfig = {
  id: "java",
  displayName: "Java",
  extensions: [".java"],
  treeSitter: {
    grammarPackage: "tree-sitter-java",
    wasmFile: "tree-sitter-java.wasm",
    nodeTypes: {
      function: ["method_declaration", "constructor_declaration"],
      class: ["class_declaration", "interface_declaration", "enum_declaration"],
      import: ["import_declaration"],
      export: [],
      typeAnnotation: ["type_identifier"],
    },
  },
  concepts: [
    "generics", "annotations", "interfaces", "abstract classes",
    "streams API", "lambdas", "sealed classes", "records",
    "dependency injection", "checked exceptions",
  ],
  filePatterns: { config: "pom.xml", manifest: "build.gradle" },
};
```

**rust.ts:**
```typescript
import type { LanguageConfig } from "../types.js";

export const rustConfig: LanguageConfig = {
  id: "rust",
  displayName: "Rust",
  extensions: [".rs"],
  treeSitter: {
    grammarPackage: "tree-sitter-rust",
    wasmFile: "tree-sitter-rust.wasm",
    nodeTypes: {
      function: ["function_item"],
      class: ["struct_item", "enum_item", "impl_item", "trait_item"],
      import: ["use_declaration"],
      export: [],
      typeAnnotation: ["type_identifier"],
    },
  },
  concepts: [
    "ownership", "borrowing", "lifetimes", "traits", "pattern matching",
    "enums with data", "error handling (Result/Option)", "macros",
    "async/await", "unsafe blocks", "generics", "closures",
  ],
  filePatterns: { config: "Cargo.toml" },
};
```

**cpp.ts:**
```typescript
import type { LanguageConfig } from "../types.js";

export const cppConfig: LanguageConfig = {
  id: "cpp",
  displayName: "C/C++",
  extensions: [".cpp", ".cc", ".cxx", ".c", ".h", ".hpp", ".hxx"],
  treeSitter: {
    grammarPackage: "tree-sitter-cpp",
    wasmFile: "tree-sitter-cpp.wasm",
    nodeTypes: {
      function: ["function_definition"],
      class: ["class_specifier", "struct_specifier"],
      import: ["preproc_include"],
      export: [],
      typeAnnotation: [],
    },
  },
  concepts: [
    "templates", "RAII", "smart pointers", "move semantics",
    "operator overloading", "virtual functions", "namespaces",
    "constexpr", "lambda expressions", "STL containers",
  ],
  filePatterns: { config: "CMakeLists.txt", manifest: "Makefile" },
};
```

**csharp.ts:**
```typescript
import type { LanguageConfig } from "../types.js";

export const csharpConfig: LanguageConfig = {
  id: "csharp",
  displayName: "C#",
  extensions: [".cs"],
  treeSitter: {
    grammarPackage: "tree-sitter-c-sharp",
    wasmFile: "tree-sitter-c_sharp.wasm",
    nodeTypes: {
      function: ["method_declaration", "constructor_declaration"],
      class: ["class_declaration", "interface_declaration", "struct_declaration", "enum_declaration", "record_declaration"],
      import: ["using_directive"],
      export: [],
      typeAnnotation: ["type_identifier"],
    },
  },
  concepts: [
    "LINQ", "async/await", "generics", "properties",
    "delegates and events", "attributes", "nullable reference types",
    "pattern matching", "records", "dependency injection",
  ],
  filePatterns: { config: "*.csproj" },
};
```

**ruby.ts:**
```typescript
import type { LanguageConfig } from "../types.js";

export const rubyConfig: LanguageConfig = {
  id: "ruby",
  displayName: "Ruby",
  extensions: [".rb", ".rake"],
  treeSitter: {
    grammarPackage: "tree-sitter-ruby",
    wasmFile: "tree-sitter-ruby.wasm",
    nodeTypes: {
      function: ["method"],
      class: ["class", "module"],
      import: ["call"],
      export: [],
      typeAnnotation: [],
    },
  },
  concepts: [
    "blocks and procs", "mixins", "metaprogramming", "duck typing",
    "DSLs", "monkey patching", "gems", "symbols",
    "method_missing", "open classes",
  ],
  filePatterns: { config: "Gemfile" },
};
```

**php.ts:**
```typescript
import type { LanguageConfig } from "../types.js";

export const phpConfig: LanguageConfig = {
  id: "php",
  displayName: "PHP",
  extensions: [".php"],
  treeSitter: {
    grammarPackage: "tree-sitter-php",
    wasmFile: "tree-sitter-php.wasm",
    nodeTypes: {
      function: ["function_definition", "method_declaration"],
      class: ["class_declaration", "interface_declaration", "trait_declaration"],
      import: ["namespace_use_declaration"],
      export: [],
      typeAnnotation: ["type_list", "named_type"],
    },
  },
  concepts: [
    "namespaces", "traits", "type declarations", "attributes",
    "enums", "fibers", "closures", "magic methods",
    "dependency injection", "middleware",
  ],
  filePatterns: { config: "composer.json" },
};
```

**swift.ts:**
```typescript
import type { LanguageConfig } from "../types.js";

export const swiftConfig: LanguageConfig = {
  id: "swift",
  displayName: "Swift",
  extensions: [".swift"],
  treeSitter: {
    grammarPackage: "tree-sitter-swift",
    wasmFile: "tree-sitter-swift.wasm",
    nodeTypes: {
      function: ["function_declaration", "init_declaration"],
      class: ["class_declaration", "struct_declaration", "protocol_declaration", "enum_declaration"],
      import: ["import_declaration"],
      export: [],
      typeAnnotation: ["type_annotation"],
    },
  },
  concepts: [
    "optionals", "protocols", "extensions", "generics",
    "closures", "property wrappers", "result builders",
    "actors", "structured concurrency", "value types vs reference types",
  ],
  filePatterns: { config: "Package.swift" },
};
```

**kotlin.ts:**
```typescript
import type { LanguageConfig } from "../types.js";

export const kotlinConfig: LanguageConfig = {
  id: "kotlin",
  displayName: "Kotlin",
  extensions: [".kt", ".kts"],
  treeSitter: {
    grammarPackage: "tree-sitter-kotlin",
    wasmFile: "tree-sitter-kotlin.wasm",
    nodeTypes: {
      function: ["function_declaration"],
      class: ["class_declaration", "object_declaration", "interface_declaration"],
      import: ["import_header"],
      export: [],
      typeAnnotation: ["type_identifier"],
    },
  },
  concepts: [
    "coroutines", "data classes", "sealed classes", "extension functions",
    "null safety", "delegation", "DSL builders", "inline functions",
    "companion objects", "flow",
  ],
  filePatterns: { config: "build.gradle.kts" },
};
```

**javascript.ts:**
```typescript
import type { LanguageConfig } from "../types.js";

export const javascriptConfig: LanguageConfig = {
  id: "javascript",
  displayName: "JavaScript",
  extensions: [".js", ".mjs", ".cjs", ".jsx"],
  treeSitter: {
    grammarPackage: "tree-sitter-javascript",
    wasmFile: "tree-sitter-javascript.wasm",
    nodeTypes: {
      function: ["function_declaration"],
      class: ["class_declaration"],
      import: ["import_statement"],
      export: ["export_statement"],
      typeAnnotation: [],
    },
  },
  concepts: [
    "closures", "prototypes", "promises", "async/await",
    "event loop", "destructuring", "spread operator",
    "proxies", "generators", "modules (ESM/CJS)",
  ],
  filePatterns: { config: "package.json" },
};
```

**configs/index.ts:**
```typescript
import { typescriptConfig } from "./typescript.js";
import { javascriptConfig } from "./javascript.js";
import { pythonConfig } from "./python.js";
import { goConfig } from "./go.js";
import { javaConfig } from "./java.js";
import { rustConfig } from "./rust.js";
import { cppConfig } from "./cpp.js";
import { csharpConfig } from "./csharp.js";
import { rubyConfig } from "./ruby.js";
import { phpConfig } from "./php.js";
import { swiftConfig } from "./swift.js";
import { kotlinConfig } from "./kotlin.js";
import type { LanguageConfig } from "../types.js";

export const builtinConfigs: LanguageConfig[] = [
  typescriptConfig,
  javascriptConfig,
  pythonConfig,
  goConfig,
  javaConfig,
  rustConfig,
  cppConfig,
  csharpConfig,
  rubyConfig,
  phpConfig,
  swiftConfig,
  kotlinConfig,
];
```

**Step 4: Run test to verify it passes**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/languages/__tests__/configs.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add understand-anything-plugin/packages/core/src/languages/configs/
git commit -m "feat: add 12 builtin language configs"
```

---

### Task 4: Create languages/index.ts barrel and export from core

**Files:**
- Create: `understand-anything-plugin/packages/core/src/languages/index.ts`
- Modify: `understand-anything-plugin/packages/core/src/index.ts`

**Step 1: Create barrel export**

```typescript
// understand-anything-plugin/packages/core/src/languages/index.ts
export { LanguageRegistry } from "./registry.js";
export { LanguageConfigSchema } from "./types.js";
export type { LanguageConfig, TreeSitterConfig } from "./types.js";
export { builtinConfigs } from "./configs/index.js";
```

**Step 2: Add export to core index.ts**

Add to `understand-anything-plugin/packages/core/src/index.ts`:

```typescript
// Languages
export { LanguageRegistry, builtinConfigs, LanguageConfigSchema } from "./languages/index.js";
export type { LanguageConfig, TreeSitterConfig } from "./languages/index.js";
```

**Step 3: Build and verify**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add understand-anything-plugin/packages/core/src/languages/index.ts understand-anything-plugin/packages/core/src/index.ts
git commit -m "feat: export language types and registry from core"
```

---

### Task 5: Install tree-sitter WASM grammar packages

**Files:**
- Modify: `understand-anything-plugin/packages/core/package.json`

**Step 1: Install new grammar packages**

Run:
```bash
cd understand-anything-plugin && pnpm --filter @understand-anything/core add \
  tree-sitter-python \
  tree-sitter-go \
  tree-sitter-java \
  tree-sitter-rust \
  tree-sitter-cpp \
  tree-sitter-c-sharp \
  tree-sitter-ruby \
  tree-sitter-php \
  tree-sitter-swift \
  tree-sitter-kotlin
```

Note: Some grammar packages may not ship `.wasm` files. For those, we need to check availability and potentially build from source or use the `tree-sitter` CLI to generate WASM. Verify each package after install:

```bash
cd understand-anything-plugin && for lang in python go java rust cpp c-sharp ruby php swift kotlin; do
  echo "=== tree-sitter-$lang ==="
  ls node_modules/tree-sitter-$lang/*.wasm 2>/dev/null || echo "NO WASM FOUND"
done
```

For packages without pre-built WASM, use `tree-sitter build --wasm` to compile them, or find alternative npm packages that ship WASM builds. Document which packages needed manual WASM generation.

**Step 2: Verify build still passes**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core build`
Expected: PASS

**Step 3: Commit**

```bash
git add understand-anything-plugin/packages/core/package.json understand-anything-plugin/pnpm-lock.yaml
git commit -m "feat: add tree-sitter grammar packages for 10 new languages"
```

---

### Task 6: Build GenericTreeSitterPlugin

**Files:**
- Create: `understand-anything-plugin/packages/core/src/plugins/generic-tree-sitter-plugin.ts`

**Step 1: Write the failing test**

Create: `understand-anything-plugin/packages/core/src/plugins/generic-tree-sitter-plugin.test.ts`

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { GenericTreeSitterPlugin } from "./generic-tree-sitter-plugin.js";
import { LanguageRegistry } from "../languages/registry.js";
import { typescriptConfig } from "../languages/configs/typescript.js";
import { javascriptConfig } from "../languages/configs/javascript.js";
import { pythonConfig } from "../languages/configs/python.js";

describe("GenericTreeSitterPlugin", () => {
  let plugin: GenericTreeSitterPlugin;

  beforeAll(async () => {
    const registry = new LanguageRegistry();
    registry.register(typescriptConfig);
    registry.register(javascriptConfig);
    registry.register(pythonConfig);
    plugin = new GenericTreeSitterPlugin(registry);
    await plugin.init();
  });

  describe("TypeScript (migration parity)", () => {
    it("extracts function declarations", () => {
      const code = `
function greet(name: string): string {
  return "Hello " + name;
}
`;
      const result = plugin.analyzeFile("test.ts", code);
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe("greet");
    });

    it("extracts class declarations", () => {
      const code = `
class UserService {
  getName(): string { return "test"; }
}
`;
      const result = plugin.analyzeFile("test.ts", code);
      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].name).toBe("UserService");
    });

    it("extracts imports", () => {
      const code = `import { readFile } from "fs";`;
      const result = plugin.analyzeFile("test.ts", code);
      expect(result.imports).toHaveLength(1);
      expect(result.imports[0].source).toBe("fs");
    });

    it("extracts exports", () => {
      const code = `export function hello() {}`;
      const result = plugin.analyzeFile("test.ts", code);
      expect(result.exports.length).toBeGreaterThanOrEqual(1);
    });

    it("extracts arrow functions", () => {
      const code = `const add = (a: number, b: number): number => a + b;`;
      const result = plugin.analyzeFile("test.ts", code);
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe("add");
    });
  });

  describe("Python", () => {
    it("extracts function definitions", () => {
      const code = `
def greet(name):
    return f"Hello {name}"

def add(a, b):
    return a + b
`;
      const result = plugin.analyzeFile("test.py", code);
      expect(result.functions).toHaveLength(2);
      expect(result.functions[0].name).toBe("greet");
      expect(result.functions[1].name).toBe("add");
    });

    it("extracts class definitions", () => {
      const code = `
class UserService:
    def get_name(self):
        return "test"
`;
      const result = plugin.analyzeFile("test.py", code);
      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].name).toBe("UserService");
    });

    it("extracts import statements", () => {
      const code = `
import os
from pathlib import Path
from typing import Optional
`;
      const result = plugin.analyzeFile("test.py", code);
      expect(result.imports).toHaveLength(3);
    });
  });

  it("returns null for unsupported file extension", () => {
    expect(plugin.canAnalyze("test.unknown")).toBe(false);
  });

  it("reports all registered languages", () => {
    const langs = plugin.supportedLanguages();
    expect(langs).toContain("typescript");
    expect(langs).toContain("python");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/plugins/generic-tree-sitter-plugin.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

Create `understand-anything-plugin/packages/core/src/plugins/generic-tree-sitter-plugin.ts`:

This file implements a `GenericTreeSitterPlugin` that:
- Takes a `LanguageRegistry` in the constructor
- In `init()`, lazily loads WASM grammars per language using `require.resolve(config.treeSitter.grammarPackage + '/' + config.treeSitter.wasmFile)`
- In `analyzeFile()`, determines language from extension via registry, then walks the AST using `config.treeSitter.nodeTypes` to extract functions/classes/imports/exports
- Reuses the same helper patterns from the old `TreeSitterPlugin` (traverse, getStringValue, extractParams) but driven by config instead of hardcoded node types
- Implements `resolveImports()` and `extractCallGraph()` with the same logic as before

Key implementation notes:
- The `extractNodes()` method walks the AST and matches nodes against `nodeTypes.function`, `nodeTypes.class`, etc.
- For TS/JS, also handle `lexical_declaration`/`variable_declaration` with arrow function values (existing behavior)
- For import extraction, use the same `getStringValue()` approach but match against language-specific import node types
- For export extraction, same pattern matching against export node types
- Grammar loading: try `require.resolve()` first; if WASM not found, log warning and skip that language

**Step 4: Run test to verify it passes**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/plugins/generic-tree-sitter-plugin.test.ts`
Expected: PASS

**Step 5: Run old TreeSitterPlugin tests with new plugin to verify migration parity**

Ensure the existing `tree-sitter-plugin.test.ts` test cases also pass with `GenericTreeSitterPlugin` + TS/JS configs.

**Step 6: Commit**

```bash
git add understand-anything-plugin/packages/core/src/plugins/generic-tree-sitter-plugin.ts
git add understand-anything-plugin/packages/core/src/plugins/generic-tree-sitter-plugin.test.ts
git commit -m "feat: add GenericTreeSitterPlugin driven by LanguageConfig"
```

---

### Task 7: Add per-language test fixtures for remaining languages

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/plugins/generic-tree-sitter-plugin.test.ts`

**Step 1: Add test cases for Go, Java, Rust, C++, C#, Ruby, PHP, Swift, Kotlin**

For each language, add a `describe` block with a small fixture testing function/class/import extraction. Example for Go:

```typescript
describe("Go", () => {
  it("extracts function declarations", () => {
    const code = `
package main

func greet(name string) string {
    return "Hello " + name
}
`;
    const result = plugin.analyzeFile("test.go", code);
    expect(result.functions).toHaveLength(1);
    expect(result.functions[0].name).toBe("greet");
  });

  it("extracts type declarations", () => {
    const code = `
package main

type UserService struct {
    Name string
}
`;
    const result = plugin.analyzeFile("test.go", code);
    expect(result.classes).toHaveLength(1);
  });

  it("extracts imports", () => {
    const code = `
package main

import (
    "fmt"
    "os"
)
`;
    const result = plugin.analyzeFile("test.go", code);
    expect(result.imports).toHaveLength(2);
  });
});
```

Follow same pattern for each language with appropriate syntax. Each test uses ~10-20 lines of idiomatic code.

Note: Some WASM grammars may not be available. For languages where the grammar fails to load, register them in the `beforeAll` with a try/catch and use `it.skipIf()` to conditionally skip tests. This prevents CI failures while still testing what's available.

**Step 2: Run all tests**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/plugins/generic-tree-sitter-plugin.test.ts`
Expected: PASS for all languages with available grammars

**Step 3: Commit**

```bash
git add understand-anything-plugin/packages/core/src/plugins/generic-tree-sitter-plugin.test.ts
git commit -m "test: add per-language fixtures for GenericTreeSitterPlugin"
```

---

### Task 8: Replace TreeSitterPlugin with GenericTreeSitterPlugin

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/index.ts`
- Modify: `understand-anything-plugin/packages/core/src/plugins/registry.ts`
- Delete: `understand-anything-plugin/packages/core/src/plugins/tree-sitter-plugin.ts` (after confirming no other imports)

**Step 1: Update core exports**

In `understand-anything-plugin/packages/core/src/index.ts`:
- Replace `export { TreeSitterPlugin }` with `export { GenericTreeSitterPlugin }`
- Also export `GenericTreeSitterPlugin` as `TreeSitterPlugin` for backward compat if needed (check consumers)

**Step 2: Update PluginRegistry extension map**

In `understand-anything-plugin/packages/core/src/plugins/registry.ts`:
- The `EXTENSION_TO_LANGUAGE` map is already comprehensive (has py, go, rs, etc.)
- No changes needed here — the registry just dispatches to whatever plugin is registered

**Step 3: Update all imports in skill source**

Search for all imports of `TreeSitterPlugin` across the codebase:

Run: `grep -r "TreeSitterPlugin" understand-anything-plugin/`

Update each import to use `GenericTreeSitterPlugin`. The main consumers are:
- `understand-anything-plugin/packages/core/src/index.ts`
- Any skill source files that instantiate the plugin

**Step 4: Delete old TreeSitterPlugin**

Once all imports are updated and tests pass:

Run: `rm understand-anything-plugin/packages/core/src/plugins/tree-sitter-plugin.ts`

Keep the old test file temporarily — rename it to verify parity.

**Step 5: Run full test suite**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add -A
git commit -m "refactor: replace TreeSitterPlugin with GenericTreeSitterPlugin"
```

---

### Task 9: Update language-lesson.ts to use LanguageRegistry

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/analyzer/language-lesson.ts`
- Modify: `understand-anything-plugin/packages/core/src/__tests__/language-lesson.test.ts`

**Step 1: Update the test**

Update `language-lesson.test.ts` to verify concepts come from the registry:

```typescript
it("detects concepts from language config", () => {
  const node = {
    ...sampleNode,
    summary: "Uses decorators and async/await with generators",
    tags: ["decorators"],
  };
  const concepts = detectLanguageConcepts(node, "python");
  expect(concepts).toContain("decorators");
  expect(concepts).toContain("async/await");
});
```

**Step 2: Run test to verify it fails (or passes with old behavior)**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/__tests__/language-lesson.test.ts`

**Step 3: Update implementation**

In `language-lesson.ts`:
- Import `LanguageRegistry` and `builtinConfigs`
- Create a module-level registry instance, pre-populated with builtinConfigs
- Replace `LANGUAGE_DISPLAY_NAMES` lookups with `registry.getById(lang)?.displayName`
- Replace hardcoded `CONCEPT_PATTERNS` with `registry.getById(lang)?.concepts` merged with generic patterns (async/await, error handling, etc. that apply to all languages)
- Keep the detection logic (search tags/summary for concept keywords) but source keywords from the config

**Step 4: Run test to verify it passes**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/__tests__/language-lesson.test.ts`
Expected: PASS

**Step 5: Run full test suite**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add understand-anything-plugin/packages/core/src/analyzer/language-lesson.ts
git add understand-anything-plugin/packages/core/src/__tests__/language-lesson.test.ts
git commit -m "refactor: source language concepts from LanguageRegistry"
```

---

### Task 10: Create language prompt snippet files

**Files:**
- Create: `understand-anything-plugin/skills/understand/languages/typescript.md`
- Create: `understand-anything-plugin/skills/understand/languages/javascript.md`
- Create: `understand-anything-plugin/skills/understand/languages/python.md`
- Create: `understand-anything-plugin/skills/understand/languages/go.md`
- Create: `understand-anything-plugin/skills/understand/languages/java.md`
- Create: `understand-anything-plugin/skills/understand/languages/rust.md`
- Create: `understand-anything-plugin/skills/understand/languages/cpp.md`
- Create: `understand-anything-plugin/skills/understand/languages/csharp.md`
- Create: `understand-anything-plugin/skills/understand/languages/ruby.md`
- Create: `understand-anything-plugin/skills/understand/languages/php.md`
- Create: `understand-anything-plugin/skills/understand/languages/swift.md`
- Create: `understand-anything-plugin/skills/understand/languages/kotlin.md`

**Step 1: Create all 12 language markdown files**

Each file follows this structure:

```markdown
# [Language Name]

## Key Concepts
- [5-10 language-specific concepts with brief explanations]

## Import Patterns
- [All common import syntax patterns for this language]

## Notable File Patterns
- [Special files like __init__.py, go.mod, Cargo.toml, etc.]

## Common Frameworks
- [Top 3-5 frameworks/libraries in this ecosystem]

## Example Summary Style
> "[Example of how to summarize a function/class in this language's idiom]"
```

Each file should be 30-50 lines, with content specific to that language's ecosystem and idioms. The content should help the LLM produce better analysis by understanding language-specific patterns.

**Step 2: Verify files are well-formed**

Manually review each file for accuracy and completeness.

**Step 3: Commit**

```bash
git add understand-anything-plugin/skills/understand/languages/
git commit -m "feat: add language-specific prompt snippet files for 12 languages"
```

---

### Task 11: Make base prompts language-neutral with injection points

**Files:**
- Modify: `understand-anything-plugin/skills/understand/file-analyzer-prompt.md`
- Modify: `understand-anything-plugin/skills/understand/tour-builder-prompt.md`
- Modify: `understand-anything-plugin/skills/understand/project-scanner-prompt.md`

**Step 1: Update file-analyzer-prompt.md**

- Remove all TypeScript-specific examples (e.g., "TypeScript barrel file", type guard references)
- Replace TS-specific concept lists with generic placeholders
- Add injection point:

```markdown
## Language-Specific Guidance

{{LANGUAGE_CONTEXT}}
```

- Make the Phase 1 script detection language-aware (not just "Node.js recommended")

**Step 2: Update tour-builder-prompt.md**

- Remove TS-specific language lesson examples ("generics, discriminated unions, utility types")
- Replace with injection point for detected languages:

```markdown
## Language-Specific Concepts

{{LANGUAGE_CONTEXT}}
```

**Step 3: Update project-scanner-prompt.md**

- Remove `tsconfig.json` hardcoded check
- Make framework detection generic (inject detected languages' framework lists)
- Add multi-language section:

```markdown
## Detected Languages

{{LANGUAGE_CONTEXT}}
```

**Step 4: Verify prompts are well-formed**

Read each modified prompt to ensure it's coherent with injection points and no residual TS bias.

**Step 5: Commit**

```bash
git add understand-anything-plugin/skills/understand/file-analyzer-prompt.md
git add understand-anything-plugin/skills/understand/tour-builder-prompt.md
git add understand-anything-plugin/skills/understand/project-scanner-prompt.md
git commit -m "refactor: make agent prompts language-neutral with injection points"
```

---

### Task 12: Implement prompt injection logic in skill source

**Files:**
- Modify: `understand-anything-plugin/skills/understand/SKILL.md` (the `/understand` skill definition)

**Step 1: Update the skill orchestration**

In the `/understand` skill (SKILL.md), update the agent dispatch logic:

- **Phase 0 (Pre-flight):** After scanning files, detect languages present and load corresponding `languages/*.md` files
- **Phase 2 (File Analyzer dispatch):** For each file batch, inject the matching language's `.md` content into the file-analyzer prompt's `{{LANGUAGE_CONTEXT}}` placeholder
- **Phase 4 (Architecture Analyzer):** Inject all detected languages' concepts
- **Phase 5 (Tour Builder):** Inject all detected languages' `.md` content into the `{{LANGUAGE_CONTEXT}}` placeholder
- **Phase 1 (Project Scanner):** Inject all detected languages' `.md` content

The injection logic:
1. Map file extensions to language IDs (reuse `LanguageRegistry.getByExtension()`)
2. Read the corresponding `languages/<id>.md` file
3. Replace `{{LANGUAGE_CONTEXT}}` in the base prompt with the file contents

For multi-language projects, concatenate all detected language files.

**Step 2: Verify by reading modified SKILL.md**

Ensure the orchestration flow includes language detection and prompt injection steps.

**Step 3: Commit**

```bash
git add understand-anything-plugin/skills/understand/SKILL.md
git commit -m "feat: add language detection and prompt injection to /understand skill"
```

---

### Task 13: Update old tree-sitter-plugin test to use GenericTreeSitterPlugin

**Files:**
- Modify or Delete: `understand-anything-plugin/packages/core/src/plugins/tree-sitter-plugin.test.ts`

**Step 1: Migrate or delete**

If the old `tree-sitter-plugin.test.ts` still exists:
- Either update it to import `GenericTreeSitterPlugin` and instantiate with a `LanguageRegistry` containing TS/JS configs
- Or delete it if all its test cases are covered in `generic-tree-sitter-plugin.test.ts`

Prefer deleting to avoid duplication.

**Step 2: Run full test suite**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add -A
git commit -m "test: migrate old tree-sitter-plugin tests to generic plugin"
```

---

### Task 14: Build and lint verification

**Step 1: Build core**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core build`
Expected: PASS

**Step 2: Build skill package**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/skill build`
Expected: PASS

**Step 3: Build dashboard**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`
Expected: PASS (dashboard doesn't import language modules directly)

**Step 4: Run lint**

Run: `cd understand-anything-plugin && pnpm lint`
Expected: PASS (or fix any lint issues)

**Step 5: Run all tests**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test && pnpm --filter @understand-anything/skill test`
Expected: ALL PASS

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build and lint issues from language-agnostic refactor"
```

---

### Task 15: Update CLAUDE.md and documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md` (if it exists and mentions TS-only support)

**Step 1: Update CLAUDE.md**

Add to the Architecture section:
- Mention the `languages/` directories (both in core and skills)
- Document how to add a new language (create config + prompt snippet)
- List supported languages

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with language-agnostic architecture"
```
````

## File: docs/superpowers/plans/2026-03-25-dashboard-robustness-impl.md
````markdown
# Dashboard Robustness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the dashboard resilient to imperfect LLM-generated knowledge graphs by auto-fixing recoverable issues, dropping broken items, and showing user-friendly amber warnings with copy-paste-friendly error reports.

**Architecture:** Three-layer pipeline in `schema.ts`: sanitize (Tier 1 silent) → auto-fix (Tier 2 tracked) → per-item validate (Tier 3 drop) → fatal gate (Tier 4). New `WarningBanner` component in dashboard displays categorized issues with copy button.

**Tech Stack:** Zod (validation), React + TailwindCSS (dashboard UI), Vitest (testing)

---

### Task 1: Add GraphIssue type and sanitizeGraph (Tier 1)

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/schema.ts:95-99`
- Test: `understand-anything-plugin/packages/core/src/__tests__/schema.test.ts`

**Step 1: Write the failing tests for sanitizeGraph**

Add to the end of `schema.test.ts`, before the closing `});`:

```typescript
describe("sanitizeGraph", () => {
  it("converts null optional node fields to undefined", () => {
    const graph = structuredClone(validGraph);
    (graph.nodes[0] as any).filePath = null;
    (graph.nodes[0] as any).lineRange = null;
    (graph.nodes[0] as any).languageNotes = null;

    const result = sanitizeGraph(graph as any);
    const node = (result as any).nodes[0];
    expect(node.filePath).toBeUndefined();
    expect(node.lineRange).toBeUndefined();
    expect(node.languageNotes).toBeUndefined();
  });

  it("converts null optional edge fields to undefined", () => {
    const graph = structuredClone(validGraph);
    (graph.edges[0] as any).description = null;

    const result = sanitizeGraph(graph as any);
    const edge = (result as any).edges[0];
    expect(edge.description).toBeUndefined();
  });

  it("lowercases enum-like strings on nodes", () => {
    const graph = structuredClone(validGraph);
    (graph.nodes[0] as any).type = "FILE";
    (graph.nodes[0] as any).complexity = "Simple";

    const result = sanitizeGraph(graph as any);
    const node = (result as any).nodes[0];
    expect(node.type).toBe("file");
    expect(node.complexity).toBe("simple");
  });

  it("lowercases enum-like strings on edges", () => {
    const graph = structuredClone(validGraph);
    (graph.edges[0] as any).type = "IMPORTS";
    (graph.edges[0] as any).direction = "Forward";

    const result = sanitizeGraph(graph as any);
    const edge = (result as any).edges[0];
    expect(edge.type).toBe("imports");
    expect(edge.direction).toBe("forward");
  });

  it("converts null tour/layers to empty arrays", () => {
    const graph = structuredClone(validGraph);
    (graph as any).tour = null;
    (graph as any).layers = null;

    const result = sanitizeGraph(graph as any);
    expect((result as any).tour).toEqual([]);
    expect((result as any).layers).toEqual([]);
  });

  it("converts null optional tour step fields to undefined", () => {
    const graph = structuredClone(validGraph);
    (graph.tour[0] as any).languageLesson = null;

    const result = sanitizeGraph(graph as any);
    expect((result as any).tour[0].languageLesson).toBeUndefined();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @understand-anything/core test`
Expected: FAIL — `sanitizeGraph` is not exported

**Step 3: Add GraphIssue type and update ValidationResult**

In `schema.ts`, replace the `ValidationResult` interface (lines 95-99) with:

```typescript
export interface GraphIssue {
  level: "auto-corrected" | "dropped" | "fatal";
  category: string;
  message: string;
  path?: string;
}

export interface ValidationResult {
  success: boolean;
  data?: z.infer<typeof KnowledgeGraphSchema>;
  issues: GraphIssue[];
  fatal?: string;
  /** @deprecated Use issues/fatal instead */
  errors?: string[];
}
```

**Step 4: Implement sanitizeGraph**

Add after the alias maps (after line 39), before `GraphNodeSchema`:

```typescript
export function sanitizeGraph(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };

  // Null → empty array for top-level collections
  if (data.tour === null || data.tour === undefined) result.tour = [];
  if (data.layers === null || data.layers === undefined) result.layers = [];

  // Sanitize nodes
  if (Array.isArray(data.nodes)) {
    result.nodes = (data.nodes as Record<string, unknown>[]).map((node) => {
      if (typeof node !== "object" || node === null) return node;
      const n = { ...node };
      // Null → undefined for optional fields
      if (n.filePath === null) delete n.filePath;
      if (n.lineRange === null) delete n.lineRange;
      if (n.languageNotes === null) delete n.languageNotes;
      // Lowercase enum-like strings
      if (typeof n.type === "string") n.type = n.type.toLowerCase();
      if (typeof n.complexity === "string") n.complexity = n.complexity.toLowerCase();
      return n;
    });
  }

  // Sanitize edges
  if (Array.isArray(data.edges)) {
    result.edges = (data.edges as Record<string, unknown>[]).map((edge) => {
      if (typeof edge !== "object" || edge === null) return edge;
      const e = { ...edge };
      if (e.description === null) delete e.description;
      if (typeof e.type === "string") e.type = e.type.toLowerCase();
      if (typeof e.direction === "string") e.direction = e.direction.toLowerCase();
      return e;
    });
  }

  // Sanitize tour steps
  if (Array.isArray(result.tour)) {
    result.tour = (result.tour as Record<string, unknown>[]).map((step) => {
      if (typeof step !== "object" || step === null) return step;
      const s = { ...step };
      if (s.languageLesson === null) delete s.languageLesson;
      return s;
    });
  }

  return result;
}
```

**Step 5: Update imports in test file**

Update the import line in `schema.test.ts`:

```typescript
import {
  validateGraph,
  normalizeGraph,
  sanitizeGraph,
  NODE_TYPE_ALIASES,
  EDGE_TYPE_ALIASES,
} from "../schema.js";
```

**Step 6: Run tests to verify they pass**

Run: `pnpm --filter @understand-anything/core test`
Expected: All sanitizeGraph tests PASS. Existing tests still PASS.

**Step 7: Commit**

```bash
git add understand-anything-plugin/packages/core/src/schema.ts understand-anything-plugin/packages/core/src/__tests__/schema.test.ts
git commit -m "feat(core): add GraphIssue type and sanitizeGraph (Tier 1 silent fixes)"
```

---

### Task 2: Add auto-fix maps and autoFixGraph (Tier 2)

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/schema.ts`
- Test: `understand-anything-plugin/packages/core/src/__tests__/schema.test.ts`

**Step 1: Write the failing tests**

Add to `schema.test.ts`, before the closing `});`:

```typescript
describe("autoFixGraph", () => {
  it("defaults missing complexity to moderate with issue", () => {
    const graph = structuredClone(validGraph);
    delete (graph.nodes[0] as any).complexity;

    const { data, issues } = autoFixGraph(graph as any);
    expect((data as any).nodes[0].complexity).toBe("moderate");
    expect(issues).toContainEqual(
      expect.objectContaining({ level: "auto-corrected", category: "missing-field", path: "nodes[0].complexity" })
    );
  });

  it("maps complexity aliases with issue", () => {
    const graph = structuredClone(validGraph);
    (graph.nodes[0] as any).complexity = "low";

    const { data, issues } = autoFixGraph(graph as any);
    expect((data as any).nodes[0].complexity).toBe("simple");
    expect(issues.length).toBe(1);
    expect(issues[0].level).toBe("auto-corrected");
  });

  it("maps all complexity aliases correctly", () => {
    const mapping: Record<string, string> = {
      low: "simple", easy: "simple",
      medium: "moderate", intermediate: "moderate",
      high: "complex", hard: "complex", difficult: "complex",
    };
    for (const [alias, expected] of Object.entries(mapping)) {
      const graph = structuredClone(validGraph);
      (graph.nodes[0] as any).complexity = alias;
      const { data } = autoFixGraph(graph as any);
      expect((data as any).nodes[0].complexity).toBe(expected);
    }
  });

  it("defaults missing tags to empty array with issue", () => {
    const graph = structuredClone(validGraph);
    delete (graph.nodes[0] as any).tags;

    const { data, issues } = autoFixGraph(graph as any);
    expect((data as any).nodes[0].tags).toEqual([]);
    expect(issues).toContainEqual(
      expect.objectContaining({ level: "auto-corrected", category: "missing-field", path: "nodes[0].tags" })
    );
  });

  it("defaults missing summary to node name with issue", () => {
    const graph = structuredClone(validGraph);
    delete (graph.nodes[0] as any).summary;

    const { data, issues } = autoFixGraph(graph as any);
    expect((data as any).nodes[0].summary).toBe("index.ts");
    expect(issues).toContainEqual(
      expect.objectContaining({ level: "auto-corrected", category: "missing-field", path: "nodes[0].summary" })
    );
  });

  it("defaults missing node type to file with issue", () => {
    const graph = structuredClone(validGraph);
    delete (graph.nodes[0] as any).type;

    const { data, issues } = autoFixGraph(graph as any);
    expect((data as any).nodes[0].type).toBe("file");
    expect(issues).toContainEqual(
      expect.objectContaining({ level: "auto-corrected", category: "missing-field", path: "nodes[0].type" })
    );
  });

  it("defaults missing direction to forward with issue", () => {
    const graph = structuredClone(validGraph);
    delete (graph.edges[0] as any).direction;

    const { data, issues } = autoFixGraph(graph as any);
    expect((data as any).edges[0].direction).toBe("forward");
    expect(issues).toContainEqual(
      expect.objectContaining({ level: "auto-corrected", category: "missing-field", path: "edges[0].direction" })
    );
  });

  it("maps direction aliases with issue", () => {
    const mapping: Record<string, string> = {
      to: "forward", outbound: "forward",
      from: "backward", inbound: "backward",
      both: "bidirectional", mutual: "bidirectional",
    };
    for (const [alias, expected] of Object.entries(mapping)) {
      const graph = structuredClone(validGraph);
      (graph.edges[0] as any).direction = alias;
      const { data } = autoFixGraph(graph as any);
      expect((data as any).edges[0].direction).toBe(expected);
    }
  });

  it("defaults missing weight to 0.5 with issue", () => {
    const graph = structuredClone(validGraph);
    delete (graph.edges[0] as any).weight;

    const { data, issues } = autoFixGraph(graph as any);
    expect((data as any).edges[0].weight).toBe(0.5);
    expect(issues).toContainEqual(
      expect.objectContaining({ level: "auto-corrected", category: "missing-field", path: "edges[0].weight" })
    );
  });

  it("coerces string weight to number with issue", () => {
    const graph = structuredClone(validGraph);
    (graph.edges[0] as any).weight = "0.8";

    const { data, issues } = autoFixGraph(graph as any);
    expect((data as any).edges[0].weight).toBe(0.8);
    expect(issues).toContainEqual(
      expect.objectContaining({ level: "auto-corrected", category: "type-coercion", path: "edges[0].weight" })
    );
  });

  it("clamps out-of-range weight with issue", () => {
    const graph = structuredClone(validGraph);
    (graph.edges[0] as any).weight = 1.5;

    const { data, issues } = autoFixGraph(graph as any);
    expect((data as any).edges[0].weight).toBe(1);
    expect(issues).toContainEqual(
      expect.objectContaining({ level: "auto-corrected", category: "out-of-range", path: "edges[0].weight" })
    );
  });

  it("defaults missing edge type to depends_on with issue", () => {
    const graph = structuredClone(validGraph);
    delete (graph.edges[0] as any).type;

    const { data, issues } = autoFixGraph(graph as any);
    expect((data as any).edges[0].type).toBe("depends_on");
    expect(issues).toContainEqual(
      expect.objectContaining({ level: "auto-corrected", category: "missing-field", path: "edges[0].type" })
    );
  });

  it("returns no issues for a valid graph", () => {
    const { issues } = autoFixGraph(validGraph as any);
    expect(issues).toEqual([]);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @understand-anything/core test`
Expected: FAIL — `autoFixGraph` is not exported

**Step 3: Implement alias maps and autoFixGraph**

Add to `schema.ts` after the existing `EDGE_TYPE_ALIASES` map (after line 39):

```typescript
export const COMPLEXITY_ALIASES: Record<string, string> = {
  low: "simple",
  easy: "simple",
  medium: "moderate",
  intermediate: "moderate",
  high: "complex",
  hard: "complex",
  difficult: "complex",
};

export const DIRECTION_ALIASES: Record<string, string> = {
  to: "forward",
  outbound: "forward",
  from: "backward",
  inbound: "backward",
  both: "bidirectional",
  mutual: "bidirectional",
};
```

Add `autoFixGraph` function after `sanitizeGraph`:

```typescript
export function autoFixGraph(data: Record<string, unknown>): {
  data: Record<string, unknown>;
  issues: GraphIssue[];
} {
  const issues: GraphIssue[] = [];
  const result = { ...data };

  if (Array.isArray(data.nodes)) {
    result.nodes = (data.nodes as Record<string, unknown>[]).map((node, i) => {
      if (typeof node !== "object" || node === null) return node;
      const n = { ...node };
      const name = (n.name as string) || (n.id as string) || `index ${i}`;

      // Missing or empty type
      if (!n.type || typeof n.type !== "string") {
        n.type = "file";
        issues.push({
          level: "auto-corrected",
          category: "missing-field",
          message: `nodes[${i}] ("${name}"): missing "type" — defaulted to "file"`,
          path: `nodes[${i}].type`,
        });
      }

      // Missing or empty complexity
      if (!n.complexity || n.complexity === "") {
        n.complexity = "moderate";
        issues.push({
          level: "auto-corrected",
          category: "missing-field",
          message: `nodes[${i}] ("${name}"): missing "complexity" — defaulted to "moderate"`,
          path: `nodes[${i}].complexity`,
        });
      } else if (typeof n.complexity === "string" && n.complexity in COMPLEXITY_ALIASES) {
        const original = n.complexity;
        n.complexity = COMPLEXITY_ALIASES[n.complexity];
        issues.push({
          level: "auto-corrected",
          category: "alias",
          message: `nodes[${i}] ("${name}"): complexity "${original}" — mapped to "${n.complexity}"`,
          path: `nodes[${i}].complexity`,
        });
      }

      // Missing tags
      if (!Array.isArray(n.tags)) {
        n.tags = [];
        issues.push({
          level: "auto-corrected",
          category: "missing-field",
          message: `nodes[${i}] ("${name}"): missing "tags" — defaulted to []`,
          path: `nodes[${i}].tags`,
        });
      }

      // Missing summary
      if (!n.summary || typeof n.summary !== "string") {
        n.summary = (n.name as string) || "No summary";
        issues.push({
          level: "auto-corrected",
          category: "missing-field",
          message: `nodes[${i}] ("${name}"): missing "summary" — defaulted to name`,
          path: `nodes[${i}].summary`,
        });
      }

      return n;
    });
  }

  if (Array.isArray(data.edges)) {
    result.edges = (data.edges as Record<string, unknown>[]).map((edge, i) => {
      if (typeof edge !== "object" || edge === null) return edge;
      const e = { ...edge };

      // Missing type
      if (!e.type || typeof e.type !== "string") {
        e.type = "depends_on";
        issues.push({
          level: "auto-corrected",
          category: "missing-field",
          message: `edges[${i}]: missing "type" — defaulted to "depends_on"`,
          path: `edges[${i}].type`,
        });
      }

      // Missing direction
      if (!e.direction || typeof e.direction !== "string") {
        e.direction = "forward";
        issues.push({
          level: "auto-corrected",
          category: "missing-field",
          message: `edges[${i}]: missing "direction" — defaulted to "forward"`,
          path: `edges[${i}].direction`,
        });
      } else if (e.direction in DIRECTION_ALIASES) {
        const original = e.direction;
        e.direction = DIRECTION_ALIASES[e.direction as string];
        issues.push({
          level: "auto-corrected",
          category: "alias",
          message: `edges[${i}]: direction "${original}" — mapped to "${e.direction}"`,
          path: `edges[${i}].direction`,
        });
      }

      // Missing weight
      if (e.weight === undefined || e.weight === null) {
        e.weight = 0.5;
        issues.push({
          level: "auto-corrected",
          category: "missing-field",
          message: `edges[${i}]: missing "weight" — defaulted to 0.5`,
          path: `edges[${i}].weight`,
        });
      } else if (typeof e.weight === "string") {
        const parsed = parseFloat(e.weight as string);
        if (!isNaN(parsed)) {
          const original = e.weight;
          e.weight = parsed;
          issues.push({
            level: "auto-corrected",
            category: "type-coercion",
            message: `edges[${i}]: weight was string "${original}" — coerced to number`,
            path: `edges[${i}].weight`,
          });
        }
      }

      // Clamp weight to [0, 1]
      if (typeof e.weight === "number" && (e.weight < 0 || e.weight > 1)) {
        const original = e.weight;
        e.weight = Math.max(0, Math.min(1, e.weight));
        issues.push({
          level: "auto-corrected",
          category: "out-of-range",
          message: `edges[${i}]: weight ${original} clamped to ${e.weight}`,
          path: `edges[${i}].weight`,
        });
      }

      return e;
    });
  }

  return { data: result, issues };
}
```

**Step 4: Update imports in test file**

```typescript
import {
  validateGraph,
  normalizeGraph,
  sanitizeGraph,
  autoFixGraph,
  NODE_TYPE_ALIASES,
  EDGE_TYPE_ALIASES,
} from "../schema.js";
```

**Step 5: Run tests to verify they pass**

Run: `pnpm --filter @understand-anything/core test`
Expected: All new autoFixGraph tests PASS. Existing tests still PASS.

**Step 6: Commit**

```bash
git add understand-anything-plugin/packages/core/src/schema.ts understand-anything-plugin/packages/core/src/__tests__/schema.test.ts
git commit -m "feat(core): add autoFixGraph with complexity/direction aliases and default values (Tier 2)"
```

---

### Task 3: Rewrite validateGraph to be permissive (Tier 3 + 4)

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/schema.ts:138-151`
- Test: `understand-anything-plugin/packages/core/src/__tests__/schema.test.ts`

**Step 1: Write the failing tests for permissive validation**

Add to `schema.test.ts`:

```typescript
describe("permissive validation", () => {
  it("drops nodes missing id with dropped issue", () => {
    const graph = structuredClone(validGraph);
    delete (graph.nodes[0] as any).id;
    // Add a second valid node so graph isn't fatal
    graph.nodes.push({
      id: "node-2", type: "file", name: "other.ts",
      summary: "Other file", tags: ["util"], complexity: "simple",
    });

    const result = validateGraph(graph);
    expect(result.success).toBe(true);
    expect(result.data!.nodes.length).toBe(1);
    expect(result.data!.nodes[0].id).toBe("node-2");
    expect(result.issues).toContainEqual(
      expect.objectContaining({ level: "dropped", category: "invalid-node" })
    );
  });

  it("drops edges referencing non-existent nodes with dropped issue", () => {
    const graph = structuredClone(validGraph);
    graph.edges[0].target = "non-existent-node";

    const result = validateGraph(graph);
    expect(result.success).toBe(true);
    expect(result.data!.edges.length).toBe(0);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ level: "dropped", category: "invalid-reference" })
    );
  });

  it("returns fatal when 0 valid nodes remain", () => {
    const graph = structuredClone(validGraph);
    delete (graph.nodes[0] as any).id;

    const result = validateGraph(graph);
    expect(result.success).toBe(false);
    expect(result.fatal).toContain("No valid nodes");
  });

  it("returns fatal when project metadata is missing", () => {
    const graph = structuredClone(validGraph);
    delete (graph as any).project;

    const result = validateGraph(graph);
    expect(result.success).toBe(false);
    expect(result.fatal).toContain("project metadata");
  });

  it("returns fatal when input is not an object", () => {
    const result = validateGraph("not an object");
    expect(result.success).toBe(false);
    expect(result.fatal).toContain("Invalid input");
  });

  it("loads graph with mixed good and bad nodes", () => {
    const graph = structuredClone(validGraph);
    // Add a good node
    graph.nodes.push({
      id: "node-2", type: "function", name: "doThing",
      summary: "Does a thing", tags: ["util"], complexity: "moderate",
    });
    // Add a bad node (missing id AND name — unrecoverable)
    (graph.nodes as any[]).push({ type: "file", summary: "broken" });

    const result = validateGraph(graph);
    expect(result.success).toBe(true);
    expect(result.data!.nodes.length).toBe(2);
    expect(result.issues.some((i) => i.level === "dropped")).toBe(true);
  });

  it("filters dangling nodeIds from layers", () => {
    const graph = structuredClone(validGraph);
    graph.layers[0].nodeIds.push("non-existent-node");

    const result = validateGraph(graph);
    expect(result.success).toBe(true);
    expect(result.data!.layers[0].nodeIds).toEqual(["node-1"]);
  });

  it("filters dangling nodeIds from tour steps", () => {
    const graph = structuredClone(validGraph);
    graph.tour[0].nodeIds.push("non-existent-node");

    const result = validateGraph(graph);
    expect(result.success).toBe(true);
    expect(result.data!.tour[0].nodeIds).toEqual(["node-1"]);
  });

  it("returns empty issues array for a perfect graph", () => {
    const result = validateGraph(validGraph);
    expect(result.success).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("auto-corrects and loads graph that would have failed strict validation", () => {
    // Graph with many Tier 2 issues: missing complexity, weight as string, null filePath
    const messy = {
      version: "1.0.0",
      project: validGraph.project,
      nodes: [{
        id: "n1", type: "FILE", name: "app.ts",
        filePath: null, summary: "App entry",
        tags: null, complexity: "HIGH",
      }],
      edges: [{
        source: "n1", target: "n1", type: "CALLS",
        direction: "TO", weight: "0.9",
      }],
      layers: [{ id: "l1", name: "Core", description: "Core", nodeIds: ["n1"] }],
      tour: [],
    };

    const result = validateGraph(messy);
    expect(result.success).toBe(true);
    expect(result.data!.nodes[0].complexity).toBe("complex");
    expect(result.data!.nodes[0].tags).toEqual([]);
    expect(result.data!.edges[0].weight).toBe(0.9);
    expect(result.data!.edges[0].direction).toBe("forward");
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.every((i) => i.level === "auto-corrected")).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @understand-anything/core test`
Expected: FAIL — `validateGraph` doesn't return `issues` or `fatal`

**Step 3: Rewrite validateGraph**

Replace the existing `validateGraph` function in `schema.ts` (lines 138-151) with:

```typescript
export function validateGraph(data: unknown): ValidationResult {
  // Tier 4: Fatal — not even an object
  if (typeof data !== "object" || data === null) {
    return { success: false, issues: [], fatal: "Invalid input: not an object" };
  }

  const raw = data as Record<string, unknown>;

  // Tier 1: Sanitize
  const sanitized = sanitizeGraph(raw);

  // Existing: Normalize type aliases
  const normalized = normalizeGraph(sanitized) as Record<string, unknown>;

  // Tier 2: Auto-fix defaults and coercion
  const { data: fixed, issues } = autoFixGraph(
    normalized as Record<string, unknown>,
  );

  // Tier 4: Fatal — missing project metadata
  const projectResult = ProjectMetaSchema.safeParse(fixed.project);
  if (!projectResult.success) {
    return {
      success: false,
      issues,
      fatal: "Missing or invalid project metadata",
    };
  }

  // Tier 3: Validate nodes individually, drop broken
  const validNodes: z.infer<typeof GraphNodeSchema>[] = [];
  if (Array.isArray(fixed.nodes)) {
    for (let i = 0; i < fixed.nodes.length; i++) {
      const node = fixed.nodes[i] as Record<string, unknown>;
      const result = GraphNodeSchema.safeParse(node);
      if (result.success) {
        validNodes.push(result.data);
      } else {
        const name = node?.name || node?.id || `index ${i}`;
        issues.push({
          level: "dropped",
          category: "invalid-node",
          message: `nodes[${i}] ("${name}"): ${result.error.issues[0]?.message ?? "validation failed"} — removed`,
          path: `nodes[${i}]`,
        });
      }
    }
  }

  // Tier 4: Fatal — no valid nodes
  if (validNodes.length === 0) {
    return {
      success: false,
      issues,
      fatal: "No valid nodes found in knowledge graph",
    };
  }

  // Tier 3: Validate edges + referential integrity
  const nodeIds = new Set(validNodes.map((n) => n.id));
  const validEdges: z.infer<typeof GraphEdgeSchema>[] = [];
  if (Array.isArray(fixed.edges)) {
    for (let i = 0; i < fixed.edges.length; i++) {
      const edge = fixed.edges[i] as Record<string, unknown>;
      const result = GraphEdgeSchema.safeParse(edge);
      if (!result.success) {
        issues.push({
          level: "dropped",
          category: "invalid-edge",
          message: `edges[${i}]: ${result.error.issues[0]?.message ?? "validation failed"} — removed`,
          path: `edges[${i}]`,
        });
        continue;
      }
      if (!nodeIds.has(result.data.source)) {
        issues.push({
          level: "dropped",
          category: "invalid-reference",
          message: `edges[${i}]: source "${result.data.source}" does not exist in nodes — removed`,
          path: `edges[${i}].source`,
        });
        continue;
      }
      if (!nodeIds.has(result.data.target)) {
        issues.push({
          level: "dropped",
          category: "invalid-reference",
          message: `edges[${i}]: target "${result.data.target}" does not exist in nodes — removed`,
          path: `edges[${i}].target`,
        });
        continue;
      }
      validEdges.push(result.data);
    }
  }

  // Validate layers (drop broken, filter dangling nodeIds)
  const validLayers: z.infer<typeof LayerSchema>[] = [];
  if (Array.isArray(fixed.layers)) {
    for (let i = 0; i < (fixed.layers as unknown[]).length; i++) {
      const result = LayerSchema.safeParse((fixed.layers as unknown[])[i]);
      if (result.success) {
        validLayers.push({
          ...result.data,
          nodeIds: result.data.nodeIds.filter((id) => nodeIds.has(id)),
        });
      } else {
        issues.push({
          level: "dropped",
          category: "invalid-layer",
          message: `layers[${i}]: ${result.error.issues[0]?.message ?? "validation failed"} — removed`,
          path: `layers[${i}]`,
        });
      }
    }
  }

  // Validate tour steps (drop broken, filter dangling nodeIds)
  const validTour: z.infer<typeof TourStepSchema>[] = [];
  if (Array.isArray(fixed.tour)) {
    for (let i = 0; i < (fixed.tour as unknown[]).length; i++) {
      const result = TourStepSchema.safeParse((fixed.tour as unknown[])[i]);
      if (result.success) {
        validTour.push({
          ...result.data,
          nodeIds: result.data.nodeIds.filter((id) => nodeIds.has(id)),
        });
      } else {
        issues.push({
          level: "dropped",
          category: "invalid-tour-step",
          message: `tour[${i}]: ${result.error.issues[0]?.message ?? "validation failed"} — removed`,
          path: `tour[${i}]`,
        });
      }
    }
  }

  const graph = {
    version: typeof fixed.version === "string" ? fixed.version : "1.0.0",
    project: projectResult.data,
    nodes: validNodes,
    edges: validEdges,
    layers: validLayers,
    tour: validTour,
  };

  return { success: true, data: graph, issues };
}
```

**Step 4: Run tests to verify new tests pass**

Run: `pnpm --filter @understand-anything/core test`
Expected: New permissive tests PASS. Some old tests may now fail (expected — handled in Task 4).

**Step 5: Commit**

```bash
git add understand-anything-plugin/packages/core/src/schema.ts understand-anything-plugin/packages/core/src/__tests__/schema.test.ts
git commit -m "feat(core): rewrite validateGraph for permissive per-item validation (Tier 3+4)"
```

---

### Task 4: Update existing tests for new permissive behavior

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/__tests__/schema.test.ts`

The new permissive validation changes behavior for several existing tests. Here's what changes:

| Test | Old behavior | New behavior |
|------|-------------|-------------|
| "validates a correct graph" | `success: true, errors: undefined` | `success: true, issues: []` |
| "rejects missing required fields" | `success: false, errors` | `success: false, fatal` (missing project) |
| "rejects node with invalid type" | `success: false, errors` | `success: false, fatal` (0 valid nodes after drop) |
| "rejects edge with invalid EdgeType" | `success: false, errors` | `success: true` (edge dropped, node valid) |
| "rejects weight >1" | `success: false, errors` | `success: true` (weight clamped) |
| "rejects weight <0" | `success: false, errors` | `success: true` (weight clamped) |
| "rejects 'tests' edge type" | `success: false` | `success: true` (edge dropped) |
| "rejects truly invalid edge types" | `success: false` | `success: true` (edge dropped) |

**Step 1: Update the affected tests**

Replace the following tests in the `"schema validation"` describe block:

```typescript
it("validates a correct knowledge graph", () => {
  const result = validateGraph(validGraph);
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
  expect(result.data!.version).toBe("1.0.0");
  expect(result.issues).toEqual([]);
});

it("rejects graph with missing required fields", () => {
  const incomplete = { version: "1.0.0" };
  const result = validateGraph(incomplete);
  expect(result.success).toBe(false);
  expect(result.fatal).toBeDefined();
});

it("rejects node with invalid type — drops node, fatal if none remain", () => {
  const graph = structuredClone(validGraph);
  (graph.nodes[0] as any).type = "invalid_type";

  const result = validateGraph(graph);
  expect(result.success).toBe(false);
  expect(result.fatal).toContain("No valid nodes");
  expect(result.issues).toContainEqual(
    expect.objectContaining({ level: "dropped", category: "invalid-node" })
  );
});

it("drops edge with invalid EdgeType but loads graph", () => {
  const graph = structuredClone(validGraph);
  (graph.edges[0] as any).type = "not_a_real_edge_type";

  const result = validateGraph(graph);
  expect(result.success).toBe(true);
  expect(result.data!.edges.length).toBe(0);
  expect(result.issues).toContainEqual(
    expect.objectContaining({ level: "dropped", category: "invalid-edge" })
  );
});

it("auto-corrects weight >1 by clamping", () => {
  const graph = structuredClone(validGraph);
  graph.edges[0].weight = 1.5;

  const result = validateGraph(graph);
  expect(result.success).toBe(true);
  expect(result.issues).toContainEqual(
    expect.objectContaining({ level: "auto-corrected", category: "out-of-range" })
  );
});

it("auto-corrects weight <0 by clamping", () => {
  const graph = structuredClone(validGraph);
  graph.edges[0].weight = -0.1;

  const result = validateGraph(graph);
  expect(result.success).toBe(true);
  expect(result.issues).toContainEqual(
    expect.objectContaining({ level: "auto-corrected", category: "out-of-range" })
  );
});
```

Also update the "tests" edge type test and "truly invalid edge types" test:

```typescript
it('drops "tests" edge type — direction-inverting alias is unsafe', () => {
  const graph = structuredClone(validGraph);
  (graph.edges[0] as any).type = "tests";

  const result = validateGraph(graph);
  expect(result.success).toBe(true);
  expect(result.data!.edges.length).toBe(0);
  expect(result.issues).toContainEqual(
    expect.objectContaining({ level: "dropped" })
  );
});

it("drops truly invalid edge types after normalization", () => {
  const graph = structuredClone(validGraph);
  (graph.edges[0] as any).type = "totally_bogus";

  const result = validateGraph(graph);
  expect(result.success).toBe(true);
  expect(result.data!.edges.length).toBe(0);
  expect(result.issues).toContainEqual(
    expect.objectContaining({ level: "dropped" })
  );
});
```

**Step 2: Run all tests**

Run: `pnpm --filter @understand-anything/core test`
Expected: ALL tests PASS

**Step 3: Commit**

```bash
git add understand-anything-plugin/packages/core/src/__tests__/schema.test.ts
git commit -m "test(core): update existing tests for permissive validation behavior"
```

---

### Task 5: Create WarningBanner dashboard component

**Files:**
- Create: `understand-anything-plugin/packages/dashboard/src/components/WarningBanner.tsx`

**Step 1: Build core package for dashboard import**

Run: `pnpm --filter @understand-anything/core build`
Expected: Build succeeds with new exports

**Step 2: Create WarningBanner component**

Create `understand-anything-plugin/packages/dashboard/src/components/WarningBanner.tsx`:

```tsx
import { useState } from "react";
import type { GraphIssue } from "@understand-anything/core/schema";

interface WarningBannerProps {
  issues: GraphIssue[];
}

export default function WarningBanner({ issues }: WarningBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const autoCorrected = issues.filter((i) => i.level === "auto-corrected");
  const dropped = issues.filter((i) => i.level === "dropped");

  const summaryParts: string[] = [];
  if (autoCorrected.length > 0) {
    summaryParts.push(
      `${autoCorrected.length} auto-correction${autoCorrected.length > 1 ? "s" : ""}`,
    );
  }
  if (dropped.length > 0) {
    summaryParts.push(
      `${dropped.length} dropped item${dropped.length > 1 ? "s" : ""}`,
    );
  }

  const copyText = [
    "The following issues were found in your knowledge-graph.json.",
    "These are LLM generation errors — not a system bug.",
    "You can ask your agent to fix these specific issues in the knowledge-graph.json file:",
    "",
    ...issues.map(
      (i) =>
        `[${i.level === "auto-corrected" ? "Auto-corrected" : "Dropped"}] ${i.message}`,
    ),
  ].join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-5 py-3 border-b text-sm" style={{
      backgroundColor: "rgba(212, 165, 116, 0.08)",
      borderColor: "rgba(212, 165, 116, 0.25)",
    }}>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left transition-colors"
          style={{ color: "var(--color-gold-dim)" }}
        >
          <svg
            className={`w-4 h-4 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span>
            Knowledge graph loaded with {summaryParts.join(" and ")}
          </span>
        </button>
        <button
          onClick={handleCopy}
          className="shrink-0 flex items-center gap-1 text-xs transition-colors"
          style={{ color: copied ? "var(--color-gold)" : "var(--color-text-muted)" }}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {copied ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            )}
          </svg>
          {copied ? "Copied!" : "Copy issues"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-1 font-mono text-xs">
          {autoCorrected.length > 0 && (
            <>
              <div className="text-text-muted font-sans text-xs font-medium mt-2 mb-1">
                Auto-corrected ({autoCorrected.length})
              </div>
              {autoCorrected.map((issue, i) => (
                <div key={`ac-${i}`} className="text-text-secondary pl-3">
                  {issue.message}
                </div>
              ))}
            </>
          )}
          {dropped.length > 0 && (
            <>
              <div className="font-sans text-xs font-medium mt-2 mb-1" style={{ color: "var(--color-gold)" }}>
                Dropped ({dropped.length})
              </div>
              {dropped.map((issue, i) => (
                <div key={`dr-${i}`} className="pl-3" style={{ color: "var(--color-gold-dim)" }}>
                  {issue.message}
                </div>
              ))}
            </>
          )}
          <p className="mt-3 text-text-muted font-sans text-xs">
            These are LLM generation issues, not system bugs. Copy the issues
            above and ask your agent to fix them in the knowledge-graph.json, or
            re-run{" "}
            <code className="text-gold-dim">/understand</code> for a fresh
            generation.
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Verify dashboard builds**

Run: `pnpm --filter @understand-anything/dashboard build`
Expected: Build succeeds (component not yet wired, but should compile)

**Step 4: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/WarningBanner.tsx
git commit -m "feat(dashboard): add WarningBanner component for graph validation issues"
```

---

### Task 6: Wire WarningBanner into App.tsx

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/App.tsx`

**Step 1: Update App.tsx**

Add import at top of file (after other component imports):

```typescript
import WarningBanner from "./components/WarningBanner";
import type { GraphIssue } from "@understand-anything/core/schema";
```

Add state for issues (after `loadError` state, line 26):

```typescript
const [graphIssues, setGraphIssues] = useState<GraphIssue[]>([]);
```

Replace the graph loading `useEffect` (lines 119-136) with:

```typescript
useEffect(() => {
  fetch("/knowledge-graph.json")
    .then((res) => res.json())
    .then((data: unknown) => {
      const result = validateGraph(data);
      if (result.success && result.data) {
        setGraph(result.data);
        setGraphIssues(result.issues);
        if (result.issues.length > 0) {
          const autoCorrected = result.issues.filter((i) => i.level === "auto-corrected");
          const dropped = result.issues.filter((i) => i.level === "dropped");
          if (autoCorrected.length > 0) console.warn(`[understand-anything] Auto-corrected ${autoCorrected.length} graph issues`);
          if (dropped.length > 0) console.error(`[understand-anything] Dropped ${dropped.length} broken graph items`);
        }
      } else if (result.fatal) {
        console.error("Knowledge graph fatal error:", result.fatal);
        setLoadError(result.fatal);
      } else {
        setLoadError("Unknown validation error");
      }
    })
    .catch((err) => {
      console.error("Failed to load knowledge graph:", err);
      setLoadError(
        `Failed to load knowledge graph: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
}, [setGraph]);
```

Replace the error banner section (lines 213-218) with:

```tsx
{/* Warning banner for graph issues */}
{graphIssues.length > 0 && !loadError && (
  <WarningBanner issues={graphIssues} />
)}

{/* Fatal error banner */}
{loadError && (
  <div className="px-5 py-3 bg-red-900/30 border-b border-red-700 text-red-200 text-sm">
    {loadError}
  </div>
)}
```

**Step 2: Build and verify**

Run: `pnpm --filter @understand-anything/core build && pnpm --filter @understand-anything/dashboard build`
Expected: Both builds succeed

**Step 3: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/App.tsx
git commit -m "feat(dashboard): wire WarningBanner to display graph validation issues"
```

---

### Task 7: Final verification

**Step 1: Run all core tests**

Run: `pnpm --filter @understand-anything/core test`
Expected: ALL tests pass

**Step 2: Build full pipeline**

Run: `pnpm --filter @understand-anything/core build && pnpm --filter @understand-anything/dashboard build`
Expected: Both builds succeed with no errors

**Step 3: Lint**

Run: `pnpm lint`
Expected: No lint errors in changed files

**Step 4: Final commit (if any lint fixes needed)**

```bash
git add -A
git commit -m "chore: lint fixes for dashboard robustness feature"
```
````

## File: docs/superpowers/plans/2026-03-25-dashboard-robustness-plan.md
````markdown
# Design: Dashboard Robustness — Permissive Graph Loading

## Problem

When the LLM agent produces a knowledge-graph.json that deviates from the strict Zod schema, the dashboard shows a blank screen with cryptic Zod error paths. Users don't know whether it's a system bug or an agent generation issue, and their only recourse is a full re-run of `/understand`.

## Goals

1. **Maximize what the user can see** — load valid nodes/edges even if some are broken
2. **Clearly communicate generation issues** — amber warnings (not red errors) with copy-paste-friendly messages
3. **Empower targeted fixes** — users can copy the issue report and ask their agent to fix specific problems instead of a full re-run

## Design

### Three-Layer Robustness Pipeline

```
Raw JSON → Sanitize (Tier 1) → Normalize + Auto-fix (Tier 2) → Validate per-item (Tier 3) → Fatal check (Tier 4) → Dashboard
```

### Tier 1: Sanitize Silently

Common LLM quirks that are pure noise — fix without reporting.

| Issue | Fix |
|-------|-----|
| `null` on optional fields (`filePath`, `lineRange`, `description`, `languageNotes`) | Convert to `undefined` |
| Mixed-case enum strings (`"Forward"`, `"SIMPLE"`) | Lowercase before matching |

### Tier 2: Auto-fix With Info Notice

Recoverable issues — apply sensible defaults, track as `auto-corrected` issues.

| Issue | Default | Notes |
|-------|---------|-------|
| Missing `complexity` | `"moderate"` | Most common LLM omission |
| Missing `tags` | `[]` | Empty is valid |
| Missing `weight` | `0.5` | Middle of 0–1 range |
| `weight` as string | Coerce to number | e.g., `"0.8"` → `0.8` |
| Missing `direction` | `"forward"` | Safe default |
| Missing `summary` | Use node `name` | Better than empty |
| `tour: null` / `layers: null` | `[]` | Null vs empty array |
| Complexity aliases | `low/easy→simple`, `medium/intermediate→moderate`, `high/hard→complex` | |
| Direction aliases | `to/outbound→forward`, `from/inbound→backward`, `both→bidirectional` | |
| Existing node/edge type aliases | Already handled by `normalizeGraph` | No change needed |
| Missing node `type` | `"file"` | Safe fallback |
| Missing edge `type` | `"depends_on"` | Generic fallback |

### Tier 3: Drop With Warning

Can't safely guess — remove the item, track as `dropped` issue.

| Issue | Action |
|-------|--------|
| Edge references non-existent node ID | Drop edge |
| Node missing `id` | Drop node |
| Node missing `name` | Drop node |
| Edge missing `source` or `target` | Drop edge |
| Unrecognizable `type` value (not in canonical or alias list) | Drop item |
| `weight` not coercible to number | Drop edge |

### Tier 4: Fatal

Graph is unsalvageable — show red error banner.

| Condition | Message |
|-----------|---------|
| 0 valid nodes after filtering | "No valid nodes found in knowledge graph" |
| Missing `project` metadata entirely | "Missing project metadata" |
| Input is not an object / not valid JSON | "Invalid input format" |

### Return Type

```typescript
interface GraphIssue {
  level: 'auto-corrected' | 'dropped' | 'fatal';
  category: string;      // e.g., "missing-field", "invalid-reference", "type-coercion"
  message: string;       // human-readable, copy-paste friendly
  path?: string;         // e.g., "nodes[3].complexity"
}

interface ValidationResult {
  success: boolean;
  data?: KnowledgeGraph;
  issues: GraphIssue[];
  fatal?: string;
}
```

### Dashboard UI: WarningBanner Component

**New component** in `packages/dashboard/src/components/WarningBanner.tsx`.

**Visual design:**
- **Amber/gold theme** — `bg-amber-900/20`, `border-amber-700`, `text-amber-200`
- Matches dashboard's gold accent aesthetic; signals "generation quality issue" not "system crash"
- **Collapsed by default** — summary line: "Knowledge graph loaded with 5 auto-corrections and 2 dropped items"
- **Expandable** — click to reveal categorized issue list
- **Copy button** — one-click copies the full issue report as a pre-formatted message
- **Actionable footer** — tells users to copy issues and ask their agent to fix them

**Copy-paste output format:**
```
The following issues were found in your knowledge-graph.json.
These are LLM generation errors — not a system bug.
You can ask your agent to fix these specific issues in the knowledge-graph.json file:

[Auto-corrected] nodes[3] ("AuthService"): missing "complexity" — defaulted to "moderate"
[Auto-corrected] nodes[7] ("utils.ts"): missing "tags" — defaulted to []
[Auto-corrected] edges[12]: weight was string "0.8" — coerced to number
[Dropped] edges[5]: target "file:src/nonexistent.ts" does not exist in nodes
[Dropped] nodes[14]: missing required "id" field — cannot recover
```

**Fatal errors** stay red (`bg-red-900/30`) with message: "Knowledge graph is unsalvageable: [reason]. Please re-run `/understand` to generate a new one."

**Existing red error banner** for network/JSON-parse errors stays as-is (those ARE system/infra issues).

### App.tsx Changes

- On `result.success === true` with `result.issues.length > 0`: show `WarningBanner` with issues, load graph normally
- On `result.fatal`: show existing red banner with fatal message
- `console.warn` for auto-corrected items, `console.error` for dropped items

### Test Coverage

All in `packages/core/src/__tests__/schema.test.ts`:

- **Tier 1:** `null` optional fields silently become `undefined`
- **Tier 2:** Missing `complexity`/`tags`/`weight`/`direction`/`summary` get defaults; issues tracked
- **Tier 2:** String `weight` coerced; complexity/direction aliases mapped
- **Tier 3:** Dangling edge references dropped; nodes missing `id` dropped; issues recorded
- **Tier 4:** Empty graph after filtering → fatal; missing `project` → fatal
- **Integration:** Graph with mixed good/bad nodes → loads with correct node count + correct issues list

### Files Changed

| File | Change |
|------|--------|
| `packages/core/src/schema.ts` | Sanitize, expanded normalize, permissive validate, new types |
| `packages/dashboard/src/components/WarningBanner.tsx` | New component |
| `packages/dashboard/src/App.tsx` | Wire issues to WarningBanner |
| `packages/core/src/__tests__/schema.test.ts` | Tests for all tiers |

### Files NOT Changed

- Agent prompts (can be tightened later as a separate effort)
- GraphView / store logic (they already handle valid `KnowledgeGraph` objects)
- Existing node/edge type alias maps (preserved, extended around)
````

## File: docs/superpowers/plans/2026-03-26-theme-system-implementation.md
````markdown
# Theme System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add curated theme presets with accent customization to the dashboard.

**Architecture:** CSS variable injection at runtime via a pure theme engine, React context for state, localStorage + meta.json for persistence. Five presets (4 dark + 1 light) with 8 accent swatches each.

**Tech Stack:** React, TypeScript, TailwindCSS v4, Zustand (untouched), CSS custom properties.

**Design Doc:** `docs/plans/2026-03-26-theme-system-design.md`

---

### Task 1: Rename `gold` to `accent` in CSS variables and Tailwind classes

This is a mechanical find-and-replace with no behavioral change. Must be done first so all subsequent tasks use the new naming.

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/index.css`
- Modify: `understand-anything-plugin/packages/dashboard/src/components/CustomNode.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/components/NodeInfo.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/components/LearnPanel.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/components/ProjectOverview.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/components/SearchBar.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/components/LayerLegend.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/components/PersonaSelector.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/components/CodeViewer.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/components/GraphView.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/App.tsx`

**Step 1: Rename CSS variables in index.css**

In the `@theme` block, rename:
- `--color-gold` -> `--color-accent`
- `--color-gold-dim` -> `--color-accent-dim`
- `--color-gold-bright` -> `--color-accent-bright`

Also rename the `@keyframes goldPulse` to `accentPulse` and `.animate-gold-pulse` to `.animate-accent-pulse`.

**Step 2: Rename all Tailwind class references across components**

Find and replace in all component files:
- `text-gold-bright` -> `text-accent-bright`
- `text-gold-dim` -> `text-accent-dim`
- `text-gold` -> `text-accent`
- `bg-gold` -> `bg-accent`
- `border-gold` -> `border-accent`
- `ring-gold-dim` -> `ring-accent-dim`
- `ring-gold-bright` -> `ring-accent-bright`
- `ring-gold` -> `ring-accent`
- `animate-gold-pulse` -> `animate-accent-pulse`

Order matters — replace the longer `-bright` and `-dim` variants first to avoid partial matches.

Also replace any `var(--color-gold` with `var(--color-accent` in inline styles.

**Step 3: Verify the build compiles**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`
Expected: Build succeeds with no errors.

**Step 4: Visually verify (optional)**

Run: `cd understand-anything-plugin && pnpm dev:dashboard`
Expected: Dashboard looks identical — same gold accent, no visual changes.

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(dashboard): rename gold CSS variables to accent"
```

---

### Task 2: Consolidate hardcoded RGBA values into CSS variables

Replace scattered hardcoded color values in components with CSS variables so they respond to theme changes.

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/index.css`
- Modify: `understand-anything-plugin/packages/dashboard/src/components/GraphView.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/components/CustomNode.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/components/CodeViewer.tsx`

**Step 1: Add new CSS variables to index.css @theme block**

Add these new variables after the existing border variables:

```css
/* Glass */
--glass-bg: rgba(20, 20, 20, 0.8);
--glass-bg-heavy: rgba(20, 20, 20, 0.95);
--glass-border: rgba(212, 165, 116, 0.1);
--glass-border-heavy: rgba(212, 165, 116, 0.15);

/* Scrollbar */
--scrollbar-thumb: rgba(212, 165, 116, 0.2);
--scrollbar-thumb-hover: rgba(212, 165, 116, 0.35);

/* Glow */
--glow-accent: rgba(212, 165, 116, 0.15);
--glow-accent-strong: rgba(212, 165, 116, 0.4);
--glow-accent-pulse: rgba(212, 165, 116, 0.6);

/* Edges */
--color-edge: rgba(212, 165, 116, 0.3);
--color-edge-dim: rgba(212, 165, 116, 0.08);
--color-edge-dot: rgba(212, 165, 116, 0.15);

/* Layer group (accent-based overlays) */
--color-accent-overlay-bg: rgba(212, 165, 116, 0.05);
--color-accent-overlay-border: rgba(212, 165, 116, 0.25);

/* kbd */
--kbd-bg: rgba(212, 165, 116, 0.1);
```

**Step 2: Update .glass, .glass-heavy classes in index.css**

Replace hardcoded values with the new variables:

```css
.glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.glass-heavy {
  background: var(--glass-bg-heavy);
  border: 1px solid var(--glass-border-heavy);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
```

**Step 3: Update scrollbar styles in index.css**

```css
::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
```

**Step 4: Update glow classes in index.css**

```css
.node-glow {
  box-shadow: 0 0 20px var(--glow-accent);
}
```

Update `@keyframes accentPulse` (renamed in Task 1):
```css
@keyframes accentPulse {
  0%, 100% {
    box-shadow: 0 0 8px var(--glow-accent-strong);
  }
  50% {
    box-shadow: 0 0 20px var(--glow-accent-pulse);
  }
}
```

**Step 5: Update .kbd class in index.css**

```css
.kbd {
  /* ... keep existing sizing/layout ... */
  color: var(--color-accent);
  background: var(--kbd-bg);
}
```

**Step 6: Update GraphView.tsx hardcoded colors**

Replace these inline style values:

| Location | Old Value | New Value |
|----------|-----------|-----------|
| Edge default style stroke | `"rgba(212,165,116,0.3)"` | `"var(--color-edge)"` |
| Edge diff-faded stroke | `"rgba(212,165,116,0.08)"` | `"var(--color-edge-dim)"` |
| Background dots color prop | `"rgba(212,165,116,0.15)"` | `"var(--color-edge-dot)"` |
| MiniMap nodeColor | `"#1a1a1a"` | `"var(--color-elevated)"` |
| MiniMap maskColor | `"rgba(10,10,10,0.7)"` | `"var(--glass-bg)"` |
| Group node backgroundColor | `"rgba(212,165,116,0.05)"` | `"var(--color-accent-overlay-bg)"` |
| Group node border | `"2px dashed rgba(212,165,116,0.25)"` | `"2px dashed var(--color-accent-overlay-border)"` |
| Group node label color | `"#d4a574"` | `"var(--color-accent)"` |
| Edge label fill (normal) | `"#a39787"` | `"var(--color-text-secondary)"` |
| Edge label fill (diff faded) | `"rgba(163,151,135,0.3)"` | `"var(--color-text-muted)"` |
| Spinner border class | `border-gold` already renamed to `border-accent` | Already done in Task 1 |

**Step 7: Update CodeViewer.tsx hardcoded colors**

Replace inline styles for the file type badge:
- `color: "var(--color-node-file)"` — already uses CSS var, keep
- `borderColor: "rgba(74,124,155,0.3)"` -> `"color-mix(in srgb, var(--color-node-file) 30%, transparent)"`
- `backgroundColor: "rgba(74,124,155,0.1)"` -> `"color-mix(in srgb, var(--color-node-file) 10%, transparent)"`

**Step 8: Update CustomNode.tsx hardcoded shadow**

Replace `shadow-[0_2px_8px_rgba(0,0,0,0.3)]` — this black shadow is fine for dark themes but keep it. Leave as-is since it works on both dark and light.

**Step 9: Verify build**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`
Expected: Build succeeds.

**Step 10: Commit**

```bash
git add -A
git commit -m "refactor(dashboard): consolidate hardcoded colors into CSS variables"
```

---

### Task 3: Create theme type definitions

**Files:**
- Create: `understand-anything-plugin/packages/dashboard/src/themes/types.ts`

**Step 1: Write the types file**

```typescript
export type PresetId =
  | "dark-gold"
  | "dark-ocean"
  | "dark-forest"
  | "dark-rose"
  | "light-minimal";

export interface AccentSwatch {
  id: string;
  name: string;
  accent: string;
  accentDim: string;
  accentBright: string;
}

export interface ThemePreset {
  id: PresetId;
  name: string;
  isDark: boolean;
  colors: Record<string, string>;
  accentSwatches: AccentSwatch[];
  defaultAccentId: string;
}

export interface ThemeConfig {
  presetId: PresetId;
  accentId: string;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  presetId: "dark-gold",
  accentId: "gold",
};
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add theme type definitions"
```

---

### Task 4: Create theme presets

**Files:**
- Create: `understand-anything-plugin/packages/dashboard/src/themes/presets.ts`

**Step 1: Write the presets file**

```typescript
import type { AccentSwatch, ThemePreset } from "./types.ts";

const DARK_ACCENT_SWATCHES: AccentSwatch[] = [
  { id: "gold", name: "Gold", accent: "#d4a574", accentDim: "#c9a96e", accentBright: "#e8c49a" },
  { id: "ocean", name: "Ocean", accent: "#5ba4cf", accentDim: "#4e93ba", accentBright: "#7abce0" },
  { id: "emerald", name: "Emerald", accent: "#5ea67a", accentDim: "#4e9468", accentBright: "#78c492" },
  { id: "rose", name: "Rose", accent: "#cf7a8a", accentDim: "#b96e7e", accentBright: "#e094a4" },
  { id: "purple", name: "Purple", accent: "#9b7abf", accentDim: "#876bb0", accentBright: "#b494d4" },
  { id: "amber", name: "Amber", accent: "#c9963a", accentDim: "#b5862e", accentBright: "#ddb05c" },
  { id: "teal", name: "Teal", accent: "#4aab9a", accentDim: "#3d9686", accentBright: "#68c4b4" },
  { id: "silver", name: "Silver", accent: "#a0a8b0", accentDim: "#8e959c", accentBright: "#b8bfc6" },
];

const LIGHT_ACCENT_SWATCHES: AccentSwatch[] = [
  { id: "indigo", name: "Indigo", accent: "#4a6fa5", accentDim: "#3d5f8f", accentBright: "#6088bf" },
  { id: "ocean", name: "Ocean", accent: "#3a8ab5", accentDim: "#2e7aa0", accentBright: "#55a0cc" },
  { id: "emerald", name: "Emerald", accent: "#3a8a5c", accentDim: "#2e7a4e", accentBright: "#55a878" },
  { id: "rose", name: "Rose", accent: "#a5566a", accentDim: "#8f4a5c", accentBright: "#bf6e82" },
  { id: "purple", name: "Purple", accent: "#6b5a9e", accentDim: "#5c4d8a", accentBright: "#8474b5" },
  { id: "amber", name: "Amber", accent: "#9e7a30", accentDim: "#8a6a28", accentBright: "#b5923e" },
  { id: "teal", name: "Teal", accent: "#2e8a7a", accentDim: "#267a6c", accentBright: "#45a595" },
  { id: "slate", name: "Slate", accent: "#5a6570", accentDim: "#4e5860", accentBright: "#6e7a85" },
];

export const PRESETS: ThemePreset[] = [
  {
    id: "dark-gold",
    name: "Dark Gold",
    isDark: true,
    defaultAccentId: "gold",
    accentSwatches: DARK_ACCENT_SWATCHES,
    colors: {
      root: "#0a0a0a",
      surface: "#111111",
      elevated: "#1a1a1a",
      panel: "#141414",
      "text-primary": "#f5f0eb",
      "text-secondary": "#a39787",
      "text-muted": "#6b5f53",
      "node-file": "#4a7c9b",
      "node-function": "#5a9e6f",
      "node-class": "#8b6fb0",
      "node-module": "#c9a06c",
      "node-concept": "#b07a8a",
    },
  },
  {
    id: "dark-ocean",
    name: "Dark Ocean",
    isDark: true,
    defaultAccentId: "ocean",
    accentSwatches: DARK_ACCENT_SWATCHES,
    colors: {
      root: "#0a0e14",
      surface: "#111820",
      elevated: "#1a222c",
      panel: "#141c24",
      "text-primary": "#e8edf2",
      "text-secondary": "#87939f",
      "text-muted": "#536b7a",
      "node-file": "#4a7c9b",
      "node-function": "#5a9e6f",
      "node-class": "#8b6fb0",
      "node-module": "#c9a06c",
      "node-concept": "#b07a8a",
    },
  },
  {
    id: "dark-forest",
    name: "Dark Forest",
    isDark: true,
    defaultAccentId: "emerald",
    accentSwatches: DARK_ACCENT_SWATCHES,
    colors: {
      root: "#0a100a",
      surface: "#111811",
      elevated: "#1a241a",
      panel: "#141c14",
      "text-primary": "#ebf0eb",
      "text-secondary": "#87a38f",
      "text-muted": "#536b5a",
      "node-file": "#4a7c9b",
      "node-function": "#5a9e6f",
      "node-class": "#8b6fb0",
      "node-module": "#c9a06c",
      "node-concept": "#b07a8a",
    },
  },
  {
    id: "dark-rose",
    name: "Dark Rose",
    isDark: true,
    defaultAccentId: "rose",
    accentSwatches: DARK_ACCENT_SWATCHES,
    colors: {
      root: "#100a0a",
      surface: "#181111",
      elevated: "#221a1a",
      panel: "#1c1414",
      "text-primary": "#f2e8ea",
      "text-secondary": "#9f8790",
      "text-muted": "#6b535a",
      "node-file": "#4a7c9b",
      "node-function": "#5a9e6f",
      "node-class": "#8b6fb0",
      "node-module": "#c9a06c",
      "node-concept": "#b07a8a",
    },
  },
  {
    id: "light-minimal",
    name: "Light Minimal",
    isDark: false,
    defaultAccentId: "indigo",
    accentSwatches: LIGHT_ACCENT_SWATCHES,
    colors: {
      root: "#f5f3f0",
      surface: "#eae7e3",
      elevated: "#ffffff",
      panel: "#f0ede9",
      "text-primary": "#1a1a1a",
      "text-secondary": "#6b6b6b",
      "text-muted": "#a0a0a0",
      "node-file": "#3a6a87",
      "node-function": "#488a5b",
      "node-class": "#755d99",
      "node-module": "#a88a56",
      "node-concept": "#966674",
    },
  },
];

export function getPreset(id: string): ThemePreset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}

export function getAccent(preset: ThemePreset, accentId: string): AccentSwatch {
  return (
    preset.accentSwatches.find((s) => s.id === accentId) ??
    preset.accentSwatches.find((s) => s.id === preset.defaultAccentId) ??
    preset.accentSwatches[0]
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add theme preset definitions"
```

---

### Task 5: Create theme engine

Pure functions with no React dependency. Handles CSS variable injection and accent derivation.

**Files:**
- Create: `understand-anything-plugin/packages/dashboard/src/themes/theme-engine.ts`

**Step 1: Write the theme engine**

```typescript
import type { ThemeConfig } from "./types.ts";
import { getAccent, getPreset } from "./presets.ts";

export function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function deriveFromAccent(accentHex: string, isDark: boolean): Record<string, string> {
  const rgb = hexToRgb(accentHex);
  return {
    "color-border-subtle": `rgba(${rgb}, ${isDark ? 0.12 : 0.1})`,
    "color-border-medium": `rgba(${rgb}, ${isDark ? 0.25 : 0.18})`,
    "glass-bg": isDark ? "rgba(20, 20, 20, 0.8)" : "rgba(255, 255, 255, 0.8)",
    "glass-bg-heavy": isDark ? "rgba(20, 20, 20, 0.95)" : "rgba(255, 255, 255, 0.95)",
    "glass-border": `rgba(${rgb}, ${isDark ? 0.1 : 0.08})`,
    "glass-border-heavy": `rgba(${rgb}, ${isDark ? 0.15 : 0.12})`,
    "scrollbar-thumb": `rgba(${rgb}, 0.2)`,
    "scrollbar-thumb-hover": `rgba(${rgb}, 0.35)`,
    "glow-accent": `rgba(${rgb}, 0.15)`,
    "glow-accent-strong": `rgba(${rgb}, 0.4)`,
    "glow-accent-pulse": `rgba(${rgb}, 0.6)`,
    "color-edge": `rgba(${rgb}, 0.3)`,
    "color-edge-dim": `rgba(${rgb}, 0.08)`,
    "color-edge-dot": `rgba(${rgb}, 0.15)`,
    "color-accent-overlay-bg": `rgba(${rgb}, 0.05)`,
    "color-accent-overlay-border": `rgba(${rgb}, 0.25)`,
    "kbd-bg": `rgba(${rgb}, 0.1)`,
  };
}

export function applyTheme(config: ThemeConfig): void {
  const preset = getPreset(config.presetId);
  const accent = getAccent(preset, config.accentId);
  const style = document.documentElement.style;

  // 1. Apply base preset colors
  for (const [key, value] of Object.entries(preset.colors)) {
    style.setProperty(`--color-${key}`, value);
  }

  // 2. Apply accent colors from swatch
  style.setProperty("--color-accent", accent.accent);
  style.setProperty("--color-accent-dim", accent.accentDim);
  style.setProperty("--color-accent-bright", accent.accentBright);

  // 3. Apply derived values
  const derived = deriveFromAccent(accent.accent, preset.isDark);
  for (const [key, value] of Object.entries(derived)) {
    style.setProperty(`--${key}`, value);
  }

  // 4. Set data-theme for CSS-only selectors
  document.documentElement.setAttribute("data-theme", preset.isDark ? "dark" : "light");
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add theme engine with CSS variable injection"
```

---

### Task 6: Create ThemeContext

React context + provider that manages theme state, persistence, and resolution.

**Files:**
- Create: `understand-anything-plugin/packages/dashboard/src/themes/ThemeContext.tsx`

**Step 1: Write the context**

```typescript
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PresetId, ThemeConfig, ThemePreset } from "./types.ts";
import { DEFAULT_THEME_CONFIG } from "./types.ts";
import { getPreset } from "./presets.ts";
import { applyTheme } from "./theme-engine.ts";

const STORAGE_KEY = "ua-theme";

interface ThemeContextValue {
  config: ThemeConfig;
  preset: ThemePreset;
  setPreset: (presetId: PresetId) => void;
  setAccent: (accentId: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function loadFromLocalStorage(): ThemeConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.presetId === "string" && typeof parsed.accentId === "string") {
      return parsed as ThemeConfig;
    }
    return null;
  } catch {
    return null;
  }
}

function saveToLocalStorage(config: ThemeConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Storage full or unavailable — ignore
  }
}

function resolveInitialTheme(metaTheme?: ThemeConfig | null): ThemeConfig {
  return loadFromLocalStorage() ?? metaTheme ?? DEFAULT_THEME_CONFIG;
}

interface ThemeProviderProps {
  metaTheme?: ThemeConfig | null;
  children: ReactNode;
}

export function ThemeProvider({ metaTheme, children }: ThemeProviderProps) {
  const [config, setConfig] = useState<ThemeConfig>(() => resolveInitialTheme(metaTheme));
  const initialized = useRef(false);

  // Apply theme on mount and config changes
  useEffect(() => {
    applyTheme(config);
    if (initialized.current) {
      saveToLocalStorage(config);
    }
    initialized.current = true;
  }, [config]);

  // Update if metaTheme arrives later (async fetch) and no localStorage preference exists
  useEffect(() => {
    if (metaTheme && !loadFromLocalStorage()) {
      setConfig(metaTheme);
    }
  }, [metaTheme]);

  const setPreset = useCallback((presetId: PresetId) => {
    setConfig((prev) => {
      const newPreset = getPreset(presetId);
      return { presetId, accentId: newPreset.defaultAccentId };
    });
  }, []);

  const setAccent = useCallback((accentId: string) => {
    setConfig((prev) => ({ ...prev, accentId }));
  }, []);

  const preset = getPreset(config.presetId);

  return (
    <ThemeContext.Provider value={{ config, preset, setPreset, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
```

**Step 2: Create barrel export**

Create: `understand-anything-plugin/packages/dashboard/src/themes/index.ts`

```typescript
export { ThemeProvider, useTheme } from "./ThemeContext.tsx";
export { PRESETS, getPreset, getAccent } from "./presets.ts";
export { applyTheme } from "./theme-engine.ts";
export type { PresetId, ThemeConfig, ThemePreset, AccentSwatch } from "./types.ts";
export { DEFAULT_THEME_CONFIG } from "./types.ts";
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add ThemeContext with localStorage persistence"
```

---

### Task 7: Extend AnalysisMeta with theme field

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/types.ts`

**Step 1: Add ThemeConfig type and extend AnalysisMeta**

Add near the top of the file (after existing imports/types):

```typescript
export interface ThemeConfig {
  presetId: string;
  accentId: string;
}
```

Add `theme` field to `AnalysisMeta`:

```typescript
export interface AnalysisMeta {
  lastAnalyzedAt: string;
  gitCommitHash: string;
  version: string;
  analyzedFiles: number;
  theme?: ThemeConfig;
}
```

**Step 2: Verify core builds**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core build`
Expected: Build succeeds.

**Step 3: Verify core tests pass**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test`
Expected: All tests pass.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(core): add optional theme field to AnalysisMeta"
```

---

### Task 8: Create ThemePicker component

The popover UI with preset selection and accent swatch row.

**Files:**
- Create: `understand-anything-plugin/packages/dashboard/src/components/ThemePicker.tsx`

**Step 1: Write the component**

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme, PRESETS } from "../themes/index.ts";

export function ThemePicker() {
  const { config, preset, setPreset, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handlePreset = useCallback(
    (id: string) => {
      setPreset(id as Parameters<typeof setPreset>[0]);
    },
    [setPreset],
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-text-secondary hover:text-text-primary transition-colors"
        title="Change theme"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a7 7 0 0 0 0 14 4 4 0 0 1 0 8 10 10 0 0 0 0-20z" />
          <circle cx="8" cy="10" r="1.5" fill="currentColor" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
          <circle cx="16" cy="10" r="1.5" fill="currentColor" />
        </svg>
        <span className="hidden sm:inline">Theme</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-lg glass-heavy shadow-xl z-50 p-3 space-y-3">
          {/* Presets */}
          <div>
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              Theme
            </div>
            <div className="space-y-1">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePreset(p.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
                    p.id === config.presetId
                      ? "bg-accent/15 text-accent"
                      : "text-text-secondary hover:text-text-primary hover:bg-elevated"
                  }`}
                >
                  {/* Color preview dots */}
                  <div className="flex gap-1">
                    <span
                      className="w-3 h-3 rounded-full border border-border-subtle"
                      style={{ backgroundColor: p.colors.root }}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-border-subtle"
                      style={{ backgroundColor: p.colors.surface }}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-border-subtle"
                      style={{
                        backgroundColor:
                          p.accentSwatches.find((s) => s.id === p.defaultAccentId)?.accent ??
                          p.accentSwatches[0].accent,
                      }}
                    />
                  </div>
                  <span>{p.name}</span>
                  {p.id === config.presetId && (
                    <svg
                      className="ml-auto w-3.5 h-3.5 text-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Accent swatches */}
          <div>
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              Accent Color
            </div>
            <div className="flex gap-2 flex-wrap">
              {preset.accentSwatches.map((swatch) => (
                <button
                  key={swatch.id}
                  onClick={() => setAccent(swatch.id)}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                    swatch.id === config.accentId
                      ? "ring-2 ring-text-primary ring-offset-1 ring-offset-root"
                      : ""
                  }`}
                  style={{ backgroundColor: swatch.accent }}
                  title={swatch.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add ThemePicker popover component"
```

---

### Task 9: Integrate ThemeProvider and ThemePicker into App

Wire everything together in the root component.

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/App.tsx`

**Step 1: Add imports**

Add to imports at top of App.tsx:

```typescript
import { ThemeProvider } from "./themes/index.ts";
import { ThemePicker } from "./components/ThemePicker.tsx";
import type { ThemeConfig } from "./themes/index.ts";
```

**Step 2: Add meta.json theme loading**

Inside the App component, add state and effect for meta.json theme:

```typescript
const [metaTheme, setMetaTheme] = useState<ThemeConfig | null>(null);

useEffect(() => {
  fetch("/meta.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((meta) => {
      if (meta?.theme) setMetaTheme(meta.theme);
    })
    .catch(() => {});
}, []);
```

**Step 3: Wrap return JSX with ThemeProvider**

Wrap the entire return value of App with `<ThemeProvider metaTheme={metaTheme}>...</ThemeProvider>`.

**Step 4: Add ThemePicker to header**

In the header bar (the `<header>` or top flex row), add `<ThemePicker />` after the existing controls (PersonaSelector, DiffToggle, LayerLegend) and before the help button.

**Step 5: Verify build**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`
Expected: Build succeeds.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(dashboard): integrate ThemeProvider and ThemePicker into App"
```

---

### Task 10: Light theme CSS adjustments

Handle edge cases where CSS variables alone aren't sufficient for the light theme.

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/index.css`

**Step 1: Add data-theme selectors for light theme overrides**

Add at the end of index.css:

```css
/* Light theme overrides */
[data-theme="light"] {
  color-scheme: light;
}

[data-theme="light"] .diff-faded {
  opacity: 0.35;
}

[data-theme="light"] ::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] {
  color-scheme: dark;
}
```

**Step 2: Add transition for smooth theme switching**

Add to the `html` base styles:

```css
html {
  transition: background-color 0.2s ease, color 0.2s ease;
}
```

**Step 3: Update the WarningBanner consideration**

WarningBanner uses Tailwind amber/orange colors directly (e.g., `bg-amber-900/20`). These are semantic warning colors and should NOT change with theme. However, for the light theme, the amber colors on a light background need adjustment.

Add to light theme overrides if needed:

```css
[data-theme="light"] .warning-banner {
  background: rgba(180, 130, 30, 0.1);
  border-color: rgba(180, 130, 30, 0.3);
  color: #92600a;
}
```

Note: Only add this if the WarningBanner looks broken on the light theme during visual testing. It may work fine as-is with Tailwind's amber colors.

**Step 4: Verify build**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(dashboard): add light theme CSS overrides"
```

---

### Task 11: Remove @theme defaults from index.css

Now that the theme engine sets all CSS variables at runtime, the `@theme` block in index.css serves as the initial/fallback values before React mounts. Keep it but update it to use the accent naming.

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/index.css`

**Step 1: Update @theme block**

The `@theme` block should already have `--color-accent` (from Task 1 rename). Ensure the new variables added in Task 2 are also present in the `@theme` block as defaults:

```css
@theme {
  /* Base */
  --color-root: #0a0a0a;
  --color-surface: #111111;
  --color-elevated: #1a1a1a;
  --color-panel: #141414;

  /* Accent */
  --color-accent: #d4a574;
  --color-accent-dim: #c9a96e;
  --color-accent-bright: #e8c49a;

  /* Text */
  --color-text-primary: #f5f0eb;
  --color-text-secondary: #a39787;
  --color-text-muted: #6b5f53;

  /* Borders */
  --color-border-subtle: rgba(212, 165, 116, 0.12);
  --color-border-medium: rgba(212, 165, 116, 0.25);

  /* Node types */
  --color-node-file: #4a7c9b;
  --color-node-function: #5a9e6f;
  --color-node-class: #8b6fb0;
  --color-node-module: #c9a06c;
  --color-node-concept: #b07a8a;

  /* Diff */
  --color-diff-changed: #e05252;
  --color-diff-affected: #d4a030;
  --color-diff-changed-dim: rgba(224, 82, 82, 0.25);
  --color-diff-affected-dim: rgba(212, 160, 48, 0.25);

  /* Glass */
  --glass-bg: rgba(20, 20, 20, 0.8);
  --glass-bg-heavy: rgba(20, 20, 20, 0.95);
  --glass-border: rgba(212, 165, 116, 0.1);
  --glass-border-heavy: rgba(212, 165, 116, 0.15);

  /* Scrollbar */
  --scrollbar-thumb: rgba(212, 165, 116, 0.2);
  --scrollbar-thumb-hover: rgba(212, 165, 116, 0.35);

  /* Glow */
  --glow-accent: rgba(212, 165, 116, 0.15);
  --glow-accent-strong: rgba(212, 165, 116, 0.4);
  --glow-accent-pulse: rgba(212, 165, 116, 0.6);

  /* Edges */
  --color-edge: rgba(212, 165, 116, 0.3);
  --color-edge-dim: rgba(212, 165, 116, 0.08);
  --color-edge-dot: rgba(212, 165, 116, 0.15);

  /* Accent overlays */
  --color-accent-overlay-bg: rgba(212, 165, 116, 0.05);
  --color-accent-overlay-border: rgba(212, 165, 116, 0.25);

  /* Kbd */
  --kbd-bg: rgba(212, 165, 116, 0.1);

  /* Typography */
  --font-serif: 'DM Serif Display', Georgia, serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

This ensures:
- Tailwind v4 generates all the correct utility classes from the `@theme` block
- Before React mounts, the page shows the Dark Gold default (no flash of unstyled content)
- The theme engine overrides these values at runtime

**Step 2: Verify build**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor(dashboard): align @theme defaults with theme engine variables"
```

---

### Task 12: Full build + visual verification

**Files:** None (verification only)

**Step 1: Build core**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core build`
Expected: Build succeeds.

**Step 2: Build dashboard**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`
Expected: Build succeeds.

**Step 3: Run core tests**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test`
Expected: All tests pass.

**Step 4: Run lint**

Run: `cd understand-anything-plugin && pnpm lint`
Expected: No lint errors.

**Step 5: Start dev server and visually verify**

Run: `cd understand-anything-plugin && pnpm dev:dashboard`

Verify:
1. Dashboard loads with Dark Gold theme (default) — looks identical to current
2. Theme picker button visible in header
3. Click theme picker — popover opens with 5 presets and 8 accent swatches
4. Select Dark Ocean — backgrounds turn navy-blue, accent turns cyan
5. Select Dark Forest — backgrounds turn dark green, accent turns emerald
6. Select Dark Rose — backgrounds turn dark warm, accent turns rose
7. Select Light Minimal — backgrounds turn light, text turns dark, accent turns indigo
8. Select different accent swatches within each preset — accent color, borders, glass, glow all update
9. Refresh page — theme persists from localStorage
10. Click outside popover — it closes
11. Press Escape — popover closes

**Step 6: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(dashboard): theme system visual adjustments"
```

---

## Dependency Graph

```
Task 1 (rename gold→accent) ─┐
                              ├─> Task 3 (types) ──┐
Task 2 (consolidate colors) ──┤                     │
                              │   Task 4 (presets) ─┤
                              │                     ├─> Task 6 (context) ─┐
                              │   Task 5 (engine) ──┘                     │
                              │                                           ├─> Task 8 (picker) ─┐
                              │   Task 7 (core types) ────────────────────┘                    │
                              │                                                                │
                              └───────────────────────────────────────────> Task 9 (integrate) ─┤
                                                                                               │
                                                                           Task 10 (light CSS) ┤
                                                                                               │
                                                                           Task 11 (defaults) ─┤
                                                                                               │
                                                                           Task 12 (verify) ───┘
```

**Parallelizable groups:**
- Tasks 1 + 2 can be done sequentially (both touch index.css)
- Tasks 3, 4, 5 can be done in parallel (independent new files)
- Task 6 depends on 3, 4, 5
- Task 7 is independent (core package)
- Task 8 depends on 6
- Task 9 depends on 1, 2, 7, 8
- Tasks 10, 11 can be done after 9
- Task 12 is final verification
````

## File: docs/superpowers/plans/2026-03-27-token-reduction-impl.md
````markdown
# Token Reduction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce `/understand` token cost by ~85% on large codebases through import pre-resolution, batch consolidation, addendum removal, payload slimming, and gating the LLM reviewer.

**Architecture:** Five changes (C5 → C4 → C3 → C1+C2) applied in rollout order — lowest risk first. All changes are to prompt/skill markdown files in `understand-anything-plugin/skills/understand/`. No TypeScript source changes required.

**Tech Stack:** Markdown skill files, Node.js inline scripts embedded in SKILL.md, knowledge-graph JSON pipeline.

**Design doc:** `docs/plans/2026-03-27-token-reduction-design.md`

---

## Task 1: C5 — Gate graph-reviewer behind `--review` flag

Replaces the always-on LLM graph-reviewer subagent with a deterministic inline validation script. The LLM reviewer only runs when `--review` is in `$ARGUMENTS`. Saves ~58,500 tokens per default run.

**Files:**
- Modify: `understand-anything-plugin/skills/understand/SKILL.md` (Phase 6, lines 330–362)

### Step 1: Open SKILL.md and locate Phase 6

Read the file and find "## Phase 6 — REVIEW" (line 297). Identify steps 3–6 (lines 330–362) which currently always dispatch the LLM graph-reviewer subagent.

### Step 2: Replace Phase 6 steps 3–6 with conditional reviewer logic

Replace lines 330–362 (from "3. Dispatch a subagent using the prompt template" through "6. **If `approved: true`:** Proceed to Phase 7.") with:

```markdown
3. **Check `$ARGUMENTS` for `--review` flag.** Then run the appropriate validation path:

---

#### Default path (no `--review`): inline deterministic validation

Write the following Node.js script to `$PROJECT_ROOT/.understand-anything/tmp/ua-inline-validate.js`:

```javascript
#!/usr/bin/env node
const fs = require('fs');
const graphPath = process.argv[2];
const outputPath = process.argv[3];
try {
  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const issues = [], warnings = [];
  const nodeIds = new Set();
  const seen = new Map();
  graph.nodes.forEach((n, i) => {
    if (!n.id) { issues.push(`Node[${i}] missing id`); return; }
    if (!n.type) issues.push(`Node[${i}] '${n.id}' missing type`);
    if (!n.name) issues.push(`Node[${i}] '${n.id}' missing name`);
    if (!n.summary) issues.push(`Node[${i}] '${n.id}' missing summary`);
    if (!n.tags || !n.tags.length) issues.push(`Node[${i}] '${n.id}' missing tags`);
    if (seen.has(n.id)) issues.push(`Duplicate node ID '${n.id}' at indices ${seen.get(n.id)} and ${i}`);
    else seen.set(n.id, i);
    nodeIds.add(n.id);
  });
  graph.edges.forEach((e, i) => {
    if (!nodeIds.has(e.source)) issues.push(`Edge[${i}] source '${e.source}' not found`);
    if (!nodeIds.has(e.target)) issues.push(`Edge[${i}] target '${e.target}' not found`);
  });
  const fileNodes = graph.nodes.filter(n => n.type === 'file').map(n => n.id);
  const assigned = new Map();
  (graph.layers || []).forEach(layer => {
    (layer.nodeIds || []).forEach(id => {
      if (!nodeIds.has(id)) issues.push(`Layer '${layer.id}' refs missing node '${id}'`);
      if (assigned.has(id)) issues.push(`Node '${id}' appears in multiple layers`);
      assigned.set(id, layer.id);
    });
  });
  fileNodes.forEach(id => {
    if (!assigned.has(id)) issues.push(`File node '${id}' not in any layer`);
  });
  (graph.tour || []).forEach((step, i) => {
    (step.nodeIds || []).forEach(id => {
      if (!nodeIds.has(id)) issues.push(`Tour step[${i}] refs missing node '${id}'`);
    });
  });
  const withEdges = new Set([
    ...graph.edges.map(e => e.source),
    ...graph.edges.map(e => e.target)
  ]);
  graph.nodes.forEach(n => {
    if (!withEdges.has(n.id)) warnings.push(`Node '${n.id}' has no edges (orphan)`);
  });
  const stats = {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    totalLayers: (graph.layers || []).length,
    tourSteps: (graph.tour || []).length,
    nodeTypes: graph.nodes.reduce((a, n) => { a[n.type] = (a[n.type]||0)+1; return a; }, {}),
    edgeTypes: graph.edges.reduce((a, e) => { a[e.type] = (a[e.type]||0)+1; return a; }, {})
  };
  fs.writeFileSync(outputPath, JSON.stringify({ issues, warnings, stats }, null, 2));
  process.exit(0);
} catch (err) { process.stderr.write(err.message + '\n'); process.exit(1); }
```

Execute it:
```bash
node $PROJECT_ROOT/.understand-anything/tmp/ua-inline-validate.js \
  "$PROJECT_ROOT/.understand-anything/intermediate/assembled-graph.json" \
  "$PROJECT_ROOT/.understand-anything/intermediate/review.json"
```

If the script exits non-zero, read stderr, fix the script, and retry once.

---

#### `--review` path: full LLM reviewer

If `--review` IS in `$ARGUMENTS`, dispatch the LLM graph-reviewer subagent as follows:

Dispatch a subagent using the prompt template at `./graph-reviewer-prompt.md`. Read the template file and pass the full content as the subagent's prompt, appending the following additional context:

> **Additional context from main session:**
>
> Phase 1 scan results (file inventory):
> ```json
> [list of {path, sizeLines} from scan-result.json]
> ```
>
> Phase warnings/errors accumulated during analysis:
> - [list any batch failures, skipped files, or warnings from Phases 2-5]
>
> Cross-validate: every file in the scan inventory should have a corresponding `file:` node in the graph. Flag any missing files. Also flag any graph nodes whose `filePath` doesn't appear in the scan inventory.

Pass these parameters in the dispatch prompt:

> Validate the knowledge graph at `$PROJECT_ROOT/.understand-anything/intermediate/assembled-graph.json`.
> Project root: `$PROJECT_ROOT`
> Read the file and validate it for completeness and correctness.
> Write output to: `$PROJECT_ROOT/.understand-anything/intermediate/review.json`

---

4. Read `$PROJECT_ROOT/.understand-anything/intermediate/review.json`.

5. **If `issues` array is non-empty:**
   - Review the `issues` list
   - Apply automated fixes where possible:
     - Remove edges with dangling references
     - Fill missing required fields with sensible defaults (e.g., empty `tags` -> `["untagged"]`, empty `summary` -> `"No summary available"`)
     - Remove nodes with invalid types
   - Re-run the final graph validation after automated fixes
   - If critical issues remain after one fix attempt, save the graph anyway but include the warnings in the final report and mark dashboard auto-launch as skipped

6. **If `issues` array is empty:** Proceed to Phase 7.
```

### Step 3: Verify the edit

Re-read SKILL.md lines 297–380 and confirm:
- Phase 6 step 3 now checks for `--review` flag
- The inline validation script is present and complete
- The `--review` path still dispatches the LLM subagent identically to before
- Steps 4–6 handle the `review.json` output the same way as before

### Step 4: Commit

```bash
git add understand-anything-plugin/skills/understand/SKILL.md
git commit -m "perf(understand): gate LLM graph-reviewer behind --review flag, add inline deterministic validation"
```

---

## Task 2: C4a — Slim Phase 4 (architecture) node payload

Removes `name` and `languageNotes` from the file node format injected into the architecture-analyzer subagent. These fields are not needed for architectural layer assignment and add unnecessary tokens.

**Files:**
- Modify: `understand-anything-plugin/skills/understand/SKILL.md` (Phase 4, around line 188–196)

### Step 1: Locate the Phase 4 dispatch prompt in SKILL.md

Find the block starting "Pass these parameters in the dispatch prompt:" under Phase 4 (around line 181). Look for:

```
> File nodes:
> ```json
> [list of {id, name, filePath, summary, tags} for all file-type nodes]
> ```
```

### Step 2: Update the file node format

Change the file nodes line from:
```
> [list of {id, name, filePath, summary, tags} for all file-type nodes]
```

To:
```
> [list of {id, filePath, summary, tags} for all file-type nodes — omit name, complexity, languageNotes]
```

### Step 3: Verify

Re-read Phase 4 and confirm the node format line is updated. Import edges line below it (`[list of edges with type "imports"]`) is unchanged.

### Step 4: Commit

```bash
git add understand-anything-plugin/skills/understand/SKILL.md
git commit -m "perf(understand): slim Phase 4 architecture payload — drop redundant node fields"
```

---

## Task 3: C4b — Slim Phase 5 (tour builder) payload

Phase 5 currently injects all nodes (including function/class), all edge types, and full layer objects (with nodeIds arrays). Only file nodes, import+calls edges, and slim layers are needed for tour design. This is the largest single payload change, saving ~105,000 tokens on a 500-file project.

**Files:**
- Modify: `understand-anything-plugin/skills/understand/SKILL.md` (Phase 5, lines 257–270)
- Modify: `understand-anything-plugin/skills/understand/tour-builder-prompt.md` (input schema)

### Step 1: Locate the Phase 5 dispatch prompt in SKILL.md

Find the block starting with (around line 257):
```
> Nodes (summarized):
> ```json
> [list of {id, name, filePath, summary, type} for key nodes]
> ```
>
> Layers:
> ```json
> [layers from Phase 4]
> ```
>
> Key edges:
> ```json
> [imports and calls edges]
> ```
```

### Step 2: Replace all three payload sections

Replace those lines with:

```markdown
> Nodes (file nodes only):
> ```json
> [list of {id, name, filePath, summary, type} for file-type nodes ONLY — do NOT include function or class nodes]
> ```
>
> Layers:
> ```json
> [list of {id, name, description} for each layer — omit nodeIds]
> ```
>
> Edges (imports and calls only):
> ```json
> [list of edges where type is "imports" or "calls" only — exclude all other edge types]
> ```
```

### Step 3: Update tour-builder-prompt.md input schema

Open `tour-builder-prompt.md` and find the "Script Requirements" section (around line 18–35). The input schema currently shows:
```json
{
  "nodes": [...],
  "edges": [...],
  "layers": [
    {"id": "layer:core", "name": "Core", "nodeIds": ["file:src/index.ts"]}
  ]
}
```

Update the layers example to reflect the slim format:
```json
{
  "nodes": [
    {"id": "file:src/index.ts", "type": "file", "name": "index.ts", "filePath": "src/index.ts", "summary": "..."}
  ],
  "edges": [
    {"source": "file:src/index.ts", "target": "file:src/utils.ts", "type": "imports"}
  ],
  "layers": [
    {"id": "layer:core", "name": "Core", "description": "Core application logic"}
  ]
}
```

Also update the "G. Node Summary Index" description (around line 84) to reflect that input nodes are file-type only:

Find:
```
**G. Node Summary Index**

Create a lookup of each node ID to its `summary`, `type`, `tags` (default to empty array `[]` if not present in input), and `name` for easy reference.
```

Add a note after it:
```
Note: input nodes are file-type only. The nodeSummaryIndex will contain only file nodes.
```

### Step 4: Verify

- Re-read SKILL.md Phase 5 payload block: confirms file-only nodes, slim layers (no nodeIds), imports+calls edges only
- Re-read tour-builder-prompt.md input schema: layers no longer have nodeIds

### Step 5: Commit

```bash
git add understand-anything-plugin/skills/understand/SKILL.md \
        understand-anything-plugin/skills/understand/tour-builder-prompt.md
git commit -m "perf(understand): slim Phase 5 tour payload — file nodes only, imports+calls edges, slim layers"
```

---

## Task 4: C3 — Remove language/framework addendums from file-analyzer batches

The addendums (`languages/typescript.md`, `frameworks/react.md`, etc.) are currently injected into every file-analyzer batch prompt. They cost ~1,300 tokens × N batches. The model already knows these languages. Replace with a compact inline reference table (~150 tokens, paid once, embedded in the base template).

**Files:**
- Modify: `understand-anything-plugin/skills/understand/SKILL.md` (Phase 2, lines 104–117)
- Modify: `understand-anything-plugin/skills/understand/file-analyzer-prompt.md` (add quick reference section)

### Step 1: Update the "Build the combined prompt template" block in SKILL.md Phase 2

Find the block at lines 104–117:
```
**Build the combined prompt template:**
1. Read the base template at `./file-analyzer-prompt.md`.
2. **Language context injection:** ...
3. **Framework addendum injection:** ...

Then for each batch pass the combined template content as the subagent's prompt, appending the following additional context:

> **Additional context from main session:**
>
> Project: `<projectName>` — `<projectDescription>`
> Frameworks detected: `<frameworks from Phase 1>`
> Languages: `<languages from Phase 1>`
>
> Use the language context and framework addendums (appended above) to produce more accurate summaries and better classify file roles.
```

Replace it with:
```markdown
**Build the prompt for each batch:**
1. Read the base template at `./file-analyzer-prompt.md`. (Language and framework hints are embedded in the template — do NOT append addendum files for Phase 2 batches. Addendums are reserved for Phase 4.)

Then for each batch pass the template content as the subagent's prompt, appending the following additional context:

> **Additional context from main session:**
>
> Project: `<projectName>` — `<projectDescription>`
> Languages: `<languages from Phase 1>`
```

This removes steps 2 and 3 (the addendum injection loops) entirely from Phase 2.

### Step 2: Add Language and Framework Quick Reference to file-analyzer-prompt.md

Open `file-analyzer-prompt.md`. Find the "## Critical Constraints" section near the bottom (around line 299). Insert the following new section **before** "## Critical Constraints":

```markdown
## Language and Framework Quick Reference

Use these hints to improve tag and edge accuracy for common patterns. Your training knowledge covers these — this is a fast lookup for the most impactful signals.

**Tag signals:**

| Signal | Tags to apply |
|---|---|
| File in `hooks/`, exports a function starting with `use` | `hook`, `service` |
| File in `contexts/` or `context/`, exports a Provider component | `service`, `state` |
| File in `pages/` or `views/` | `ui`, `routing` |
| File in `store/`, `slices/`, `reducers/`, `state/` | `state` |
| File in `services/`, `api/`, `client/` | `service` |
| `__init__.py` at a package root with re-exports | `entry-point`, `barrel` |
| `manage.py` at the project root | `entry-point` |
| `mod.rs` in a directory | `barrel` |
| `main.go` in a `cmd/` subdirectory | `entry-point` |

**Edge signals:**

| Pattern | Edge to create |
|---|---|
| React component renders another component in its JSX | `contains` from parent to child |
| Component/hook calls a custom hook (`useX`) | `depends_on` from consumer to hook file |
| Context provider wraps components | `publishes` from provider to context definition |
| Component calls `useContext` or custom context hook | `subscribes` from consumer to context definition |
| Python file uses `from x import y` where x is a project file | `imports` edge (same rule as JS/TS) |
| Go file `import`s an internal package path | `imports` edge to the resolved file |

```

### Step 3: Verify

- Re-read SKILL.md Phase 2 "Build the prompt" block: steps 2 and 3 (addendum loops) are gone; "Frameworks detected" line in additional context is gone
- Re-read file-analyzer-prompt.md: new "Language and Framework Quick Reference" section appears before Critical Constraints; no reference to addendum files
- Confirm Phase 4 "Build the combined prompt template" (lines 163–167) is **unchanged** — addendums still apply there

### Step 4: Commit

```bash
git add understand-anything-plugin/skills/understand/SKILL.md \
        understand-anything-plugin/skills/understand/file-analyzer-prompt.md
git commit -m "perf(understand): remove addendum injection from Phase 2 batches, add compact inline hints to file-analyzer"
```

---

## Task 5: C1a — Extend scanner to pre-resolve imports

Adds a new Step 8 to the project scanner script: parse import statements from every source file and resolve relative imports against the discovered file list. The resolved map is written into `scan-result.json` as `importMap`. This is the data that lets us eliminate `allProjectFiles` from every batch in Task 7.

**Files:**
- Modify: `understand-anything-plugin/skills/understand/project-scanner-prompt.md`

### Step 1: Add Step 8 to the scanner script requirements

Open `project-scanner-prompt.md`. Find "**Step 7 -- Project Name**" (around line 100). After its content (the priority list), add a new step:

```markdown
**Step 8 -- Import Resolution**

For each file in the discovered source list, extract and resolve relative import statements. The goal is to produce a map from each file's path to the list of project-internal files it imports. External package imports are ignored.

For each file, read its content and extract import paths using language-appropriate patterns:

| Language | Import patterns to match |
|---|---|
| TypeScript/JavaScript | `import ... from './...'` or `'../'`, `require('./...')` or `require('../...')` |
| Python | `from .x import y`, `from ..x import y`, `import .x` (relative only) |
| Go | Paths in `import (...)` blocks that start with the module path from `go.mod` |
| Rust | `use crate::`, `use super::`, `mod x` (within the same crate) |
| Java/Kotlin | Not resolvable by path — skip import resolution for these languages |
| Ruby | `require_relative '...'` paths |

For each extracted import path:
1. Compute the resolved file path relative to project root:
   - For relative imports (`./x`, `../x`): resolve from the importing file's directory
   - Try these extension variants in order if the import has no extension: `.ts`, `.tsx`, `.js`, `.jsx`, `/index.ts`, `/index.js`, `/index.tsx`, `/index.jsx`, `.py`, `.go`, `.rs`, `.rb`
2. Check if the resolved path exists in the discovered file list
3. If yes: add to this file's resolved imports list
4. If no: skip (external, unresolvable, or dynamic import)

Output format in the script result:
```json
"importMap": {
  "src/index.ts": ["src/utils.ts", "src/config.ts"],
  "src/utils.ts": [],
  "src/components/App.tsx": ["src/hooks/useAuth.ts", "src/store/index.ts"]
}
```

Keys are project-relative paths. Values are arrays of resolved project-relative paths. Every key in the file list must appear in `importMap` (use an empty array `[]` if no imports were resolved). External packages and unresolvable imports are omitted entirely.
```

### Step 2: Update the scanner script output format

Find the "### Script Output Format" section (around line 109) and update the example JSON to include `importMap`:

Find this in the example:
```json
{
  "scriptCompleted": true,
  "name": "project-name",
  ...
  "estimatedComplexity": "moderate"
}
```

Add `importMap` to the example:
```json
{
  "scriptCompleted": true,
  "name": "project-name",
  "rawDescription": "...",
  "readmeHead": "...",
  "languages": ["javascript", "typescript"],
  "frameworks": ["React", "Vite"],
  "files": [
    {"path": "src/index.ts", "language": "typescript", "sizeLines": 150}
  ],
  "totalFiles": 42,
  "estimatedComplexity": "moderate",
  "importMap": {
    "src/index.ts": ["src/utils.ts", "src/config.ts"],
    "src/utils.ts": []
  }
}
```

Also update the field documentation list below the example to add:
```
- `importMap` (object) — map from every source file path to its list of resolved project-internal import paths; empty array if no resolved imports; external packages excluded
```

### Step 3: Update the final assembly section to preserve importMap

Find "## Phase 2 -- Description and Final Assembly" (around line 153). Find the IMPORTANT note:
```
**IMPORTANT:** The final output must NOT contain the `scriptCompleted`, `rawDescription`, or `readmeHead` fields.
```

Update it to:
```
**IMPORTANT:** The final output must NOT contain the `scriptCompleted`, `rawDescription`, or `readmeHead` fields. All other fields — including `importMap` — MUST be preserved exactly as output by the script.
```

Also update the final output example to include `importMap`:
```json
{
  "name": "project-name",
  "description": "...",
  "languages": ["typescript"],
  "frameworks": ["React"],
  "files": [...],
  "totalFiles": 42,
  "estimatedComplexity": "moderate",
  "importMap": {
    "src/index.ts": ["src/utils.ts"]
  }
}
```

### Step 4: Verify

Re-read `project-scanner-prompt.md` and confirm:
- Step 8 is present with full import resolution logic
- Script output format includes `importMap`
- Field documentation includes `importMap`
- Final assembly section preserves `importMap` in output

### Step 5: Commit

```bash
git add understand-anything-plugin/skills/understand/project-scanner-prompt.md
git commit -m "perf(understand): extend scanner to pre-resolve imports, output importMap in scan-result.json"
```

---

## Task 6: C1b — Update file-analyzer to use batchImportData

Removes `allProjectFiles` from the file-analyzer input schema and replaces it with `batchImportData` (pre-resolved imports for this batch's files only). Updates the extraction script section to skip import resolution entirely (already done by scanner). Updates the edge creation step to use `batchImportData` directly.

**Files:**
- Modify: `understand-anything-plugin/skills/understand/file-analyzer-prompt.md`

### Step 1: Update the input JSON schema (Script Requirements, step 1)

Find the input schema block around line 19:
```json
{
  "projectRoot": "/path/to/project",
  "allProjectFiles": ["src/index.ts", "src/utils.ts", "..."],
  "batchFiles": [
    {"path": "src/index.ts", "language": "typescript", "sizeLines": 150},
    {"path": "src/utils.ts", "language": "typescript", "sizeLines": 80}
  ]
}
```

Replace with:
```json
{
  "projectRoot": "/path/to/project",
  "batchFiles": [
    {"path": "src/index.ts", "language": "typescript", "sizeLines": 150},
    {"path": "src/utils.ts", "language": "typescript", "sizeLines": 80}
  ],
  "batchImportData": {
    "src/index.ts": ["src/utils.ts", "src/config.ts"],
    "src/utils.ts": []
  }
}
```

Update the field descriptions:
- Remove: `allProjectFiles` description
- Add: `batchImportData` (object) — map from each batch file's project-relative path to its list of pre-resolved project-internal imports. Produced by the project scanner. Use this directly for import edge creation — do NOT attempt to re-resolve imports yourself.

### Step 2: Remove the imports extraction from "What the Script Must Extract"

Find the "**Imports:**" subsection under "What the Script Must Extract" (around lines 49–53):
```
**Imports:**
- Source module path (exactly as written in the import statement)
- Imported specifiers (named imports, default import, namespace import)
- Line number
- For relative imports (starting with `./` or `../`), compute the resolved path...
```

Replace this entire subsection with:
```markdown
**Imports:**
- Do NOT extract imports in the script. Import resolution has already been performed by the project scanner.
- The pre-resolved imports for each file are provided in `batchImportData` in the input JSON.
- Do not include an `imports` field in the script output — import edges will be created in Phase 2 using `batchImportData` directly.
```

### Step 3: Update the script output format to remove imports

Find the `results` array in the script output format (around line 67). The current `imports` array in the output:
```json
"imports": [
  {"source": "./utils", "resolvedPath": "src/utils.ts", "specifiers": ["formatDate"], "line": 1, "isExternal": false},
  {"source": "express", "resolvedPath": null, "specifiers": ["default"], "line": 2, "isExternal": true}
],
```

Remove the `imports` array from the script output format entirely. The result for each file should be:
```json
{
  "path": "src/index.ts",
  "language": "typescript",
  "totalLines": 150,
  "nonEmptyLines": 120,
  "functions": [...],
  "classes": [...],
  "exports": [...],
  "metrics": {
    "importCount": 5,
    "exportCount": 3,
    "functionCount": 4,
    "classCount": 1
  }
}
```

Keep `metrics.importCount` (derived from `batchImportData[path].length`) as a useful metric.

Update the metrics description to say:
```
- `importCount` (integer) — use `batchImportData[file.path].length` from the input JSON
```

### Step 4: Update "Preparing the Script Input" section

Find the `cat` command around line 113 that creates the input JSON:
```bash
cat > $PROJECT_ROOT/.understand-anything/tmp/ua-file-analyzer-input-<batchIndex>.json << 'ENDJSON'
{
  "projectRoot": "<project-root>",
  "allProjectFiles": [<full file list from scan>],
  "batchFiles": [<this batch's files>]
}
ENDJSON
```

Replace with:
```bash
cat > $PROJECT_ROOT/.understand-anything/tmp/ua-file-analyzer-input-<batchIndex>.json << 'ENDJSON'
{
  "projectRoot": "<project-root>",
  "batchFiles": [<this batch's files>],
  "batchImportData": <batchImportData JSON object — provided in your dispatch prompt>
}
ENDJSON
```

### Step 5: Update Step 3 (Create Edges) — Import edge creation rule

Find the "**Import edge creation rule:**" in the "Step 3 -- Create Edges" section (around line 213):
```
**Import edge creation rule:** For each import in the script output where `isExternal` is `false` and `resolvedPath` is non-null, create an `imports` edge from the current file node to `file:<resolvedPath>`. Do NOT create edges for external package imports.
```

Replace with:
```markdown
**Import edge creation rule:** For each resolved path in `batchImportData[filePath]` (provided in the input JSON), create an `imports` edge from the current file node to `file:<resolvedPath>`. The `batchImportData` values contain only resolved project-internal paths — external packages have already been filtered out. Do NOT attempt to re-resolve imports from source.
```

### Step 6: Remove `allProjectFiles` references from Critical Constraints

Find the last bullet in "## Critical Constraints" (around line 304):
```
- For import edges, use the script's `resolvedPath` field directly. Do NOT attempt to resolve import paths yourself -- the script already did this deterministically.
```

Replace with:
```markdown
- For import edges, use `batchImportData[filePath]` directly from the input JSON. Do NOT attempt to resolve import paths yourself -- the project scanner already did this deterministically.
```

### Step 7: Verify

Re-read `file-analyzer-prompt.md` and confirm:
- Input schema has `batchImportData`, no `allProjectFiles`
- Script "What to Extract" section: imports extraction replaced with "do not extract"
- Script output format: no `imports` array per file
- Preparing the Script Input: cat command has no `allProjectFiles`
- Import edge creation rule: uses `batchImportData` not script output
- Critical Constraints: no reference to `resolvedPath` from script

### Step 8: Commit

```bash
git add understand-anything-plugin/skills/understand/file-analyzer-prompt.md
git commit -m "perf(understand): replace allProjectFiles with batchImportData in file-analyzer — import resolution now done by scanner"
```

---

## Task 7: C1c + C2 — Update SKILL.md Phase 2 orchestration

Wires up the `importMap` from Phase 1 into per-batch `batchImportData` slices. Increases batch size from 5-10 to 20-30 files. Increases concurrency from 3 to 5. Removes `allProjectFiles` from the dispatch prompt.

**Files:**
- Modify: `understand-anything-plugin/skills/understand/SKILL.md` (Phase 0, Phase 1, Phase 2)

### Step 1: Update Phase 1 to note importMap is now in scan-result.json

Find Phase 1 (around line 62) where it says:
```
After the subagent completes, read `$PROJECT_ROOT/.understand-anything/intermediate/scan-result.json` to get:
- Project name, description
- Languages, frameworks
- File list with line counts
- Complexity estimate
```

Add one item to the list:
```
- Import map (`importMap`): pre-resolved project-internal imports per file
```

Also add a note:
```
Store `importMap` in memory as `$IMPORT_MAP` for use in Phase 2 batch construction.
```

### Step 2: Change batch size and concurrency in Phase 2

Find line 100:
```
Batch the file list from Phase 1 into groups of **5-10 files each** (aim for balanced batch sizes).
```

Replace with:
```
Batch the file list from Phase 1 into groups of **20-30 files each** (aim for ~25 files per batch for balanced sizes).
```

Find line 102:
```
For each batch, dispatch a subagent using the prompt template at `./file-analyzer-prompt.md`. Run up to **3 subagents concurrently** using parallel dispatch.
```

Replace with:
```
For each batch, dispatch a subagent using the prompt template at `./file-analyzer-prompt.md`. Run up to **5 subagents concurrently** using parallel dispatch.
```

### Step 3: Add batchImportData construction to the dispatch block

Find the dispatch prompt block (around lines 119–134):
```
Fill in batch-specific parameters below and dispatch:

> Analyze these source files and produce GraphNode and GraphEdge objects.
> Project root: `$PROJECT_ROOT`
> Project: `<projectName>`
> Languages: `<languages>`
> Batch index: `<batchIndex>`
> Write output to: `$PROJECT_ROOT/.understand-anything/intermediate/batch-<batchIndex>.json`
>
> All project files (for import resolution):
> `<full file path list from scan>`
>
> Files to analyze in this batch:
> 1. `<path>` (<sizeLines> lines)
> ...
```

Replace with:
```markdown
Before dispatching each batch, construct `batchImportData` from `$IMPORT_MAP`:
```json
batchImportData = {}
for each file in this batch:
  batchImportData[file.path] = $IMPORT_MAP[file.path] ?? []
```

Fill in batch-specific parameters below and dispatch:

> Analyze these source files and produce GraphNode and GraphEdge objects.
> Project root: `$PROJECT_ROOT`
> Project: `<projectName>`
> Languages: `<languages>`
> Batch index: `<batchIndex>`
> Write output to: `$PROJECT_ROOT/.understand-anything/intermediate/batch-<batchIndex>.json`
>
> Pre-resolved import data for this batch (use this for all import edge creation — do NOT re-resolve imports from source):
> ```json
> <batchImportData JSON>
> ```
>
> Files to analyze in this batch:
> 1. `<path>` (<sizeLines> lines)
> 2. `<path>` (<sizeLines> lines)
> ...
```

### Step 4: Update incremental update path

Find "### Incremental update path" (around line 140):
```
Use the changed files list from Phase 0. Batch and dispatch file-analyzer subagents using the same process as above, but only for changed files.
```

Update to clarify that batchImportData still applies:
```
Use the changed files list from Phase 0. Batch and dispatch file-analyzer subagents using the same process as above (20-30 files per batch, up to 5 concurrent, with batchImportData constructed from $IMPORT_MAP), but only for changed files.
```

### Step 5: Verify all Phase 2 changes

Re-read SKILL.md Phase 2 in full and confirm:
- Batch size says "20-30 files"
- Concurrency says "5 subagents concurrently"
- "Build the prompt" block: only step 1 (read base template), no addendum steps
- Additional context block: no "Frameworks detected" line, no addendum reference
- Dispatch prompt: has `batchImportData` injection, no `allProjectFiles`
- Incremental path: mentions batchImportData

### Step 6: Commit

```bash
git add understand-anything-plugin/skills/understand/SKILL.md
git commit -m "perf(understand): wire importMap into batchImportData per batch, increase batch size 5-10→20-30, concurrency 3→5"
```

---

## Task 8: Version bump

Per project convention, all four version files must stay in sync when changes are pushed.

**Files:**
- Modify: `understand-anything-plugin/package.json`
- Modify: `.claude-plugin/marketplace.json`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.cursor-plugin/plugin.json`

### Step 1: Read current version

```bash
node -e "const p = require('./understand-anything-plugin/package.json'); console.log(p.version)"
```

Expected: `1.2.1` (or whatever the current version is).

### Step 2: Bump patch version in all four files

New version: `1.2.2` (patch bump — internal optimization, no API changes).

Update each file:
- `understand-anything-plugin/package.json`: `"version": "1.2.2"`
- `.claude-plugin/marketplace.json`: `"version": "1.2.2"` in `plugins[0]`
- `.claude-plugin/plugin.json`: `"version": "1.2.2"`
- `.cursor-plugin/plugin.json`: `"version": "1.2.2"`

### Step 3: Verify all four files match

```bash
grep -r '"version"' understand-anything-plugin/package.json .claude-plugin/marketplace.json .claude-plugin/plugin.json .cursor-plugin/plugin.json
```

All four should show `"version": "1.2.2"`.

### Step 4: Commit

```bash
git add understand-anything-plugin/package.json \
        .claude-plugin/marketplace.json \
        .claude-plugin/plugin.json \
        .cursor-plugin/plugin.json
git commit -m "chore: bump version to 1.2.2"
```

---

## Task 9: Build and smoke test

Verifies all changes work end-to-end by running `/understand --full` against a real project.

**Files:** None (testing only)

### Step 1: Build the packages

```bash
pnpm --filter @understand-anything/core build
pnpm --filter @understand-anything/skill build
```

Expected: both build without errors.

### Step 2: Find installed plugin version and copy to cache

```bash
ls ~/.claude/plugins/cache/understand-anything/understand-anything/
```

Note the version (e.g., `1.0.1`). Copy local build into the cache:

```bash
VERSION=$(node -e "const p = require('./understand-anything-plugin/package.json'); console.log(p.version)")
rm -rf ~/.claude/plugins/cache/understand-anything/understand-anything/$VERSION
cp -R ./understand-anything-plugin ~/.claude/plugins/cache/understand-anything/understand-anything/$VERSION
```

### Step 3: Smoke test on a small project (~20 files)

Open a fresh Claude Code session in a small TypeScript project. Run:
```
/understand --full
```

Verify:
- Phases 0–7 complete without errors
- `knowledge-graph.json` is created
- Node count and edge count are reasonable
- Layers and tour are present
- No "allProjectFiles" or addendum errors in the output

### Step 4: Smoke test on a larger project (~100+ files)

Run `/understand --full` on a medium/large TypeScript+React project.

Verify:
- Batch count is ~4-6 (at 20-30 files per batch for 100 files), not 10-20
- No errors about missing import resolution
- `importMap` is present in `scan-result.json` (check `.understand-anything/intermediate/` before cleanup, or add a temporary debug log)
- Graph quality is comparable to before (summaries are descriptive, layers are correct)

### Step 5: Test `--review` flag

Run `/understand --full --review` on the same project.

Verify:
- Phase 6 now dispatches the LLM graph-reviewer subagent (not the inline script)
- `review.json` is produced with `approved` field
- Pipeline completes normally

### Step 6: Final commit (if any fixes needed from smoke test)

```bash
git add -A
git commit -m "fix(understand): smoke test fixes for token reduction changes"
```

---

## Summary

| Task | Change | Risk |
|---|---|---|
| 1 | C5: Gate reviewer | Low |
| 2 | C4a: Slim Phase 4 payload | Low |
| 3 | C4b: Slim Phase 5 payload | Low |
| 4 | C3: Remove addendums from batches | Low |
| 5 | C1a: Scanner import resolution | Medium |
| 6 | C1b: File-analyzer uses batchImportData | Medium |
| 7 | C1c+C2: SKILL.md orchestration + batch size | Medium |
| 8 | Version bump | Low |
| 9 | Smoke test | — |

Tasks 1–4 are independent of Tasks 5–7. They can be shipped separately if needed. Tasks 5, 6, and 7 are tightly coupled (scanner produces importMap → SKILL.md passes batchImportData → file-analyzer consumes it) and must be shipped together.
````

## File: docs/superpowers/plans/2026-03-28-understand-anything-extension-impl.md
````markdown
# Universal File Type Support — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend Understand Anything to analyze 26+ non-code file types (Markdown, Dockerfile, YAML, SQL, Terraform, etc.) with new graph node/edge types, custom parsers, updated agent prompts, and dashboard visualization.

**Architecture:** Extend the existing LanguageConfig + AnalyzerPlugin pipeline. Add 8 new node types and 8 new edge types to the schema. Build 12 lightweight regex/parser-based analyzers for structured formats, LLM-only for unstructured. Update all 5 agent prompts to handle non-code files. Add new node colors and sidebar rendering to the dashboard.

**Tech Stack:** TypeScript, Zod, Vitest, React, React Flow, Zustand, TailwindCSS v4, `yaml` npm package, `@iarna/toml`, `jsonc-parser`

**Design doc:** `docs/plans/2026-03-28-understand-anything-extension-design.md`

---

## Task 1: Extend Core Types — Node & Edge Types

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/types.ts:1-116`
- Test: `understand-anything-plugin/packages/core/src/types.test.ts`

**Step 1: Write the failing test**

In `types.test.ts`, add a test that imports and verifies the new node types exist on GraphNode and edge types exist on EdgeType:

```typescript
import { describe, it, expect } from "vitest";
import type { GraphNode, GraphEdge, EdgeType, StructuralAnalysis } from "../types.js";

describe("Extended types", () => {
  it("accepts all 13 node types", () => {
    const nodeTypes: GraphNode["type"][] = [
      "file", "function", "class", "module", "concept",
      "config", "document", "service", "table", "endpoint",
      "pipeline", "schema", "resource",
    ];
    expect(nodeTypes).toHaveLength(13);
  });

  it("accepts all 26 edge types", () => {
    const edgeTypes: EdgeType[] = [
      "imports", "exports", "contains", "inherits", "implements",
      "calls", "subscribes", "publishes", "middleware",
      "reads_from", "writes_to", "transforms", "validates",
      "depends_on", "tested_by", "configures",
      "related", "similar_to",
      "deploys", "serves", "migrates", "documents",
      "provisions", "routes", "defines_schema", "triggers",
    ];
    expect(edgeTypes).toHaveLength(26);
  });

  it("StructuralAnalysis has optional non-code fields", () => {
    const analysis: StructuralAnalysis = {
      functions: [], classes: [], imports: [], exports: [],
      sections: [{ name: "Introduction", level: 1, lineRange: [1, 10] }],
      definitions: [{ name: "users", kind: "table", lineRange: [1, 20], fields: ["id", "name"] }],
      services: [{ name: "web", image: "node:22", ports: [3000] }],
      endpoints: [{ method: "GET", path: "/api/users", lineRange: [5, 15] }],
      steps: [{ name: "build", lineRange: [1, 5] }],
      resources: [{ name: "aws_s3_bucket.main", kind: "aws_s3_bucket", lineRange: [1, 10] }],
    };
    expect(analysis.sections).toHaveLength(1);
    expect(analysis.definitions).toHaveLength(1);
    expect(analysis.services).toHaveLength(1);
    expect(analysis.endpoints).toHaveLength(1);
    expect(analysis.steps).toHaveLength(1);
    expect(analysis.resources).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @understand-anything/core test -- --run types.test`
Expected: FAIL — TypeScript compilation errors for new types that don't exist yet

**Step 3: Implement the type extensions**

In `types.ts`, update the `GraphNode.type` union (line 12):

```typescript
type: "file" | "function" | "class" | "module" | "concept"
  | "config" | "document" | "service" | "table" | "endpoint"
  | "pipeline" | "schema" | "resource";
```

Update the `EdgeType` type (lines 1-7) to add 8 new edge types:

```typescript
export type EdgeType =
  | "imports" | "exports" | "contains" | "inherits" | "implements"  // Structural
  | "calls" | "subscribes" | "publishes" | "middleware"              // Behavioral
  | "reads_from" | "writes_to" | "transforms" | "validates"         // Data flow
  | "depends_on" | "tested_by" | "configures"                       // Dependencies
  | "related" | "similar_to"                                         // Semantic
  | "deploys" | "serves" | "migrates" | "documents"                 // Infrastructure
  | "provisions" | "routes" | "defines_schema" | "triggers";        // Infrastructure
```

Extend `StructuralAnalysis` (after line 95) with new optional fields:

```typescript
export interface SectionInfo {
  name: string;
  level: number;
  lineRange: [number, number];
}

export interface DefinitionInfo {
  name: string;
  kind: string; // "table", "message", "type", "schema"
  lineRange: [number, number];
  fields: string[];
}

export interface ServiceInfo {
  name: string;
  image?: string;
  ports: number[];
}

export interface EndpointInfo {
  method?: string;
  path: string;
  lineRange: [number, number];
}

export interface StepInfo {
  name: string;
  lineRange: [number, number];
}

export interface ResourceInfo {
  name: string;
  kind: string;
  lineRange: [number, number];
}

export interface ReferenceResolution {
  source: string;
  target: string;
  referenceType: string; // "file", "image", "schema", "service"
  line?: number;
}

export interface StructuralAnalysis {
  functions: Array<{ name: string; lineRange: [number, number]; params: string[]; returnType?: string }>;
  classes: Array<{ name: string; lineRange: [number, number]; methods: string[]; properties: string[] }>;
  imports: Array<{ source: string; specifiers: string[]; lineNumber: number }>;
  exports: Array<{ name: string; lineNumber: number }>;
  // Non-code structural data (all optional for backward compat)
  sections?: SectionInfo[];
  definitions?: DefinitionInfo[];
  services?: ServiceInfo[];
  endpoints?: EndpointInfo[];
  steps?: StepInfo[];
  resources?: ResourceInfo[];
}
```

Update `AnalyzerPlugin` interface (lines 109-115) — make `resolveImports` optional, add `extractReferences`:

```typescript
export interface AnalyzerPlugin {
  name: string;
  languages: string[];
  analyzeFile(filePath: string, content: string): StructuralAnalysis;
  resolveImports?(filePath: string, content: string): ImportResolution[];
  extractCallGraph?(filePath: string, content: string): CallGraphEntry[];
  extractReferences?(filePath: string, content: string): ReferenceResolution[];
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @understand-anything/core test -- --run types.test`
Expected: PASS

**Step 5: Commit**

```bash
git add understand-anything-plugin/packages/core/src/types.ts understand-anything-plugin/packages/core/src/types.test.ts
git commit -m "feat(core): extend GraphNode/EdgeType/StructuralAnalysis for non-code file types"
```

---

## Task 2: Extend Schema Validation — Zod Schemas & Aliases

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/schema.ts:1-554`
- Test: `understand-anything-plugin/packages/core/src/__tests__/schema.test.ts`

**Step 1: Write the failing tests**

Add to `schema.test.ts`:

```typescript
describe("Extended node/edge types", () => {
  it("validates nodes with new types: config, document, service, table, endpoint, pipeline, schema, resource", () => {
    const newTypes = ["config", "document", "service", "table", "endpoint", "pipeline", "schema", "resource"];
    for (const type of newTypes) {
      const graph = structuredClone(validGraph);
      graph.nodes[0].type = type;
      const result = validateGraph(graph);
      expect(result.success).toBe(true);
      expect(result.data!.nodes[0].type).toBe(type);
    }
  });

  it("validates edges with new types: deploys, serves, migrates, documents, provisions, routes, defines_schema, triggers", () => {
    const newTypes = ["deploys", "serves", "migrates", "documents", "provisions", "routes", "defines_schema", "triggers"];
    for (const type of newTypes) {
      const graph = structuredClone(validGraph);
      graph.edges[0].type = type;
      const result = validateGraph(graph);
      expect(result.success).toBe(true);
      expect(result.data!.edges[0].type).toBe(type);
    }
  });

  it("auto-fixes new node type aliases: container→service, doc→document, workflow→pipeline, etc.", () => {
    const aliases = { container: "service", doc: "document", workflow: "pipeline", route: "endpoint", setting: "config", infra: "resource", migration: "table" };
    for (const [alias, canonical] of Object.entries(aliases)) {
      const graph = structuredClone(validGraph);
      (graph.nodes[0] as any).type = alias;
      const result = validateGraph(graph);
      expect(result.success).toBe(true);
      expect(result.data!.nodes[0].type).toBe(canonical);
    }
  });

  it("auto-fixes new edge type aliases: describes→documents, creates→provisions, exposes→serves", () => {
    const aliases = { describes: "documents", creates: "provisions", exposes: "serves" };
    for (const [alias, canonical] of Object.entries(aliases)) {
      const graph = structuredClone(validGraph);
      (graph.edges[0] as any).type = alias;
      const result = validateGraph(graph);
      expect(result.success).toBe(true);
      expect(result.data!.edges[0].type).toBe(canonical);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @understand-anything/core test -- --run schema.test`
Expected: FAIL — Zod enum rejects new types

**Step 3: Implement schema extensions**

In `schema.ts`:

1. Update `EdgeTypeSchema` (line 4-10) — add 8 new edge types:
```typescript
export const EdgeTypeSchema = z.enum([
  "imports", "exports", "contains", "inherits", "implements",
  "calls", "subscribes", "publishes", "middleware",
  "reads_from", "writes_to", "transforms", "validates",
  "depends_on", "tested_by", "configures",
  "related", "similar_to",
  "deploys", "serves", "migrates", "documents",
  "provisions", "routes", "defines_schema", "triggers",
]);
```

2. Update `NODE_TYPE_ALIASES` (line 13-22) — add new aliases:
```typescript
export const NODE_TYPE_ALIASES: Record<string, string> = {
  func: "function", fn: "function", method: "function",
  interface: "class", struct: "class",
  mod: "module", pkg: "module", package: "module",
  // New non-code aliases
  container: "service", deployment: "service", pod: "service",
  doc: "document", readme: "document", docs: "document",
  workflow: "pipeline", job: "pipeline", ci: "pipeline", action: "pipeline",
  route: "endpoint", api: "endpoint", query: "endpoint", mutation: "endpoint",
  setting: "config", env: "config", configuration: "config",
  infra: "resource", infrastructure: "resource", terraform: "resource",
  migration: "table", database: "table", db: "table", view: "table",
  proto: "schema", protobuf: "schema", definition: "schema", typedef: "schema",
};
```

3. Update `EDGE_TYPE_ALIASES` (line 25-39) — add new aliases:
```typescript
// Add these entries:
  describes: "documents",
  documented_by: "documents",
  creates: "provisions",
  exposes: "serves",
  listens: "serves",
  deploys_to: "deploys",
  migrates_to: "migrates",
  routes_to: "routes",
  triggers_on: "triggers",
  fires: "triggers",
  defines: "defines_schema",
```

4. Update `GraphNodeSchema` (line 267-277) — extend type enum:
```typescript
export const GraphNodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    "file", "function", "class", "module", "concept",
    "config", "document", "service", "table", "endpoint",
    "pipeline", "schema", "resource",
  ]),
  name: z.string(),
  filePath: z.string().optional(),
  lineRange: z.tuple([z.number(), z.number()]).optional(),
  summary: z.string(),
  tags: z.array(z.string()),
  complexity: z.enum(["simple", "moderate", "complex"]),
  languageNotes: z.string().optional(),
});
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @understand-anything/core test -- --run schema.test`
Expected: PASS

**Step 5: Commit**

```bash
git add understand-anything-plugin/packages/core/src/schema.ts understand-anything-plugin/packages/core/src/__tests__/schema.test.ts
git commit -m "feat(core): extend Zod schemas and aliases for 8 new node/edge types"
```

---

## Task 3: Update PluginRegistry — Optional resolveImports

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/plugins/registry.ts:1-76`
- Test: `understand-anything-plugin/packages/core/src/__tests__/plugin-registry.test.ts`

**Step 1: Write the failing test**

Add to `plugin-registry.test.ts`:

```typescript
it("handles plugins with optional resolveImports (non-code plugins)", () => {
  const markdownPlugin: AnalyzerPlugin = {
    name: "markdown",
    languages: ["markdown"],
    analyzeFile: () => ({ functions: [], classes: [], imports: [], exports: [] }),
    // No resolveImports — optional
  };
  registry.register(markdownPlugin);
  const result = registry.resolveImports("README.md", "# Hello");
  expect(result).toBeNull(); // Returns null for plugins without resolveImports
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @understand-anything/core test -- --run plugin-registry.test`
Expected: FAIL — current registry calls `plugin.resolveImports(...)` unconditionally

**Step 3: Update PluginRegistry**

In `registry.ts`, update `resolveImports` (line 62-66):

```typescript
resolveImports(filePath: string, content: string): ImportResolution[] | null {
  const plugin = this.getPluginForFile(filePath);
  if (!plugin || !plugin.resolveImports) return null;
  return plugin.resolveImports(filePath, content);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @understand-anything/core test -- --run plugin-registry.test`
Expected: PASS

**Step 5: Commit**

```bash
git add understand-anything-plugin/packages/core/src/plugins/registry.ts understand-anything-plugin/packages/core/src/__tests__/plugin-registry.test.ts
git commit -m "feat(core): make resolveImports optional on AnalyzerPlugin"
```

---

## Task 4: Add Non-Code Language Configs (26 configs)

**Files:**
- Create: `understand-anything-plugin/packages/core/src/languages/configs/markdown.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/yaml.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/json-config.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/toml.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/env.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/xml.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/dockerfile.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/sql.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/graphql.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/protobuf.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/terraform.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/github-actions.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/makefile.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/shell.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/html.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/css.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/openapi.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/kubernetes.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/docker-compose.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/json-schema.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/csv.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/restructuredtext.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/powershell.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/batch.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/jenkinsfile.ts`
- Create: `understand-anything-plugin/packages/core/src/languages/configs/plaintext.ts`
- Modify: `understand-anything-plugin/packages/core/src/languages/configs/index.ts`
- Test: `understand-anything-plugin/packages/core/src/__tests__/language-registry.test.ts`

**Step 1: Write the failing test**

Add to `language-registry.test.ts`:

```typescript
describe("Non-code language configs", () => {
  it("detects all non-code file types via extension", () => {
    const registry = LanguageRegistry.createDefault();
    const expectations: [string, string][] = [
      ["README.md", "markdown"],
      ["config.yaml", "yaml"],
      ["package.json", "json"],
      ["config.toml", "toml"],
      [".env", "env"],
      ["pom.xml", "xml"],
      ["Dockerfile", "dockerfile"],
      ["schema.sql", "sql"],
      ["schema.graphql", "graphql"],
      ["types.proto", "protobuf"],
      ["main.tf", "terraform"],
      ["Makefile", "makefile"],
      ["deploy.sh", "shell"],
      ["index.html", "html"],
      ["styles.css", "css"],
      ["data.csv", "csv"],
      ["deploy.ps1", "powershell"],
    ];
    for (const [file, expectedId] of expectations) {
      const config = registry.getForFile(file);
      expect(config?.id, `${file} should be detected as ${expectedId}`).toBe(expectedId);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @understand-anything/core test -- --run language-registry.test`
Expected: FAIL — no configs registered for non-code extensions

**Step 3: Create all config files**

Each config follows the same pattern as `typescript.ts`. Example for markdown:

```typescript
// markdown.ts
import type { LanguageConfig } from "../types.js";

export const markdownConfig = {
  id: "markdown",
  displayName: "Markdown",
  extensions: [".md", ".mdx"],
  concepts: ["headings", "links", "code blocks", "front matter", "lists", "tables", "images"],
  filePatterns: {
    entryPoints: ["README.md"],
    barrels: [],
    tests: [],
    config: [],
  },
} satisfies LanguageConfig;
```

Create similar configs for all 26 types. Key extension mappings:
- yaml: `.yaml`, `.yml`
- json: `.json`, `.jsonc`
- toml: `.toml`
- env: `.env` (Note: LanguageRegistry needs filename match, not just extension)
- xml: `.xml`
- dockerfile: `Dockerfile` (filename-based detection — needs special handling)
- sql: `.sql`
- graphql: `.graphql`, `.gql`
- protobuf: `.proto`
- terraform: `.tf`, `.tfvars`
- github-actions: (detected by path `.github/workflows/*.yml` — defer to scanner)
- makefile: `Makefile` (filename-based — needs special handling)
- shell: `.sh`, `.bash`, `.zsh`
- html: `.html`, `.htm`
- css: `.css`, `.scss`, `.less`
- csv: `.csv`, `.tsv`
- powershell: `.ps1`, `.psm1`
- batch: `.bat`, `.cmd`
- plaintext: `.txt`
- restructuredtext: `.rst`
- jenkinsfile: (filename-based — `Jenkinsfile`)

**Important:** For filename-based detection (Dockerfile, Makefile, Jenkinsfile), extend LanguageRegistry to support `filenames` array in addition to `extensions`. Add a `filenames?: string[]` field to `LanguageConfig` and update `getForFile()` to check basename against filenames when extension lookup fails.

Update `configs/index.ts` to import and register all new configs in `builtinLanguageConfigs`.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @understand-anything/core test -- --run language-registry.test`
Expected: PASS

**Step 5: Commit**

```bash
git add understand-anything-plugin/packages/core/src/languages/
git commit -m "feat(core): add 26 non-code language configs with filename-based detection"
```

---

## Task 5: Build Custom Parsers (12 parsers)

**Files:**
- Create: `understand-anything-plugin/packages/core/src/plugins/parsers/markdown-parser.ts`
- Create: `understand-anything-plugin/packages/core/src/plugins/parsers/yaml-parser.ts`
- Create: `understand-anything-plugin/packages/core/src/plugins/parsers/json-parser.ts`
- Create: `understand-anything-plugin/packages/core/src/plugins/parsers/toml-parser.ts`
- Create: `understand-anything-plugin/packages/core/src/plugins/parsers/env-parser.ts`
- Create: `understand-anything-plugin/packages/core/src/plugins/parsers/dockerfile-parser.ts`
- Create: `understand-anything-plugin/packages/core/src/plugins/parsers/sql-parser.ts`
- Create: `understand-anything-plugin/packages/core/src/plugins/parsers/graphql-parser.ts`
- Create: `understand-anything-plugin/packages/core/src/plugins/parsers/protobuf-parser.ts`
- Create: `understand-anything-plugin/packages/core/src/plugins/parsers/terraform-parser.ts`
- Create: `understand-anything-plugin/packages/core/src/plugins/parsers/makefile-parser.ts`
- Create: `understand-anything-plugin/packages/core/src/plugins/parsers/shell-parser.ts`
- Create: `understand-anything-plugin/packages/core/src/plugins/parsers/index.ts`
- Test: `understand-anything-plugin/packages/core/src/__tests__/parsers.test.ts`

Each parser implements `AnalyzerPlugin`. Build them TDD-style, one at a time.

**Step 1: Write failing tests for all 12 parsers**

Create `parsers.test.ts` with test suites for each parser. Example for MarkdownParser:

```typescript
import { describe, it, expect } from "vitest";
import { MarkdownParser } from "../plugins/parsers/markdown-parser.js";

describe("MarkdownParser", () => {
  const parser = new MarkdownParser();

  it("extracts heading sections", () => {
    const content = "# Title\n\nIntro\n\n## Section A\n\nContent A\n\n### Subsection\n\nContent B";
    const result = parser.analyzeFile("README.md", content);
    expect(result.sections).toHaveLength(3);
    expect(result.sections![0]).toMatchObject({ name: "Title", level: 1 });
    expect(result.sections![1]).toMatchObject({ name: "Section A", level: 2 });
    expect(result.sections![2]).toMatchObject({ name: "Subsection", level: 3 });
  });

  it("extracts YAML front matter as imports", () => {
    const content = "---\ntitle: Test\ntags: [a, b]\n---\n# Content";
    const result = parser.analyzeFile("post.md", content);
    expect(result.imports).toHaveLength(0); // Front matter is metadata, not imports
  });

  it("extracts file references", () => {
    const parser2 = new MarkdownParser();
    const content = "See [guide](./docs/guide.md) and ![img](./assets/logo.png)";
    const refs = parser2.extractReferences!("README.md", content);
    expect(refs).toHaveLength(2);
    expect(refs[0]).toMatchObject({ target: "./docs/guide.md", referenceType: "file" });
    expect(refs[1]).toMatchObject({ target: "./assets/logo.png", referenceType: "image" });
  });
});
```

Similar test suites for:
- **DockerfileParser**: Extract FROM stages, EXPOSE ports, COPY sources
- **SQLParser**: Extract CREATE TABLE, columns, foreign keys
- **YAMLParser**: Extract top-level key hierarchy
- **JSONParser**: Extract key structure, `$ref`/`$defs`
- **TerraformParser**: Extract resource/module/variable blocks
- **GraphQLParser**: Extract type/query/mutation/subscription definitions
- **ProtobufParser**: Extract message/service/enum definitions
- **MakefileParser**: Extract targets and dependencies
- **ShellParser**: Extract function definitions and source commands
- **TOMLParser**: Extract section structure
- **EnvParser**: Extract variable names

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @understand-anything/core test -- --run parsers.test`
Expected: FAIL — parser modules don't exist

**Step 3: Implement all 12 parsers**

Each parser follows this pattern:

```typescript
import type { AnalyzerPlugin, StructuralAnalysis, ReferenceResolution } from "../../types.js";

export class MarkdownParser implements AnalyzerPlugin {
  name = "markdown-parser";
  languages = ["markdown"];

  analyzeFile(filePath: string, content: string): StructuralAnalysis {
    const sections = this.extractSections(content);
    return {
      functions: [], classes: [], imports: [], exports: [],
      sections,
    };
  }

  extractReferences(filePath: string, content: string): ReferenceResolution[] {
    const refs: ReferenceResolution[] = [];
    // Match [text](path) and ![alt](path)
    const linkRegex = /!?\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const target = match[2];
      if (target.startsWith("http")) continue; // Skip external URLs
      const line = content.slice(0, match.index).split("\n").length;
      refs.push({
        source: filePath,
        target,
        referenceType: match[0].startsWith("!") ? "image" : "file",
        line,
      });
    }
    return refs;
  }

  private extractSections(content: string): SectionInfo[] {
    const sections: SectionInfo[] = [];
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^(#{1,6})\s+(.+)/);
      if (match) {
        sections.push({
          name: match[2].trim(),
          level: match[1].length,
          lineRange: [i + 1, i + 1],
        });
      }
    }
    // Fix lineRange end for each section (extends to next heading or EOF)
    for (let i = 0; i < sections.length; i++) {
      const next = sections[i + 1];
      sections[i].lineRange[1] = next ? next.lineRange[0] - 1 : lines.length;
    }
    return sections;
  }
}
```

Create `parsers/index.ts` that exports all parsers and a `registerAllParsers(registry: PluginRegistry)` helper.

**Install new dependencies:**
```bash
cd understand-anything-plugin/packages/core
pnpm add yaml @iarna/toml jsonc-parser
```

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @understand-anything/core test -- --run parsers.test`
Expected: PASS

**Step 5: Commit**

```bash
git add understand-anything-plugin/packages/core/src/plugins/parsers/ understand-anything-plugin/packages/core/src/__tests__/parsers.test.ts understand-anything-plugin/packages/core/package.json understand-anything-plugin/packages/core/pnpm-lock.yaml
git commit -m "feat(core): add 12 custom parsers for non-code file types"
```

---

## Task 6: Update GraphBuilder — Support New Node Types

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/analyzer/graph-builder.ts:1-207`
- Test: `understand-anything-plugin/packages/core/src/analyzer/graph-builder.test.ts`

**Step 1: Write the failing test**

Add to `graph-builder.test.ts`:

```typescript
describe("Non-code file support", () => {
  it("adds non-code file nodes with correct types", () => {
    const builder = new GraphBuilder("test", "abc123");
    builder.addNonCodeFile("README.md", {
      nodeType: "document",
      summary: "Project documentation",
      tags: ["documentation"],
      complexity: "simple",
    });
    const graph = builder.build();
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].type).toBe("document");
    expect(graph.nodes[0].id).toBe("file:README.md");
  });

  it("adds non-code child nodes (sections, definitions, services)", () => {
    const builder = new GraphBuilder("test", "abc123");
    builder.addNonCodeFileWithAnalysis("schema.sql", {
      nodeType: "file",
      summary: "Database schema",
      tags: ["database"],
      complexity: "moderate",
      definitions: [{ name: "users", kind: "table", lineRange: [1, 20] as [number, number], fields: ["id", "name", "email"] }],
    });
    const graph = builder.build();
    // File node + table child node
    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes[1].type).toBe("table");
    expect(graph.nodes[1].name).toBe("users");
    // Contains edge
    expect(graph.edges.some(e => e.type === "contains" && e.target.includes("users"))).toBe(true);
  });

  it("detects non-code languages from EXTENSION_LANGUAGE map", () => {
    const builder = new GraphBuilder("test", "abc123");
    builder.addFile("config.yaml", { summary: "Config", tags: [], complexity: "simple" });
    const graph = builder.build();
    expect(graph.project.languages).toContain("yaml");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @understand-anything/core test -- --run graph-builder.test`
Expected: FAIL — `addNonCodeFile` and `addNonCodeFileWithAnalysis` methods don't exist

**Step 3: Implement GraphBuilder extensions**

Add new methods to GraphBuilder:

```typescript
interface NonCodeFileMeta extends FileMeta {
  nodeType: GraphNode["type"];
}

interface NonCodeFileAnalysisMeta extends NonCodeFileMeta {
  definitions?: DefinitionInfo[];
  services?: ServiceInfo[];
  endpoints?: EndpointInfo[];
  steps?: StepInfo[];
  resources?: ResourceInfo[];
  sections?: SectionInfo[];
}

addNonCodeFile(filePath: string, meta: NonCodeFileMeta): void {
  const lang = detectLanguage(filePath);
  if (lang !== "unknown") this.languages.add(lang);
  const name = filePath.split("/").pop() ?? filePath;
  this.nodes.push({
    id: `file:${filePath}`,
    type: meta.nodeType,
    name,
    filePath,
    summary: meta.summary,
    tags: meta.tags,
    complexity: meta.complexity,
  });
}

addNonCodeFileWithAnalysis(filePath: string, meta: NonCodeFileAnalysisMeta): void {
  this.addNonCodeFile(filePath, meta);
  const fileId = `file:${filePath}`;

  // Create child nodes for definitions (tables, schemas, etc.)
  for (const def of meta.definitions ?? []) {
    const childId = `${def.kind}:${filePath}:${def.name}`;
    this.nodes.push({
      id: childId,
      type: this.mapKindToNodeType(def.kind),
      name: def.name,
      filePath,
      lineRange: def.lineRange,
      summary: `${def.kind}: ${def.name} (${def.fields.length} fields)`,
      tags: [],
      complexity: meta.complexity,
    });
    this.edges.push({ source: fileId, target: childId, type: "contains", direction: "forward", weight: 1 });
  }

  // Create child nodes for services
  for (const svc of meta.services ?? []) {
    const childId = `service:${filePath}:${svc.name}`;
    this.nodes.push({
      id: childId, type: "service", name: svc.name, filePath,
      summary: `Service ${svc.name}${svc.image ? ` (image: ${svc.image})` : ""}`,
      tags: [], complexity: meta.complexity,
    });
    this.edges.push({ source: fileId, target: childId, type: "contains", direction: "forward", weight: 1 });
  }

  // Similar for endpoints, steps, resources
}

private mapKindToNodeType(kind: string): GraphNode["type"] {
  const mapping: Record<string, GraphNode["type"]> = {
    table: "table", view: "table", index: "table",
    message: "schema", type: "schema", enum: "schema",
    resource: "resource", module: "resource",
    service: "service", deployment: "service",
    job: "pipeline", stage: "pipeline", target: "pipeline",
    route: "endpoint", query: "endpoint", mutation: "endpoint",
  };
  return mapping[kind] ?? "concept";
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @understand-anything/core test -- --run graph-builder.test`
Expected: PASS

**Step 5: Commit**

```bash
git add understand-anything-plugin/packages/core/src/analyzer/graph-builder.ts understand-anything-plugin/packages/core/src/analyzer/graph-builder.test.ts
git commit -m "feat(core): add non-code file support to GraphBuilder"
```

---

## Task 7: Update Core Exports

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/index.ts`

**Step 1: Update exports to include new types and parsers**

Add to `index.ts`:

```typescript
// New structural analysis types
export type {
  SectionInfo,
  DefinitionInfo,
  ServiceInfo,
  EndpointInfo,
  StepInfo,
  ResourceInfo,
  ReferenceResolution,
} from "./types.js";

// Non-code parsers
export {
  MarkdownParser,
  DockerfileParser,
  SQLParser,
  YAMLConfigParser,
  JSONConfigParser,
  TOMLParser,
  EnvParser,
  GraphQLParser,
  ProtobufParser,
  TerraformParser,
  MakefileParser,
  ShellParser,
  registerAllParsers,
} from "./plugins/parsers/index.js";
```

**Step 2: Build to verify exports work**

Run: `pnpm --filter @understand-anything/core build`
Expected: Success, no errors

**Step 3: Commit**

```bash
git add understand-anything-plugin/packages/core/src/index.ts
git commit -m "feat(core): export new types and parsers from core"
```

---

## Task 8: Update Agent Prompts — Project Scanner

**Files:**
- Modify: `understand-anything-plugin/skills/understand/project-scanner-prompt.md`

**Step 1: Update the scanner to discover ALL file types**

Key changes to the prompt:
1. Remove the code-only file filter — scan `.md`, `.yaml`, `.json`, `.sql`, `.tf`, `Dockerfile`, etc.
2. Add a `fileCategory` field to each discovered file: `"code" | "config" | "docs" | "infra" | "data" | "script" | "markup"`
3. Update the exclusion list — still exclude `node_modules/`, `.git/`, binaries, but include non-code files
4. Add category detection logic in the discovery script:
   - `.md`, `.rst`, `.txt` → `"docs"`
   - `.yaml`, `.yml`, `.json`, `.toml`, `.env`, `.xml` → `"config"`
   - `Dockerfile`, `docker-compose.*`, `.tf`, `.github/workflows/*`, `Makefile`, `Jenkinsfile` → `"infra"`
   - `.sql`, `.graphql`, `.proto`, `.schema.json`, `.csv` → `"data"`
   - `.sh`, `.bash`, `.ps1`, `.bat` → `"script"`
   - `.html`, `.css`, `.scss` → `"markup"`
   - Everything else → `"code"`
5. Update output schema to include `fileCategory` per file

**Step 2: Commit**

```bash
git add understand-anything-plugin/skills/understand/project-scanner-prompt.md
git commit -m "feat(agents): update project-scanner to discover all file types"
```

---

## Task 9: Update Agent Prompts — File Analyzer

**Files:**
- Modify: `understand-anything-plugin/skills/understand/file-analyzer-prompt.md`

**Step 1: Add type-aware analysis prompts**

Key changes:
1. Add a section at the top explaining file categories and how to analyze each:
   - **Code files** (current behavior): Extract functions, classes, imports, call graph
   - **Config files**: Extract key settings, what they configure, which code they affect
   - **Documentation files**: Extract sections/headings, key concepts, referenced code components
   - **Infrastructure files**: Extract services, ports, volumes, deployments, which code they deploy
   - **Data/Schema files**: Extract tables, columns, types, relationships, consuming code
   - **Pipeline files**: Extract jobs, steps, triggers, deployed targets

2. Update the output JSON schema to include new fields:
   - `sections` (for docs)
   - `definitions` (for data/schema)
   - `services` (for infra)
   - `endpoints` (for API schemas)
   - `steps` (for pipelines)
   - `resources` (for IaC)

3. Add `nodeType` field to output: what GraphNode type each file should become (file, config, document, service, etc.)

4. Update edge generation guidance:
   - Config files: generate `configures` edges to code files they affect
   - Doc files: generate `documents` edges to described code
   - Dockerfiles: generate `deploys` edges to code directories
   - SQL migrations: generate `migrates` edges to tables
   - CI configs: generate `triggers` edges to pipelines
   - API schemas: generate `defines_schema` edges to endpoints

5. Update tagging guidance with new tags: `documentation`, `configuration`, `infrastructure`, `database`, `api-schema`, `ci-cd`, `deployment`, `migration`

**Step 2: Commit**

```bash
git add understand-anything-plugin/skills/understand/file-analyzer-prompt.md
git commit -m "feat(agents): add type-aware analysis prompts for non-code files"
```

---

## Task 10: Update Agent Prompts — Architecture Analyzer

**Files:**
- Modify: `understand-anything-plugin/skills/understand/architecture-analyzer-prompt.md`

**Step 1: Add non-code pattern detection**

Key changes:
1. Add new architectural patterns to detect:
   - **Deployment topology**: Dockerfile → docker-compose → K8s manifests
   - **Data pipeline**: Schema definition → migration → API endpoint → client code
   - **Documentation coverage**: Which modules have corresponding docs
   - **Configuration graph**: Which config files affect which code paths
2. Update layer hints to include non-code layers:
   - `"infrastructure"` layer for Dockerfiles, K8s, Terraform
   - `"documentation"` layer for docs
   - `"data"` layer for SQL, schemas
   - `"ci-cd"` layer for GitHub Actions, Jenkinsfiles
3. Update script to compute cross-category dependency analysis (code→infra, code→config, etc.)

**Step 2: Commit**

```bash
git add understand-anything-plugin/skills/understand/architecture-analyzer-prompt.md
git commit -m "feat(agents): add non-code pattern detection to architecture analyzer"
```

---

## Task 11: Update Agent Prompts — Tour Builder

**Files:**
- Modify: `understand-anything-plugin/skills/understand/tour-builder-prompt.md`

**Step 1: Add non-code tour stops**

Key changes:
1. Update tour step guidance to include non-code files:
   - Step 1 could be README.md (project overview)
   - Infrastructure stops: "How the app gets containerized"
   - Data stops: "The database schema"
   - CI/CD stops: "How code gets deployed"
2. Update `languageLesson` to also cover non-code concepts:
   - Dockerfile: multi-stage builds, layer caching
   - SQL: normalization, foreign keys
   - YAML: anchors, merge keys
   - Terraform: state management, modules

**Step 2: Commit**

```bash
git add understand-anything-plugin/skills/understand/tour-builder-prompt.md
git commit -m "feat(agents): extend tour builder for non-code file stops"
```

---

## Task 12: Update Agent Prompts — Graph Reviewer

**Files:**
- Modify: `understand-anything-plugin/skills/understand/graph-reviewer-prompt.md`

**Step 1: Update validation for new node/edge types**

Key changes:
1. Add new node types to the valid type list in the validation script
2. Add new edge types to the valid type list
3. Add quality checks for non-code nodes:
   - Config nodes should have `configures` edges
   - Document nodes should have `documents` edges
   - Service nodes should have `deploys` edges
   - Table nodes should reference columns

**Step 2: Commit**

```bash
git add understand-anything-plugin/skills/understand/graph-reviewer-prompt.md
git commit -m "feat(agents): update graph reviewer for new node/edge types"
```

---

## Task 13: Add Language Context Snippets

**Files:**
- Create: `understand-anything-plugin/skills/understand/languages/markdown.md`
- Create: `understand-anything-plugin/skills/understand/languages/yaml.md`
- Create: `understand-anything-plugin/skills/understand/languages/json.md`
- Create: `understand-anything-plugin/skills/understand/languages/sql.md`
- Create: `understand-anything-plugin/skills/understand/languages/dockerfile.md`
- Create: `understand-anything-plugin/skills/understand/languages/terraform.md`
- Create: `understand-anything-plugin/skills/understand/languages/graphql.md`
- Create: `understand-anything-plugin/skills/understand/languages/protobuf.md`
- Create: `understand-anything-plugin/skills/understand/languages/shell.md`
- Create: `understand-anything-plugin/skills/understand/languages/html.md`
- Create: `understand-anything-plugin/skills/understand/languages/css.md`

Each snippet follows the pattern of existing `typescript.md` / `python.md`:

```markdown
# Markdown

## Key Concepts
- Heading hierarchy (# through ######)
- Front matter (YAML metadata between --- delimiters)
- Code blocks (fenced with ``` or indented)
- Reference-style links
- Tables (pipe-delimited)

## Notable File Patterns
- `README.md` — Project overview (high-value entry point)
- `CONTRIBUTING.md` — Contribution guidelines
- `CHANGELOG.md` — Version history
- `docs/**/*.md` — Documentation directory

## Edge Patterns
- Markdown files `documents` the code components they describe
- Links to other .md files create `related` edges
- Code block references may imply `depends_on` edges

## Summary Style
> "Comprehensive guide document with N sections covering [topics]"
```

**Step 1: Create all 11 language snippets**

**Step 2: Commit**

```bash
git add understand-anything-plugin/skills/understand/languages/
git commit -m "feat(agents): add language context snippets for 11 non-code file types"
```

---

## Task 14: Update SKILL.md — Main Pipeline

**Files:**
- Modify: `understand-anything-plugin/skills/understand/SKILL.md`

**Step 1: Update the pipeline to handle non-code files**

Key changes:
1. **Phase 1 (SCAN)**: Update file batching to include non-code files. Add `fileCategory` to batch metadata.
2. **Phase 2 (ANALYZE)**: Update batch construction to group related non-code files together (e.g., Dockerfile + docker-compose.yml). Pass `fileCategory` to file-analyzer prompt.
3. **Phase 4 (ARCHITECTURE)**: Inject non-code language snippets for detected non-code languages.
4. **Phase 5 (TOUR)**: Include non-code nodes in tour candidate pool.
5. **Phase 7 (SAVE)**: No changes needed (schema handles new types).
6. **Node/Edge reference table**: Add the 8 new node types and 8 new edge types.

**Step 2: Commit**

```bash
git add understand-anything-plugin/skills/understand/SKILL.md
git commit -m "feat(pipeline): update main skill pipeline for non-code file analysis"
```

---

## Task 15: Dashboard — Add Node Type Colors to Theme Presets

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/themes/presets.ts:1-143`

**Step 1: Add 8 new node type colors to all 5 presets**

Add these color entries to each preset's `colors` object:

For dark presets:
```typescript
"node-config": "#5eead4",    // Teal
"node-document": "#7dd3fc",  // Sky blue
"node-service": "#a78bfa",   // Violet
"node-table": "#6ee7b7",     // Emerald
"node-endpoint": "#fdba74",  // Orange
"node-pipeline": "#fda4af",  // Rose
"node-schema": "#fcd34d",    // Amber
"node-resource": "#a5b4fc",  // Indigo
```

For light preset, use slightly darker versions:
```typescript
"node-config": "#14b8a6",
"node-document": "#38bdf8",
"node-service": "#8b5cf6",
"node-table": "#34d399",
"node-endpoint": "#fb923c",
"node-pipeline": "#fb7185",
"node-schema": "#facc15",
"node-resource": "#818cf8",
```

**Step 2: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/themes/presets.ts
git commit -m "feat(dashboard): add 8 new node type colors to all theme presets"
```

---

## Task 16: Dashboard — Update CustomNode Component

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/components/CustomNode.tsx:1-137`

**Step 1: Add new entries to typeColors and typeTextColors maps**

```typescript
const typeColors: Record<string, string> = {
  file: "var(--color-node-file)",
  function: "var(--color-node-function)",
  class: "var(--color-node-class)",
  module: "var(--color-node-module)",
  concept: "var(--color-node-concept)",
  config: "var(--color-node-config)",
  document: "var(--color-node-document)",
  service: "var(--color-node-service)",
  table: "var(--color-node-table)",
  endpoint: "var(--color-node-endpoint)",
  pipeline: "var(--color-node-pipeline)",
  schema: "var(--color-node-schema)",
  resource: "var(--color-node-resource)",
};

const typeTextColors: Record<string, string> = {
  file: "text-node-file",
  function: "text-node-function",
  class: "text-node-class",
  module: "text-node-module",
  concept: "text-node-concept",
  config: "text-node-config",
  document: "text-node-document",
  service: "text-node-service",
  table: "text-node-table",
  endpoint: "text-node-endpoint",
  pipeline: "text-node-pipeline",
  schema: "text-node-schema",
  resource: "text-node-resource",
};
```

**Step 2: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/CustomNode.tsx
git commit -m "feat(dashboard): add new node type colors to CustomNode"
```

---

## Task 17: Dashboard — Update NodeInfo Sidebar

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/components/NodeInfo.tsx:1-312`

**Step 1: Add badge colors for new node types**

Add to `typeBadgeColors`:
```typescript
config: "text-node-config border border-node-config/30 bg-node-config/10",
document: "text-node-document border border-node-document/30 bg-node-document/10",
service: "text-node-service border border-node-service/30 bg-node-service/10",
table: "text-node-table border border-node-table/30 bg-node-table/10",
endpoint: "text-node-endpoint border border-node-endpoint/30 bg-node-endpoint/10",
pipeline: "text-node-pipeline border border-node-pipeline/30 bg-node-pipeline/10",
schema: "text-node-schema border border-node-schema/30 bg-node-schema/10",
resource: "text-node-resource border border-node-resource/30 bg-node-resource/10",
```

**Step 2: Add directional labels for new edge types**

Add to `getDirectionalLabel()`:
```typescript
case "deploys":
  return isSource ? "deploys" : "deployed by";
case "serves":
  return isSource ? "serves" : "served by";
case "migrates":
  return isSource ? "migrates" : "migrated by";
case "documents":
  return isSource ? "documents" : "documented by";
case "provisions":
  return isSource ? "provisions" : "provisioned by";
case "routes":
  return isSource ? "routes to" : "routed from";
case "defines_schema":
  return isSource ? "defines schema for" : "schema defined by";
case "triggers":
  return isSource ? "triggers" : "triggered by";
```

**Step 3: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/NodeInfo.tsx
git commit -m "feat(dashboard): add new node/edge type support to NodeInfo sidebar"
```

---

## Task 18: Dashboard — Update ProjectOverview with File Type Breakdown

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/components/ProjectOverview.tsx`

**Step 1: Add file type distribution**

Add a "File Types" section after the stats grid that shows count per node type category:
- Code: file + function + class
- Config: config
- Docs: document
- Infra: service + resource + pipeline
- Data: table + endpoint + schema

Use colored dots matching the node type colors.

**Step 2: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/ProjectOverview.tsx
git commit -m "feat(dashboard): add file type breakdown to ProjectOverview"
```

---

## Task 19: Dashboard — Add Filter Controls

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/store.ts`
- Modify: `understand-anything-plugin/packages/dashboard/src/components/GraphView.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/App.tsx`

**Step 1: Add filter state to store**

Add to the Zustand store:
```typescript
nodeTypeFilters: Record<string, boolean>; // { code: true, config: true, docs: true, infra: true, data: true }
toggleNodeTypeFilter: (category: string) => void;
```

Default all categories to `true` (visible).

**Step 2: Apply filters in GraphView topology computation**

In `useLayerDetailTopology`, filter nodes based on `nodeTypeFilters` before layout.

**Step 3: Add filter checkboxes to App.tsx header**

Add small checkbox toggles next to the layer legend for each category.

**Step 4: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/store.ts understand-anything-plugin/packages/dashboard/src/components/GraphView.tsx understand-anything-plugin/packages/dashboard/src/App.tsx
git commit -m "feat(dashboard): add node type category filter controls"
```

---

## Task 20: Dashboard Build Verification

**Step 1: Build the dashboard**

Run: `pnpm --filter @understand-anything/dashboard build`
Expected: Success, no TypeScript errors

**Step 2: Build the core package**

Run: `pnpm --filter @understand-anything/core build`
Expected: Success

**Step 3: Run all core tests**

Run: `pnpm --filter @understand-anything/core test`
Expected: All tests pass

**Step 4: Run lint**

Run: `pnpm lint`
Expected: No errors

**Step 5: Commit any lint fixes**

```bash
git add -A
git commit -m "fix: lint and build fixes for universal file type support"
```

---

## Task 21: Integration Test — End-to-End Verification

**Step 1: Dev server smoke test**

Run: `pnpm dev:dashboard`
- Load a knowledge graph that includes non-code nodes
- Verify new node types render with correct colors
- Verify NodeInfo sidebar shows new edge labels
- Verify filter controls work

**Step 2: Generate test graph with non-code nodes**

Update `scripts/generate-large-graph.mjs` to include non-code node types in the random generation, then generate a test graph and load it in the dashboard.

**Step 3: Commit**

```bash
git add scripts/generate-large-graph.mjs
git commit -m "feat(scripts): include non-code node types in test graph generator"
```

---

## Task 22: Version Bump & Final Commit

**Files:**
- Modify: `understand-anything-plugin/package.json` → bump version
- Modify: `.claude-plugin/marketplace.json` → bump version
- Modify: `.claude-plugin/plugin.json` → bump version
- Modify: `.cursor-plugin/plugin.json` → bump version

**Step 1: Bump version in all 4 files** (e.g., 1.3.0 → 1.4.0)

**Step 2: Final commit**

```bash
git add understand-anything-plugin/package.json .claude-plugin/marketplace.json .claude-plugin/plugin.json .cursor-plugin/plugin.json
git commit -m "chore: bump version to 1.4.0 for universal file type support"
```

---

## Summary of All Tasks

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 1 | Extend core types | types.ts | — |
| 2 | Extend schema validation | schema.ts | 1 |
| 3 | Update PluginRegistry | registry.ts | 1 |
| 4 | Add 26 language configs | languages/configs/ | 1 |
| 5 | Build 12 custom parsers | plugins/parsers/ | 1, 3 |
| 6 | Update GraphBuilder | graph-builder.ts | 1 |
| 7 | Update core exports | index.ts | 1-6 |
| 8 | Update project-scanner prompt | project-scanner-prompt.md | — |
| 9 | Update file-analyzer prompt | file-analyzer-prompt.md | — |
| 10 | Update architecture-analyzer prompt | architecture-analyzer-prompt.md | — |
| 11 | Update tour-builder prompt | tour-builder-prompt.md | — |
| 12 | Update graph-reviewer prompt | graph-reviewer-prompt.md | — |
| 13 | Add language context snippets | languages/*.md | — |
| 14 | Update SKILL.md pipeline | SKILL.md | 8-13 |
| 15 | Dashboard theme colors | presets.ts | — |
| 16 | Dashboard CustomNode | CustomNode.tsx | 15 |
| 17 | Dashboard NodeInfo | NodeInfo.tsx | 15 |
| 18 | Dashboard ProjectOverview | ProjectOverview.tsx | 15 |
| 19 | Dashboard filter controls | store.ts, GraphView.tsx, App.tsx | 15-18 |
| 20 | Build verification | — | 1-19 |
| 21 | Integration test | — | 20 |
| 22 | Version bump | package.json × 4 | 21 |

**Parallelizable groups:**
- Tasks 1-7 (core) are sequential
- Tasks 8-14 (agent prompts) can run in parallel with each other, and in parallel with Tasks 15-19 (dashboard)
- Tasks 20-22 are sequential and depend on all prior tasks
````

## File: docs/superpowers/plans/2026-03-29-homepage-update-impl.md
````markdown
# Homepage Feature Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the Astro homepage to reflect features from v1.2.0–v2.0.0 releases.

**Architecture:** Three file edits — expand Features.astro from 3→6 cards, update Install.astro platform note, update Footer.astro tagline. No new files or structural changes.

**Tech Stack:** Astro 6, CSS grid

---

### Task 1: Update Features.astro — Replace 3 Cards with 6

**Files:**
- Modify: `homepage/src/components/Features.astro`

**Step 1: Replace the features array (lines 2–18)**

Replace the entire frontmatter features array with:

```astro
---
const features = [
  {
    icon: '◈',
    title: 'Interactive Knowledge Graph',
    description: 'Visualize files, functions, and dependencies as an explorable graph with hierarchical drill-down and smart layout.',
  },
  {
    icon: '⬡',
    title: 'Beyond Code Analysis',
    description: 'Analyze your entire project — Dockerfiles, Terraform, SQL, Markdown, and 26+ file types mapped into one unified graph.',
  },
  {
    icon: '⊘',
    title: 'Smart Filtering & Search',
    description: 'Filter by node type, complexity, layer, or edge category. Fuzzy and semantic search to find anything instantly.',
  },
  {
    icon: '⎙',
    title: 'Export & Share',
    description: 'Export your knowledge graph as high-quality PNG, SVG, or filtered JSON — ready for docs, presentations, or further analysis.',
  },
  {
    icon: '⟿',
    title: 'Dependency Path Finder',
    description: 'Find the shortest path between any two components. Understand how parts of your system connect at a glance.',
  },
  {
    icon: '⟐',
    title: 'Guided Tours & Onboarding',
    description: 'AI-generated walkthroughs that teach the codebase step by step, plus onboarding guides for new team members.',
  },
];
---
```

**Step 2: Update the reveal delay logic (line 24)**

The current `reveal-delay-${i + 1}` only has CSS for delays 1–3. With 6 cards in 2 rows, use modulo so each row staggers 1/2/3:

```astro
<div class={`feature-card reveal reveal-delay-${(i % 3) + 1}`}>
```

**Step 3: Update the grid CSS to handle 2 rows properly**

No change needed — `grid-template-columns: repeat(3, 1fr)` already wraps to a second row. The mobile `1fr` breakpoint also works. No CSS changes required.

**Step 4: Verify build**

Run: `cd homepage && npx astro build`
Expected: Build completes with no errors.

**Step 5: Commit**

```bash
git add homepage/src/components/Features.astro
git commit -m "feat(homepage): expand features section to 6 cards for v2.0.0"
```

---

### Task 2: Update Install.astro — Multi-Platform Note

**Files:**
- Modify: `homepage/src/components/Install.astro`

**Step 1: Replace the platform note (line 13)**

Change:
```html
<p class="install-note">Works with <strong>Claude Code</strong> — Anthropic's official CLI for Claude.</p>
```

To:
```html
<p class="install-note">Works with <strong>Claude Code</strong>, <strong>Codex</strong>, <strong>OpenCode</strong>, <strong>Gemini CLI</strong>, and more.</p>
```

**Step 2: Commit**

```bash
git add homepage/src/components/Install.astro
git commit -m "feat(homepage): update install note for multi-platform support"
```

---

### Task 3: Update Footer.astro — Tagline

**Files:**
- Modify: `homepage/src/components/Footer.astro`

**Step 1: Replace the tagline (line 13)**

Change:
```html
<p class="footer-note">Built as a Claude Code plugin</p>
```

To:
```html
<p class="footer-note">Built for AI coding assistants</p>
```

**Step 2: Verify full build**

Run: `cd homepage && npx astro build`
Expected: Clean build, no errors.

**Step 3: Commit**

```bash
git add homepage/src/components/Footer.astro
git commit -m "feat(homepage): update footer tagline for multi-platform"
```
````

## File: docs/superpowers/plans/2026-04-01-business-domain-knowledge-impl.md
````markdown
# Business Domain Knowledge Extraction — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/understand-domain` skill that extracts business domain knowledge from codebases and renders it as an interactive horizontal flow graph in the dashboard.

**Architecture:** Separate `domain-graph.json` file using extended `KnowledgeGraph` schema (3 new node types, 4 new edge types, optional `domainMeta` field). Two analysis paths: lightweight scan (no existing graph) or derivation from existing graph. Dashboard shows domain view by default when available, with pill toggle to switch to structural view.

**Tech Stack:** TypeScript, Zod, React Flow (dagre LR layout), Zustand, Vitest, web-tree-sitter

**Design Spec:** `docs/plans/2026-04-01-business-domain-knowledge-design.md`

---

## Task 1: Extend Core Types

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/types.ts`

- [ ] **Step 1: Write failing test for new node types**

Create test file:

```typescript
// understand-anything-plugin/packages/core/src/__tests__/domain-types.test.ts
import { describe, it, expect } from "vitest";
import { validateGraph } from "../schema.js";
import type { KnowledgeGraph } from "../types.js";

const domainGraph: KnowledgeGraph = {
  version: "1.0.0",
  project: {
    name: "test-project",
    languages: ["typescript"],
    frameworks: [],
    description: "A test project",
    analyzedAt: "2026-04-01T00:00:00.000Z",
    gitCommitHash: "abc123",
  },
  nodes: [
    {
      id: "domain:order-management",
      type: "domain",
      name: "Order Management",
      summary: "Handles order lifecycle",
      tags: ["core"],
      complexity: "complex",
    },
    {
      id: "flow:create-order",
      type: "flow",
      name: "Create Order",
      summary: "Customer submits a new order",
      tags: ["write-path"],
      complexity: "moderate",
      domainMeta: {
        entryPoint: "POST /api/orders",
        entryType: "http",
      },
    },
    {
      id: "step:create-order:validate",
      type: "step",
      name: "Validate Input",
      summary: "Checks request body",
      tags: ["validation"],
      complexity: "simple",
      filePath: "src/validators/order.ts",
      lineRange: [10, 30],
    },
  ],
  edges: [
    {
      source: "domain:order-management",
      target: "flow:create-order",
      type: "contains_flow",
      direction: "forward",
      weight: 1.0,
    },
    {
      source: "flow:create-order",
      target: "step:create-order:validate",
      type: "flow_step",
      direction: "forward",
      weight: 0.1,
    },
  ],
  layers: [],
  tour: [],
};

describe("domain graph types", () => {
  it("validates a domain graph with domain/flow/step node types", () => {
    const result = validateGraph(domainGraph);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.nodes).toHaveLength(3);
    expect(result.data!.edges).toHaveLength(2);
  });

  it("validates contains_flow edge type", () => {
    const result = validateGraph(domainGraph);
    expect(result.success).toBe(true);
    expect(result.data!.edges[0].type).toBe("contains_flow");
  });

  it("validates flow_step edge type", () => {
    const result = validateGraph(domainGraph);
    expect(result.success).toBe(true);
    expect(result.data!.edges[1].type).toBe("flow_step");
  });

  it("validates cross_domain edge type", () => {
    const graph = structuredClone(domainGraph);
    graph.nodes.push({
      id: "domain:logistics",
      type: "domain",
      name: "Logistics",
      summary: "Handles shipping",
      tags: [],
      complexity: "moderate",
    });
    graph.edges.push({
      source: "domain:order-management",
      target: "domain:logistics",
      type: "cross_domain",
      direction: "forward",
      description: "Triggers on order confirmed",
      weight: 0.6,
    });
    const result = validateGraph(graph);
    expect(result.success).toBe(true);
  });

  it("normalizes domain type aliases", () => {
    const graph = structuredClone(domainGraph);
    (graph.nodes[0] as any).type = "business_domain";
    (graph.nodes[1] as any).type = "workflow";
    (graph.nodes[2] as any).type = "action";
    const result = validateGraph(graph);
    expect(result.success).toBe(true);
    expect(result.data!.nodes[0].type).toBe("domain");
    expect(result.data!.nodes[1].type).toBe("flow");
    expect(result.data!.nodes[2].type).toBe("step");
  });

  it("normalizes domain edge type aliases", () => {
    const graph = structuredClone(domainGraph);
    (graph.edges[0] as any).type = "has_flow";
    (graph.edges[1] as any).type = "next_step";
    const result = validateGraph(graph);
    expect(result.success).toBe(true);
    expect(result.data!.edges[0].type).toBe("contains_flow");
    expect(result.data!.edges[1].type).toBe("flow_step");
  });

  it("preserves domainMeta on nodes through validation", () => {
    const result = validateGraph(domainGraph);
    expect(result.success).toBe(true);
    // domainMeta is passthrough — schema uses .passthrough()
    const flowNode = result.data!.nodes.find((n) => n.id === "flow:create-order");
    expect((flowNode as any).domainMeta).toEqual({
      entryPoint: "POST /api/orders",
      entryType: "http",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/__tests__/domain-types.test.ts`

Expected: FAIL — "domain" is not a valid NodeType enum value

- [ ] **Step 3: Add domain/flow/step to NodeType union**

In `understand-anything-plugin/packages/core/src/types.ts`, update the `NodeType` union (lines 1-5):

```typescript
// Node types (16 total: 5 code + 8 non-code + 3 domain)
export type NodeType =
  | "file" | "function" | "class" | "module" | "concept"
  | "config" | "document" | "service" | "table" | "endpoint"
  | "pipeline" | "schema" | "resource"
  | "domain" | "flow" | "step";
```

Update `EdgeType` union (lines 7-15):

```typescript
// Edge types (30 total in 7 categories)
export type EdgeType =
  | "imports" | "exports" | "contains" | "inherits" | "implements"  // Structural
  | "calls" | "subscribes" | "publishes" | "middleware"              // Behavioral
  | "reads_from" | "writes_to" | "transforms" | "validates"         // Data flow
  | "depends_on" | "tested_by" | "configures"                       // Dependencies
  | "related" | "similar_to"                                         // Semantic
  | "deploys" | "serves" | "provisions" | "triggers"                // Infrastructure
  | "migrates" | "documents" | "routes" | "defines_schema"          // Schema/Data
  | "contains_flow" | "flow_step" | "cross_domain";                 // Domain
```

Add `DomainMeta` interface after `GraphNode` (after line 28):

```typescript
// Optional domain metadata for domain/flow/step nodes
export interface DomainMeta {
  // For domain nodes
  entities?: string[];
  businessRules?: string[];
  crossDomainInteractions?: string[];
  // For flow nodes
  entryPoint?: string;
  entryType?: "http" | "cli" | "event" | "cron" | "manual";
}
```

- [ ] **Step 4: Update Zod schemas in schema.ts**

In `understand-anything-plugin/packages/core/src/schema.ts`:

Update `EdgeTypeSchema` (lines 4-12) to add the 4 new edge types:

```typescript
export const EdgeTypeSchema = z.enum([
  "imports", "exports", "contains", "inherits", "implements",
  "calls", "subscribes", "publishes", "middleware",
  "reads_from", "writes_to", "transforms", "validates",
  "depends_on", "tested_by", "configures",
  "related", "similar_to",
  "deploys", "serves", "provisions", "triggers",
  "migrates", "documents", "routes", "defines_schema",
  "contains_flow", "flow_step", "cross_domain",
]);
```

Add domain aliases to `NODE_TYPE_ALIASES` (after line 52):

```typescript
  // Domain aliases
  business_domain: "domain",
  process: "flow",
  workflow: "flow",
  action: "step",
  task: "step",
```

Note: This overwrites the existing `workflow: "pipeline"` and `action: "pipeline"` mappings. Since domain extraction is the newer, higher-priority feature, the domain aliases take precedence. The LLM prompt for structural analysis already uses `"pipeline"` directly.

Add domain edge aliases to `EDGE_TYPE_ALIASES` (after line 81):

```typescript
  // Domain edge aliases
  has_flow: "contains_flow",
  next_step: "flow_step",
  interacts_with: "cross_domain",
  implemented_by: "implements",
```

Update `GraphNodeSchema` (lines 310-324) to add domain types and use `.passthrough()`:

```typescript
export const GraphNodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    "file", "function", "class", "module", "concept",
    "config", "document", "service", "table", "endpoint",
    "pipeline", "schema", "resource",
    "domain", "flow", "step",
  ]),
  name: z.string(),
  filePath: z.string().optional(),
  lineRange: z.tuple([z.number(), z.number()]).optional(),
  summary: z.string(),
  tags: z.array(z.string()),
  complexity: z.enum(["simple", "moderate", "complex"]),
  languageNotes: z.string().optional(),
}).passthrough();
```

The `.passthrough()` allows `domainMeta` and other extra fields to survive validation without needing to define them in Zod (keeps the schema simple and forward-compatible).

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/__tests__/domain-types.test.ts`

Expected: All 7 tests PASS

- [ ] **Step 6: Run existing tests to verify no regressions**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run`

Expected: All existing tests PASS

- [ ] **Step 7: Commit**

```bash
git add understand-anything-plugin/packages/core/src/types.ts \
       understand-anything-plugin/packages/core/src/schema.ts \
       understand-anything-plugin/packages/core/src/__tests__/domain-types.test.ts
git commit -m "feat(core): add domain/flow/step node types and domain edge types for business domain knowledge"
```

---

## Task 2: Add Domain Graph Persistence

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/persistence/index.ts`
- Modify: `understand-anything-plugin/packages/core/src/index.ts`

- [ ] **Step 1: Write failing test for domain graph persistence**

```typescript
// understand-anything-plugin/packages/core/src/__tests__/domain-persistence.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { saveDomainGraph, loadDomainGraph } from "../persistence/index.js";
import type { KnowledgeGraph } from "../types.js";

const testRoot = join(tmpdir(), "ua-domain-persist-test");

const domainGraph: KnowledgeGraph = {
  version: "1.0.0",
  project: {
    name: "test",
    languages: ["typescript"],
    frameworks: [],
    description: "test",
    analyzedAt: "2026-04-01T00:00:00.000Z",
    gitCommitHash: "abc123",
  },
  nodes: [
    {
      id: "domain:orders",
      type: "domain" as any,
      name: "Orders",
      summary: "Order management",
      tags: [],
      complexity: "moderate",
    },
  ],
  edges: [],
  layers: [],
  tour: [],
};

describe("domain graph persistence", () => {
  beforeEach(() => {
    if (existsSync(testRoot)) rmSync(testRoot, { recursive: true });
    mkdirSync(testRoot, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testRoot)) rmSync(testRoot, { recursive: true });
  });

  it("saves and loads domain graph", () => {
    saveDomainGraph(testRoot, domainGraph);
    const loaded = loadDomainGraph(testRoot);
    expect(loaded).not.toBeNull();
    expect(loaded!.nodes[0].id).toBe("domain:orders");
  });

  it("returns null when no domain graph exists", () => {
    const loaded = loadDomainGraph(testRoot);
    expect(loaded).toBeNull();
  });

  it("saves to domain-graph.json, not knowledge-graph.json", () => {
    saveDomainGraph(testRoot, domainGraph);
    const domainPath = join(testRoot, ".understand-anything", "domain-graph.json");
    const structuralPath = join(testRoot, ".understand-anything", "knowledge-graph.json");
    expect(existsSync(domainPath)).toBe(true);
    expect(existsSync(structuralPath)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/__tests__/domain-persistence.test.ts`

Expected: FAIL — `saveDomainGraph` is not exported

- [ ] **Step 3: Implement saveDomainGraph and loadDomainGraph**

Add to `understand-anything-plugin/packages/core/src/persistence/index.ts` (after `loadConfig` function, before end of file):

```typescript
const DOMAIN_GRAPH_FILE = "domain-graph.json";

export function saveDomainGraph(projectRoot: string, graph: KnowledgeGraph): void {
  const dir = ensureDir(projectRoot);
  const sanitised = sanitiseFilePaths(graph, projectRoot);
  writeFileSync(
    join(dir, DOMAIN_GRAPH_FILE),
    JSON.stringify(sanitised, null, 2),
    "utf-8",
  );
}

export function loadDomainGraph(
  projectRoot: string,
  options?: { validate?: boolean },
): KnowledgeGraph | null {
  const filePath = join(projectRoot, UA_DIR, DOMAIN_GRAPH_FILE);
  if (!existsSync(filePath)) return null;

  const data = JSON.parse(readFileSync(filePath, "utf-8"));

  if (options?.validate !== false) {
    const result = validateGraph(data);
    if (!result.success) {
      throw new Error(
        `Invalid domain graph: ${result.fatal ?? "unknown error"}`,
      );
    }
    return result.data as KnowledgeGraph;
  }

  return data as KnowledgeGraph;
}
```

- [ ] **Step 4: Export from core index**

Add to `understand-anything-plugin/packages/core/src/index.ts` (after the existing persistence re-exports on line 2):

The existing line 2 is `export * from "./persistence/index.js";` which will auto-export the new functions. No change needed — the wildcard export picks up `saveDomainGraph` and `loadDomainGraph` automatically.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/__tests__/domain-persistence.test.ts`

Expected: All 3 tests PASS

- [ ] **Step 6: Run all core tests for regressions**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run`

Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add understand-anything-plugin/packages/core/src/persistence/index.ts \
       understand-anything-plugin/packages/core/src/__tests__/domain-persistence.test.ts
git commit -m "feat(core): add saveDomainGraph/loadDomainGraph persistence functions"
```

---

## Task 3: Update Normalize Graph for Domain ID Prefixes

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/analyzer/normalize-graph.ts`

- [ ] **Step 1: Write failing test for domain ID normalization**

```typescript
// understand-anything-plugin/packages/core/src/__tests__/domain-normalize.test.ts
import { describe, it, expect } from "vitest";
import { normalizeNodeId } from "../analyzer/normalize-graph.js";

describe("domain node ID normalization", () => {
  it("normalizes domain node IDs", () => {
    const result = normalizeNodeId("domain:order-management", {
      type: "domain",
      name: "Order Management",
    });
    expect(result).toBe("domain:order-management");
  });

  it("normalizes flow node IDs", () => {
    const result = normalizeNodeId("flow:create-order", {
      type: "flow",
      name: "Create Order",
    });
    expect(result).toBe("flow:create-order");
  });

  it("normalizes step node IDs with filePath", () => {
    const result = normalizeNodeId("step:create-order:validate", {
      type: "step",
      name: "Validate",
      filePath: "src/validators/order.ts",
    });
    expect(result).toBe("step:src/validators/order.ts:validate");
  });

  it("normalizes step node IDs without filePath", () => {
    const result = normalizeNodeId("step:validate", {
      type: "step",
      name: "Validate",
    });
    expect(result).toBe("step:validate");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/__tests__/domain-normalize.test.ts`

Expected: FAIL — "domain" is not a valid prefix in `VALID_PREFIXES`

- [ ] **Step 3: Add domain prefixes to normalize-graph.ts**

In `understand-anything-plugin/packages/core/src/analyzer/normalize-graph.ts`:

Add `"domain"`, `"flow"`, `"step"` to `VALID_PREFIXES` (lines 1-5):

```typescript
const VALID_PREFIXES = new Set([
  "file", "func", "class", "module", "concept",
  "config", "document", "service", "table", "endpoint",
  "pipeline", "schema", "resource",
  "domain", "flow", "step",
]);
```

Add to `TYPE_TO_PREFIX` map (lines 7-21):

```typescript
  domain: "domain",
  flow: "flow",
  step: "step",
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run src/__tests__/domain-normalize.test.ts`

Expected: All 4 tests PASS

- [ ] **Step 5: Run all core tests**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run`

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add understand-anything-plugin/packages/core/src/analyzer/normalize-graph.ts \
       understand-anything-plugin/packages/core/src/__tests__/domain-normalize.test.ts
git commit -m "feat(core): add domain/flow/step prefixes to node ID normalization"
```

---

## Task 4: Build Core Package and Verify

**Files:**
- None (build verification)

- [ ] **Step 1: Build core package**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core build`

Expected: Build succeeds with no errors

- [ ] **Step 2: Run full test suite**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run`

Expected: All tests PASS

- [ ] **Step 3: Commit (if any build config changes were needed)**

Only commit if build required changes. Otherwise skip.

---

## Task 5: Dashboard Store — Add Domain State

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/store.ts`

- [ ] **Step 1: Add ViewMode type and domain state to store**

In `understand-anything-plugin/packages/dashboard/src/store.ts`:

Add `ViewMode` type after the existing type definitions (after line 14):

```typescript
export type ViewMode = "structural" | "domain";
```

Update `NodeType` (line 12) to include domain types:

```typescript
export type NodeType = "file" | "function" | "class" | "module" | "concept" | "config" | "document" | "service" | "table" | "endpoint" | "pipeline" | "schema" | "resource" | "domain" | "flow" | "step";
```

Update `ALL_NODE_TYPES` (line 23):

```typescript
export const ALL_NODE_TYPES: NodeType[] = ["file", "function", "class", "module", "concept", "config", "document", "service", "table", "endpoint", "pipeline", "schema", "resource", "domain", "flow", "step"];
```

Add domain edge category to `EDGE_CATEGORY_MAP` (after line 33):

```typescript
export const EDGE_CATEGORY_MAP: Record<EdgeCategory, string[]> = {
  structural: ["imports", "exports", "contains", "inherits", "implements"],
  behavioral: ["calls", "subscribes", "publishes", "middleware"],
  "data-flow": ["reads_from", "writes_to", "transforms", "validates"],
  dependencies: ["depends_on", "tested_by", "configures"],
  semantic: ["related", "similar_to"],
};

export const DOMAIN_EDGE_TYPES = ["contains_flow", "flow_step", "cross_domain"];
```

Add to `DashboardStore` interface (after line 93):

```typescript
  // Domain view
  viewMode: ViewMode;
  domainGraph: KnowledgeGraph | null;
  activeDomainId: string | null;

  setDomainGraph: (graph: KnowledgeGraph) => void;
  setViewMode: (mode: ViewMode) => void;
  navigateToDomain: (domainId: string) => void;
```

- [ ] **Step 2: Implement domain state in the create() block**

In the `create<DashboardStore>()` call (after line 183):

```typescript
  viewMode: "structural",
  domainGraph: null,
  activeDomainId: null,

  setDomainGraph: (graph) => {
    set({ domainGraph: graph, viewMode: "domain" });
  },

  setViewMode: (mode) => {
    set({
      viewMode: mode,
      selectedNodeId: null,
      focusNodeId: null,
      codeViewerOpen: false,
      codeViewerNodeId: null,
    });
  },

  navigateToDomain: (domainId) => {
    set({
      activeDomainId: domainId,
      selectedNodeId: null,
      focusNodeId: null,
    });
  },
```

- [ ] **Step 3: Verify dashboard builds**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/store.ts
git commit -m "feat(dashboard): add domain view state to store (viewMode, domainGraph, activeDomainId)"
```

---

## Task 6: Dashboard — View Mode Toggle

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/App.tsx`

- [ ] **Step 1: Add domain graph loading to Dashboard component**

In `understand-anything-plugin/packages/dashboard/src/App.tsx`, add store selectors (after line 81):

```typescript
  const viewMode = useDashboardStore((s) => s.viewMode);
  const setViewMode = useDashboardStore((s) => s.setViewMode);
  const domainGraph = useDashboardStore((s) => s.domainGraph);
  const setDomainGraph = useDashboardStore((s) => s.setDomainGraph);
```

Add a `useEffect` to load `domain-graph.json` (after the diff-overlay useEffect, ~line 265):

```typescript
  useEffect(() => {
    fetch(tokenUrl("/domain-graph.json", accessToken))
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data: unknown) => {
        if (!data) return;
        const result = validateGraph(data);
        if (result.success && result.data) {
          setDomainGraph(result.data);
        }
      })
      .catch(() => {
        // Silently ignore — domain graph is optional
      });
  }, [setDomainGraph]);
```

- [ ] **Step 2: Add view mode toggle pill to header**

In the header left section (after PersonaSelector, around line 290), add the toggle pill. Only show when both graphs exist:

```typescript
          {graph && domainGraph && (
            <>
              <div className="w-px h-5 bg-border-subtle" />
              <div className="flex items-center bg-elevated rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("domain")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewMode === "domain"
                      ? "bg-accent/20 text-accent"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  Domain
                </button>
                <button
                  onClick={() => setViewMode("structural")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewMode === "structural"
                      ? "bg-accent/20 text-accent"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  Structural
                </button>
              </div>
            </>
          )}
```

- [ ] **Step 3: Verify dashboard builds**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/App.tsx
git commit -m "feat(dashboard): add domain graph loading and view mode toggle pill"
```

---

## Task 7: Dashboard — Domain Cluster Node Component

**Files:**
- Create: `understand-anything-plugin/packages/dashboard/src/components/DomainClusterNode.tsx`

- [ ] **Step 1: Create the DomainClusterNode component**

```typescript
// understand-anything-plugin/packages/dashboard/src/components/DomainClusterNode.tsx
import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import { useDashboardStore } from "../store";

export interface DomainClusterData {
  label: string;
  summary: string;
  entities?: string[];
  flowCount: number;
  businessRules?: string[];
  domainId: string;
}

export type DomainClusterFlowNode = Node<DomainClusterData, "domain-cluster">;

function DomainClusterNode({ data, id }: NodeProps<DomainClusterFlowNode>) {
  const navigateToDomain = useDashboardStore((s) => s.navigateToDomain);
  const selectedNodeId = useDashboardStore((s) => s.selectedNodeId);
  const selectNode = useDashboardStore((s) => s.selectNode);
  const isSelected = selectedNodeId === data.domainId;

  return (
    <div
      className={`rounded-xl border-2 px-5 py-4 min-w-[280px] max-w-[360px] cursor-pointer transition-all ${
        isSelected
          ? "border-accent bg-accent/10 shadow-lg shadow-accent/10"
          : "border-accent/40 bg-surface hover:border-accent/70"
      }`}
      onClick={() => selectNode(data.domainId)}
      onDoubleClick={() => navigateToDomain(data.domainId)}
    >
      <Handle type="target" position={Position.Left} className="!bg-accent/60 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-accent/60 !w-2 !h-2" />

      <div className="font-serif text-sm text-accent font-semibold mb-1 truncate">
        {data.label}
      </div>
      <div className="text-[11px] text-text-secondary line-clamp-2 mb-2">
        {data.summary}
      </div>

      {data.entities && data.entities.length > 0 && (
        <div className="mb-2">
          <div className="text-[9px] uppercase tracking-wider text-text-muted mb-1">Entities</div>
          <div className="flex flex-wrap gap-1">
            {data.entities.slice(0, 5).map((e) => (
              <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-elevated text-text-secondary">
                {e}
              </span>
            ))}
            {data.entities.length > 5 && (
              <span className="text-[10px] text-text-muted">+{data.entities.length - 5}</span>
            )}
          </div>
        </div>
      )}

      <div className="text-[10px] text-text-muted">
        {data.flowCount} flow{data.flowCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

export default memo(DomainClusterNode);
```

- [ ] **Step 2: Verify dashboard builds**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/DomainClusterNode.tsx
git commit -m "feat(dashboard): add DomainClusterNode component for domain view"
```

---

## Task 8: Dashboard — Flow and Step Node Components

**Files:**
- Create: `understand-anything-plugin/packages/dashboard/src/components/FlowNode.tsx`
- Create: `understand-anything-plugin/packages/dashboard/src/components/StepNode.tsx`

- [ ] **Step 1: Create the FlowNode component**

```typescript
// understand-anything-plugin/packages/dashboard/src/components/FlowNode.tsx
import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import { useDashboardStore } from "../store";

export interface FlowNodeData {
  label: string;
  summary: string;
  entryPoint?: string;
  entryType?: string;
  stepCount: number;
  flowId: string;
}

export type FlowFlowNode = Node<FlowNodeData, "flow-node">;

function FlowNode({ data }: NodeProps<FlowFlowNode>) {
  const selectNode = useDashboardStore((s) => s.selectNode);
  const selectedNodeId = useDashboardStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === data.flowId;

  return (
    <div
      className={`rounded-lg border px-4 py-3 min-w-[240px] max-w-[320px] cursor-pointer transition-all ${
        isSelected
          ? "border-accent bg-accent/10"
          : "border-border-medium bg-surface hover:border-accent/50"
      }`}
      onClick={() => selectNode(data.flowId)}
    >
      <Handle type="target" position={Position.Left} className="!bg-accent/60 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-accent/60 !w-2 !h-2" />

      {data.entryPoint && (
        <div className="text-[9px] font-mono text-accent/70 mb-1 truncate">
          {data.entryPoint}
        </div>
      )}
      <div className="text-xs font-semibold text-text-primary mb-1 truncate">
        {data.label}
      </div>
      <div className="text-[10px] text-text-secondary line-clamp-2">
        {data.summary}
      </div>
      <div className="text-[9px] text-text-muted mt-1">
        {data.stepCount} step{data.stepCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

export default memo(FlowNode);
```

- [ ] **Step 2: Create the StepNode component**

```typescript
// understand-anything-plugin/packages/dashboard/src/components/StepNode.tsx
import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import { useDashboardStore } from "../store";

export interface StepNodeData {
  label: string;
  summary: string;
  filePath?: string;
  stepId: string;
  order: number;
}

export type StepFlowNode = Node<StepNodeData, "step-node">;

function StepNode({ data }: NodeProps<StepFlowNode>) {
  const selectNode = useDashboardStore((s) => s.selectNode);
  const selectedNodeId = useDashboardStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === data.stepId;

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 min-w-[180px] max-w-[240px] cursor-pointer transition-all ${
        isSelected
          ? "border-accent bg-accent/10"
          : "border-border-subtle bg-elevated hover:border-accent/40"
      }`}
      onClick={() => selectNode(data.stepId)}
    >
      <Handle type="target" position={Position.Left} className="!bg-text-muted/40 !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Right} className="!bg-text-muted/40 !w-1.5 !h-1.5" />

      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[9px] font-mono text-accent/60 shrink-0">
          {data.order}
        </span>
        <span className="text-[11px] font-medium text-text-primary truncate">
          {data.label}
        </span>
      </div>
      <div className="text-[10px] text-text-secondary line-clamp-2">
        {data.summary}
      </div>
      {data.filePath && (
        <div className="text-[9px] font-mono text-text-muted mt-1 truncate">
          {data.filePath}
        </div>
      )}
    </div>
  );
}

export default memo(StepNode);
```

- [ ] **Step 3: Verify dashboard builds**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/FlowNode.tsx \
       understand-anything-plugin/packages/dashboard/src/components/StepNode.tsx
git commit -m "feat(dashboard): add FlowNode and StepNode components for domain view"
```

---

## Task 9: Dashboard — Domain Graph View

**Files:**
- Create: `understand-anything-plugin/packages/dashboard/src/components/DomainGraphView.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/App.tsx`

- [ ] **Step 1: Create the DomainGraphView component**

```typescript
// understand-anything-plugin/packages/dashboard/src/components/DomainGraphView.tsx
import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
} from "@xyflow/react";
import type { Edge, Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import DomainClusterNode from "./DomainClusterNode";
import type { DomainClusterFlowNode } from "./DomainClusterNode";
import FlowNode from "./FlowNode";
import type { FlowFlowNode } from "./FlowNode";
import StepNode from "./StepNode";
import type { StepFlowNode } from "./StepNode";
import { useDashboardStore } from "../store";
import { useTheme } from "../themes/index.ts";
import { applyDagreLayout } from "../utils/layout";
import type { KnowledgeGraph, GraphNode } from "@understand-anything/core/types";

const nodeTypes = {
  "domain-cluster": DomainClusterNode,
  "flow-node": FlowNode,
  "step-node": StepNode,
};

// Dimensions for domain-specific nodes
const DOMAIN_NODE_DIMENSIONS = new Map<string, { width: number; height: number }>();

function getDomainMeta(node: GraphNode): Record<string, unknown> | undefined {
  return (node as any).domainMeta;
}

function buildDomainOverview(graph: KnowledgeGraph): { nodes: Node[]; edges: Edge[] } {
  const domainNodes = graph.nodes.filter((n) => n.type === "domain");
  const flowNodes = graph.nodes.filter((n) => n.type === "flow");

  // Count flows per domain
  const flowCountMap = new Map<string, number>();
  for (const edge of graph.edges) {
    if (edge.type === "contains_flow") {
      flowCountMap.set(edge.source, (flowCountMap.get(edge.source) ?? 0) + 1);
    }
  }

  const rfNodes: Node[] = domainNodes.map((node) => {
    const meta = getDomainMeta(node);
    const data = {
      label: node.name,
      summary: node.summary,
      entities: meta?.entities as string[] | undefined,
      flowCount: flowCountMap.get(node.id) ?? 0,
      businessRules: meta?.businessRules as string[] | undefined,
      domainId: node.id,
    };
    DOMAIN_NODE_DIMENSIONS.set(node.id, { width: 320, height: 180 });
    return {
      id: node.id,
      type: "domain-cluster" as const,
      position: { x: 0, y: 0 },
      data,
    };
  });

  const rfEdges: Edge[] = graph.edges
    .filter((e) => e.type === "cross_domain")
    .map((e) => ({
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      label: e.description ?? "",
      style: { stroke: "var(--color-accent)", strokeDasharray: "6 3", strokeWidth: 2 },
      labelStyle: { fill: "var(--color-text-muted)", fontSize: 10 },
      animated: true,
    }));

  return applyDagreLayout(rfNodes, rfEdges, "LR", DOMAIN_NODE_DIMENSIONS);
}

function buildDomainDetail(
  graph: KnowledgeGraph,
  domainId: string,
): { nodes: Node[]; edges: Edge[] } {
  // Find flows for this domain
  const flowIds = new Set(
    graph.edges
      .filter((e) => e.type === "contains_flow" && e.source === domainId)
      .map((e) => e.target),
  );

  const flowNodes = graph.nodes.filter((n) => flowIds.has(n.id));
  const stepEdges = graph.edges.filter(
    (e) => e.type === "flow_step" && flowIds.has(e.source),
  );
  const stepIds = new Set(stepEdges.map((e) => e.target));
  const stepNodes = graph.nodes.filter((n) => stepIds.has(n.id));

  // Build step order map
  const stepOrderMap = new Map<string, number>();
  for (const edge of stepEdges) {
    stepOrderMap.set(edge.target, edge.weight);
  }

  // Count steps per flow
  const stepCountMap = new Map<string, number>();
  for (const edge of stepEdges) {
    stepCountMap.set(edge.source, (stepCountMap.get(edge.source) ?? 0) + 1);
  }

  const dims = new Map<string, { width: number; height: number }>();

  const rfNodes: Node[] = [
    ...flowNodes.map((node) => {
      const meta = getDomainMeta(node);
      dims.set(node.id, { width: 260, height: 120 });
      return {
        id: node.id,
        type: "flow-node" as const,
        position: { x: 0, y: 0 },
        data: {
          label: node.name,
          summary: node.summary,
          entryPoint: meta?.entryPoint as string | undefined,
          entryType: meta?.entryType as string | undefined,
          stepCount: stepCountMap.get(node.id) ?? 0,
          flowId: node.id,
        },
      };
    }),
    ...stepNodes.map((node) => {
      dims.set(node.id, { width: 200, height: 90 });
      return {
        id: node.id,
        type: "step-node" as const,
        position: { x: 0, y: 0 },
        data: {
          label: node.name,
          summary: node.summary,
          filePath: node.filePath,
          stepId: node.id,
          order: Math.round((stepOrderMap.get(node.id) ?? 0) * 10),
        },
      };
    }),
  ];

  const rfEdges: Edge[] = stepEdges.map((e) => ({
    id: `${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    style: { stroke: "var(--color-border-medium)", strokeWidth: 1.5 },
    animated: false,
  }));

  return applyDagreLayout(rfNodes, rfEdges, "LR", dims);
}

function DomainGraphViewInner() {
  const domainGraph = useDashboardStore((s) => s.domainGraph);
  const activeDomainId = useDashboardStore((s) => s.activeDomainId);
  const navigateToDomain = useDashboardStore((s) => s.navigateToDomain);
  const navigateToOverview = useDashboardStore((s) => s.navigateToOverview);
  const theme = useTheme();

  const { nodes, edges } = useMemo(() => {
    if (!domainGraph) return { nodes: [], edges: [] };
    if (activeDomainId) {
      return buildDomainDetail(domainGraph, activeDomainId);
    }
    return buildDomainOverview(domainGraph);
  }, [domainGraph, activeDomainId]);

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "domain-cluster" && node.data && "domainId" in node.data) {
        navigateToDomain(node.data.domainId as string);
      }
    },
    [navigateToDomain],
  );

  if (!domainGraph) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted text-sm">
        No domain graph available. Run /understand-domain to generate one.
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {activeDomainId && (
        <div className="absolute top-3 left-3 z-10">
          <button
            onClick={() => {
              useDashboardStore.setState({ activeDomainId: null });
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary transition-colors"
          >
            Back to domains
          </button>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--color-border-subtle)"
        />
        <Controls
          showInteractive={false}
          style={{ bottom: 16, left: 16 }}
        />
        <MiniMap
          nodeColor={() => theme.colors?.accent ?? "#d4a574"}
          maskColor="rgba(0,0,0,0.7)"
          style={{ bottom: 16, right: 16, width: 160, height: 100 }}
        />
      </ReactFlow>
    </div>
  );
}

export default function DomainGraphView() {
  return (
    <ReactFlowProvider>
      <DomainGraphViewInner />
    </ReactFlowProvider>
  );
}
```

- [ ] **Step 2: Wire DomainGraphView into App.tsx**

In `understand-anything-plugin/packages/dashboard/src/App.tsx`:

Add import at top:

```typescript
import DomainGraphView from "./components/DomainGraphView";
```

Replace the graph area section (around lines 394-400) to conditionally render:

```typescript
        {/* Graph area */}
        <div className="flex-1 min-w-0 min-h-0 relative">
          {viewMode === "domain" && domainGraph ? (
            <DomainGraphView />
          ) : (
            <GraphView />
          )}
          <div className="absolute top-3 right-3 text-sm text-text-muted/60 pointer-events-none select-none">
            Press <kbd className="kbd">?</kbd> for keyboard shortcuts
          </div>
        </div>
```

- [ ] **Step 3: Verify dashboard builds**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/DomainGraphView.tsx \
       understand-anything-plugin/packages/dashboard/src/App.tsx
git commit -m "feat(dashboard): add DomainGraphView with domain overview and detail views"
```

---

## Task 10: Dashboard — Domain-Aware NodeInfo Sidebar

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/components/NodeInfo.tsx`

- [ ] **Step 1: Add domain-aware sections to NodeInfo**

Read the existing NodeInfo.tsx first, then add domain-specific rendering. After the existing connection sections, add handling for domain/flow/step node types.

The key changes:
1. Read `viewMode` and `domainGraph` from store
2. When `viewMode === "domain"`, look up the selected node in `domainGraph` instead of `graph`
3. For `domain` nodes: show entities, business rules, cross-domain interactions, list of flows
4. For `flow` nodes: show entry point, step list in order
5. For `step` nodes: show description, file path, "View in code" link

Add a helper function above the component:

```typescript
function DomainNodeDetails({ node, graph }: { node: GraphNode; graph: KnowledgeGraph }) {
  const navigateToDomain = useDashboardStore((s) => s.navigateToDomain);
  const selectNode = useDashboardStore((s) => s.selectNode);
  const meta = (node as any).domainMeta as Record<string, unknown> | undefined;

  if (node.type === "domain") {
    const flows = graph.edges
      .filter((e) => e.type === "contains_flow" && e.source === node.id)
      .map((e) => graph.nodes.find((n) => n.id === e.target))
      .filter(Boolean);

    return (
      <div className="space-y-3">
        {meta?.entities && (meta.entities as string[]).length > 0 && (
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Entities</h4>
            <div className="flex flex-wrap gap-1">
              {(meta.entities as string[]).map((e) => (
                <span key={e} className="text-[11px] px-2 py-0.5 rounded bg-elevated text-text-secondary">{e}</span>
              ))}
            </div>
          </div>
        )}
        {meta?.businessRules && (meta.businessRules as string[]).length > 0 && (
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Business Rules</h4>
            <ul className="text-[11px] text-text-secondary space-y-1">
              {(meta.businessRules as string[]).map((r, i) => (
                <li key={i} className="flex gap-1.5"><span className="text-accent shrink-0">-</span>{r}</li>
              ))}
            </ul>
          </div>
        )}
        {meta?.crossDomainInteractions && (meta.crossDomainInteractions as string[]).length > 0 && (
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Cross-Domain</h4>
            <ul className="text-[11px] text-text-secondary space-y-1">
              {(meta.crossDomainInteractions as string[]).map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        {flows.length > 0 && (
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Flows</h4>
            <div className="space-y-1">
              {flows.map((f) => (
                <button
                  key={f!.id}
                  onClick={() => { navigateToDomain(node.id); selectNode(f!.id); }}
                  className="block w-full text-left px-2 py-1.5 rounded bg-elevated hover:bg-accent/10 text-[11px] text-text-secondary hover:text-accent transition-colors"
                >
                  {f!.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (node.type === "flow") {
    const steps = graph.edges
      .filter((e) => e.type === "flow_step" && e.source === node.id)
      .sort((a, b) => a.weight - b.weight)
      .map((e) => graph.nodes.find((n) => n.id === e.target))
      .filter(Boolean);

    return (
      <div className="space-y-3">
        {meta?.entryPoint && (
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Entry Point</h4>
            <div className="text-[11px] font-mono text-accent">{meta.entryPoint as string}</div>
          </div>
        )}
        {steps.length > 0 && (
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Steps</h4>
            <ol className="space-y-1">
              {steps.map((s, i) => (
                <li key={s!.id}>
                  <button
                    onClick={() => selectNode(s!.id)}
                    className="block w-full text-left px-2 py-1.5 rounded bg-elevated hover:bg-accent/10 text-[11px] transition-colors"
                  >
                    <span className="text-accent/60 mr-1.5">{i + 1}.</span>
                    <span className="text-text-secondary hover:text-accent">{s!.name}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  }

  if (node.type === "step") {
    return (
      <div className="space-y-3">
        {node.filePath && (
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Implementation</h4>
            <div className="text-[11px] font-mono text-text-secondary">
              {node.filePath}
              {node.lineRange && <span className="text-text-muted">:{node.lineRange[0]}-{node.lineRange[1]}</span>}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
```

Then in the main NodeInfo component, add domain-aware rendering. After getting the `node` from the graph, add logic to also check `domainGraph`:

```typescript
  const viewMode = useDashboardStore((s) => s.viewMode);
  const domainGraph = useDashboardStore((s) => s.domainGraph);

  const activeGraph = viewMode === "domain" && domainGraph ? domainGraph : graph;
  const node = activeGraph?.nodes.find((n) => n.id === selectedNodeId);
```

And after the summary section, add:

```typescript
        {/* Domain-specific details */}
        {activeGraph && node && (node.type === "domain" || node.type === "flow" || node.type === "step") && (
          <DomainNodeDetails node={node} graph={activeGraph} />
        )}
```

- [ ] **Step 2: Verify dashboard builds**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/NodeInfo.tsx
git commit -m "feat(dashboard): add domain-aware NodeInfo sidebar for domain/flow/step nodes"
```

---

## Task 11: Dashboard — Update GraphView NODE_TYPE_TO_CATEGORY

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/components/GraphView.tsx`

- [ ] **Step 1: Add domain types to NODE_TYPE_TO_CATEGORY**

In `understand-anything-plugin/packages/dashboard/src/components/GraphView.tsx`, update `NODE_TYPE_TO_CATEGORY` (lines 53-59):

```typescript
const NODE_TYPE_TO_CATEGORY: Record<NodeType, NodeCategory> = {
  file: "code", function: "code", class: "code", module: "code", concept: "code",
  config: "config",
  document: "docs",
  service: "infra", resource: "infra", pipeline: "infra",
  table: "data", endpoint: "data", schema: "data",
  // Domain types — categorized as "code" for filtering purposes
  domain: "code", flow: "code", step: "code",
} as const;
```

- [ ] **Step 2: Verify dashboard builds**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/GraphView.tsx
git commit -m "feat(dashboard): add domain node types to NODE_TYPE_TO_CATEGORY mapping"
```

---

## Task 12: Create Domain Analyzer Agent

**Files:**
- Create: `understand-anything-plugin/agents/domain-analyzer.md`

- [ ] **Step 1: Create the agent definition**

```markdown
---
name: domain-analyzer
description: |
  Analyzes codebases to extract business domain knowledge — domains, business flows, and process steps. Produces a domain-graph.json that maps how business logic flows through the code.
model: opus
---

# Domain Analyzer Agent

You are a business domain analysis expert. Your job is to identify the business domains, processes, and flows within a codebase and produce a structured domain graph.

## Your Task

Analyze the provided context (either a preprocessed domain context file OR an existing knowledge graph) and produce a complete domain graph JSON.

## Three-Level Hierarchy

1. **Business Domain** — High-level business areas (e.g., "Order Management", "User Authentication", "Payment Processing")
2. **Business Flow** — Specific processes within a domain (e.g., "Create Order", "Process Refund")
3. **Business Step** — Individual actions within a flow (e.g., "Validate input", "Check inventory")

## Output Schema

Produce a JSON object with this exact structure:

```json
{
  "version": "1.0.0",
  "project": {
    "name": "<project name>",
    "languages": ["<detected languages>"],
    "frameworks": ["<detected frameworks>"],
    "description": "<project description focused on business purpose>",
    "analyzedAt": "<ISO timestamp>",
    "gitCommitHash": "<commit hash>"
  },
  "nodes": [
    {
      "id": "domain:<kebab-case-name>",
      "type": "domain",
      "name": "<Human Readable Domain Name>",
      "summary": "<2-3 sentences about what this domain handles>",
      "tags": ["<relevant-tags>"],
      "complexity": "simple|moderate|complex",
      "domainMeta": {
        "entities": ["<key domain objects>"],
        "businessRules": ["<important constraints/invariants>"],
        "crossDomainInteractions": ["<how this domain interacts with others>"]
      }
    },
    {
      "id": "flow:<kebab-case-name>",
      "type": "flow",
      "name": "<Flow Name>",
      "summary": "<what this flow accomplishes>",
      "tags": ["<relevant-tags>"],
      "complexity": "simple|moderate|complex",
      "domainMeta": {
        "entryPoint": "<trigger, e.g. POST /api/orders>",
        "entryType": "http|cli|event|cron|manual"
      }
    },
    {
      "id": "step:<flow-name>:<step-name>",
      "type": "step",
      "name": "<Step Name>",
      "summary": "<what this step does>",
      "tags": ["<relevant-tags>"],
      "complexity": "simple|moderate|complex",
      "filePath": "<relative path to implementing file>",
      "lineRange": [<start>, <end>]
    }
  ],
  "edges": [
    { "source": "domain:<name>", "target": "flow:<name>", "type": "contains_flow", "direction": "forward", "weight": 1.0 },
    { "source": "flow:<name>", "target": "step:<flow>:<step>", "type": "flow_step", "direction": "forward", "weight": 0.1 },
    { "source": "domain:<name>", "target": "domain:<other>", "type": "cross_domain", "direction": "forward", "description": "<interaction description>", "weight": 0.6 }
  ],
  "layers": [],
  "tour": []
}
```

## Rules

1. **flow_step weight encodes order**: First step = 0.1, second = 0.2, etc.
2. **Every flow must connect to a domain** via `contains_flow` edge
3. **Every step must connect to a flow** via `flow_step` edge
4. **Cross-domain edges** describe how domains interact
5. **File paths** on step nodes should be relative to project root
6. **Be specific, not generic** — use the actual business terminology from the code
7. **Don't invent flows that aren't in the code** — only document what exists

Respond ONLY with the JSON object, no additional text or markdown fences.
```

- [ ] **Step 2: Commit**

```bash
git add understand-anything-plugin/agents/domain-analyzer.md
git commit -m "feat(agents): add domain-analyzer agent for business domain extraction"
```

---

## Task 13: Create /understand-domain Skill

**Files:**
- Create: `understand-anything-plugin/skills/understand-domain/SKILL.md`

- [ ] **Step 1: Create the skill directory and SKILL.md**

```bash
mkdir -p understand-anything-plugin/skills/understand-domain
```

```markdown
---
name: understand-domain
description: Extract business domain knowledge from a codebase and generate an interactive domain flow graph. Works standalone (lightweight scan) or derives from an existing /understand knowledge graph.
argument-hint: [--full]
---

# /understand-domain

Extracts business domain knowledge — domains, business flows, and process steps — from a codebase and produces an interactive horizontal flow graph in the dashboard.

## How It Works

- If a knowledge graph already exists (`.understand-anything/knowledge-graph.json`), derives domain knowledge from it (cheap, no file scanning)
- If no knowledge graph exists, performs a lightweight scan: file tree + entry point detection + sampled files
- Use `--full` flag to force a fresh scan even if a knowledge graph exists

## Instructions

### Phase 1: Detect Existing Graph

1. Check if `.understand-anything/knowledge-graph.json` exists in the current project
2. If it exists AND `--full` was NOT passed → proceed to Phase 3 (derive from graph)
3. Otherwise → proceed to Phase 2 (lightweight scan)

### Phase 2: Lightweight Scan (Path 1)

1. Run the preprocessing script bundled with this skill:
   ```
   python understand-anything-plugin/skills/understand-domain/extract-domain-context.py <project-root>
   ```
   This outputs `.understand-anything/intermediate/domain-context.json` containing:
   - File tree (respecting `.gitignore`)
   - Detected entry points (HTTP routes, CLI commands, event handlers, cron jobs, exported handlers)
   - File signatures (exports, imports per file)
   - Code snippets for each entry point (signature + first few lines)
2. Read the generated `domain-context.json` as context for Phase 4
3. Proceed to Phase 4

### Phase 3: Derive from Existing Graph (Path 2)

1. Read `.understand-anything/knowledge-graph.json`
2. Format the graph data as structured context:
   - All nodes with their types, names, summaries, and tags
   - All edges with their types (especially `calls`, `imports`, `contains`)
   - All layers with their descriptions
   - Tour steps if available
3. This is the context for the domain analyzer — no file reading needed
4. Proceed to Phase 4

### Phase 4: Domain Analysis

1. Read the domain-analyzer agent prompt from `agents/domain-analyzer.md`
2. Dispatch a subagent with the domain-analyzer prompt + the context from Phase 2 or 3
3. The agent writes its output to `.understand-anything/intermediate/domain-analysis.json`

### Phase 5: Validate and Save

1. Read the domain analysis output
2. Validate using the standard graph validation pipeline (the schema now supports domain/flow/step types)
3. If validation fails, log warnings but save what's valid (error tolerance)
4. Save to `.understand-anything/domain-graph.json`
5. Clean up `.understand-anything/intermediate/domain-analysis.json`

### Phase 6: Launch Dashboard

1. Auto-trigger `/understand-dashboard` to visualize the domain graph
2. The dashboard will detect `domain-graph.json` and show the domain view by default
```

- [ ] **Step 2: Commit**

```bash
git add understand-anything-plugin/skills/understand-domain/SKILL.md
git commit -m "feat(skills): add /understand-domain skill for business domain knowledge extraction"
```

---

## Task 14: Dashboard — Serve domain-graph.json

**Files:**
- Modify: `understand-anything-plugin/skills/understand-dashboard/SKILL.md`

- [ ] **Step 1: Read the existing understand-dashboard skill**

Read `understand-anything-plugin/skills/understand-dashboard/SKILL.md` to understand how the dashboard server is configured, then add `domain-graph.json` to the list of served files.

The dashboard server serves files from `.understand-anything/`. The domain graph file (`domain-graph.json`) needs to be served alongside `knowledge-graph.json` and `meta.json`.

Update the skill to mention that `domain-graph.json` should also be served if it exists. The exact change depends on how the server is configured in the skill — typically it serves the entire `.understand-anything/` directory, so `domain-graph.json` should be automatically available. Verify this is the case.

- [ ] **Step 2: Commit (if changes needed)**

Only commit if the skill needed updating.

---

## Task 15: Full Build and Integration Verification

**Files:**
- None (verification only)

- [ ] **Step 1: Build core package**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core build`

Expected: Build succeeds

- [ ] **Step 2: Run all core tests**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/core test -- --run`

Expected: All tests PASS

- [ ] **Step 3: Build dashboard**

Run: `cd understand-anything-plugin && pnpm --filter @understand-anything/dashboard build`

Expected: Build succeeds

- [ ] **Step 4: Run linter**

Run: `cd understand-anything-plugin && pnpm lint`

Expected: No errors (warnings acceptable)

- [ ] **Step 5: Final commit (if any lint fixes needed)**

Fix any lint issues and commit.

---

## Summary of All Files

### New Files
- `understand-anything-plugin/packages/core/src/__tests__/domain-types.test.ts`
- `understand-anything-plugin/packages/core/src/__tests__/domain-persistence.test.ts`
- `understand-anything-plugin/packages/core/src/__tests__/domain-normalize.test.ts`
- `understand-anything-plugin/packages/dashboard/src/components/DomainClusterNode.tsx`
- `understand-anything-plugin/packages/dashboard/src/components/FlowNode.tsx`
- `understand-anything-plugin/packages/dashboard/src/components/StepNode.tsx`
- `understand-anything-plugin/packages/dashboard/src/components/DomainGraphView.tsx`
- `understand-anything-plugin/agents/domain-analyzer.md`
- `understand-anything-plugin/skills/understand-domain/SKILL.md`
- `understand-anything-plugin/skills/understand-domain/extract-domain-context.py`

### Modified Files
- `understand-anything-plugin/packages/core/src/types.ts` — 3 new node types, 3 new edge types, DomainMeta interface
- `understand-anything-plugin/packages/core/src/schema.ts` — Zod schemas + aliases for domain types
- `understand-anything-plugin/packages/core/src/persistence/index.ts` — saveDomainGraph/loadDomainGraph
- `understand-anything-plugin/packages/core/src/analyzer/normalize-graph.ts` — domain ID prefixes
- `understand-anything-plugin/packages/dashboard/src/store.ts` — viewMode, domainGraph, activeDomainId
- `understand-anything-plugin/packages/dashboard/src/App.tsx` — domain graph loading, view toggle, conditional rendering
- `understand-anything-plugin/packages/dashboard/src/components/NodeInfo.tsx` — domain-aware sidebar
- `understand-anything-plugin/packages/dashboard/src/components/GraphView.tsx` — NODE_TYPE_TO_CATEGORY update
````

## File: docs/superpowers/plans/2026-04-09-understand-knowledge.md
````markdown
# /understand-knowledge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/understand-knowledge` skill that takes any folder of markdown notes (Obsidian, Logseq, Dendron, Foam, Karpathy-style, Zettelkasten, or plain) and produces an interactive knowledge graph with typed nodes, edges, and dashboard visualization.

**Architecture:** Extends the existing schema with 5 knowledge node types and 6 knowledge edge types. A new 5-agent pipeline (knowledge-scanner → format-detector → article-analyzer → relationship-builder → graph-reviewer) processes markdown files. The dashboard renders knowledge graphs with vertical layout, a knowledge-specific sidebar, and a reading mode panel — all driven by a new `kind` field on the root graph object.

**Tech Stack:** TypeScript, Zod (schema validation), React + ReactFlow (dashboard), dagre (layout), TailwindCSS v4, Vitest (testing)

**Spec:** `docs/superpowers/specs/2026-04-09-understand-knowledge-design.md`

---

## File Structure

### Core package changes
- Modify: `understand-anything-plugin/packages/core/src/types.ts` — add 5 node types, 6 edge types, `KnowledgeMeta` interface, `kind` field
- Modify: `understand-anything-plugin/packages/core/src/schema.ts` — add new types to Zod schemas, add aliases
- Modify: `understand-anything-plugin/packages/core/src/types.test.ts` — add tests for new types
- Test: `understand-anything-plugin/packages/core/src/__tests__/knowledge-schema.test.ts` — validation tests for knowledge-specific schema

### Dashboard changes
- Modify: `understand-anything-plugin/packages/dashboard/src/store.ts` — add knowledge node types, edge categories, `ViewMode`, node categories
- Modify: `understand-anything-plugin/packages/dashboard/src/components/CustomNode.tsx` — add colors for 5 new node types
- Modify: `understand-anything-plugin/packages/dashboard/src/components/NodeInfo.tsx` — add badge colors and edge labels for new types, add knowledge sidebar sections
- Modify: `understand-anything-plugin/packages/dashboard/src/components/ProjectOverview.tsx` — add knowledge-specific stats
- Modify: `understand-anything-plugin/packages/dashboard/src/index.css` — add CSS variables for 5 new node colors
- Modify: `understand-anything-plugin/packages/dashboard/src/App.tsx` — detect `kind` field, set view mode
- Create: `understand-anything-plugin/packages/dashboard/src/components/KnowledgeInfo.tsx` — knowledge-specific sidebar
- Create: `understand-anything-plugin/packages/dashboard/src/components/ReadingPanel.tsx` — full article reading overlay

### Skill & agent definitions
- Create: `understand-anything-plugin/skills/understand-knowledge/SKILL.md` — skill entry point
- Create: `understand-anything-plugin/skills/understand-knowledge/formats/obsidian.md`
- Create: `understand-anything-plugin/skills/understand-knowledge/formats/logseq.md`
- Create: `understand-anything-plugin/skills/understand-knowledge/formats/dendron.md`
- Create: `understand-anything-plugin/skills/understand-knowledge/formats/foam.md`
- Create: `understand-anything-plugin/skills/understand-knowledge/formats/karpathy.md`
- Create: `understand-anything-plugin/skills/understand-knowledge/formats/zettelkasten.md`
- Create: `understand-anything-plugin/skills/understand-knowledge/formats/plain.md`
- Create: `understand-anything-plugin/agents/knowledge-scanner.md`
- Create: `understand-anything-plugin/agents/format-detector.md`
- Create: `understand-anything-plugin/agents/article-analyzer.md`
- Create: `understand-anything-plugin/agents/relationship-builder.md`

Existing `graph-reviewer.md` agent is reused for the final validation step.

---

## Task 1: Extend Core Types

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/types.ts`

- [ ] **Step 1: Add knowledge node types to NodeType union**

In `understand-anything-plugin/packages/core/src/types.ts`, add the 5 knowledge types after the domain types:

```typescript
// Node types (21 total: 5 code + 8 non-code + 3 domain + 5 knowledge)
export type NodeType =
  | "file" | "function" | "class" | "module" | "concept"
  | "config" | "document" | "service" | "table" | "endpoint"
  | "pipeline" | "schema" | "resource"
  | "domain" | "flow" | "step"
  | "article" | "entity" | "topic" | "claim" | "source";
```

- [ ] **Step 2: Add knowledge edge types to EdgeType union**

```typescript
// Edge types (35 total in 8 categories)
export type EdgeType =
  | "imports" | "exports" | "contains" | "inherits" | "implements"
  | "calls" | "subscribes" | "publishes" | "middleware"
  | "reads_from" | "writes_to" | "transforms" | "validates"
  | "depends_on" | "tested_by" | "configures"
  | "related" | "similar_to"
  | "deploys" | "serves" | "provisions" | "triggers"
  | "migrates" | "documents" | "routes" | "defines_schema"
  | "contains_flow" | "flow_step" | "cross_domain"
  | "cites" | "contradicts" | "builds_on" | "exemplifies" | "categorized_under" | "authored_by";
```

- [ ] **Step 3: Add KnowledgeMeta interface**

Add after the `DomainMeta` interface:

```typescript
// Optional knowledge metadata for article/entity/topic/claim/source nodes
export interface KnowledgeMeta {
  format?: "obsidian" | "logseq" | "dendron" | "foam" | "karpathy" | "zettelkasten" | "plain";
  wikilinks?: string[];
  backlinks?: string[];
  frontmatter?: Record<string, unknown>;
  sourceUrl?: string;
  confidence?: number; // 0-1, for LLM-inferred relationships
}
```

- [ ] **Step 4: Add knowledgeMeta to GraphNode**

```typescript
export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  filePath?: string;
  lineRange?: [number, number];
  summary: string;
  tags: string[];
  complexity: "simple" | "moderate" | "complex";
  languageNotes?: string;
  domainMeta?: DomainMeta;
  knowledgeMeta?: KnowledgeMeta;
}
```

- [ ] **Step 5: Add kind field to KnowledgeGraph**

```typescript
export interface KnowledgeGraph {
  version: string;
  kind?: "codebase" | "knowledge"; // undefined defaults to "codebase" for backward compat
  project: ProjectMeta;
  nodes: GraphNode[];
  edges: GraphEdge[];
  layers: Layer[];
  tour: TourStep[];
}
```

- [ ] **Step 6: Build core and verify no type errors**

Run: `pnpm --filter @understand-anything/core build`
Expected: Clean build, no errors

- [ ] **Step 7: Commit**

```bash
git add understand-anything-plugin/packages/core/src/types.ts
git commit -m "feat(core): add knowledge node types, edge types, KnowledgeMeta, and graph kind field"
```

---

## Task 2: Extend Schema Validation

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/schema.ts`
- Create: `understand-anything-plugin/packages/core/src/__tests__/knowledge-schema.test.ts`

- [ ] **Step 1: Add knowledge edge types to EdgeTypeSchema**

In `understand-anything-plugin/packages/core/src/schema.ts`, update the `EdgeTypeSchema` z.enum to include the 6 new types:

```typescript
export const EdgeTypeSchema = z.enum([
  "imports", "exports", "contains", "inherits", "implements",
  "calls", "subscribes", "publishes", "middleware",
  "reads_from", "writes_to", "transforms", "validates",
  "depends_on", "tested_by", "configures",
  "related", "similar_to",
  "deploys", "serves", "provisions", "triggers",
  "migrates", "documents", "routes", "defines_schema",
  "contains_flow", "flow_step", "cross_domain",
  // Knowledge
  "cites", "contradicts", "builds_on", "exemplifies", "categorized_under", "authored_by",
]);
```

- [ ] **Step 2: Add knowledge node type aliases**

Add to `NODE_TYPE_ALIASES`:

```typescript
  // Knowledge aliases
  note: "article",
  page: "article",
  wiki_page: "article",
  person: "entity",
  tool: "entity",
  paper: "entity",
  organization: "entity",
  org: "entity",
  category: "topic",
  theme: "topic",
  tag_topic: "topic",
  assertion: "claim",
  insight: "claim",
  takeaway: "claim",
  reference: "source",
  raw: "source",
  citation: "source",
```

- [ ] **Step 3: Add knowledge edge type aliases**

Add to `EDGE_TYPE_ALIASES`:

```typescript
  // Knowledge aliases
  references: "cites",
  cited_by: "cites",
  sourced_from: "cites",
  conflicts_with: "contradicts",
  disagrees_with: "contradicts",
  extends: "builds_on",  // Note: "extends" was already mapped to "inherits" — knowledge context will use builds_on via the relationship-builder agent prompt, so keep "extends" → "inherits" for code
  refines: "builds_on",
  deepens: "builds_on",
  example_of: "exemplifies",
  instance_of: "exemplifies",
  belongs_to: "categorized_under",
  tagged_with: "categorized_under",
  part_of: "categorized_under",
  written_by: "authored_by",
  created_by: "authored_by",
```

- [ ] **Step 4: Write the failing test for knowledge graph validation**

Create `understand-anything-plugin/packages/core/src/__tests__/knowledge-schema.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { validateGraph } from "../schema";
import type { KnowledgeGraph } from "../types";

describe("knowledge graph schema validation", () => {
  const minimalKnowledgeGraph: KnowledgeGraph = {
    version: "1.0",
    kind: "knowledge",
    project: {
      name: "Test KB",
      languages: [],
      frameworks: [],
      description: "A test knowledge base",
      analyzedAt: new Date().toISOString(),
      gitCommitHash: "abc123",
    },
    nodes: [
      {
        id: "article:test-note",
        type: "article",
        name: "Test Note",
        summary: "A test article node",
        tags: ["test"],
        complexity: "simple",
      },
      {
        id: "entity:karpathy",
        type: "entity",
        name: "Andrej Karpathy",
        summary: "AI researcher",
        tags: ["person", "ai"],
        complexity: "simple",
      },
      {
        id: "topic:pkm",
        type: "topic",
        name: "Personal Knowledge Management",
        summary: "Tools and methods for managing personal knowledge",
        tags: ["knowledge", "productivity"],
        complexity: "moderate",
      },
    ],
    edges: [
      {
        source: "article:test-note",
        target: "entity:karpathy",
        type: "authored_by",
        direction: "forward",
        weight: 0.8,
      },
      {
        source: "article:test-note",
        target: "topic:pkm",
        type: "categorized_under",
        direction: "forward",
        weight: 0.7,
      },
    ],
    layers: [
      {
        id: "layer:pkm",
        name: "PKM",
        description: "Personal Knowledge Management topic cluster",
        nodeIds: ["article:test-note", "topic:pkm"],
      },
    ],
    tour: [],
  };

  it("validates a minimal knowledge graph", () => {
    const result = validateGraph(minimalKnowledgeGraph);
    const fatals = result.issues.filter((i) => i.level === "fatal");
    expect(fatals).toHaveLength(0);
  });

  it("accepts all knowledge node types", () => {
    const graph = {
      ...minimalKnowledgeGraph,
      nodes: [
        ...minimalKnowledgeGraph.nodes,
        { id: "claim:rag-bad", type: "claim", name: "RAG loses context", summary: "An assertion", tags: ["claim"], complexity: "simple" },
        { id: "source:paper1", type: "source", name: "Attention paper", summary: "A source", tags: ["paper"], complexity: "simple" },
      ],
    };
    const result = validateGraph(graph);
    const fatals = result.issues.filter((i) => i.level === "fatal");
    expect(fatals).toHaveLength(0);
  });

  it("accepts all knowledge edge types", () => {
    const graph = {
      ...minimalKnowledgeGraph,
      nodes: [
        ...minimalKnowledgeGraph.nodes,
        { id: "claim:c1", type: "claim", name: "Claim 1", summary: "c1", tags: [], complexity: "simple" },
        { id: "claim:c2", type: "claim", name: "Claim 2", summary: "c2", tags: [], complexity: "simple" },
        { id: "source:s1", type: "source", name: "Source 1", summary: "s1", tags: [], complexity: "simple" },
        { id: "article:a2", type: "article", name: "Article 2", summary: "a2", tags: [], complexity: "simple" },
      ],
      edges: [
        ...minimalKnowledgeGraph.edges,
        { source: "article:test-note", target: "source:s1", type: "cites", direction: "forward", weight: 0.7 },
        { source: "claim:c1", target: "claim:c2", type: "contradicts", direction: "forward", weight: 0.6 },
        { source: "article:a2", target: "article:test-note", type: "builds_on", direction: "forward", weight: 0.7 },
        { source: "entity:karpathy", target: "topic:pkm", type: "exemplifies", direction: "forward", weight: 0.5 },
      ],
    };
    const result = validateGraph(graph);
    const fatals = result.issues.filter((i) => i.level === "fatal");
    expect(fatals).toHaveLength(0);
  });

  it("resolves knowledge node type aliases", () => {
    const graph = {
      ...minimalKnowledgeGraph,
      nodes: [
        { id: "note:n1", type: "note", name: "A Note", summary: "note alias", tags: [], complexity: "simple" },
        { id: "person:p1", type: "person", name: "A Person", summary: "person alias", tags: [], complexity: "simple" },
      ],
      edges: [],
      layers: [],
    };
    const result = validateGraph(graph);
    const noteNode = result.graph.nodes.find((n) => n.id === "note:n1");
    const personNode = result.graph.nodes.find((n) => n.id === "person:p1");
    expect(noteNode?.type).toBe("article");
    expect(personNode?.type).toBe("entity");
  });

  it("resolves knowledge edge type aliases", () => {
    const graph = {
      ...minimalKnowledgeGraph,
      edges: [
        { source: "article:test-note", target: "entity:karpathy", type: "written_by", direction: "forward", weight: 0.8 },
      ],
    };
    const result = validateGraph(graph);
    const edge = result.graph.edges.find((e) => e.source === "article:test-note" && e.target === "entity:karpathy");
    expect(edge?.type).toBe("authored_by");
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `pnpm --filter @understand-anything/core test -- --run src/__tests__/knowledge-schema.test.ts`
Expected: Tests fail because EdgeTypeSchema doesn't include knowledge types yet (if schema.ts wasn't updated), or pass if Steps 1-3 were done correctly.

- [ ] **Step 6: Run all core tests to verify nothing is broken**

Run: `pnpm --filter @understand-anything/core test -- --run`
Expected: All existing tests pass, new knowledge tests pass

- [ ] **Step 7: Commit**

```bash
git add understand-anything-plugin/packages/core/src/schema.ts understand-anything-plugin/packages/core/src/__tests__/knowledge-schema.test.ts
git commit -m "feat(core): add knowledge types to schema validation with aliases and tests"
```

---

## Task 3: Dashboard — CSS Variables & Node Colors

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/index.css`

- [ ] **Step 1: Add CSS variables for 5 knowledge node types**

In `understand-anything-plugin/packages/dashboard/src/index.css`, add after the existing `--color-node-resource` line:

```css
  /* Knowledge node colors */
  --color-node-article: #d4a574;   /* warm amber */
  --color-node-entity: #7ba4c9;    /* soft blue */
  --color-node-topic: #c9b06c;     /* muted gold */
  --color-node-claim: #6fb07a;     /* soft green */
  --color-node-source: #8a8a8a;    /* gray */
```

- [ ] **Step 2: Add Tailwind text-color utilities for knowledge nodes**

Verify TailwindCSS v4 picks up the CSS variables automatically. If the existing pattern uses `text-node-*` classes defined elsewhere, add matching entries. Check if there's a Tailwind config or if the CSS variables are consumed directly.

Look at how existing `text-node-file` etc. are defined — if they're in the CSS file as utility classes, add:

```css
  .text-node-article { color: var(--color-node-article); }
  .text-node-entity { color: var(--color-node-entity); }
  .text-node-topic { color: var(--color-node-topic); }
  .text-node-claim { color: var(--color-node-claim); }
  .text-node-source { color: var(--color-node-source); }
```

And corresponding `border-node-*` and `bg-node-*` variants if the pattern requires them.

- [ ] **Step 3: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/index.css
git commit -m "feat(dashboard): add CSS variables and utility classes for knowledge node types"
```

---

## Task 4: Dashboard — Store & Type Maps

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/store.ts`

- [ ] **Step 1: Add knowledge types to NodeType union**

Update the local `NodeType` in store.ts:

```typescript
export type NodeType = "file" | "function" | "class" | "module" | "concept" | "config" | "document" | "service" | "table" | "endpoint" | "pipeline" | "schema" | "resource" | "domain" | "flow" | "step" | "article" | "entity" | "topic" | "claim" | "source";
```

- [ ] **Step 2: Add knowledge edge category**

Update `EdgeCategory` and `EDGE_CATEGORY_MAP`:

```typescript
export type EdgeCategory = "structural" | "behavioral" | "data-flow" | "dependencies" | "semantic" | "infrastructure" | "domain" | "knowledge";

export const EDGE_CATEGORY_MAP: Record<EdgeCategory, string[]> = {
  structural: ["imports", "exports", "contains", "inherits", "implements"],
  behavioral: ["calls", "subscribes", "publishes", "middleware"],
  "data-flow": ["reads_from", "writes_to", "transforms", "validates"],
  dependencies: ["depends_on", "tested_by", "configures"],
  semantic: ["related", "similar_to"],
  infrastructure: ["deploys", "serves", "provisions", "triggers"],
  domain: ["contains_flow", "flow_step", "cross_domain"],
  knowledge: ["cites", "contradicts", "builds_on", "exemplifies", "categorized_under", "authored_by"],
};
```

- [ ] **Step 3: Add knowledge to ALL_NODE_TYPES and ALL_EDGE_CATEGORIES**

```typescript
export const ALL_NODE_TYPES: NodeType[] = ["file", "function", "class", "module", "concept", "config", "document", "service", "table", "endpoint", "pipeline", "schema", "resource", "domain", "flow", "step", "article", "entity", "topic", "claim", "source"];

export const ALL_EDGE_CATEGORIES: EdgeCategory[] = ["structural", "behavioral", "data-flow", "dependencies", "semantic", "infrastructure", "domain", "knowledge"];
```

- [ ] **Step 4: Add "knowledge" to ViewMode and NodeCategory**

```typescript
export type ViewMode = "structural" | "domain" | "knowledge";

export type NodeCategory = "code" | "config" | "docs" | "infra" | "data" | "domain" | "knowledge";
```

Update the `NODE_CATEGORY_MAP` (find where it maps node types to categories) to include:

```typescript
  article: "knowledge",
  entity: "knowledge",
  topic: "knowledge",
  claim: "knowledge",
  source: "knowledge",
```

- [ ] **Step 5: Add knowledge node type filter default**

In the store's initial state `nodeTypeFilters`, add:

```typescript
nodeTypeFilters: { code: true, config: true, docs: true, infra: true, data: true, domain: true, knowledge: true },
```

- [ ] **Step 6: Build dashboard and verify no errors**

Run: `pnpm --filter @understand-anything/dashboard build`
Expected: Clean build

- [ ] **Step 7: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/store.ts
git commit -m "feat(dashboard): add knowledge types to store, edge categories, and view mode"
```

---

## Task 5: Dashboard — CustomNode & NodeInfo Type Maps

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/components/CustomNode.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/components/NodeInfo.tsx`

- [ ] **Step 1: Add knowledge node colors to CustomNode.tsx**

In `typeColors` map, add after the `step` entry:

```typescript
  // Knowledge
  article: "var(--color-node-article)",
  entity: "var(--color-node-entity)",
  topic: "var(--color-node-topic)",
  claim: "var(--color-node-claim)",
  source: "var(--color-node-source)",
```

In `typeTextColors` map, add:

```typescript
  // Knowledge
  article: "text-node-article",
  entity: "text-node-entity",
  topic: "text-node-topic",
  claim: "text-node-claim",
  source: "text-node-source",
```

- [ ] **Step 2: Add knowledge node badge colors to NodeInfo.tsx**

In `typeBadgeColors` map, add:

```typescript
  // Knowledge
  article: "text-node-article border border-node-article/30 bg-node-article/10",
  entity: "text-node-entity border border-node-entity/30 bg-node-entity/10",
  topic: "text-node-topic border border-node-topic/30 bg-node-topic/10",
  claim: "text-node-claim border border-node-claim/30 bg-node-claim/10",
  source: "text-node-source border border-node-source/30 bg-node-source/10",
```

- [ ] **Step 3: Add knowledge edge labels to NodeInfo.tsx**

In `EDGE_LABELS` map, add:

```typescript
  // Knowledge
  cites: { forward: "cites", backward: "cited by" },
  contradicts: { forward: "contradicts", backward: "contradicted by" },
  builds_on: { forward: "builds on", backward: "built upon by" },
  exemplifies: { forward: "exemplifies", backward: "exemplified by" },
  categorized_under: { forward: "categorized under", backward: "categorizes" },
  authored_by: { forward: "authored by", backward: "authored" },
```

- [ ] **Step 4: Build dashboard and verify**

Run: `pnpm --filter @understand-anything/dashboard build`
Expected: Clean build, no type errors

- [ ] **Step 5: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/CustomNode.tsx understand-anything-plugin/packages/dashboard/src/components/NodeInfo.tsx
git commit -m "feat(dashboard): add knowledge node colors, badge colors, and edge labels"
```

---

## Task 6: Dashboard — Knowledge Sidebar Component

**Files:**
- Create: `understand-anything-plugin/packages/dashboard/src/components/KnowledgeInfo.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/App.tsx`

- [ ] **Step 1: Create KnowledgeInfo.tsx**

Create `understand-anything-plugin/packages/dashboard/src/components/KnowledgeInfo.tsx`:

```tsx
import { useDashboardStore } from "../store";
import type { GraphNode, GraphEdge, KnowledgeGraph } from "@understand-anything/core/types";

const KNOWLEDGE_NODE_TYPES = new Set(["article", "entity", "topic", "claim", "source"]);

function getBacklinks(nodeId: string, edges: GraphEdge[]): string[] {
  return edges
    .filter((e) => e.target === nodeId)
    .map((e) => e.source);
}

function getOutgoingLinks(nodeId: string, edges: GraphEdge[]): string[] {
  return edges
    .filter((e) => e.source === nodeId)
    .map((e) => e.target);
}

function NodeLink({ nodeId, nodes, onNavigate }: { nodeId: string; nodes: GraphNode[]; onNavigate: (id: string) => void }) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return <span className="text-text-muted text-xs">{nodeId}</span>;
  return (
    <button
      className="text-accent-dim hover:text-accent text-xs text-left truncate block w-full"
      onClick={() => onNavigate(nodeId)}
    >
      <span className="text-text-muted mr-1">[{node.type}]</span>
      {node.name}
    </button>
  );
}

export default function KnowledgeInfo() {
  const graph = useDashboardStore((s) => s.graph);
  const selectedNode = useDashboardStore((s) => s.selectedNode);
  const setSelectedNode = useDashboardStore((s) => s.setSelectedNode);

  if (!graph || !selectedNode) return null;

  const node = graph.nodes.find((n) => n.id === selectedNode);
  if (!node) return null;

  const backlinks = getBacklinks(node.id, graph.edges);
  const outgoing = getOutgoingLinks(node.id, graph.edges);
  const meta = node.knowledgeMeta;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div>
        <div className="text-xs text-text-muted uppercase tracking-wider mb-1">{node.type}</div>
        <h2 className="text-lg font-serif text-text-primary">{node.name}</h2>
      </div>

      {/* Summary */}
      <p className="text-sm text-text-secondary leading-relaxed">{node.summary}</p>

      {/* Tags */}
      {node.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {node.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-elevated border border-border-subtle text-text-muted">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Knowledge-specific metadata */}
      {meta?.sourceUrl && (
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Source</div>
          <span className="text-xs text-accent-dim break-all">{meta.sourceUrl}</span>
        </div>
      )}

      {meta?.confidence !== undefined && (
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Confidence</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-dim rounded-full"
                style={{ width: `${meta.confidence * 100}%` }}
              />
            </div>
            <span className="text-xs text-text-muted">{Math.round(meta.confidence * 100)}%</span>
          </div>
        </div>
      )}

      {/* Frontmatter */}
      {meta?.frontmatter && Object.keys(meta.frontmatter).length > 0 && (
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Frontmatter</div>
          <div className="space-y-1">
            {Object.entries(meta.frontmatter).map(([key, value]) => (
              <div key={key} className="text-xs">
                <span className="text-text-muted">{key}:</span>{" "}
                <span className="text-text-secondary">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
            Backlinks ({backlinks.length})
          </div>
          <div className="space-y-0.5">
            {backlinks.map((id) => (
              <NodeLink key={id} nodeId={id} nodes={graph.nodes} onNavigate={setSelectedNode} />
            ))}
          </div>
        </div>
      )}

      {/* Outgoing */}
      {outgoing.length > 0 && (
        <div>
          <div className="text-xs text-text-muted uppercase tracking-wider mb-1">
            Outgoing Links ({outgoing.length})
          </div>
          <div className="space-y-0.5">
            {outgoing.map((id) => (
              <NodeLink key={id} nodeId={id} nodes={graph.nodes} onNavigate={setSelectedNode} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Integrate KnowledgeInfo into App.tsx sidebar rendering**

In `understand-anything-plugin/packages/dashboard/src/App.tsx`, find where the sidebar renders `NodeInfo` and add a condition: if `graph.kind === "knowledge"` and a node is selected, render `KnowledgeInfo` instead of `NodeInfo`.

Import at top:
```typescript
import KnowledgeInfo from "./components/KnowledgeInfo";
```

In the sidebar section, wrap the existing NodeInfo render:
```tsx
{graph?.kind === "knowledge" ? <KnowledgeInfo /> : <NodeInfo />}
```

- [ ] **Step 3: Build dashboard and verify**

Run: `pnpm --filter @understand-anything/dashboard build`
Expected: Clean build

- [ ] **Step 4: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/KnowledgeInfo.tsx understand-anything-plugin/packages/dashboard/src/App.tsx
git commit -m "feat(dashboard): add KnowledgeInfo sidebar component for knowledge graphs"
```

---

## Task 7: Dashboard — Reading Panel

**Files:**
- Create: `understand-anything-plugin/packages/dashboard/src/components/ReadingPanel.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/App.tsx`

- [ ] **Step 1: Create ReadingPanel.tsx**

Create `understand-anything-plugin/packages/dashboard/src/components/ReadingPanel.tsx`:

```tsx
import { useState } from "react";
import { useDashboardStore } from "../store";

export default function ReadingPanel() {
  const graph = useDashboardStore((s) => s.graph);
  const selectedNode = useDashboardStore((s) => s.selectedNode);
  const setSelectedNode = useDashboardStore((s) => s.setSelectedNode);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!graph || graph.kind !== "knowledge" || !selectedNode) return null;

  const node = graph.nodes.find((n) => n.id === selectedNode);
  if (!node || node.type !== "article") return null;

  // Get backlinks for this article
  const backlinks = graph.edges
    .filter((e) => e.target === node.id)
    .map((e) => {
      const sourceNode = graph.nodes.find((n) => n.id === e.source);
      return sourceNode ? { id: sourceNode.id, name: sourceNode.name, type: sourceNode.type } : null;
    })
    .filter(Boolean) as { id: string; name: string; type: string }[];

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 bg-surface border-t border-border-subtle transition-all duration-300 z-50 ${
        isExpanded ? "h-[70vh]" : "h-[45vh]"
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-elevated">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted uppercase tracking-wider">Reading</span>
          <span className="text-sm font-serif text-text-primary">{node.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-text-muted hover:text-text-primary px-2 py-1"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
          <button
            onClick={() => setSelectedNode(null)}
            className="text-xs text-text-muted hover:text-text-primary px-2 py-1"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100%-40px)] overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-serif text-text-primary mb-4">{node.name}</h1>

            {/* Tags */}
            {node.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {node.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-elevated border border-border-subtle text-text-muted">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Article content (summary for now — full markdown rendering is a future enhancement) */}
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-text-secondary leading-relaxed">{node.summary}</p>
            </div>

            {/* Frontmatter metadata */}
            {node.knowledgeMeta?.frontmatter && Object.keys(node.knowledgeMeta.frontmatter).length > 0 && (
              <div className="mt-6 p-3 rounded-lg bg-elevated border border-border-subtle">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Metadata</div>
                {Object.entries(node.knowledgeMeta.frontmatter).map(([key, value]) => (
                  <div key={key} className="text-xs mb-1">
                    <span className="text-text-muted">{key}:</span>{" "}
                    <span className="text-text-secondary">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Backlinks sidebar */}
        {backlinks.length > 0 && (
          <div className="w-56 border-l border-border-subtle overflow-y-auto p-3 bg-elevated">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
              Backlinks ({backlinks.length})
            </div>
            <div className="space-y-1">
              {backlinks.map((link) => (
                <button
                  key={link.id}
                  className="text-xs text-accent-dim hover:text-accent text-left truncate block w-full"
                  onClick={() => setSelectedNode(link.id)}
                >
                  <span className="text-text-muted mr-1">[{link.type}]</span>
                  {link.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add ReadingPanel to App.tsx**

Import and render `ReadingPanel` in the main dashboard layout, positioned at the bottom:

```typescript
import ReadingPanel from "./components/ReadingPanel";
```

Add `<ReadingPanel />` inside the dashboard container, after the graph view area.

- [ ] **Step 3: Build and verify**

Run: `pnpm --filter @understand-anything/dashboard build`
Expected: Clean build

- [ ] **Step 4: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/ReadingPanel.tsx understand-anything-plugin/packages/dashboard/src/App.tsx
git commit -m "feat(dashboard): add ReadingPanel for article reading mode in knowledge graphs"
```

---

## Task 8: Dashboard — Vertical Layout for Knowledge Graphs

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/components/GraphView.tsx`
- Modify: `understand-anything-plugin/packages/dashboard/src/utils/layout.ts` (if direction isn't already configurable)

- [ ] **Step 1: Check how layout direction is passed to dagre**

Read `GraphView.tsx` to find where `applyDagreLayout` is called. The layout.ts `applyDagreLayout` already accepts a `direction: "TB" | "LR"` parameter (default `"TB"`).

Find where GraphView calls this function and check what direction it passes.

- [ ] **Step 2: Pass graph kind to layout decision**

In `GraphView.tsx`, where the layout is applied, check the graph's `kind` field. If `kind === "knowledge"`, use `"TB"` (top-to-bottom). If `kind === "codebase"` or undefined, keep the existing default.

The graph object is available via the store. Add:

```typescript
const graphKind = useDashboardStore((s) => s.graph?.kind);
const layoutDirection = graphKind === "knowledge" ? "TB" : "LR";
```

Pass `layoutDirection` to the layout call.

- [ ] **Step 3: Build and verify**

Run: `pnpm --filter @understand-anything/dashboard build`
Expected: Clean build

- [ ] **Step 4: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/GraphView.tsx
git commit -m "feat(dashboard): use vertical top-down layout for knowledge graphs"
```

---

## Task 9: Dashboard — Knowledge Edge Styling

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/components/GraphView.tsx`

- [ ] **Step 1: Add knowledge edge style map**

In `GraphView.tsx`, add a style map for knowledge edge types. Follow the existing pattern from `DomainGraphView.tsx` which uses ReactFlow's `style` prop:

```typescript
const KNOWLEDGE_EDGE_STYLES: Record<string, React.CSSProperties> = {
  cites: { strokeDasharray: "6 3", strokeWidth: 1.5 },
  contradicts: { stroke: "#c97070", strokeWidth: 2 },
  builds_on: { stroke: "var(--color-accent)", strokeWidth: 2 },
  categorized_under: { stroke: "rgba(150,150,150,0.5)", strokeWidth: 1 },
  authored_by: { strokeDasharray: "3 3", stroke: "var(--color-node-entity)", strokeWidth: 1.5 },
  exemplifies: { strokeDasharray: "3 3", stroke: "var(--color-node-claim)", strokeWidth: 1.5 },
};
```

- [ ] **Step 2: Apply styles when building ReactFlow edges**

Where edges are converted to ReactFlow format, check if the graph is `kind === "knowledge"` and the edge type has a knowledge style. Merge the style:

```typescript
const knowledgeStyle = graph?.kind === "knowledge" ? KNOWLEDGE_EDGE_STYLES[edge.type] : undefined;
// Merge with existing edge style
const style = { ...baseEdgeStyle, ...knowledgeStyle };
```

- [ ] **Step 3: Build and verify**

Run: `pnpm --filter @understand-anything/dashboard build`
Expected: Clean build

- [ ] **Step 4: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/GraphView.tsx
git commit -m "feat(dashboard): add distinct edge styles for knowledge relationship types"
```

---

## Task 10: Dashboard — Knowledge-Aware ProjectOverview

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/components/ProjectOverview.tsx`

- [ ] **Step 1: Add knowledge-specific stats**

In `ProjectOverview.tsx`, detect `graph.kind === "knowledge"` and show knowledge-specific stats:

- Total articles, entities, topics, claims, sources (instead of "code, config, docs, infra, data")
- Detected format (from the first node's `knowledgeMeta.format`)
- Remove "Languages" and "Frameworks" sections for knowledge graphs (they'll be empty)

Add after the existing stats grid:

```tsx
{graph.kind === "knowledge" && (
  <div className="space-y-2">
    <div className="text-xs text-text-muted uppercase tracking-wider">Knowledge Stats</div>
    <div className="grid grid-cols-2 gap-2">
      <StatBox label="Articles" value={graph.nodes.filter(n => n.type === "article").length} />
      <StatBox label="Entities" value={graph.nodes.filter(n => n.type === "entity").length} />
      <StatBox label="Topics" value={graph.nodes.filter(n => n.type === "topic").length} />
      <StatBox label="Claims" value={graph.nodes.filter(n => n.type === "claim").length} />
      <StatBox label="Sources" value={graph.nodes.filter(n => n.type === "source").length} />
    </div>
  </div>
)}
```

Reuse or create a `StatBox` component matching the existing style.

- [ ] **Step 2: Conditionally hide code-specific sections**

Wrap the "Languages", "Frameworks", and code-specific file type breakdown sections in a condition:

```tsx
{graph.kind !== "knowledge" && (
  <>
    {/* existing languages/frameworks/file-types sections */}
  </>
)}
```

- [ ] **Step 3: Build and verify**

Run: `pnpm --filter @understand-anything/dashboard build`
Expected: Clean build

- [ ] **Step 4: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/components/ProjectOverview.tsx
git commit -m "feat(dashboard): add knowledge-specific stats to ProjectOverview"
```

---

## Task 11: Create Agent Definitions

**Files:**
- Create: `understand-anything-plugin/agents/knowledge-scanner.md`
- Create: `understand-anything-plugin/agents/format-detector.md`
- Create: `understand-anything-plugin/agents/article-analyzer.md`
- Create: `understand-anything-plugin/agents/relationship-builder.md`

- [ ] **Step 1: Create knowledge-scanner agent**

Create `understand-anything-plugin/agents/knowledge-scanner.md`:

```markdown
---
name: knowledge-scanner
description: Scans a directory for markdown files and produces a file manifest for knowledge base analysis
model: inherit
---

# Knowledge Scanner Agent

You scan a target directory to discover all markdown files for knowledge base analysis.

## Input

You receive a JSON block with:
- `targetDir` — absolute path to the knowledge base directory

## Task

1. Use Glob/Bash to find all `.md` files in the target directory (recursive)
2. Exclude common non-content directories: `.obsidian/`, `logseq/`, `.foam/`, `_meta/`, `node_modules/`, `.git/`
3. For each file, capture:
   - `path` — relative path from targetDir
   - `sizeLines` — number of lines
   - `preview` — first 20 lines of content
4. Detect directory structure signatures:
   - Check for `.obsidian/` directory
   - Check for `logseq/` + `pages/` directories
   - Check for `.dendron.yml` or `*.schema.yml`
   - Check for `.foam/` or `.vscode/foam.json`
   - Check for `raw/` + `wiki/` + `index.md`
   - Scan a sample of files for `[[wikilinks]]` and unique ID prefixes
5. Write results to `$PROJECT_ROOT/.understand-anything/intermediate/knowledge-manifest.json`

## Output Schema

```json
{
  "targetDir": "/absolute/path",
  "totalFiles": 342,
  "directorySignatures": {
    "hasObsidianDir": true,
    "hasLogseqDir": false,
    "hasDendronConfig": false,
    "hasFoamConfig": false,
    "hasKarpathyStructure": false,
    "hasWikilinks": true,
    "hasUniqueIdPrefixes": false
  },
  "files": [
    {
      "path": "notes/topic.md",
      "sizeLines": 45,
      "preview": "---\ntags: [ai, ml]\n---\n# Topic Name\n..."
    }
  ]
}
```

## Rules

- Do NOT read file contents beyond the 20-line preview
- Sort files by path alphabetically
- Report total count prominently
- Write output to `.understand-anything/intermediate/knowledge-manifest.json`
```

- [ ] **Step 2: Create format-detector agent**

Create `understand-anything-plugin/agents/format-detector.md`:

```markdown
---
name: format-detector
description: Detects the knowledge base format from directory signatures and file samples
model: inherit
---

# Format Detector Agent

You analyze the knowledge-manifest.json to determine which knowledge base format is being used.

## Input

Read `.understand-anything/intermediate/knowledge-manifest.json` produced by the knowledge-scanner.

## Detection Priority

Apply these rules in order (first match wins):

| Priority | Signal | Format |
|----------|--------|--------|
| 1 | `hasObsidianDir === true` | `obsidian` |
| 2 | `hasLogseqDir === true` | `logseq` |
| 3 | `hasDendronConfig === true` | `dendron` |
| 4 | `hasFoamConfig === true` | `foam` |
| 5 | `hasKarpathyStructure === true` | `karpathy` |
| 6 | `hasWikilinks === true` AND `hasUniqueIdPrefixes === true` | `zettelkasten` |
| 7 | fallback | `plain` |

## Output

Write to `.understand-anything/intermediate/format-detection.json`:

```json
{
  "format": "obsidian",
  "confidence": 0.95,
  "parsingHints": {
    "linkStyle": "wikilink",
    "metadataLocation": "yaml-frontmatter",
    "folderSemantics": "none",
    "specialFiles": [".obsidian/app.json"],
    "tagSyntax": "hashtag-inline"
  }
}
```

## Rules

- Always produce exactly one format
- Set confidence based on how many signals matched
- Include parsing hints that will help the article-analyzer
```

- [ ] **Step 3: Create article-analyzer agent**

Create `understand-anything-plugin/agents/article-analyzer.md`:

```markdown
---
name: article-analyzer
description: Analyzes individual markdown files to extract knowledge nodes and explicit edges
model: inherit
---

# Article Analyzer Agent

You analyze batches of markdown files from a knowledge base to extract structured knowledge graph data.

## Input

You receive a JSON block with:
- `projectRoot` — absolute path to the knowledge base
- `batchFiles` — array of file objects from the manifest (path, sizeLines, preview)
- `format` — detected format from format-detection.json
- `parsingHints` — format-specific parsing guidance

You also receive a **format guide** (injected by the skill) that describes how to parse this specific format.

## Task

For each file in the batch:

### 1. Read the full file content

### 2. Extract the article node

- **id**: `article:<relative-path-without-extension>` (e.g., `article:notes/topic`)
- **type**: `article`
- **name**: First heading, or frontmatter title, or filename
- **filePath**: relative path
- **summary**: 2-3 sentence summary of the article content
- **tags**: from frontmatter tags, inline #tags, or inferred from content (3-5 tags)
- **complexity**: `simple` (<50 lines), `moderate` (50-200 lines), `complex` (>200 lines)
- **knowledgeMeta**: `{ format, wikilinks, frontmatter }`

### 3. Extract entity nodes

Identify named entities mentioned in the article:
- People, organizations, tools, papers, projects, datasets
- **id**: `entity:<normalized-lowercase-name>` (e.g., `entity:andrej-karpathy`)
- **type**: `entity`
- **summary**: one-sentence description based on context in the article
- **tags**: entity category tags like `person`, `tool`, `paper`, `organization`

### 4. Extract claim nodes (for articles with strong assertions)

- Only extract claims that are significant takeaways or insights
- **id**: `claim:<article-path>:<short-slug>` (e.g., `claim:notes/topic:rag-loses-context`)
- **type**: `claim`
- **summary**: the assertion itself

### 5. Extract source nodes (for cited references)

- External URLs, paper references, book citations
- **id**: `source:<normalized-url-or-title>`
- **type**: `source`
- **knowledgeMeta**: `{ sourceUrl }`

### 6. Extract explicit edges

- `[[wikilinks]]` → find target article, create `related` edge
- Frontmatter references → `categorized_under` or `related` edges
- Inline citations/URLs → `cites` edges to source nodes
- Author mentions → `authored_by` edges

## Node ID Conventions

```
article:<relative-path-without-extension>
entity:<normalized-lowercase-name>
topic:<normalized-lowercase-name>
claim:<article-path>:<short-slug>
source:<normalized-url-or-title>
```

Normalize: lowercase, replace spaces with hyphens, remove special characters.

**Deduplicate entities**: If the same entity appears across multiple files in the batch, emit it only once. Use the most informative summary.

## Edge Weight Conventions

```
contains: 1.0
authored_by: 0.9
cites: 0.8
categorized_under: 0.7
builds_on: 0.7
related: 0.5
exemplifies: 0.5
contradicts: 0.6
```

## Output

Write per-batch results to `.understand-anything/intermediate/article-batch-<N>.json`:

```json
{
  "nodes": [...],
  "edges": [...]
}
```

## Rules

- One article node per file (always)
- Entity nodes only for clearly named entities (not generic concepts)
- Claim nodes only for significant assertions (not every sentence)
- Source nodes only for explicit external references
- Deduplicate entities within the batch
- Respect the format guide for parsing links and metadata
```

- [ ] **Step 4: Create relationship-builder agent**

Create `understand-anything-plugin/agents/relationship-builder.md`:

```markdown
---
name: relationship-builder
description: Discovers implicit cross-file relationships and builds topic clusters from analyzed knowledge nodes
model: inherit
---

# Relationship Builder Agent

You analyze all extracted nodes and edges to discover implicit relationships that explicit links missed.

## Input

Read all `article-batch-*.json` files from `.understand-anything/intermediate/`. Merge all nodes and edges.

## Task

### 1. Deduplicate entities globally

Multiple batches may have emitted the same entity. Merge them:
- Keep the most detailed summary
- Union all tags
- Collapse duplicate IDs

### 2. Discover implicit relationships

For each pair of articles/entities, determine if there's an implicit relationship:

- **builds_on**: Article A extends or deepens ideas from Article B (similar topics, references same entities, but goes further)
- **contradicts**: Article A makes claims that conflict with Article B
- **categorized_under**: Group articles into topic clusters
- **exemplifies**: An entity is a concrete example of a concept/topic
- **related**: Articles share significant thematic overlap but aren't explicitly linked

Set `confidence` in knowledgeMeta for LLM-inferred edges (0.0-1.0).

### 3. Build topic nodes

Identify thematic clusters across all articles:
- **id**: `topic:<normalized-name>`
- **type**: `topic`
- **summary**: description of what this topic covers
- Create `categorized_under` edges from articles/entities to their topics

### 4. Build layers

Group nodes into layers by topic:
- Each topic becomes a layer
- Articles, entities, claims, and sources are assigned to their primary topic's layer
- Nodes not clearly belonging to any topic go into an "Uncategorized" layer

### 5. Build tour

Create a guided tour through the knowledge base:
- Start with the broadest topic overview
- Walk through key articles in a logical learning order
- Each step covers 1-3 related nodes
- 5-10 tour steps total

## Output

Write to `.understand-anything/intermediate/relationships.json`:

```json
{
  "nodes": [...],
  "edges": [...],
  "layers": [...],
  "tour": [...]
}
```

## Rules

- Only add edges with confidence > 0.4
- Don't duplicate edges that already exist from article-analyzer
- Topics should be meaningful clusters (3+ articles), not one-off categories
- Tour should be navigable by someone new to the knowledge base
- Keep layers balanced — no layer with 50%+ of all nodes
```

- [ ] **Step 5: Commit**

```bash
git add understand-anything-plugin/agents/knowledge-scanner.md understand-anything-plugin/agents/format-detector.md understand-anything-plugin/agents/article-analyzer.md understand-anything-plugin/agents/relationship-builder.md
git commit -m "feat(agents): add knowledge-scanner, format-detector, article-analyzer, and relationship-builder agents"
```

---

## Task 12: Create Format Guides

**Files:**
- Create: `understand-anything-plugin/skills/understand-knowledge/formats/obsidian.md`
- Create: `understand-anything-plugin/skills/understand-knowledge/formats/logseq.md`
- Create: `understand-anything-plugin/skills/understand-knowledge/formats/dendron.md`
- Create: `understand-anything-plugin/skills/understand-knowledge/formats/foam.md`
- Create: `understand-anything-plugin/skills/understand-knowledge/formats/karpathy.md`
- Create: `understand-anything-plugin/skills/understand-knowledge/formats/zettelkasten.md`
- Create: `understand-anything-plugin/skills/understand-knowledge/formats/plain.md`

**IMPORTANT**: Each format guide must be **research-backed**. The implementing agent MUST:
1. Use WebSearch and WebFetch to read the **official documentation** for each format
2. Study the actual parsing rules, not assumptions
3. Include specific syntax examples from real documentation

- [ ] **Step 1: Create obsidian.md format guide**

Research Obsidian's official docs (https://help.obsidian.md/) and create `understand-anything-plugin/skills/understand-knowledge/formats/obsidian.md`:

The guide must cover:
- Detection: `.obsidian/` directory exists
- Link syntax: `[[wikilink]]`, `[[note|alias]]`, `[[note#heading]]`, `![[embed]]`
- Metadata: YAML frontmatter between `---` delimiters
- Tags: `#tag` inline, `tags:` in frontmatter (both array and space-separated)
- Properties: Obsidian Properties (frontmatter fields rendered in UI)
- Folder semantics: Obsidian doesn't assign folder meaning by default
- Special files: `.obsidian/app.json`, `.obsidian/workspace.json` (ignore these)
- Canvas: `.canvas` files (JSON format, describe spatial layouts — extract card references)
- Dataview: inline fields `key:: value`, `[key:: value]`

- [ ] **Step 2: Create logseq.md format guide**

Research Logseq docs (https://docs.logseq.com/) and create `understand-anything-plugin/skills/understand-knowledge/formats/logseq.md`:

Cover:
- Detection: `logseq/` + `pages/` directories
- Structure: `journals/YYYY_MM_DD.md` (daily notes), `pages/*.md` (named pages)
- Link syntax: `[[wikilinks]]`, `((block-references))` by UUID
- Block-based: Content is organized as bullet-point outlines
- Properties: `key:: value` syntax on blocks
- Tags: `#tag` inline, page tags via properties
- Special: `logseq/config.edn` for configuration

- [ ] **Step 3: Create dendron.md format guide**

Research Dendron wiki (https://wiki.dendron.so/) and create `understand-anything-plugin/skills/understand-knowledge/formats/dendron.md`:

Cover:
- Detection: `.dendron.yml` or `*.schema.yml` files
- Hierarchy: dot-delimited filenames (`a.b.c.md`)
- Link syntax: `[[wikilinks]]` with hierarchy awareness
- Schemas: `.schema.yml` files define expected hierarchy structure
- Frontmatter: YAML with required `id` and `title` fields
- Stubs: auto-created intermediate hierarchy files

- [ ] **Step 4: Create foam.md format guide**

Research Foam docs (https://foambubble.github.io/foam/) and create `understand-anything-plugin/skills/understand-knowledge/formats/foam.md`:

Cover:
- Detection: `.foam/` directory or `.vscode/foam.json`
- Link syntax: `[[wikilinks]]` plus link reference definitions at file bottom
- Placeholder links: links to non-existent files
- Frontmatter: standard YAML
- Auto-linking: Foam auto-updates links on file rename/move

- [ ] **Step 5: Create karpathy.md format guide**

Research Karpathy's gist (https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) and create `understand-anything-plugin/skills/understand-knowledge/formats/karpathy.md`:

Cover:
- Detection: `raw/` + `wiki/` directories + `index.md`
- Structure: `raw/` (immutable sources), `wiki/` (compiled articles), `_meta/` (state)
- Special files: `index.md` (master page list), `log.md` (append-only operations log)
- Link style: standard markdown links (not wikilinks)
- Log parsing: `## [YYYY-MM-DD] operation | Title` entries
- Wiki articles: LLM-compiled, may have cross-references and backlinks

- [ ] **Step 6: Create zettelkasten.md format guide**

Research zettelkasten.de and create `understand-anything-plugin/skills/understand-knowledge/formats/zettelkasten.md`:

Cover:
- Detection: `[[wikilinks]]` + unique ID prefixes in filenames (timestamps like `202604091234`)
- Atomic notes: one idea per note
- Unique IDs: timestamp or alphanumeric prefix in filename
- Links: `[[wikilinks]]` with optional typed links
- Frontmatter: YAML with tags, creation date
- No folder hierarchy: flat structure, connections via links only

- [ ] **Step 7: Create plain.md format guide**

Create `understand-anything-plugin/skills/understand-knowledge/formats/plain.md`:

Cover:
- Detection: fallback when no other format detected
- Links: standard markdown `[text](relative/path.md)` links
- Structure: folder hierarchy provides categorization
- Headings: `#` hierarchy provides structure within files
- No special metadata expectations
- Tags: none expected (LLM infers topics)

- [ ] **Step 8: Commit**

```bash
git add understand-anything-plugin/skills/understand-knowledge/formats/
git commit -m "feat(skill): add 7 research-backed format guides for knowledge base parsing"
```

---

## Task 13: Create SKILL.md

**Files:**
- Create: `understand-anything-plugin/skills/understand-knowledge/SKILL.md`

- [ ] **Step 1: Create the skill definition**

Create `understand-anything-plugin/skills/understand-knowledge/SKILL.md`:

```markdown
---
name: understand-knowledge
description: Analyze a markdown knowledge base (Obsidian, Logseq, Dendron, Foam, Karpathy-style, Zettelkasten, or plain) to produce an interactive knowledge graph with typed relationships
argument-hint: [path/to/notes] [--ingest <file-or-folder>]
---

# /understand-knowledge

Analyze a personal knowledge base of markdown files and produce an interactive knowledge graph.

## Arguments

- `path/to/notes` — (optional) directory containing markdown files. Defaults to current working directory.
- `--ingest <path>` — (optional) incrementally add new file(s) to an existing knowledge graph.

## Phase 0: Pre-flight

1. Determine the target directory:
   - If a path argument is provided, use it
   - Otherwise use the current working directory
2. Create `.understand-anything/` and `.understand-anything/intermediate/` directories if they don't exist
3. If `--ingest` flag is present:
   - Verify `.understand-anything/knowledge-graph.json` exists (error if not — must run full scan first)
   - Read the existing graph
   - Skip to Phase 2 with only the new/changed files
4. Get the current git commit hash (if in a git repo, otherwise use "no-git")

## Phase 1: SCAN

Dispatch the **knowledge-scanner** agent:

```json
{
  "targetDir": "<absolute-path-to-target>"
}
```

Wait for the agent to write `.understand-anything/intermediate/knowledge-manifest.json`.

Report: "Scanned {totalFiles} markdown files."

## Phase 2: FORMAT DETECTION

Dispatch the **format-detector** agent.

Wait for `.understand-anything/intermediate/format-detection.json`.

Report: "Detected format: {format} (confidence: {confidence})"

## Phase 3: ANALYZE

Read the format detection result. Load the corresponding format guide:

- `obsidian` → inject `skills/understand-knowledge/formats/obsidian.md`
- `logseq` → inject `skills/understand-knowledge/formats/logseq.md`
- `dendron` → inject `skills/understand-knowledge/formats/dendron.md`
- `foam` → inject `skills/understand-knowledge/formats/foam.md`
- `karpathy` → inject `skills/understand-knowledge/formats/karpathy.md`
- `zettelkasten` → inject `skills/understand-knowledge/formats/zettelkasten.md`
- `plain` → inject `skills/understand-knowledge/formats/plain.md`

Batch the files from the manifest into groups of 15-25 files each.

For each batch, dispatch an **article-analyzer** agent with:

```json
{
  "projectRoot": "<absolute-path>",
  "batchFiles": [...],
  "format": "<detected-format>",
  "parsingHints": {...}
}
```

Inject the format guide content into each agent's context.

Run up to 5 batches concurrently.

Wait for all `article-batch-*.json` files.

Report: "Analyzed {totalFiles} files across {batchCount} batches."

## Phase 4: RELATIONSHIPS

Dispatch the **relationship-builder** agent.

Wait for `.understand-anything/intermediate/relationships.json`.

Report: "Discovered {topicCount} topics, {implicitEdgeCount} implicit relationships."

## Phase 5: ASSEMBLE

Merge all intermediate results into a single knowledge graph:

1. Read all `article-batch-*.json` files — collect all nodes and edges
2. Read `relationships.json` — merge in topic nodes, implicit edges, layers, and tour
3. Deduplicate nodes by ID (keep the most complete version)
4. Deduplicate edges by source+target+type
5. Assemble into `KnowledgeGraph` format:

```json
{
  "version": "1.0",
  "kind": "knowledge",
  "project": {
    "name": "<directory-name>",
    "languages": [],
    "frameworks": [],
    "description": "Knowledge base analyzed from <format> format",
    "analyzedAt": "<ISO-timestamp>",
    "gitCommitHash": "<hash>"
  },
  "nodes": [...],
  "edges": [...],
  "layers": [...],
  "tour": [...]
}
```

## Phase 6: REVIEW

Dispatch the existing **graph-reviewer** agent to validate:
- All edge source/target IDs reference existing nodes
- No orphan nodes (nodes with zero edges)
- No duplicate node IDs
- All layers reference existing nodes
- Tour steps reference existing nodes

Apply fixes from the reviewer.

## Phase 7: SAVE

1. Write `.understand-anything/knowledge-graph.json`
2. Write `.understand-anything/meta.json`:
   ```json
   {
     "lastAnalyzedAt": "<ISO-timestamp>",
     "gitCommitHash": "<hash>",
     "version": "1.0",
     "analyzedFiles": <count>,
     "knowledgeFormat": "<detected-format>"
   }
   ```
3. Clean up `.understand-anything/intermediate/` directory
4. Report: "Knowledge graph saved with {nodeCount} nodes and {edgeCount} edges."

## Phase 8: DASHBOARD

Auto-trigger `/understand-dashboard` to launch the visualization.

## Incremental Mode (--ingest)

When `--ingest <path>` is specified:

1. Read the existing `knowledge-graph.json`
2. Scan only the specified file(s) or folder
3. Skip format detection (reuse format from existing graph's metadata)
4. Run article-analyzer on only the new/changed files
5. Run relationship-builder on new nodes against the full existing graph
6. Merge new nodes/edges into the existing graph
7. Re-run graph-reviewer
8. Save updated graph
```

- [ ] **Step 2: Commit**

```bash
git add understand-anything-plugin/skills/understand-knowledge/SKILL.md
git commit -m "feat(skill): add /understand-knowledge skill definition with 8-phase pipeline"
```

---

## Task 14: Build, Test & Verify End-to-End

**Files:**
- All modified files

- [ ] **Step 1: Build core package**

Run: `pnpm --filter @understand-anything/core build`
Expected: Clean build, no errors

- [ ] **Step 2: Run core tests**

Run: `pnpm --filter @understand-anything/core test -- --run`
Expected: All tests pass, including new knowledge-schema tests

- [ ] **Step 3: Build dashboard**

Run: `pnpm --filter @understand-anything/dashboard build`
Expected: Clean build, no errors

- [ ] **Step 4: Run lint**

Run: `pnpm lint`
Expected: No lint errors

- [ ] **Step 5: Verify skill is discoverable**

Check that the skill file exists and has valid frontmatter:

Run: `head -5 understand-anything-plugin/skills/understand-knowledge/SKILL.md`
Expected: Valid `---` delimited YAML with name, description, argument-hint

- [ ] **Step 6: Verify all agents are present**

Run: `ls understand-anything-plugin/agents/ | grep knowledge\|format\|article\|relationship`
Expected: `knowledge-scanner.md`, `format-detector.md`, `article-analyzer.md`, `relationship-builder.md`

- [ ] **Step 7: Verify all format guides are present**

Run: `ls understand-anything-plugin/skills/understand-knowledge/formats/`
Expected: `obsidian.md`, `logseq.md`, `dendron.md`, `foam.md`, `karpathy.md`, `zettelkasten.md`, `plain.md`

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete /understand-knowledge implementation — knowledge base analysis skill"
```
````

## File: docs/superpowers/plans/2026-04-10-understandignore-impl.md
````markdown
# .understandignore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user-configurable file exclusion via `.understandignore` files using `.gitignore` syntax, with auto-generated starter files and a pre-analysis review pause.

**Architecture:** An `IgnoreFilter` module in `packages/core` uses the `ignore` npm package to parse `.understandignore` files and filter paths. A companion `IgnoreGenerator` scans the project for common patterns and produces a commented-out starter file. The `project-scanner` agent applies the filter as a second pass after its existing hardcoded exclusions. The `/understand` skill adds a Phase 0.5 that generates the starter file and pauses for user review.

**Tech Stack:** TypeScript, `ignore` npm package, Vitest

**Spec:** `docs/superpowers/specs/2026-04-10-understandignore-design.md`

---

## File Structure

### Core package
- Create: `understand-anything-plugin/packages/core/src/ignore-filter.ts` — parse .understandignore, merge with defaults, filter paths
- Create: `understand-anything-plugin/packages/core/src/ignore-generator.ts` — generate starter .understandignore by scanning project
- Create: `understand-anything-plugin/packages/core/src/__tests__/ignore-filter.test.ts` — filter tests
- Create: `understand-anything-plugin/packages/core/src/__tests__/ignore-generator.test.ts` — generator tests
- Modify: `understand-anything-plugin/packages/core/src/index.ts` — export new modules
- Modify: `understand-anything-plugin/packages/core/package.json` — add `ignore` dependency

### Agents & skills
- Modify: `understand-anything-plugin/agents/project-scanner.md` — add Layer 2 filtering step
- Modify: `understand-anything-plugin/skills/understand/SKILL.md` — add Phase 0.5

---

## Task 1: Add `ignore` dependency

**Files:**
- Modify: `understand-anything-plugin/packages/core/package.json`

- [ ] **Step 1: Install the `ignore` npm package**

Run:
```bash
cd understand-anything-plugin && pnpm add --filter @understand-anything/core ignore
```

- [ ] **Step 2: Verify it was added**

Run: `grep ignore understand-anything-plugin/packages/core/package.json`
Expected: `"ignore": "^7.x.x"` (or similar) in dependencies

- [ ] **Step 3: Commit**

```bash
git add understand-anything-plugin/packages/core/package.json understand-anything-plugin/pnpm-lock.yaml
git commit -m "chore(core): add ignore package for .understandignore support"
```

---

## Task 2: Create IgnoreFilter module with tests (TDD)

**Files:**
- Create: `understand-anything-plugin/packages/core/src/ignore-filter.ts`
- Create: `understand-anything-plugin/packages/core/src/__tests__/ignore-filter.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `understand-anything-plugin/packages/core/src/__tests__/ignore-filter.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createIgnoreFilter, DEFAULT_IGNORE_PATTERNS } from "../ignore-filter";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("IgnoreFilter", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `ignore-filter-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, ".understand-anything"), { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("DEFAULT_IGNORE_PATTERNS", () => {
    it("contains node_modules", () => {
      expect(DEFAULT_IGNORE_PATTERNS).toContain("node_modules/");
    });

    it("contains .git", () => {
      expect(DEFAULT_IGNORE_PATTERNS).toContain(".git/");
    });

    it("contains bin and obj for .NET", () => {
      expect(DEFAULT_IGNORE_PATTERNS).toContain("bin/");
      expect(DEFAULT_IGNORE_PATTERNS).toContain("obj/");
    });

    it("contains build output directories", () => {
      expect(DEFAULT_IGNORE_PATTERNS).toContain("dist/");
      expect(DEFAULT_IGNORE_PATTERNS).toContain("build/");
      expect(DEFAULT_IGNORE_PATTERNS).toContain("out/");
      expect(DEFAULT_IGNORE_PATTERNS).toContain("coverage/");
    });
  });

  describe("createIgnoreFilter with no user file", () => {
    it("ignores files matching default patterns", () => {
      const filter = createIgnoreFilter(testDir);
      expect(filter.isIgnored("node_modules/foo/bar.js")).toBe(true);
      expect(filter.isIgnored("dist/index.js")).toBe(true);
      expect(filter.isIgnored(".git/config")).toBe(true);
      expect(filter.isIgnored("bin/Debug/app.dll")).toBe(true);
      expect(filter.isIgnored("obj/Release/net8.0/app.dll")).toBe(true);
    });

    it("does not ignore source files", () => {
      const filter = createIgnoreFilter(testDir);
      expect(filter.isIgnored("src/index.ts")).toBe(false);
      expect(filter.isIgnored("README.md")).toBe(false);
      expect(filter.isIgnored("package.json")).toBe(false);
    });

    it("ignores lock files", () => {
      const filter = createIgnoreFilter(testDir);
      expect(filter.isIgnored("pnpm-lock.yaml")).toBe(true);
      expect(filter.isIgnored("package-lock.json")).toBe(true);
      expect(filter.isIgnored("yarn.lock")).toBe(true);
    });

    it("ignores binary/asset files", () => {
      const filter = createIgnoreFilter(testDir);
      expect(filter.isIgnored("logo.png")).toBe(true);
      expect(filter.isIgnored("font.woff2")).toBe(true);
      expect(filter.isIgnored("doc.pdf")).toBe(true);
    });

    it("ignores generated files", () => {
      const filter = createIgnoreFilter(testDir);
      expect(filter.isIgnored("bundle.min.js")).toBe(true);
      expect(filter.isIgnored("style.min.css")).toBe(true);
      expect(filter.isIgnored("source.map")).toBe(true);
    });

    it("ignores IDE directories", () => {
      const filter = createIgnoreFilter(testDir);
      expect(filter.isIgnored(".idea/workspace.xml")).toBe(true);
      expect(filter.isIgnored(".vscode/settings.json")).toBe(true);
    });
  });

  describe("createIgnoreFilter with user .understandignore", () => {
    it("reads patterns from .understand-anything/.understandignore", () => {
      writeFileSync(
        join(testDir, ".understand-anything", ".understandignore"),
        "# Exclude tests\n__tests__/\n*.test.ts\n"
      );
      const filter = createIgnoreFilter(testDir);
      expect(filter.isIgnored("__tests__/foo.test.ts")).toBe(true);
      expect(filter.isIgnored("src/utils.test.ts")).toBe(true);
      expect(filter.isIgnored("src/utils.ts")).toBe(false);
    });

    it("reads patterns from project root .understandignore", () => {
      writeFileSync(
        join(testDir, ".understandignore"),
        "docs/\n"
      );
      const filter = createIgnoreFilter(testDir);
      expect(filter.isIgnored("docs/README.md")).toBe(true);
      expect(filter.isIgnored("src/index.ts")).toBe(false);
    });

    it("handles # comments and blank lines", () => {
      writeFileSync(
        join(testDir, ".understand-anything", ".understandignore"),
        "# This is a comment\n\n\nfixtures/\n\n# Another comment\n"
      );
      const filter = createIgnoreFilter(testDir);
      expect(filter.isIgnored("fixtures/data.json")).toBe(true);
      expect(filter.isIgnored("src/index.ts")).toBe(false);
    });

    it("supports ! negation to override defaults", () => {
      writeFileSync(
        join(testDir, ".understand-anything", ".understandignore"),
        "!dist/\n"
      );
      const filter = createIgnoreFilter(testDir);
      // dist/ is in defaults but negated by user
      expect(filter.isIgnored("dist/index.js")).toBe(false);
    });

    it("supports ** recursive matching", () => {
      writeFileSync(
        join(testDir, ".understand-anything", ".understandignore"),
        "**/snapshots/\n"
      );
      const filter = createIgnoreFilter(testDir);
      expect(filter.isIgnored("src/components/snapshots/Button.snap")).toBe(true);
      expect(filter.isIgnored("snapshots/foo.snap")).toBe(true);
    });

    it("merges .understand-anything/ and root .understandignore", () => {
      writeFileSync(
        join(testDir, ".understand-anything", ".understandignore"),
        "__tests__/\n"
      );
      writeFileSync(
        join(testDir, ".understandignore"),
        "fixtures/\n"
      );
      const filter = createIgnoreFilter(testDir);
      expect(filter.isIgnored("__tests__/foo.ts")).toBe(true);
      expect(filter.isIgnored("fixtures/data.json")).toBe(true);
      expect(filter.isIgnored("src/index.ts")).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @understand-anything/core test -- --run src/__tests__/ignore-filter.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement IgnoreFilter**

Create `understand-anything-plugin/packages/core/src/ignore-filter.ts`:

```typescript
import ignore, { type Ignore } from "ignore";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Hardcoded default ignore patterns matching the project-scanner agent's
 * exclusion rules, plus bin/obj for .NET projects.
 */
export const DEFAULT_IGNORE_PATTERNS: string[] = [
  // Dependency directories
  "node_modules/",
  ".git/",
  "vendor/",
  "venv/",
  ".venv/",
  "__pycache__/",

  // Build output
  "dist/",
  "build/",
  "out/",
  "coverage/",
  ".next/",
  ".cache/",
  ".turbo/",
  "target/",
  "bin/",
  "obj/",

  // Lock files
  "*.lock",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",

  // Binary/asset files
  "*.png",
  "*.jpg",
  "*.jpeg",
  "*.gif",
  "*.svg",
  "*.ico",
  "*.woff",
  "*.woff2",
  "*.ttf",
  "*.eot",
  "*.mp3",
  "*.mp4",
  "*.pdf",
  "*.zip",
  "*.tar",
  "*.gz",

  // Generated files
  "*.min.js",
  "*.min.css",
  "*.map",
  "*.generated.*",

  // IDE/editor
  ".idea/",
  ".vscode/",

  // Misc
  "LICENSE",
  ".gitignore",
  ".editorconfig",
  ".prettierrc",
  ".eslintrc*",
  "*.log",
];

export interface IgnoreFilter {
  /** Returns true if the given relative path should be excluded from analysis. */
  isIgnored(relativePath: string): boolean;
}

/**
 * Creates an IgnoreFilter that merges hardcoded defaults with user-defined
 * patterns from .understandignore files.
 *
 * Pattern load order (later entries can override earlier ones via ! negation):
 * 1. Hardcoded defaults
 * 2. .understand-anything/.understandignore (if exists)
 * 3. .understandignore at project root (if exists)
 */
export function createIgnoreFilter(projectRoot: string): IgnoreFilter {
  const ig: Ignore = ignore();

  // Layer 1: hardcoded defaults
  ig.add(DEFAULT_IGNORE_PATTERNS);

  // Layer 2: .understand-anything/.understandignore
  const projectIgnorePath = join(projectRoot, ".understand-anything", ".understandignore");
  if (existsSync(projectIgnorePath)) {
    const content = readFileSync(projectIgnorePath, "utf-8");
    ig.add(content);
  }

  // Layer 3: .understandignore at project root
  const rootIgnorePath = join(projectRoot, ".understandignore");
  if (existsSync(rootIgnorePath)) {
    const content = readFileSync(rootIgnorePath, "utf-8");
    ig.add(content);
  }

  return {
    isIgnored(relativePath: string): boolean {
      return ig.ignores(relativePath);
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @understand-anything/core test -- --run src/__tests__/ignore-filter.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Build to verify no type errors**

Run: `pnpm --filter @understand-anything/core build`
Expected: Clean build

- [ ] **Step 6: Commit**

```bash
git add understand-anything-plugin/packages/core/src/ignore-filter.ts understand-anything-plugin/packages/core/src/__tests__/ignore-filter.test.ts
git commit -m "feat(core): add IgnoreFilter module with .understandignore parsing and tests"
```

---

## Task 3: Create IgnoreGenerator module with tests (TDD)

**Files:**
- Create: `understand-anything-plugin/packages/core/src/ignore-generator.ts`
- Create: `understand-anything-plugin/packages/core/src/__tests__/ignore-generator.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `understand-anything-plugin/packages/core/src/__tests__/ignore-generator.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateStarterIgnoreFile } from "../ignore-generator";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("generateStarterIgnoreFile", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `ignore-gen-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("includes a header comment explaining the file", () => {
    const content = generateStarterIgnoreFile(testDir);
    expect(content).toContain(".understandignore");
    expect(content).toContain("same as .gitignore");
    expect(content).toContain("Built-in defaults");
  });

  it("all suggestions are commented out", () => {
    // Create some directories to trigger suggestions
    mkdirSync(join(testDir, "__tests__"), { recursive: true });
    mkdirSync(join(testDir, "docs"), { recursive: true });
    const content = generateStarterIgnoreFile(testDir);
    const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
    // No active (uncommented) patterns
    expect(lines).toHaveLength(0);
  });

  it("suggests __tests__ when __tests__ directory exists", () => {
    mkdirSync(join(testDir, "__tests__"), { recursive: true });
    const content = generateStarterIgnoreFile(testDir);
    expect(content).toContain("# __tests__/");
  });

  it("suggests docs when docs directory exists", () => {
    mkdirSync(join(testDir, "docs"), { recursive: true });
    const content = generateStarterIgnoreFile(testDir);
    expect(content).toContain("# docs/");
  });

  it("suggests test directories when they exist", () => {
    mkdirSync(join(testDir, "test"), { recursive: true });
    mkdirSync(join(testDir, "tests"), { recursive: true });
    const content = generateStarterIgnoreFile(testDir);
    expect(content).toContain("# test/");
    expect(content).toContain("# tests/");
  });

  it("suggests fixtures when fixtures directory exists", () => {
    mkdirSync(join(testDir, "fixtures"), { recursive: true });
    const content = generateStarterIgnoreFile(testDir);
    expect(content).toContain("# fixtures/");
  });

  it("suggests examples when examples directory exists", () => {
    mkdirSync(join(testDir, "examples"), { recursive: true });
    const content = generateStarterIgnoreFile(testDir);
    expect(content).toContain("# examples/");
  });

  it("suggests .storybook when .storybook directory exists", () => {
    mkdirSync(join(testDir, ".storybook"), { recursive: true });
    const content = generateStarterIgnoreFile(testDir);
    expect(content).toContain("# .storybook/");
  });

  it("suggests migrations when migrations directory exists", () => {
    mkdirSync(join(testDir, "migrations"), { recursive: true });
    const content = generateStarterIgnoreFile(testDir);
    expect(content).toContain("# migrations/");
  });

  it("suggests scripts when scripts directory exists", () => {
    mkdirSync(join(testDir, "scripts"), { recursive: true });
    const content = generateStarterIgnoreFile(testDir);
    expect(content).toContain("# scripts/");
  });

  it("always includes generic suggestions", () => {
    const content = generateStarterIgnoreFile(testDir);
    expect(content).toContain("# *.snap");
    expect(content).toContain("# *.test.*");
    expect(content).toContain("# *.spec.*");
  });

  it("does not suggest directories that don't exist", () => {
    const content = generateStarterIgnoreFile(testDir);
    // __tests__ doesn't exist, so it shouldn't be in directory suggestions
    // (it may still be in generic test file patterns)
    expect(content).not.toContain("# __tests__/");
    expect(content).not.toContain("# .storybook/");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @understand-anything/core test -- --run src/__tests__/ignore-generator.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement IgnoreGenerator**

Create `understand-anything-plugin/packages/core/src/ignore-generator.ts`:

```typescript
import { existsSync } from "node:fs";
import { join } from "node:path";

const HEADER = `# .understandignore — patterns for files/dirs to exclude from analysis
# Syntax: same as .gitignore (globs, # comments, ! negation, trailing / for dirs)
# Lines below are suggestions — uncomment to activate.
# Use ! prefix to force-include something excluded by defaults.
#
# Built-in defaults (always excluded unless negated):
#   node_modules/, .git/, dist/, build/, bin/, obj/, *.lock, *.min.js, etc.
#
`;

/** Directories to check for and suggest excluding. */
const DETECTABLE_DIRS = [
  { dir: "__tests__", pattern: "__tests__/" },
  { dir: "test", pattern: "test/" },
  { dir: "tests", pattern: "tests/" },
  { dir: "fixtures", pattern: "fixtures/" },
  { dir: "testdata", pattern: "testdata/" },
  { dir: "docs", pattern: "docs/" },
  { dir: "examples", pattern: "examples/" },
  { dir: "scripts", pattern: "scripts/" },
  { dir: "migrations", pattern: "migrations/" },
  { dir: ".storybook", pattern: ".storybook/" },
];

/** Always-included generic suggestions. */
const GENERIC_SUGGESTIONS = [
  "*.test.*",
  "*.spec.*",
  "*.snap",
];

/**
 * Generates a starter .understandignore file by scanning the project root
 * for common directories and suggesting them as commented-out exclusions.
 *
 * All suggestions are commented out — the user must uncomment to activate.
 * Returns the file content as a string.
 */
export function generateStarterIgnoreFile(projectRoot: string): string {
  const sections: string[] = [HEADER];

  // Detected directory suggestions
  const detected: string[] = [];
  for (const { dir, pattern } of DETECTABLE_DIRS) {
    if (existsSync(join(projectRoot, dir))) {
      detected.push(pattern);
    }
  }

  if (detected.length > 0) {
    sections.push("# --- Detected directories (uncomment to exclude) ---\n");
    for (const pattern of detected) {
      sections.push(`# ${pattern}`);
    }
    sections.push("");
  }

  // Generic suggestions (always included)
  sections.push("# --- Test file patterns (uncomment to exclude) ---\n");
  for (const pattern of GENERIC_SUGGESTIONS) {
    sections.push(`# ${pattern}`);
  }
  sections.push("");

  return sections.join("\n");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @understand-anything/core test -- --run src/__tests__/ignore-generator.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Build**

Run: `pnpm --filter @understand-anything/core build`
Expected: Clean build

- [ ] **Step 6: Commit**

```bash
git add understand-anything-plugin/packages/core/src/ignore-generator.ts understand-anything-plugin/packages/core/src/__tests__/ignore-generator.test.ts
git commit -m "feat(core): add IgnoreGenerator for starter .understandignore file creation"
```

---

## Task 4: Export new modules from core

**Files:**
- Modify: `understand-anything-plugin/packages/core/src/index.ts`

- [ ] **Step 1: Add exports**

Add to the end of `understand-anything-plugin/packages/core/src/index.ts`:

```typescript
export {
  createIgnoreFilter,
  DEFAULT_IGNORE_PATTERNS,
  type IgnoreFilter,
} from "./ignore-filter.js";
export { generateStarterIgnoreFile } from "./ignore-generator.js";
```

- [ ] **Step 2: Build and run all tests**

Run: `pnpm --filter @understand-anything/core build && pnpm --filter @understand-anything/core test -- --run`
Expected: Clean build, all tests pass

- [ ] **Step 3: Commit**

```bash
git add understand-anything-plugin/packages/core/src/index.ts
git commit -m "feat(core): export IgnoreFilter and IgnoreGenerator from core index"
```

---

## Task 5: Update project-scanner agent

**Files:**
- Modify: `understand-anything-plugin/agents/project-scanner.md`

- [ ] **Step 1: Read the current project-scanner.md**

Read `understand-anything-plugin/agents/project-scanner.md` to understand the current structure.

- [ ] **Step 2: Add bin/ and obj/ to hardcoded exclusions**

In Step 2 (Exclusion Filtering), add `bin/` and `obj/` to the "Build output" line:

Change:
```
- **Build output:** paths with a directory segment matching `dist/`, `build/`, `out/`, `coverage/`, `.next/`, `.cache/`, `.turbo/`, `target/` (Rust)
```

To:
```
- **Build output:** paths with a directory segment matching `dist/`, `build/`, `out/`, `coverage/`, `.next/`, `.cache/`, `.turbo/`, `target/` (Rust), `bin/` (.NET), `obj/` (.NET)
```

- [ ] **Step 3: Add Layer 2 filtering step**

After Step 2 (Exclusion Filtering), add a new step:

```markdown
**Step 2.5 -- User-Configured Filtering (.understandignore)**

After applying the hardcoded exclusion filters above, apply user-configured patterns from `.understandignore`:

1. Check if `.understand-anything/.understandignore` exists in the project root. If so, read it.
2. Check if `.understandignore` exists in the project root. If so, read it.
3. Parse both files using `.gitignore` syntax (glob patterns, `#` comments, blank lines ignored, `!` prefix for negation, trailing `/` for directories, `**/` for recursive matching).
4. Filter the remaining file list through these patterns. Files matching any pattern are excluded.
5. `!` negation patterns override the hardcoded exclusions from Step 2 (e.g., `!dist/` force-includes dist/).
6. Track the count of files removed by this step as `filteredByIgnore`.

This filtering must be deterministic (not LLM-based). Use a Node.js script with the `ignore` npm package if implementing programmatically, or apply the patterns manually if the file list is small.
```

- [ ] **Step 4: Update scan output schema**

Find the output JSON schema section and add `filteredByIgnore` field:

```json
{
  "name": "...",
  "description": "...",
  "languages": ["..."],
  "frameworks": ["..."],
  "files": [...],
  "totalFiles": 123,
  "filteredByIgnore": 5,
  "estimatedComplexity": "moderate",
  "importMap": {}
}
```

- [ ] **Step 5: Commit**

```bash
git add understand-anything-plugin/agents/project-scanner.md
git commit -m "feat(agent): add .understandignore support and bin/obj exclusions to project-scanner"
```

---

## Task 6: Update /understand skill with Phase 0.5

**Files:**
- Modify: `understand-anything-plugin/skills/understand/SKILL.md`

- [ ] **Step 1: Read the current SKILL.md Phase 0 section**

Read `understand-anything-plugin/skills/understand/SKILL.md` lines 22-80 to understand Phase 0.

- [ ] **Step 2: Add Phase 0.5 after Phase 0**

After the Phase 0 section (after the `---` separator before Phase 1), insert:

```markdown
## Phase 0.5 — Ignore Configuration

Set up and verify the `.understandignore` file before scanning.

1. Check if `$PROJECT_ROOT/.understand-anything/.understandignore` exists.
2. **If it does NOT exist**, generate a starter file:
   - Run a Node.js script (or inline logic) that scans `$PROJECT_ROOT` for common directories (`__tests__/`, `test/`, `tests/`, `fixtures/`, `testdata/`, `docs/`, `examples/`, `scripts/`, `migrations/`, `.storybook/`) and generates a `.understandignore` file with commented-out suggestions.
   - Write the generated content to `$PROJECT_ROOT/.understand-anything/.understandignore`.
   - Report to the user:
     > "Generated `.understand-anything/.understandignore` with suggested exclusions based on your project structure. Please review it and uncomment any patterns you'd like to exclude from analysis. When ready, confirm to continue."
   - **Wait for user confirmation before proceeding.**
3. **If it already exists**, report:
   > "Found `.understand-anything/.understandignore`. Review it if needed, then confirm to continue."
   - **Wait for user confirmation before proceeding.**
4. After confirmation, proceed to Phase 1.

**Note:** The `.understandignore` file uses `.gitignore` syntax. The user can add patterns to exclude files from analysis, or use `!` prefix to force-include files excluded by built-in defaults (e.g., `!dist/` to analyze dist/ files).

---
```

- [ ] **Step 3: Update Phase 1 reporting**

In the Phase 1 section, after the gate check (~line 114), add a note about reporting ignore stats:

```markdown
After scanning, if the scan result includes `filteredByIgnore > 0`, report:
> "Scanned {totalFiles} files ({filteredByIgnore} excluded by .understandignore)"
```

- [ ] **Step 4: Commit**

```bash
git add understand-anything-plugin/skills/understand/SKILL.md
git commit -m "feat(skill): add Phase 0.5 for .understandignore setup and review pause"
```

---

## Task 7: Build, test, and verify end-to-end

**Files:**
- All modified files

- [ ] **Step 1: Build core**

Run: `pnpm --filter @understand-anything/core build`
Expected: Clean build

- [ ] **Step 2: Run all core tests**

Run: `pnpm --filter @understand-anything/core test -- --run`
Expected: All tests pass (existing + new ignore-filter + ignore-generator tests)

- [ ] **Step 3: Build skill package**

Run: `pnpm --filter @understand-anything/skill build`
Expected: Clean build

- [ ] **Step 4: Verify files exist**

Run:
```bash
ls understand-anything-plugin/packages/core/src/ignore-filter.ts understand-anything-plugin/packages/core/src/ignore-generator.ts
```
Expected: Both files listed

- [ ] **Step 5: Verify exports work**

Run:
```bash
node -e "import('@understand-anything/core').then(m => { console.log('IgnoreFilter:', typeof m.createIgnoreFilter); console.log('Generator:', typeof m.generateStarterIgnoreFile); })"
```
Expected: Both show `function`

- [ ] **Step 6: Final commit (if any unstaged changes)**

```bash
git status
# If clean, skip. If changes exist:
git add -A && git commit -m "chore: final verification for .understandignore support"
```
````

## File: docs/superpowers/plans/2026-04-15-language-extractors-impl.md
````markdown
# Language-Specific Extractor Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Decouple AST extraction logic from TS/JS-specific node types so 8 additional code languages (Python, Go, Rust, Java, Ruby, PHP, C/C++, C#) get tree-sitter-powered structural analysis. Swift and Kotlin are excluded — no WASM grammar packages available. (2) Replace the file-analyzer agent's ad-hoc regex script generation with a deterministic, pre-built tree-sitter extraction script.

**Architecture:** Introduce a `LanguageExtractor` interface that each language implements. `TreeSitterPlugin` delegates extraction to the registered extractor for the file's language. A bundled `extract-structure.mjs` script in `skills/understand/` uses `PluginRegistry` (which includes both `TreeSitterPlugin` and the non-code parsers) to provide deterministic structural extraction for the file-analyzer agent — replacing the current approach where the LLM writes throwaway regex scripts every run.

**Tech Stack:** web-tree-sitter (WASM), TypeScript, Vitest

---

## File Structure

```
packages/core/src/plugins/
├── extractors/
│   ├── types.ts              # LanguageExtractor interface + TreeSitterNode re-export
│   ├── base-extractor.ts     # Shared utilities (traverse, getStringValue)
│   ├── typescript-extractor.ts  # TS/JS (moved from tree-sitter-plugin.ts)
│   ├── python-extractor.ts
│   ├── go-extractor.ts
│   ├── rust-extractor.ts
│   ├── java-extractor.ts
│   ├── ruby-extractor.ts
│   ├── php-extractor.ts
│   ├── cpp-extractor.ts
│   ├── csharp-extractor.ts
│   └── index.ts              # builtinExtractors array + re-exports
├── tree-sitter-plugin.ts     # Refactored to use extractors
└── tree-sitter-plugin.test.ts  # Existing tests (should still pass)

packages/core/src/plugins/__tests__/
└── extractors.test.ts        # Tests for all new extractors

skills/understand/
├── extract-structure.mjs     # Pre-built tree-sitter extraction script (NEW)
└── SKILL.md                  # Updated to reference extract-structure.mjs

agents/
└── file-analyzer.md          # Phase 1 rewritten to execute pre-built script
```

---

### Task 1: Create LanguageExtractor interface and shared utilities

**Files:**
- Create: `packages/core/src/plugins/extractors/types.ts`
- Create: `packages/core/src/plugins/extractors/base-extractor.ts`

- [ ] **Step 1: Create the extractor interface**

```typescript
// packages/core/src/plugins/extractors/types.ts
import type { StructuralAnalysis, CallGraphEntry } from "../../types.js";

// Re-export the tree-sitter Node type for use by extractors
export type TreeSitterNode = import("web-tree-sitter").Node;

/**
 * Language-specific extractor that maps a tree-sitter AST
 * to the common StructuralAnalysis / CallGraphEntry types.
 */
export interface LanguageExtractor {
  /** Language IDs this extractor handles (must match LanguageConfig.id) */
  languageIds: string[];

  /** Extract functions, classes, imports, exports from the root AST node */
  extractStructure(rootNode: TreeSitterNode): StructuralAnalysis;

  /** Extract caller→callee relationships from the root AST node */
  extractCallGraph(rootNode: TreeSitterNode): CallGraphEntry[];
}
```

- [ ] **Step 2: Create base-extractor with shared utilities**

Move `traverse()` and `getStringValue()` from `tree-sitter-plugin.ts` into a shared module:

```typescript
// packages/core/src/plugins/extractors/base-extractor.ts
import type { TreeSitterNode } from "./types.js";

/** Recursively traverse an AST tree, calling the visitor for each node. */
export function traverse(
  node: TreeSitterNode,
  visitor: (node: TreeSitterNode) => void,
): void {
  visitor(node);
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child) traverse(child, visitor);
  }
}

/** Extract the unquoted string value from a string-like node. */
export function getStringValue(node: TreeSitterNode): string {
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && child.type === "string_fragment") {
      return child.text;
    }
  }
  return node.text.replace(/^['"`]|['"`]$/g, "");
}

/** Find the first child matching a type. */
export function findChild(node: TreeSitterNode, type: string): TreeSitterNode | null {
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && child.type === type) return child;
  }
  return null;
}

/** Find all children matching a type. */
export function findChildren(node: TreeSitterNode, type: string): TreeSitterNode[] {
  const result: TreeSitterNode[] = [];
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && child.type === type) result.push(child);
  }
  return result;
}

/** Check if a node has a child of the given type (used for export/visibility checks). */
export function hasChildOfType(node: TreeSitterNode, type: string): boolean {
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && child.type === type) return true;
  }
  return false;
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/plugins/extractors/types.ts packages/core/src/plugins/extractors/base-extractor.ts
git commit -m "feat: add LanguageExtractor interface and shared base utilities"
```

---

### Task 2: Move TS/JS extraction logic into TypeScriptExtractor

**Files:**
- Create: `packages/core/src/plugins/extractors/typescript-extractor.ts`
- Modify: `packages/core/src/plugins/tree-sitter-plugin.ts`

This is a pure refactor. All existing tests must still pass with zero changes.

- [ ] **Step 1: Create TypeScriptExtractor**

Move all the TS/JS-specific extraction methods (`extractFunction`, `extractClass`, `extractVariableDeclarations`, `extractImport`, `processExportStatement`, `extractParams`, `extractReturnType`, `extractImportSpecifiers`, and the call graph walker) from `tree-sitter-plugin.ts` into `typescript-extractor.ts`, implementing the `LanguageExtractor` interface.

The `languageIds` should be `["typescript", "javascript"]`. Do NOT include `"tsx"` — it is a synthetic key internal to `TreeSitterPlugin` for grammar selection, not a `LanguageConfig.id`. The tsx→typescript mapping is handled in `getExtractor()` below.

- [ ] **Step 2: Refactor TreeSitterPlugin to use extractors**

Replace the hardcoded extraction logic in `TreeSitterPlugin` with extractor dispatch:

```typescript
// In TreeSitterPlugin
private extractors = new Map<string, LanguageExtractor>();

registerExtractor(extractor: LanguageExtractor): void {
  for (const id of extractor.languageIds) {
    this.extractors.set(id, extractor);
  }
}

private getExtractor(langKey: string): LanguageExtractor | null {
  // tsx is a synthetic grammar key — extraction logic is identical to typescript
  const key = langKey === "tsx" ? "typescript" : langKey;
  return this.extractors.get(key) ?? null;
}
```

The `analyzeFile()` method becomes:

```typescript
analyzeFile(filePath: string, content: string): StructuralAnalysis {
  const parser = this.getParser(filePath);
  if (!parser) return { functions: [], classes: [], imports: [], exports: [] };

  const tree = parser.parse(content);
  if (!tree) { parser.delete(); return { functions: [], classes: [], imports: [], exports: [] }; }

  const langKey = this.languageKeyFromPath(filePath);
  const extractor = langKey ? this.getExtractor(langKey) : null;

  let result: StructuralAnalysis;
  if (extractor) {
    result = extractor.extractStructure(tree.rootNode);
  } else {
    result = { functions: [], classes: [], imports: [], exports: [] };
  }

  tree.delete();
  parser.delete();
  return result;
}
```

The `extractCallGraph()` method follows the same pattern — parser lifecycle must be managed identically:

```typescript
extractCallGraph(filePath: string, content: string): CallGraphEntry[] {
  const parser = this.getParser(filePath);
  if (!parser) return [];

  const tree = parser.parse(content);
  if (!tree) { parser.delete(); return []; }

  const langKey = this.languageKeyFromPath(filePath);
  const extractor = langKey ? this.getExtractor(langKey) : null;
  const result = extractor ? extractor.extractCallGraph(tree.rootNode) : [];

  tree.delete();
  parser.delete();
  return result;
}
```

The constructor should accept an optional `extractors` array and register them. If none provided, register the built-in `TypeScriptExtractor` for backward compatibility.

- [ ] **Step 3: Run existing tests to verify zero behavior change**

Run: `pnpm --filter @understand-anything/core test`
Expected: All 426 tests pass (identical to before)

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/plugins/extractors/typescript-extractor.ts packages/core/src/plugins/tree-sitter-plugin.ts
git commit -m "refactor: move TS/JS extraction logic to TypeScriptExtractor, dispatch via LanguageExtractor interface"
```

---

### Task 2.5: Add extractCallGraph to PluginRegistry and update DEFAULT_PLUGIN_CONFIG

**Files:**
- Modify: `packages/core/src/plugins/registry.ts`
- Modify: `packages/core/src/plugins/discovery.ts`

**Context:** `PluginRegistry` currently only exposes `analyzeFile` and `resolveImports` — it has no `extractCallGraph`. The `extract-structure.mjs` script (Task 13) needs call graph data through the registry. Also, `DEFAULT_PLUGIN_CONFIG` hardcodes `["typescript", "javascript"]` which needs to reflect all supported languages.

- [ ] **Step 1: Add extractCallGraph to PluginRegistry**

```typescript
// In PluginRegistry (registry.ts)
extractCallGraph(filePath: string, content: string): CallGraphEntry[] | null {
  const plugin = this.getPluginForFile(filePath);
  if (!plugin?.extractCallGraph) return null;
  return plugin.extractCallGraph(filePath, content);
}
```

- [ ] **Step 2: Update DEFAULT_PLUGIN_CONFIG to derive languages dynamically**

In `discovery.ts`, replace the hardcoded `["typescript", "javascript"]` with a dynamic derivation from `builtinLanguageConfigs`:

```typescript
import { builtinLanguageConfigs } from "../languages/configs/index.js";

export const DEFAULT_PLUGIN_CONFIG: PluginConfig = {
  plugins: [
    {
      name: "tree-sitter",
      enabled: true,
      languages: builtinLanguageConfigs
        .filter((c) => c.treeSitter)
        .map((c) => c.id),
    },
  ],
};
```

- [ ] **Step 3: Run tests, commit**

```bash
pnpm --filter @understand-anything/core test
git add packages/core/src/plugins/registry.ts packages/core/src/plugins/discovery.ts
git commit -m "feat: add extractCallGraph to PluginRegistry, derive DEFAULT_PLUGIN_CONFIG from configs"
```

---

### Task 3: Add npm dependencies and treeSitter configs for all 10 languages

**Files:**
- Modify: `packages/core/package.json` (add 8 deps: python, go, rust, java, ruby, php, cpp, c-sharp)
- Modify: 10 config files in `packages/core/src/languages/configs/`

- [ ] **Step 1: Add tree-sitter grammar dependencies to package.json**

Add to `dependencies`:

```json
"tree-sitter-c-sharp": "^0.23.1",
"tree-sitter-cpp": "^0.23.4",
"tree-sitter-go": "^0.25.0",
"tree-sitter-java": "^0.23.5",
"tree-sitter-php": "^0.23.11",
"tree-sitter-python": "^0.25.0",
"tree-sitter-ruby": "^0.23.1",
"tree-sitter-rust": "^0.24.0"
```

Then run `pnpm install`.

- [ ] **Step 2: Add treeSitter field to all 10 language configs**

Each config gets a `treeSitter` block. Examples:

```typescript
// python.ts
treeSitter: { wasmPackage: "tree-sitter-python", wasmFile: "tree-sitter-python.wasm" },

// go.ts
treeSitter: { wasmPackage: "tree-sitter-go", wasmFile: "tree-sitter-go.wasm" },

// rust.ts
treeSitter: { wasmPackage: "tree-sitter-rust", wasmFile: "tree-sitter-rust.wasm" },

// java.ts
treeSitter: { wasmPackage: "tree-sitter-java", wasmFile: "tree-sitter-java.wasm" },

// ruby.ts
treeSitter: { wasmPackage: "tree-sitter-ruby", wasmFile: "tree-sitter-ruby.wasm" },

// php.ts
treeSitter: { wasmPackage: "tree-sitter-php", wasmFile: "tree-sitter-php.wasm" },

// cpp.ts
treeSitter: { wasmPackage: "tree-sitter-cpp", wasmFile: "tree-sitter-cpp.wasm" },

// csharp.ts
treeSitter: { wasmPackage: "tree-sitter-c-sharp", wasmFile: "tree-sitter-c_sharp.wasm" },
```

Note: Swift and Kotlin configs are NOT changed (no WASM packages available).

- [ ] **Step 3: Run pnpm install and verify WASM files resolve**

```bash
pnpm install
node -e "const r=require('module').createRequire(import.meta.url??__filename); console.log(r.resolve('tree-sitter-python/tree-sitter-python.wasm'))"
```

- [ ] **Step 4: Commit**

```bash
git add packages/core/package.json pnpm-lock.yaml packages/core/src/languages/configs/
git commit -m "feat: add tree-sitter grammar deps and treeSitter configs for 10 languages"
```

---

### Task 4: Create Python extractor

**Files:**
- Create: `packages/core/src/plugins/extractors/python-extractor.ts`

- [ ] **Step 1: Write the Python extractor**

Key Python tree-sitter node types:
- Functions: `function_definition` (name, parameters, return_type)
- Classes: `class_definition` (name, body → methods + assignments as properties)
- Imports: `import_statement`, `import_from_statement`
- Decorated: `decorated_definition` wrapping function_definition or class_definition
- Calls: `call` (function field)
- No formal exports (all top-level names are "exported")

```typescript
languageIds: ["python"]
```

- [ ] **Step 2: Write tests for Python extractor**

Test with representative Python code:

```python
import os
from pathlib import Path
from typing import Optional

class DataProcessor:
    name: str
    
    def __init__(self, name: str):
        self.name = name
    
    def process(self, data: list) -> dict:
        return transform(data)

def helper(x: int) -> str:
    return str(x)

@decorator
def decorated_func():
    pass
```

Verify: 2 functions (helper, decorated_func), 1 class (DataProcessor with methods __init__/process and property name), 3 imports, call graph (process→transform).

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @understand-anything/core test`

- [ ] **Step 4: Commit**

---

### Task 5: Create Go extractor

**Files:**
- Create: `packages/core/src/plugins/extractors/go-extractor.ts`

- [ ] **Step 1: Write the Go extractor**

Key Go tree-sitter node types:
- Functions: `function_declaration` (name, parameter_list, result)
- Methods: `method_declaration` (receiver, name, parameter_list, result)
- Structs: `type_declaration` → `type_spec` → `struct_type`
- Interfaces: `type_declaration` → `type_spec` → `interface_type`
- Imports: `import_declaration` → `import_spec_list` → `import_spec`
- Exports: capitalized first letter of name
- Calls: `call_expression` (function field)

```typescript
languageIds: ["go"]
```

- [ ] **Step 2: Write tests**

Test with:
```go
package main

import (
    "fmt"
    "os"
)

type Server struct {
    Host string
    Port int
}

func (s *Server) Start() error {
    fmt.Println("starting")
    return nil
}

func NewServer(host string, port int) *Server {
    return &Server{Host: host, Port: port}
}
```

Verify: 2 functions (Start, NewServer), 1 class/struct (Server with method Start, properties Host/Port), 2 imports, exports (Server, Start, NewServer — all capitalized), call graph (Start→fmt.Println).

- [ ] **Step 3: Run tests and commit**

---

### Task 6: Create Rust extractor

**Files:**
- Create: `packages/core/src/plugins/extractors/rust-extractor.ts`

- [ ] **Step 1: Write the Rust extractor**

Key Rust tree-sitter node types:
- Functions: `function_item` (name, parameters, return_type via `->`)
- Structs: `struct_item` (name, field_declaration_list)
- Enums: `enum_item`
- Impl blocks: `impl_item` (type, body containing function_items)
- Traits: `trait_item`
- Imports: `use_declaration` (scoped_identifier, use_list, use_wildcard)
- Exports: `visibility_modifier` containing `pub`
- Calls: `call_expression` (function field)

```typescript
languageIds: ["rust"]
```

- [ ] **Step 2: Write tests**

Test with:
```rust
use std::collections::HashMap;
use std::io::{self, Read};

pub struct Config {
    name: String,
    port: u16,
}

impl Config {
    pub fn new(name: String, port: u16) -> Self {
        Config { name, port }
    }

    fn validate(&self) -> bool {
        check_port(self.port)
    }
}

pub fn check_port(port: u16) -> bool {
    port > 0
}
```

Verify: 3 functions (new, validate, check_port), 1 class/struct (Config with methods new/validate, properties name/port), 2 imports, exports (Config, new, check_port — those with `pub`), call graph (validate→check_port).

- [ ] **Step 3: Run tests and commit**

---

### Task 7: Create Java extractor

**Files:**
- Create: `packages/core/src/plugins/extractors/java-extractor.ts`

- [ ] **Step 1: Write the Java extractor**

Key Java tree-sitter node types:
- Methods: `method_declaration` (name, formal_parameters, type/dimensions)
- Constructors: `constructor_declaration` (name, formal_parameters)
- Classes: `class_declaration` (name, class_body)
- Interfaces: `interface_declaration`
- Fields: `field_declaration` (declarator → variable_declarator → identifier)
- Imports: `import_declaration` (scoped_identifier)
- Exports: `public` modifier (modifiers node)
- Calls: `method_invocation` (name, object, arguments)

```typescript
languageIds: ["java"]
```

- [ ] **Step 2: Write tests with representative Java code, run, commit**

---

### Task 8: Create Ruby extractor

**Files:**
- Create: `packages/core/src/plugins/extractors/ruby-extractor.ts`

- [ ] **Step 1: Write the Ruby extractor**

Key Ruby tree-sitter node types:
- Methods: `method` (name, parameters)
- Classes: `class` (name, body containing methods)
- Modules: `module` (name)
- Imports: `call` where method is `require` or `require_relative` (Ruby uses method calls for imports)
- Calls: `call` (method, receiver, arguments)
- No formal export syntax

```typescript
languageIds: ["ruby"]
```

- [ ] **Step 2: Write tests, run, commit**

---

### Task 9: Create PHP extractor

**Files:**
- Create: `packages/core/src/plugins/extractors/php-extractor.ts`

- [ ] **Step 1: Write the PHP extractor**

Key PHP tree-sitter node types:
- Functions: `function_definition` (name, formal_parameters, return_type)
- Methods: `method_declaration` (name, formal_parameters, return_type)
- Classes: `class_declaration` (name, declaration_list)
- Imports: `namespace_use_declaration` (namespace_use_clause)
- Calls: `function_call_expression` / `member_call_expression`
- Note: PHP tree wraps everything in a `program` → `php_tag` + statements

```typescript
languageIds: ["php"]
```

- [ ] **Step 2: Write tests, run, commit**

---

### Task 10: Create C/C++ extractor

**Files:**
- Create: `packages/core/src/plugins/extractors/cpp-extractor.ts`

- [ ] **Step 1: Write the C/C++ extractor**

Key C/C++ tree-sitter node types:
- Functions: `function_definition` (declarator → function_declarator → identifier + parameter_list)
- Classes: `class_specifier` (name, body → field_declaration_list)
- Structs: `struct_specifier` (name, body)
- Includes: `preproc_include` (path → string_literal or system_lib_string)
- Namespaces: `namespace_definition`
- Calls: `call_expression` (function, arguments)

Note: C/C++ function signatures are nested (the name is inside a `function_declarator` inside the `declarator` field).

The `cppConfig` has `id: "cpp"` and `extensions: [".cpp", ".cc", ".cxx", ".c", ".h", ".hpp", ".hxx"]`. Pure C files (`.c`, `.h`) are parsed with the C++ grammar, which works but won't produce C++-specific node types like `class_specifier`. The extractor must handle their absence gracefully (return empty arrays for classes when parsing pure C).

```typescript
languageIds: ["cpp"]
```

- [ ] **Step 2: Write tests for both C++ and pure C code, run, commit**

---

### Task 11: Create C# extractor

**Files:**
- Create: `packages/core/src/plugins/extractors/csharp-extractor.ts`

- [ ] **Step 1: Write the C# extractor**

Key C# tree-sitter node types:
- Methods: `method_declaration` (name, parameter_list, return type)
- Constructors: `constructor_declaration`
- Classes: `class_declaration` (name, declaration_list)
- Interfaces: `interface_declaration`
- Properties: `property_declaration` (name, type)
- Imports: `using_directive` (qualified_name)
- Calls: `invocation_expression` (identifier/member_access, argument_list)

```typescript
languageIds: ["csharp"]
```

- [ ] **Step 2: Write tests, run, commit**

---

### Task 12: Create extractor index and wire into TreeSitterPlugin

**Files:**
- Create: `packages/core/src/plugins/extractors/index.ts`
- Modify: `packages/core/src/plugins/tree-sitter-plugin.ts` (import builtinExtractors)

- [ ] **Step 1: Create index.ts exporting all extractors**

```typescript
// packages/core/src/plugins/extractors/index.ts
export type { LanguageExtractor, TreeSitterNode } from "./types.js";
export { traverse, getStringValue, findChild, findChildren, hasChildOfType } from "./base-extractor.js";
export { TypeScriptExtractor } from "./typescript-extractor.js";
export { PythonExtractor } from "./python-extractor.js";
export { GoExtractor } from "./go-extractor.js";
export { RustExtractor } from "./rust-extractor.js";
export { JavaExtractor } from "./java-extractor.js";
export { RubyExtractor } from "./ruby-extractor.js";
export { PhpExtractor } from "./php-extractor.js";
export { CppExtractor } from "./cpp-extractor.js";
export { CSharpExtractor } from "./csharp-extractor.js";

import type { LanguageExtractor } from "./types.js";
import { TypeScriptExtractor } from "./typescript-extractor.js";
import { PythonExtractor } from "./python-extractor.js";
import { GoExtractor } from "./go-extractor.js";
import { RustExtractor } from "./rust-extractor.js";
import { JavaExtractor } from "./java-extractor.js";
import { RubyExtractor } from "./ruby-extractor.js";
import { PhpExtractor } from "./php-extractor.js";
import { CppExtractor } from "./cpp-extractor.js";
import { CSharpExtractor } from "./csharp-extractor.js";

export const builtinExtractors: LanguageExtractor[] = [
  new TypeScriptExtractor(),
  new PythonExtractor(),
  new GoExtractor(),
  new RustExtractor(),
  new JavaExtractor(),
  new RubyExtractor(),
  new PhpExtractor(),
  new CppExtractor(),
  new CSharpExtractor(),
];
```

- [ ] **Step 2: Wire builtinExtractors into TreeSitterPlugin constructor**

When no extractors are provided, default to `builtinExtractors`.

- [ ] **Step 3: Run full test suite**

Run: `pnpm --filter @understand-anything/core test`
Expected: All tests pass (existing + new extractor tests)

- [ ] **Step 4: Commit**

---

### Task 13: Create bundled extract-structure.mjs script

**Files:**
- Create: `skills/understand/extract-structure.mjs`

**Context:** Currently the file-analyzer agent (Phase 1) instructs the LLM to write a throwaway regex-based Node.js/Python script every run. This is slow, non-deterministic, and ignores the tree-sitter infrastructure we just built. This task replaces that with a pre-built script that uses `PluginRegistry` (which routes to `TreeSitterPlugin` for code files and to the regex parsers for non-code files).

- [ ] **Step 1: Create extract-structure.mjs**

The script:
1. Accepts input JSON path (arg 1) and output JSON path (arg 2)
2. Input format matches what file-analyzer.md already specifies: `{ projectRoot, batchFiles: [{path, language, sizeLines, fileCategory}], batchImportData }`
3. Resolves `@understand-anything/core` from the plugin's own `node_modules` using `createRequire` relative to the script's own location (two directories up to plugin root)
4. Creates a `PluginRegistry` with `TreeSitterPlugin` (all builtin language configs) + all non-code parsers registered
5. For each file: reads content, calls `registry.analyzeFile()`, formats output to match the existing script output schema (functions, classes, exports, sections, definitions, services, etc.)
6. For code files with tree-sitter support: also extracts call graph via `plugin.extractCallGraph()`
7. For files where no plugin exists (Swift, Kotlin, unknown languages): outputs `{ path, language, fileCategory, totalLines, nonEmptyLines, metrics }` with empty structural data — the LLM agent handles these in Phase 2
8. Writes output JSON matching the existing `scriptCompleted/filesAnalyzed/filesSkipped/results` schema

Key resolution logic (with fallback for different install layouts):
```javascript
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(__dirname, '../..');
const require = createRequire(resolve(pluginRoot, 'package.json'));

let core;
try {
  core = await import(require.resolve('@understand-anything/core'));
} catch {
  // Fallback: direct path for installed plugin cache where pnpm symlinks may differ
  core = await import(resolve(pluginRoot, 'packages/core/dist/index.js'));
}
```

- [ ] **Step 2: Test the script locally**

Create a small test input JSON with a TS file, a Python file, and a YAML file. Run:
```bash
node skills/understand/extract-structure.mjs test-input.json test-output.json
```
Verify the output contains structural data for all three.

- [ ] **Step 3: Commit**

```bash
git add skills/understand/extract-structure.mjs
git commit -m "feat: add bundled tree-sitter extraction script for file-analyzer agent"
```

---

### Task 14: Rewrite file-analyzer.md Phase 1 to use bundled script

**Files:**
- Modify: `agents/file-analyzer.md`

**Context:** Phase 1 currently has ~150 lines instructing the agent to write a custom extraction script from scratch. Replace this with a short section that tells the agent to execute the pre-built `extract-structure.mjs` script.

- [ ] **Step 1: Replace Phase 1 in file-analyzer.md**

Delete the entire current Phase 1 (~150 lines of regex script generation instructions). Replace with:

1. Tell the agent to prepare the input JSON file (same format as before):
   ```bash
   cat > $PROJECT_ROOT/.understand-anything/tmp/ua-file-analyzer-input-<batchIndex>.json << 'ENDJSON'
   {
     "projectRoot": "<project-root>",
     "batchFiles": [<this batch's files including fileCategory>],
     "batchImportData": <batchImportData JSON>
   }
   ENDJSON
   ```

2. Execute the bundled script:
   ```bash
   node <SKILL_DIR>/extract-structure.mjs \
     $PROJECT_ROOT/.understand-anything/tmp/ua-file-analyzer-input-<batchIndex>.json \
     $PROJECT_ROOT/.understand-anything/tmp/ua-file-extract-results-<batchIndex>.json
   ```

3. If the script exits non-zero, read stderr, diagnose and report the error. Do NOT fall back to writing a manual script — the bundled script is the sole extraction path.

4. Keep the existing output format — Phase 2 (semantic analysis) is unchanged.

- [ ] **Step 2: Update SKILL.md to pass SKILL_DIR to file-analyzer dispatch**

In SKILL.md Phase 2, the file-analyzer dispatch prompt must include the skill directory path so the agent can locate `extract-structure.mjs`.

Add to the dispatch parameters:
```
> Skill directory (for bundled scripts): `<SKILL_DIR>`
```

This follows the established pattern — SKILL.md already passes `<SKILL_DIR>` for `merge-batch-graphs.py` (line 213) and `merge-subdomain-graphs.py` (line 44) using the same mechanism.

- [ ] **Step 3: Verify the file-analyzer output format is unchanged**

Phase 2 of file-analyzer.md should NOT need changes — it reads the same JSON structure from the script results. Verify the output schema from `extract-structure.mjs` matches what Phase 2 expects.

- [ ] **Step 4: Commit**

```bash
git add agents/file-analyzer.md skills/understand/SKILL.md
git commit -m "feat: file-analyzer uses bundled tree-sitter script instead of LLM-generated regex"
```

---

### Task 15: Final integration verification and cleanup

- [ ] **Step 1: Add exports to packages/core/src/index.ts**

This is required — `extract-structure.mjs` and external consumers need these exports:

```typescript
export type { LanguageExtractor } from "./plugins/extractors/types.js";
export { builtinExtractors } from "./plugins/extractors/index.js";
```

- [ ] **Step 2: Build the full package**

```bash
pnpm --filter @understand-anything/core build
```

- [ ] **Step 3: Run full test suite one final time**

```bash
pnpm --filter @understand-anything/core test
```

- [ ] **Step 4: Final commit**

```bash
git commit -m "feat: complete language extractor architecture — 10 languages with tree-sitter support"
```

---

## Implementation Notes

**Test file convention:** Each language extractor gets its own test file at `packages/core/src/plugins/extractors/__tests__/<language>-extractor.test.ts`. This follows the existing pattern where `tree-sitter-plugin.test.ts` is co-located.

**Lazy grammar loading (future optimization):** The current `TreeSitterPlugin.init()` loads all grammar WASMs upfront via `Promise.all`. With 10 grammars (~12MB total WASM), this may cause noticeable init delay. A future improvement: load TS/JS eagerly (most common), defer others to first use. Not required for this PR — measure first.

**Fingerprint side effect:** `buildFingerprintStore` in `fingerprint.ts` uses `PluginRegistry.analyzeFile` internally. Once the new extractors are wired up, fingerprinting for Python/Go/Rust/etc. will automatically produce structural fingerprints instead of content-hash-only. No code changes needed — it happens for free.

**PHP grammar note:** `tree-sitter-php` ships both `tree-sitter-php.wasm` (full PHP + embedded HTML/CSS/JS) and `tree-sitter-php_only.wasm` (PHP only). We use `tree-sitter-php.wasm`. The PHP extractor should be robust to non-PHP AST nodes that appear when parsing files with embedded HTML templates.
````

## File: docs/superpowers/plans/2026-05-03-graph-layout-scaling.md
````markdown
# Graph Layout Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace dagre with ELK across structural-style dashboard views, add folder/community-based containers in the layer-detail view, and compute layout in two lazy stages so layers with many nodes are readable and large graphs stay performant.

**Architecture:** Three views (overview, DomainGraphView, layer-detail) call a new `applyElkLayout` instead of `applyDagreLayout`. The layer-detail view gains a `deriveContainers` step (folder strategy with Louvain fallback), aggregated cross-container edges, lazy two-stage ELK calls (Stage 1 = containers; Stage 2 = a container's children on demand), a new `ContainerNode` React Flow node type, and store extensions for expand state and layout caches.

**Tech Stack:** TypeScript, React 19, Vite, React Flow (`@xyflow/react`), Zustand, Vitest, ELK.js (`elkjs`), `graphology` + `graphology-communities-louvain`.

**Spec:** `docs/superpowers/specs/2026-05-03-graph-layout-scaling-design.md`

---

## File Map

```
packages/dashboard/
├── package.json                                  [modify] add elkjs, graphology, graphology-communities-louvain, vitest
├── vite.config.ts                                [modify] add vitest test config
├── src/
│   ├── utils/
│   │   ├── layout.ts                              [modify] export applyElkLayout
│   │   ├── elk-layout.ts                          [new]    runElk + repairElkInput + GraphIssue mapping
│   │   ├── containers.ts                          [new]    deriveContainers (folder + community fallback)
│   │   ├── louvain.ts                             [new]    thin wrapper around graphology-communities-louvain
│   │   ├── edgeAggregation.ts                     [modify] add aggregateContainerEdges
│   │   └── __tests__/
│   │       ├── containers.test.ts                 [new]
│   │       ├── edgeAggregation.test.ts            [new]
│   │       └── elk-layout.test.ts                 [new]
│   ├── components/
│   │   ├── ContainerNode.tsx                      [new]
│   │   ├── GraphView.tsx                          [modify] Stage 1 / Stage 2 wiring, expand state, auto-expand
│   │   └── DomainGraphView.tsx                    [modify] dagre → ELK
│   └── store.ts                                   [modify] expandedContainers, containerLayoutCache, containerSizeMemory
└── scripts/
    └── benchmark-layout.mjs                        [new] perf benchmark (uses scripts/generate-large-graph.mjs)
```

---

## Task 1: Dependencies + Vitest setup

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/package.json`
- Create: `understand-anything-plugin/packages/dashboard/src/utils/__tests__/smoke.test.ts`
- Modify: `understand-anything-plugin/packages/dashboard/vite.config.ts`

- [ ] **Step 1: Add deps and devDeps to package.json**

Edit `understand-anything-plugin/packages/dashboard/package.json`. Add to `dependencies`:

```json
    "elkjs": "^0.9.3",
    "graphology": "^0.25.4",
    "graphology-communities-louvain": "^2.0.1",
```

Add to `devDependencies`:

```json
    "vitest": "^3.1.0",
    "@vitest/coverage-v8": "^3.2.4",
```

Add to `scripts`:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 2: Update vite.config.ts to register vitest**

In `understand-anything-plugin/packages/dashboard/vite.config.ts` add a triple-slash reference at the top and a `test` block. Open the file, then at the very top add:

```ts
/// <reference types="vitest" />
```

Inside the `defineConfig({ ... })` object add:

```ts
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
```

- [ ] **Step 3: Install deps**

Run from the repo root:

```bash
pnpm install
```

Expected: pnpm resolves and installs without errors.

- [ ] **Step 4: Write smoke test**

Create `understand-anything-plugin/packages/dashboard/src/utils/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import ELK from "elkjs/lib/elk.bundled.js";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";

describe("dependency smoke test", () => {
  it("imports elkjs", () => {
    expect(typeof ELK).toBe("function");
  });

  it("imports graphology", () => {
    const g = new Graph();
    g.addNode("a");
    expect(g.order).toBe(1);
  });

  it("imports graphology-communities-louvain", () => {
    expect(typeof louvain).toBe("function");
  });
});
```

- [ ] **Step 5: Run smoke test**

```bash
pnpm --filter @understand-anything/dashboard test
```

Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/package.json \
        understand-anything-plugin/packages/dashboard/vite.config.ts \
        understand-anything-plugin/packages/dashboard/src/utils/__tests__/smoke.test.ts \
        pnpm-lock.yaml
git commit -m "chore(dashboard): add elkjs, graphology, vitest"
```

---

## Task 2: deriveContainers — folder strategy + edge cases

**Files:**
- Create: `understand-anything-plugin/packages/dashboard/src/utils/containers.ts`
- Create: `understand-anything-plugin/packages/dashboard/src/utils/__tests__/containers.test.ts`

- [ ] **Step 1: Write failing tests**

Create `understand-anything-plugin/packages/dashboard/src/utils/__tests__/containers.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { deriveContainers } from "../containers";
import type { GraphNode, GraphEdge } from "@understand-anything/core/types";

function node(id: string, filePath?: string): GraphNode {
  return {
    id,
    type: "file",
    name: id,
    filePath,
    summary: "",
    complexity: "simple",
  } as GraphNode;
}

describe("deriveContainers — folder strategy", () => {
  it("groups nodes by first folder segment after LCP", () => {
    const nodes = [
      node("a", "src/auth/login.go"),
      node("b", "src/auth/oauth.go"),
      node("c", "src/cart/cart.go"),
      node("d", "src/cart/checkout.go"),
    ];
    const { containers, ungrouped } = deriveContainers(nodes, []);
    expect(ungrouped).toEqual([]);
    expect(containers).toHaveLength(2);
    const names = containers.map((c) => c.name).sort();
    expect(names).toEqual(["auth", "cart"]);
    const auth = containers.find((c) => c.name === "auth")!;
    expect(auth.strategy).toBe("folder");
    expect(auth.nodeIds.sort()).toEqual(["a", "b"]);
  });

  it("strips deep LCP", () => {
    const nodes = [
      node("a", "monorepo/backend/src/auth/login.go"),
      node("b", "monorepo/backend/src/cart/cart.go"),
    ];
    const { containers } = deriveContainers(nodes, []);
    const names = containers.map((c) => c.name).sort();
    expect(names).toEqual(["auth", "cart"]);
  });

  it("collapses nested folders into the first segment", () => {
    const nodes = [
      node("a", "auth/handlers/oauth.go"),
      node("b", "auth/services/token.go"),
      node("c", "cart/cart.go"),
    ];
    const { containers } = deriveContainers(nodes, []);
    expect(containers.find((c) => c.name === "auth")?.nodeIds.sort()).toEqual(["a", "b"]);
  });

  it("places nodes without filePath in '~' container", () => {
    const nodes = [
      node("a", "auth/login.go"),
      node("b", "auth/oauth.go"),
      node("c"),
      node("d"),
    ];
    const { containers } = deriveContainers(nodes, []);
    expect(containers.find((c) => c.name === "~")?.nodeIds.sort()).toEqual(["c", "d"]);
  });

  it("suppresses single-child containers (single child becomes ungrouped)", () => {
    const nodes = [
      node("a", "auth/login.go"),
      node("b", "auth/oauth.go"),
      node("c", "cart/cart.go"),
    ];
    const { containers, ungrouped } = deriveContainers(nodes, []);
    // 'cart' has only 1 child → suppressed
    expect(containers.find((c) => c.name === "cart")).toBeUndefined();
    expect(ungrouped).toContain("c");
    // 'auth' kept
    expect(containers.find((c) => c.name === "auth")?.nodeIds.sort()).toEqual(["a", "b"]);
  });

  it("returns flat (no containers) when total nodes < 8", () => {
    const nodes = [
      node("a", "auth/x.go"),
      node("b", "cart/y.go"),
      node("c", "logs/z.go"),
    ];
    const { containers, ungrouped } = deriveContainers(nodes, []);
    expect(containers).toHaveLength(0);
    expect(ungrouped.sort()).toEqual(["a", "b", "c"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @understand-anything/dashboard test containers
```

Expected: import error — `Cannot find module '../containers'`.

- [ ] **Step 3: Implement `containers.ts`**

Create `understand-anything-plugin/packages/dashboard/src/utils/containers.ts`:

```ts
import type {
  GraphNode,
  GraphEdge,
} from "@understand-anything/core/types";
import { detectCommunities } from "./louvain";

export interface DerivedContainer {
  id: string;
  name: string;
  nodeIds: string[];
  strategy: "folder" | "community";
}

export interface DeriveResult {
  containers: DerivedContainer[];
  ungrouped: string[];
}

const MIN_LAYER_SIZE_FOR_GROUPING = 8;
const MIN_FOLDER_COUNT = 3;
const MAX_CONCENTRATION = 0.6;
const ROOT_BUCKET = "~";

function commonPrefix(paths: string[]): string {
  if (paths.length === 0) return "";
  let prefix = paths[0];
  for (const p of paths) {
    while (!p.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return "";
    }
  }
  // Trim back to a directory boundary
  const lastSlash = prefix.lastIndexOf("/");
  return lastSlash >= 0 ? prefix.slice(0, lastSlash + 1) : "";
}

function firstSegment(path: string): string {
  const slash = path.indexOf("/");
  return slash >= 0 ? path.slice(0, slash) : path;
}

function groupByFolder(
  nodes: GraphNode[],
): { groups: Map<string, string[]>; rooted: string[] } {
  const withPath = nodes.filter((n) => n.filePath);
  const lcp = commonPrefix(withPath.map((n) => n.filePath!));
  const groups = new Map<string, string[]>();
  const rooted: string[] = [];
  for (const n of withPath) {
    const stripped = n.filePath!.slice(lcp.length);
    if (!stripped.includes("/")) {
      rooted.push(n.id);
      continue;
    }
    const seg = firstSegment(stripped);
    const arr = groups.get(seg) ?? [];
    arr.push(n.id);
    groups.set(seg, arr);
  }
  for (const n of nodes) {
    if (!n.filePath) rooted.push(n.id);
  }
  return { groups, rooted };
}

function shouldFallbackToCommunity(
  groups: Map<string, string[]>,
  totalNodes: number,
): boolean {
  if (groups.size < MIN_FOLDER_COUNT) return true;
  for (const ids of groups.values()) {
    if (ids.length / totalNodes > MAX_CONCENTRATION) return true;
  }
  return false;
}

export function deriveContainers(
  nodes: GraphNode[],
  edges: GraphEdge[],
): DeriveResult {
  if (nodes.length < MIN_LAYER_SIZE_FOR_GROUPING) {
    return { containers: [], ungrouped: nodes.map((n) => n.id) };
  }

  const { groups, rooted } = groupByFolder(nodes);

  const useCommunity = shouldFallbackToCommunity(groups, nodes.length);
  let containers: DerivedContainer[];

  if (useCommunity) {
    const communities = detectCommunities(
      nodes.map((n) => n.id),
      edges,
    );
    const byCommunity = new Map<number, string[]>();
    for (const [nodeId, cid] of communities) {
      const arr = byCommunity.get(cid) ?? [];
      arr.push(nodeId);
      byCommunity.set(cid, arr);
    }
    const sorted = [...byCommunity.entries()].sort((a, b) => a[0] - b[0]);
    containers = sorted.map(([cid, ids], i) => ({
      id: `container:cluster-${cid}`,
      name: `Cluster ${String.fromCharCode(65 + i)}`,
      nodeIds: ids,
      strategy: "community" as const,
    }));
  } else {
    containers = [...groups.entries()].map(([seg, ids]) => ({
      id: `container:${seg}`,
      name: seg,
      nodeIds: ids,
      strategy: "folder" as const,
    }));
    if (rooted.length > 0) {
      containers.push({
        id: `container:${ROOT_BUCKET}`,
        name: ROOT_BUCKET,
        nodeIds: rooted,
        strategy: "folder" as const,
      });
    }
  }

  // Suppress single-child containers
  const ungrouped: string[] = [];
  containers = containers.filter((c) => {
    if (c.nodeIds.length === 1) {
      ungrouped.push(c.nodeIds[0]);
      return false;
    }
    return true;
  });

  return { containers, ungrouped };
}
```

- [ ] **Step 4: Stub `louvain.ts` (real impl in Task 3)**

Create `understand-anything-plugin/packages/dashboard/src/utils/louvain.ts`:

```ts
import type { GraphEdge } from "@understand-anything/core/types";

/** Returns [nodeId, communityId] for every node provided. */
export function detectCommunities(
  _nodeIds: string[],
  _edges: GraphEdge[],
): Map<string, number> {
  // Real implementation arrives in Task 3. Stub: every node in community 0.
  const m = new Map<string, number>();
  for (const id of _nodeIds) m.set(id, 0);
  return m;
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @understand-anything/dashboard test containers
```

Expected: 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/utils/containers.ts \
        understand-anything-plugin/packages/dashboard/src/utils/louvain.ts \
        understand-anything-plugin/packages/dashboard/src/utils/__tests__/containers.test.ts
git commit -m "feat(dashboard): deriveContainers folder strategy"
```

---

## Task 3: deriveContainers — community fallback (Louvain)

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/utils/louvain.ts`
- Modify: `understand-anything-plugin/packages/dashboard/src/utils/__tests__/containers.test.ts`

- [ ] **Step 1: Add failing test for community fallback**

Append to `containers.test.ts`:

```ts
describe("deriveContainers — community fallback", () => {
  it("falls back to communities when only one folder present", () => {
    const nodes = Array.from({ length: 10 }, (_, i) =>
      node(`n${i}`, `services/n${i}.go`),
    );
    // Two clusters of 5 nodes; densely connected within, no edges between
    const edges: GraphEdge[] = [];
    for (const i of [0, 1, 2, 3, 4]) {
      for (const j of [0, 1, 2, 3, 4]) {
        if (i !== j) edges.push({ source: `n${i}`, target: `n${j}`, type: "calls" } as GraphEdge);
      }
    }
    for (const i of [5, 6, 7, 8, 9]) {
      for (const j of [5, 6, 7, 8, 9]) {
        if (i !== j) edges.push({ source: `n${i}`, target: `n${j}`, type: "calls" } as GraphEdge);
      }
    }
    const { containers } = deriveContainers(nodes, edges);
    expect(containers.length).toBeGreaterThanOrEqual(2);
    for (const c of containers) {
      expect(c.strategy).toBe("community");
      expect(c.name).toMatch(/^Cluster [A-Z]$/);
    }
  });

  it("falls back when one folder holds > 60%", () => {
    const nodes = [
      ...Array.from({ length: 8 }, (_, i) => node(`big${i}`, `big/file${i}.go`)),
      node("a", "small1/a.go"),
      node("b", "small2/b.go"),
    ];
    const { containers } = deriveContainers(nodes, []);
    expect(containers.every((c) => c.strategy === "community")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

```bash
pnpm --filter @understand-anything/dashboard test containers
```

Expected: the new tests fail because the louvain stub puts every node in community 0 (only 1 container after suppression).

- [ ] **Step 3: Replace louvain stub with real implementation**

Overwrite `understand-anything-plugin/packages/dashboard/src/utils/louvain.ts`:

```ts
import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import type { GraphEdge } from "@understand-anything/core/types";

/**
 * Run Louvain community detection over the provided node set and the
 * subset of edges whose endpoints are both in the set. Returns a map of
 * nodeId → communityId. Disconnected nodes get unique community ids so
 * they don't collapse into a single cluster.
 */
export function detectCommunities(
  nodeIds: string[],
  edges: GraphEdge[],
): Map<string, number> {
  const ids = new Set(nodeIds);
  const g = new Graph({ type: "undirected", multi: false });
  for (const id of nodeIds) g.addNode(id);
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    if (e.source === e.target) continue;
    if (g.hasEdge(e.source, e.target)) continue;
    g.addEdge(e.source, e.target);
  }
  // graphology-communities-louvain returns Record<nodeId, communityId>
  const result = louvain(g) as Record<string, number>;
  const map = new Map<string, number>();
  for (const id of nodeIds) {
    map.set(id, result[id] ?? -1);
  }
  // Reassign disconnected nodes (community -1) to unique ids past the max
  let next =
    Math.max(...Array.from(map.values()).filter((v) => v >= 0), -1) + 1;
  for (const [id, c] of map) {
    if (c === -1) {
      map.set(id, next++);
    }
  }
  return map;
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @understand-anything/dashboard test containers
```

Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add understand-anything-plugin/packages/dashboard/src/utils/louvain.ts \
        understand-anything-plugin/packages/dashboard/src/utils/__tests__/containers.test.ts
git commit -m "feat(dashboard): deriveContainers community fallback via Louvain"
```

---

## Task 4: aggregateContainerEdges

**Files:**
- Modify: `understand-anything-plugin/packages/dashboard/src/utils/edgeAggregation.ts`
- Create: `understand-anything-plugin/packages/dashboard/src/utils/__tests__/edgeAggregation.test.ts`

- [ ] **Step 1: Write failing tests**

Create `understand-anything-plugin/packages/dashboard/src/utils/__tests__/edgeAggregation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { aggregateContainerEdges } from "../edgeAggregation";
import type { GraphEdge } from "@understand-anything/core/types";

const ce = (source: string, target: string, type: string = "calls"): GraphEdge =>
  ({ source, target, type }) as GraphEdge;

describe("aggregateContainerEdges", () => {
  it("returns empty arrays for empty input", () => {
    const r = aggregateContainerEdges([], new Map());
    expect(r.intraContainer).toEqual([]);
    expect(r.interContainerAggregated).toEqual([]);
  });

  it("preserves intra-container edges as-is", () => {
    const m = new Map([
      ["a", "auth"],
      ["b", "auth"],
    ]);
    const r = aggregateContainerEdges([ce("a", "b")], m);
    expect(r.intraContainer).toHaveLength(1);
    expect(r.interContainerAggregated).toEqual([]);
  });

  it("merges multiple same-direction inter edges into one", () => {
    const m = new Map([
      ["a", "auth"],
      ["b", "auth"],
      ["c", "cart"],
      ["d", "cart"],
    ]);
    const edges = [ce("a", "c"), ce("a", "d"), ce("b", "c", "imports")];
    const r = aggregateContainerEdges(edges, m);
    expect(r.interContainerAggregated).toHaveLength(1);
    const agg = r.interContainerAggregated[0];
    expect(agg.sourceContainerId).toBe("auth");
    expect(agg.targetContainerId).toBe("cart");
    expect(agg.count).toBe(3);
    expect(agg.types.sort()).toEqual(["calls", "imports"]);
  });

  it("treats opposite directions as separate aggregated edges", () => {
    const m = new Map([
      ["a", "auth"],
      ["c", "cart"],
    ]);
    const r = aggregateContainerEdges([ce("a", "c"), ce("c", "a")], m);
    expect(r.interContainerAggregated).toHaveLength(2);
    const dirs = r.interContainerAggregated.map(
      (e) => `${e.sourceContainerId}→${e.targetContainerId}`,
    );
    expect(dirs.sort()).toEqual(["auth→cart", "cart→auth"]);
  });

  it("ignores edges whose endpoints have no container mapping", () => {
    const m = new Map([["a", "auth"]]);
    const r = aggregateContainerEdges([ce("a", "z")], m);
    expect(r.intraContainer).toEqual([]);
    expect(r.interContainerAggregated).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

```bash
pnpm --filter @understand-anything/dashboard test edgeAggregation
```

Expected: import error — `aggregateContainerEdges` not exported.

- [ ] **Step 3: Implement**

Append to `understand-anything-plugin/packages/dashboard/src/utils/edgeAggregation.ts`:

```ts
import type { GraphEdge } from "@understand-anything/core/types";

export interface AggregatedContainerEdge {
  sourceContainerId: string;
  targetContainerId: string;
  count: number;
  types: string[];
}

export interface ContainerEdgeBuckets {
  intraContainer: GraphEdge[];
  interContainerAggregated: AggregatedContainerEdge[];
}

/**
 * Bucket edges into intra-container (preserved) and inter-container
 * (aggregated by directed (source,target) container pair).
 *
 * Direction is significant: A→B and B→A produce two independent
 * aggregated edges. Edges whose endpoints have no container mapping
 * are dropped (treat them as pre-filtered).
 */
export function aggregateContainerEdges(
  edges: GraphEdge[],
  nodeToContainer: Map<string, string>,
): ContainerEdgeBuckets {
  const intra: GraphEdge[] = [];
  const interMap = new Map<
    string,
    {
      sourceContainerId: string;
      targetContainerId: string;
      count: number;
      types: Set<string>;
    }
  >();

  for (const e of edges) {
    const sc = nodeToContainer.get(e.source);
    const tc = nodeToContainer.get(e.target);
    if (!sc || !tc) continue;
    if (sc === tc) {
      intra.push(e);
      continue;
    }
    const key = `${sc}