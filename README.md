# prompt-architect-mcp

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

> "Enhance this prompt: write a blog about AI"
