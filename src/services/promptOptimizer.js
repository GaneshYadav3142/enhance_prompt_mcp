const { classifyPrompt } = require("./classifierService");
const { selectStrategy } = require("./strategyEngine");

const { marketingTemplate } = require("../templates/marketingTemplate");
const { blogTemplate } = require("../templates/blogTemplate");
const { techTemplate } = require("../templates/techTemplate");
const { emailTemplate } = require("../templates/emailTemplate");

const { applyRolePrompt } = require("../strategies/rolePrompt");
const { applyChainOfThought } = require("../strategies/chainOfThought");
const { applyStructuredOutput } = require("../strategies/structuredOutput");
const { enhanceWithLLM } = require("./llmEnhancer");

async function optimizePrompt(prompt) {

    const category = classifyPrompt(prompt);

    const strategies = selectStrategy(category);

    console.error("Category:", category, "Strategies:", strategies);

    const enhancedPrompt = await enhanceWithLLM(prompt, category, strategies);


    return {
        category,
        strategies,
        enhancedPrompt
    };
}

module.exports = { optimizePrompt };