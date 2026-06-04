<a name="start-building"></a>
<br>
<p align="center">
<img src="img/banner-build-26.png" alt="Microsoft Build 2026" width="1200"/>
</p>

# [Microsoft Build 2026](https://build.microsoft.com)

## 🔥 DEM332: From zero to teammate in 25 minutes - build a Teams agent live

### Session Description

Learn how to turn a working web application into a Microsoft Teams agent in minutes. This demo shows how a coding agent, the Teams Developer CLI, and Teams agent skills can inspect an existing server, add Teams bot support, register the `/api/messages` endpoint, update the Teams app registration, and return an onboarding link with very little manual glue.

### 🚀 Getting started

If you're following this demo at your own pace:
- Clone this repository
- Set up your development environment
- Follow the demo instructions in [`docs/01-convert-webapp-to-teams-agent.md`](./docs/01-convert-webapp-to-teams-agent.md)

### 🧠 Learning Outcomes

By the end of this demo, you will be able to:

- Explain how an existing web app can become a Microsoft Teams agent
- Use the Teams Developer CLI and Teams agent skills to guide a coding agent through Teams integration
- Validate a Teams messaging endpoint, dev tunnel, app registration, and onboarding link

### 💬 Keep Learning with Copilot

Try these prompts with GitHub Copilot to explore the topics from this demo. Open Copilot Chat in Visual Studio Code (`Ctrl+Alt+I` on Windows/Linux, `Cmd+Shift+I` on Mac), paste a prompt, and see what you learn. Try connecting the [Microsoft Learn MCP Server](#-microsoft-learn-mcp-server) for the latest official documentation.

Use these as a starting point — or write your own!

1. How does the starter web app in `src/webapp` handle chat requests, project context, and transcript storage?
1. What changed between `src/webapp` and `src/completed` to add Teams bot support?
1. Walk me through how `/api/messages`, the dev tunnel, and Teams app registration work together in this demo.
1. Help me adapt this demo so the Teams agent can answer questions from my own project data.

### 💻 Technologies Used

1. [Microsoft Teams](https://learn.microsoft.com/microsoftteams/platform/)
1. [Teams Developer CLI](https://microsoft.github.io/teams-sdk/cli)
1. [Teams agent skills](https://microsoft.github.io/teams-sdk/developer-tools/agent-skills)
1. [Microsoft Teams SDK](https://microsoft.github.io/teams-sdk)
1. [Azure OpenAI Service](https://learn.microsoft.com/azure/ai-services/openai/)
1. [Node.js](https://nodejs.org/docs/latest/api/)
1. [Express](https://expressjs.com/)
1. [React](https://react.dev/)
1. [TypeScript](https://www.typescriptlang.org/docs/)
1. [Vite](https://vite.dev/guide/)

### 📚 Resources and Next Steps

| Resource | Description |
|:---------|:------------|
| [https://aka.ms/build26-next-steps](https://aka.ms/build26-next-steps) | Explore lab and session repos to further your learning from Microsoft Build |
| [Demo instructions](./docs/01-convert-webapp-to-teams-agent.md) | Follow the end-to-end flow for converting the starter web app into a Teams agent |
| [Teams Developer CLI](https://microsoft.github.io/teams-sdk/cli) | Install and use the CLI that manages Teams app setup during the demo |
| [Teams agent skills](https://microsoft.github.io/teams-sdk/developer-tools/agent-skills) | Add Teams-specific workflows to your coding agent |
| [Watch the session recording](https://aka.ms/build26/DEM332/youtube) | Watch the recorded Microsoft Build session. |


### 🌟 Microsoft Learn MCP Server

The Microsoft Learn MCP Server gives your AI agent direct access to Microsoft's official documentation — grounded, up-to-date answers about the products and services covered in this session.

**Visual Studio Code** — One click installation: 

[![Install in Visual Studio Code](https://img.shields.io/badge/Visual_Studio_Code-Install_Microsoft_Learn_MCP-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=microsoft-learn&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D)


**GitHub Copilot CLI** — Run this to install the Learn MCP Server as a plugin:
```
/plugin install microsoftdocs/mcp
```

For more info, other clients, and to post questions, visit the [Learn MCP Server repo](https://aka.ms/learnmcp).

## Content Owners

<table>
<tr>
    <td align="center"><a href="https://github.com/heyitsaamir">
        <img src="https://github.com/heyitsaamir.png" width="100px;" alt="Aamir Jawaid"/><br />
        <sub><b>Aamir Jawaid</b></sub></a><br />
            <a href="https://github.com/heyitsaamir" title="talk">📢</a>
    </td>
</tr></table>

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit [Contributor License Agreements](https://cla.opensource.microsoft.com).

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
