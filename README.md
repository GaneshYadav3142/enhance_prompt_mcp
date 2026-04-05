<!-- # prompt-architect-mcp

AI-powered prompt enhancement tool for Claude Desktop and any MCP-compatible LLM host.

## Installation

### Claude Desktop

Add this to your `claude_desktop_config.json`:

**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "prompt-architect": {
      "command": "npx",
      "args": ["-y", "prompt-architect-mcp"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key"
      }
    }
  }
}
```

Restart Claude Desktop — done!

### Cursor / Windsurf

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "prompt-architect": {
      "command": "npx",
      "args": ["-y", "prompt-architect-mcp"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key"
      }
    }
  }
}
```

## Available Tools

| Tool             | Description                                  |
| ---------------- | -------------------------------------------- |
| `enhance_prompt` | Dynamically enhances any prompt using GPT-4o |

## Usage

Once installed, just ask Claude:

> "Enhance this prompt: write a blog about AI" -->

# prompt-architect-mcp

Context-aware prompt enhancement for any LLM chat interface.

Remembers your project across conversations. Every prompt you send gets automatically enriched with the full history of what you have been building — no setup, no manual tracking. Works with OpenAI and Google Gemini.

---

## How it works

Every time you call `enhance_prompt_with_context`, the server:

1. Saves your prompt to a local SQLite database
2. Reads everything you have discussed before in this project session
3. Builds a context block from your history and pinned facts
4. Enhances your prompt with that full context via OpenAI or Gemini
5. Saves the result — so the next call is even richer

You do one thing. The server handles everything else silently.

---

## Requirements

- Node.js 18 or higher
- An OpenAI API key **or** a Google Gemini API key (or both)

---

## Installation — Claude Desktop

Open your Claude Desktop config file:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`

### Using OpenAI only

```json
{
  "mcpServers": {
    "prompt-architect": {
      "command": "npx",
      "args": ["-y", "prompt-architect-mcp@latest"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-key"
      }
    }
  }
}
```

### Using Gemini only

```json
{
  "mcpServers": {
    "prompt-architect": {
      "command": "npx",
      "args": ["-y", "prompt-architect-mcp@latest"],
      "env": {
        "GEMINI_API_KEY": "your-gemini-key"
      }
    }
  }
}
```

### Using both (OpenAI takes priority)

```json
{
  "mcpServers": {
    "prompt-architect": {
      "command": "npx",
      "args": ["-y", "prompt-architect-mcp@latest"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-key",
        "GEMINI_API_KEY": "your-gemini-key"
      }
    }
  }
}
```

Fully quit and reopen Claude Desktop after saving.

---

## Installation — VS Code (GitHub Copilot Agent Mode)

Create or open:

- **Global** (all projects): `%APPDATA%\Code\User\mcp.json` (Windows) or `~/.config/Code/User/mcp.json` (Mac/Linux)
- **Workspace** (this project only): `.vscode/mcp.json` in your project root

```json
{
  "servers": {
    "prompt-architect": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "prompt-architect-mcp@latest"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-key"
      }
    }
  }
}
```

Then open Copilot Chat (`Ctrl+Alt+I`), switch to **Agent Mode**, and your tools will appear.

---

## Installation — Cursor

Create or open:

- **Global:** `~/.cursor/mcp.json`
- **Project:** `.cursor/mcp.json` in your project root

```json
{
  "mcpServers": {
    "prompt-architect": {
      "command": "npx",
      "args": ["-y", "prompt-architect-mcp@latest"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-key"
      }
    }
  }
}
```

Or go to `Cursor Settings → Tools & MCP → New MCP Server` and paste the config.

---

## Installation — Windsurf

Go to `Windsurf Settings → MCP Servers → Add Server` and paste:

```json
{
  "mcpServers": {
    "prompt-architect": {
      "command": "npx",
      "args": ["-y", "prompt-architect-mcp@latest"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-key"
      }
    }
  }
}
```

---

## Installation — Firebase Studio (Project IDX / Antigravity)

Create `.idx/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "prompt-architect": {
      "command": "npx",
      "args": ["-y", "prompt-architect-mcp@latest"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-key"
      }
    }
  }
}
```

Or use the Command Palette: `Shift+Ctrl+P` → `Firebase Studio: Add MCP Server`.

To keep your API key out of version control, put it in a `.env` file in your project root and omit the `env` block from `mcp.json`.

---

## Tools

### `enhance_prompt_with_context` — the main tool

Call this every time you want to enhance a prompt. Context grows automatically.

| Field        | Required | Description                                                                |
| ------------ | -------- | -------------------------------------------------------------------------- |
| `prompt`     | Yes      | The raw prompt you want to enhance                                         |
| `session_id` | No       | Your project name e.g. `my-novel`. Auto-detected from git root if omitted. |

**First call — no context yet:**

```
Session: my-api-project
No context yet — this is your first turn. Context will grow automatically from here.

