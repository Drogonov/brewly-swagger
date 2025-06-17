# brewly-swagger

A Swagger-based repo to store, generate, and export mocks for Brewly's backend APIs.

This repository serves as a single source of truth for:
- 🧪 **DTO-based response/request mocks** generated from the OpenAPI (`swagger.json`)
- 🔁 **Route-based mocks** used with [Mockoon](https://mockoon.com/) for local development or testing
- 📦 Automated mock generation and cleanup via GitHub Actions

## 🔗 Swagger UI

You can view the Swagger spec rendered in Swagger UI here:  
👉 [brewly-swagger](https://drogonov.github.io/brewly-swagger/index.html)

> ⏳ _Give it a few seconds to load — performance improvements are on the roadmap!_

## 📁 Structure

```
/
├── swagger.json               # Main OpenAPI spec
├── mocks/
│   ├── dtos/                  # Sample DTO mock data
│   └── endpoints/             # Route+method-based response mocks
├── scripts/                   # JS scripts for generating and linking mocks
└── mockoon-export.json        # Final mockoon-compatible export
```

## ⚙️ Automation

This repo uses **GitHub Actions** to:
- Detect changes in `swagger.json`
- Regenerate mock files (`mocks/`) and `mockoon-export.json`
- Commit and push only when actual changes occur

## 🧾 Useful Links

- [📘 GitHub Pages setup guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [🛠 Mockoon CLI](https://mockoon.com/docs/latest/cli/overview/)
- [📚 Swagger/OpenAPI](https://swagger.io/specification/)

---

Feel free to suggest edits or open an issue if you spot something off! ✌️