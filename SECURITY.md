# Security Policy

## Supported versions

raqam is pre-1.0. Security fixes land on the latest published minor only —
upgrade before reporting against an older release.

| Version | Supported |
| ------- | --------- |
| 0.4.x   | ✅        |
| < 0.4   | ❌        |

## Reporting a vulnerability

Report privately through GitHub's
[**Report a vulnerability**](https://github.com/47vigen/raqam/security/advisories/new)
form. Please do not open a public issue for a suspected vulnerability.

Include the raqam version, the affected entry point (`raqam`, `raqam/core`,
`raqam/react`, `raqam/locales/*`), and a minimal reproduction.

You can expect an acknowledgement within 72 hours and, for a confirmed issue, a
patched release plus a published advisory.

## Scope

raqam ships **zero runtime dependencies** — nothing in this repository's
dependency tree reaches a consumer of the package. Advisories against dev
tooling (vite, storybook, playwright and friends) therefore do not affect
anyone who installs raqam, and are tracked in `pnpm-workspace.yaml` under
`auditConfig` rather than patched on an emergency basis.

In scope: anything in `src/` that ships in `dist/` — the parser, formatter,
cursor logic, locale plugins, and the React bindings. The library renders no
HTML from user input and performs no network or filesystem access.
