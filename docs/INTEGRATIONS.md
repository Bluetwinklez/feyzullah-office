# Krea and REA setup

These integrations are optional. Configure them in the same Windows user account and CLI profile that launches Ofis. A connection in ChatGPT does not configure the separate CLI processes on your PC.

## Krea for visual specialists

For Claude Code, register the official remote server with the name **krea-ai**, matching Ofis's `mcp__krea-ai` permission entry:

```powershell
claude mcp add --transport http krea-ai --scope user https://api.krea.ai/mcp
claude mcp get krea-ai
claude
```

Inside the interactive Claude session, open `/mcp` and complete Krea sign-in. User scope makes the registration available when Ofis launches Claude in a different worktree. Check that no project-local registration overrides it.

Restart Ofis, then select a Claude specialist in the design or game-development division for an initial check. Ask it to list available Krea models without generating anything. For an end-to-end check, explicitly request one small image and inspect the returned asset; generation uses your Krea account's credits.

For Codex, follow Krea's official Codex/plugin setup and authenticate in that client. The Claude registration does not transfer to Codex. Verify model discovery in Codex before assigning a visual task. Ofis intentionally omits Krea instructions for agy.

### Saving generated files

Ofis supplies visual specialists with a download helper. From the task working directory:

```powershell
node "C:\path\to\feyzullah-office\tools\krea-indir.mjs" "https://app-uploads.krea.ai/public/REPLACE-WITH-REAL-ASSET" "assets/output.png"
```

Replace both example paths and the asset URL. The helper accepts HTTPS URLs on `app-uploads.krea.ai` or `gen.krea.ai` and checks that the destination resolves within the working directory. Other asset hosts require a separate supported download path; do not relabel a URL to bypass the check.

## REA for the reverse-engineering specialist

REA requires Node 22.19+ on the 22.x line, Node 24.11+ on the 24.x line, or Node 26+. This optional tool has stricter requirements than the app itself.

Run setup in PowerShell:

```powershell
npx rea-agents@latest setup --client claude_code
claude mcp get rea
npx rea-agents@latest doctor --client claude_code --skill --json
```

Review setup's proposed changes and complete its prompts. It registers the `rea` MCP server and matching instructions. Restart Claude and Ofis after setup. Keep the server name **rea** to match the reverse specialist's `mcp__rea` permission entry.

Static JavaScript analysis needs no native decompiler. Native analysis needs an appropriate configured provider, such as Ghidra, Hopper, or IDA, with host support and licensing suitable for your target. Follow REA's provider guide rather than assuming every engine runs on Windows.

For a first check, ask **Ters Mühendis** to inspect a small JavaScript project you own and report filenames and evidence without modifying files. Confirm that the response contains actual REA tool results. Ofis's specialist is configured to report findings; it is not the implementation agent.

## Troubleshooting the Ofis integration

| Symptom | Check |
|---|---|
| Server exists in ChatGPT but not Ofis | Configure the CLI on the Windows computer; these are separate clients |
| Server visible in one project only | Inspect MCP scope/profile and test from the task directory |
| Claude asks for Krea authentication | Complete `/mcp` sign-in interactively before retrying the task |
| Krea registered as `krea` | Ofis expects `krea-ai`; use the matching name or update the app's permission mapping |
| REA starts but analysis fails | Read doctor output and install/configure the provider required for that target |
| Tool listing works but generation fails | Check model availability, account access, and credits |
| Tool is missing after CLI fallback | MCP setup is per engine; configure the fallback CLI separately |

## Sources and verification

Setup instructions were checked against upstream documentation on 2026-10-20. Authenticated Windows end-to-end runs have not been performed for this guide; record successful combinations in [COMPATIBILITY.md](COMPATIBILITY.md).

- [Official Krea MCP setup](https://www.krea.ai/mcp)
- [Krea API dashboard and setup](https://www.krea.ai/app/api)
- [Claude Code MCP configuration and scopes](https://code.claude.com/docs/en/mcp)
- [REA repository and prerequisites](https://github.com/morluto/rea)
- [REA setup, provider configuration, and diagnostics](https://github.com/morluto/rea/blob/main/docs/installation.md)
