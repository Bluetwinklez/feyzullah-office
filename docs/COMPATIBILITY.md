# Compatibility and verification

## Automated application tests

[Application tests](../.github/workflows/app-test.yml) runs `npm ci` and `npm test` on Windows and Ubuntu with Node 22 and 24. Consult the [Actions results](https://github.com/Bluetwinklez/feyzullah-office/actions/workflows/app-test.yml) for completed runs; a configured matrix is not proof of a passing run.

The suite uses fake CLI processes, injected providers, local HTTP servers, and temporary repositories. It tests the app's adapters and workflows without paid accounts. It does not certify live CLI compatibility, MCP authentication, or Electron GUI behavior. Linux tests do not imply that the desktop app supports Linux.

| Environment | Verification |
|---|---|
| Linux, Node 24.19.0 | 2026-10-20: 170 passed, 0 failed, 0 skipped, including preservation of unmerged branches after worktree cleanup |
| Windows, Node 22 / 24 | 2026-10-20: both CI jobs passed in [run 39439926043](https://github.com/Bluetwinklez/feyzullah-office/actions/runs/39439926043) |
| Ubuntu, Node 22 / 24 | 2026-10-20: both CI jobs passed in [run 39439926043](https://github.com/Bluetwinklez/feyzullah-office/actions/runs/39439926043) |

## Live engine compatibility

No exact live CLI versions have been certified in this change. The table records the required interface rather than inventing a tested version.

| Engine | Adapter requirements | Live validation |
|---|---|---|
| Claude Code | `-p`, stream-json, acceptEdits, appended system prompts, resume, allowedTools | Pending |
| Codex | `exec --json`, workspace-write, working directory, stdin prompt, session resume | Pending |
| Antigravity | `agy -p`, stream-json, sandbox, conversation resume | Pending |
| REA MCP | Server named `rea`, matching instructions, target provider readiness | Pending |

Ofis checks explicit executable overrides, known installation paths, and native executables on PATH as described in the [README](../README.md#cli-discovery-in-this-version). Test the exact executable Ofis discovers, not just a different copy on PATH.

## Windows acceptance procedure

1. Record the Ofis commit, Windows build, Node/npm/Git versions, CLI executable paths, and each executable's version output.
2. Sign in interactively and verify each configured MCP connection in the same profile. Follow [the integration guide](INTEGRATIONS.md).
3. Use a disposable repository with an initial commit. Request a small file change and a test; confirm the task card has an `ofis/` branch and the original working directory stays unchanged before merge.
4. Send a follow-up to the same specialist and verify its session resumes. Inspect streaming output and task status.
5. Confirm Reality Checker actually ran, inspect the diff, merge, check npm test results, and exercise the revert action.
6. Try cancellation and restart on disposable work. Verify that closing Ofis marks unfinished cards failed after reopening.
7. Test REA against a local target you own and check evidence in the report.
8. Record failures and limitations, plus a link to sanitized logs. Do not claim rate-limit fallback was live-tested unless a real limit event was observed; the suite covers simulated fallback separately.

For a successful live run, add the date, commit, OS, exact engine version, MCP version where applicable, pass/fail per step, and evidence link. Re-run affected checks after updating an engine.

## Desktop runtime verification

The desktop runtime is pinned to Electron 44.9.1. The Ubuntu/Node 24 CI job starts the real app under Xvfb using isolated demo data. It checks that the preload IPC API is available, the renderer clock and office canvas initialize, demo state reaches the renderer, and a non-empty screenshot can be captured. The screenshot is uploaded as `desktop-smoke`.

The `--no-sandbox` argument is confined to that CI launch; the application keeps sandboxed, isolated renderers and no Node integration. This automated Linux smoke check does not certify Windows notifications, tray integration, live provider authentication or all macOS hardware. Electron 44 requires macOS 13 or newer; see the [upstream migration notes](https://www.electronjs.org/docs/latest/breaking-changes#breaking-api-changes-440).
