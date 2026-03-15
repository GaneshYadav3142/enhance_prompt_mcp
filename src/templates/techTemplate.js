function techTemplate(prompt) {

    return `
Act as a senior software engineer.

Explain the following:

${prompt}

Requirements:
- clear explanation
- real examples
- include code snippets
- explain trade-offs
`;
}

module.exports = { techTemplate };