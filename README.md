# tsds-version

Internal `ts-dev-stack` command that generates API documentation and publishes
the `docs` directory to GitHub Pages. It is normally run from a package's npm
`version` lifecycle.

Use the parent CLI from a project configured for ts-dev-stack:

```bash
npm install --save-dev ts-dev-stack
tsds version
```

Use `tsds version --dry-run` to check the command without generating or
publishing documentation.
This package is not a standalone end-user command; see the
[ts-dev-stack guide](https://www.npmjs.com/package/ts-dev-stack) for project
setup.
