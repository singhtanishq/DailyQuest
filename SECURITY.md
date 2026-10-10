# Security Policy

## Scope

DailyQuest is a static site plus a content-generation pipeline. There is no backend, no
database, no user accounts, and no user-submitted code execution. The attack surface is
deliberately minimal.

## Supported versions

Only the latest commit on `main` is supported.

## Reporting a vulnerability

Please open a [GitHub security advisory](https://github.com/singhtanishq/DailyQuest/security/advisories/new)
(private disclosure) rather than a public issue. Include the affected file/workflow and a
description of the impact. You will get a response within a few days.

## Rules for content contributions

- **Never submit real secrets.** Not in code, not in examples, not "as a joke". The
  validator scans generated content for credential-like patterns and refuses to publish
  them; contributors who paste real credentials into templates will be treated seriously.
- **Security challenges are defensive only.** No working exploit payloads, no instructions
  for compromising real systems, no live targets. Vulnerability classes are analyzed on
  controlled examples: identify, explain, detect, mitigate.
- **No untrusted execution.** The verification runners execute repository-owned template
  content in sandboxes with timeouts. Do not add runners or template code that fetches or
  executes external content at generation time.
- Secrets used by the workflow (`DAILYQUEST_PUSH_TOKEN`, `DAILYQUEST_COMMIT_NAME`,
  `DAILYQUEST_COMMIT_EMAIL`) live exclusively in GitHub Actions secrets — never in code,
  config, logs, or documentation.

## Data handling

The site stores nothing about visitors: no accounts, no analytics, no cookies beyond the
theme preference in `localStorage`. Generated quest JSON never includes personal data.
