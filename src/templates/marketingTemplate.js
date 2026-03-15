function marketingTemplate(prompt) {

    return `
Act as a senior marketing strategist.

Task:
${prompt}

Requirements:
- persuasive tone
- highlight benefits
- emotional hook
- strong call to action

Output:
1. Headline
2. Marketing copy
3. Call to action
`;
}

module.exports = { marketingTemplate };