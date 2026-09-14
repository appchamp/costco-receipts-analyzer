# Agent Guidelines & Workflow Rules

## Git & Deployment Protocol (Strict)
- **NEVER push directly to `main`**: Do not commit or push directly to the default `main` branch on GitHub.
- **Branching Workflow**:
  1. Always create a dedicated, descriptive feature/fix branch (e.g., `feature/...`, `fix/...`, `docs/...`).
  2. Commit changes to that branch.
  3. Push only the branch to GitHub (`git push -u origin <branch>`).
- **Pull Requests**:
  1. Open a Pull Request using `gh pr create` pointing into `main`.
  2. Include a clear summary of changes and verification in the PR description.
  3. Leave the PR open for the user to review, test, and merge.
  4. Do not auto-merge or close the PR unless explicitly instructed.

## Privacy & Security Rules
- **Zero Receipt / Personal Data in Public Repo**:
  - Never place or commit raw receipt JSON, CSV, or personal membership/transaction data into the public repository (`costco-receipts-analyzer-public`).
  - All receipt data belongs strictly in the private repository (`costco-receipts-private`).
- **Client-Side Only**:
  - The analyzer web app must remain 100% client-side. No backend servers, external database dependencies, or remote logging.
