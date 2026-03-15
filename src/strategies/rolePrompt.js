function applyRolePrompt(prompt) {

    return `
Role: Expert assistant

${prompt}
`;
}

module.exports = { applyRolePrompt };