Category: technical
Enhanced Prompt:
...
```

**Second call onwards — context applied:**

```
Session: my-api-project

Context applied:
[Project context]
History: User is building a Node.js REST API with Express and MongoDB...
Current task: Adding JWT authentication middleware
Pinned facts:
  - Using Node.js 20, MongoDB Atlas, RS256 algorithm

Category: technical
Enhanced Prompt:
...already knows your stack, your history, your decisions...
```

---

### `pin_fact` — lock in a project decision

Use this when you want something remembered permanently across all future prompts in this project.

| Field        | Required | Description                                               |
| ------------ | -------- | --------------------------------------------------------- |
| `fact`       | Yes      | The fact to remember e.g. `Using React 18 and TypeScript` |
| `session_id` | No       | Must match the name used in `enhance_prompt_with_context` |

---

### `list_sessions` — see all your projects

No fields required. Returns all active project sessions with their last active date.

---

### `enhance_prompt` — quick one-off (no context)

For when you just want a single prompt enhanced without any session tracking.

| Field   | Required | Description               |
| ------- | -------- | ------------------------- |
| `input` | Yes      | The raw prompt to enhance |

---

## Testing the tools — step by step

### Step 1 — Pin your project stack

```
Tool: pin_fact
fact: Building a task management app with Node.js 20, Express 4, MongoDB Atlas, JWT HS256
session_id: task-app
```

Expected: `Fact pinned to session "task-app"`

---

### Step 2 — First enhancement (no history yet, but pinned fact appears)

```
Tool: enhance_prompt_with_context
prompt: create a mongoose schema for a task with priority levels
session_id: task-app
```

Expected: context block shows your pinned stack. Enhanced prompt mentions Node.js, MongoDB, Mongoose.

---

### Step 3 — Second enhancement (context builds automatically)

```
Tool: enhance_prompt_with_context
prompt: write the Express route to create a new task
session_id: task-app
```

Expected: context block now shows history from Step 2. Enhanced prompt knows you already have a Mongoose schema.

---

### Step 4 — Third enhancement (richer context)

```
Tool: enhance_prompt_with_context
prompt: add JWT middleware to protect the task routes
session_id: task-app
```

Expected: enhanced prompt references your schema and your routes from Steps 2 and 3.

---

### Step 5 — Verify sessions

```
Tool: list_sessions
```

Expected:

```
Your project sessions:

• task-app   (last active: today)
```

---
<!-- 
## SQLite storage limits

Your session data is stored in `~/.prompt-architect/sessions.db`. SQLite has a maximum database size of **281 TB** — effectively unlimited for any real usage.

In practice, here is what your storage actually looks like:

| What                                    | Approximate size |
| --------------------------------------- | ---------------- |
| One turn (prompt + response)            | ~2 KB            |
| One session with 100 turns              | ~200 KB          |
| One session with 1000 turns             | ~2 MB            |
| 100 active projects with 100 turns each | ~20 MB           |
| Summary snapshot                        | ~1 KB            |
| One pinned fact                         | ~0.1 KB          |

For a developer using this daily across 10 projects for a year, expect the database to be under 50 MB. The rolling summary system keeps context lean — after every 5 turns, old turns are compressed into a summary so the database never grows unboundedly.

---

## LLM provider selection

If you provide both keys, OpenAI is used by default because it produces better summaries for the context builder.

| Scenario                  | Provider used     | Models                                                             |
| ------------------------- | ----------------- | ------------------------------------------------------------------ |
| Only `OPENAI_API_KEY` set | OpenAI            | `gpt-4o` for enhancement, `gpt-4o-mini` for summaries              |
| Only `GEMINI_API_KEY` set | Gemini            | `gemini-2.5-flash` for enhancement, `gemini-2.5-flash` for summaries |
| Both keys set             | OpenAI (priority) | OpenAI models                                                      |

To force Gemini when both keys are set, remove `OPENAI_API_KEY` from your config.

--- -->

## Session ID guide

The `session_id` is just a name for your project. Rules:

- Use the **same name** every time for the same project
- Can contain letters, numbers, spaces, hyphens
- Spaces and special characters are converted to hyphens automatically
- If you are in a git repo and omit `session_id`, it is auto-detected from the repo name
- If not in a git repo and `session_id` is omitted, the tool will ask you to provide one

Good examples: `my-novel`, `work-api-2025`, `recipe-app`, `thesis-project`

---

## Data location

All session data is stored locally on your machine at:

- **Windows:** `C:\Users\YourName\.prompt-architect\sessions.db`
- **Mac/Linux:** `~/.prompt-architect/sessions.db`

No data is sent to any server other than your chosen LLM provider (OpenAI or Google) for prompt enhancement and summarisation.

---

## License

MIT
