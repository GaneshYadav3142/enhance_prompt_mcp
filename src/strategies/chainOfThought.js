function applyChainOfThought(prompt) {

    return `
${prompt}

Think step-by-step before generating the final answer.
`;
}

module.exports = { applyChainOfThought };