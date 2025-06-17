# brewly-swagger

[![Build Status](https://github.com/Drogonov/brewly-swagger/actions/workflows/generate-mocks.yml/badge.svg)](https://github.com/Drogonov/brewly-swagger/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A Swagger-based repo to store, generate, and export mocks for Brewly's backend APIs.

## 🔗 Project Ecosystem

- **📦 [brewly-backend](https://github.com/Drogonov/brewly-backend)** — RESTful API built with NestJS, Postgres, Swagger, and monitoring tools.
- **📱 [brewly-ios](https://github.com/Drogonov/brewly-ios)** — Swift mobile app for cupping workflow and user management.
- **🧪 brewly-swagger** — Auto-updated Swagger JSON repository for mocks/testing and Mockoon export.

## 🧾 Swagger UI

You can view the Swagger spec rendered in Swagger UI here:  
👉 [brewly-swagger](https://drogonov.github.io/brewly-swagger/index.html)

> ⏳ _Give it a few seconds to load — performance improvements are on the roadmap!_

## ⚙️ Features

- ✅ DTO-based mocks generated from the OpenAPI spec (`swagger.json`)
- 🔁 Route-based mocks for local development and testing with Mockoon
- 🤖 Automated mock generation and cleanup via GitHub Actions
- 📦 Swagger UI published on GitHub Pages

## 🚀 Prerequisites

- **Node.js** v16+
- **npm** (or **yarn**)
- (Optional) **Mockoon CLI** (`@mockoon/cli`)

## 🔨 Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/Drogonov/brewly-swagger.git
   cd brewly-swagger
   ```
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Generate mocks:
   ```bash
   npm run generate
   ```
4. View generated mocks:
   - DTO samples in `mocks/dtos/`
   - Endpoint mocks in `mocks/endpoints/`
5. Open the Swagger UI:
   https://drogonov.github.io/brewly-swagger/index.html

## 📁 Directory Structure

```
/
├── swagger.json               # Main OpenAPI spec
├── mocks/
│   ├── dtos/                  # Sample DTO mock data
│   └── endpoints/             # Route+method-based response mocks
├── scripts/                   # JS scripts for generating and linking mocks
└── mockoon-export.json        # Final Mockoon-compatible export
```

## ⚙️ Automation

This repository uses **GitHub Actions** (`.github/workflows/generate-mocks.yml`) to:

- Detect changes in `swagger.json` or scripts
- Regenerate mocks (`mocks/`) and `mockoon-export.json`
- Commit and push updates only when actual changes occur

## 🧾 Useful Links

- [Swagger UI on GitHub Pages](https://drogonov.github.io/brewly-swagger/index.html)
- [Mockoon CLI documentation](https://mockoon.com/docs/latest/cli/overview/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [GitHub Pages setup guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 📝 Contributing

Contributions, issues, and feature requests are welcome! Please open an issue or submit a pull request.

Feel free to suggest edits or open an issue if you spot something off! ✌️

## 📄 License

Released under the [MIT License](LICENSE).