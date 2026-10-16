# Security policy

## Reporting a vulnerability
Please report security issues privately through GitHub: **Security tab, "Report a vulnerability"** on the affected repository.
Do not open a public issue for a vulnerability. You can expect an acknowledgement within a few days.

## Scope and safety notes
- Projects are provided "as is", without warranty (see `LICENSE`).
- They contain no install-time scripts (`preinstall`/`postinstall`/`prepare`) and do not run code on your machine when you clone them.
- Secrets are never committed. Configuration is read from environment variables; see `.env.example` where present.
- Only the latest version on the default branch is supported.
