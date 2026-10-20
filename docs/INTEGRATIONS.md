# REA setup

Configure REA in the same Windows account and CLI profile that launches Ofis. A ChatGPT connection does not configure a separate CLI process.

REA requires Node 22.19+ on the 22.x line, Node 24.11+ on the 24.x line, or Node 26+. This optional tool has stricter requirements than the app itself.

Run setup in PowerShell:

```powershell
npx rea-agents@latest setup --client claude_code
claude mcp get rea
npx rea-agents@latest doctor --client claude_code --skill --json
```

Review setup's proposed changes and complete its prompts. It registers the `rea` MCP server and matching instructions. Restart Claude and Ofis after setup. Keep the server name **rea** to match the reverse specialist's `mcp__rea` permission entry.

Static JavaScript analysis needs no native decompiler. Native analysis needs an appropriate configured provider, such as Ghidra, Hopper, or IDA, with host support and licensing suitable for your target. Follow REA's provider guide rather than assuming every engine runs on Windows.

## First check

For a first check, ask **Ters Mühendis** to inspect a small JavaScript project you own and report filenames and evidence without modifying files. Confirm that the response contains actual REA tool results. Ofis's specialist is configured to report findings; it is not the implementation agent.

## Troubleshooting the Ofis integration

| Symptom | Check |
|---|---|
| Server exists in ChatGPT but not Ofis | Configure the CLI on the Windows computer; these are separate clients |
| Server visible in one project only | Inspect MCP scope/profile and test from the task directory |
| REA starts but analysis fails | Read doctor output and install/configure the provider required for that target |
| Tool is missing after CLI fallback | MCP setup is per engine; configure the fallback CLI separately |

## Sources and verification

Setup instructions were checked against upstream documentation on 2026-10-20. Authenticated Windows end-to-end runs have not been performed for this guide; record successful combinations in [COMPATIBILITY.md](COMPATIBILITY.md).

- [Claude Code MCP configuration and scopes](https://code.claude.com/docs/en/mcp)
- [REA repository and prerequisites](https://github.com/morluto/rea)
- [REA setup, provider configuration, and diagnostics](https://github.com/morluto/rea/blob/main/docs/installation.md)
