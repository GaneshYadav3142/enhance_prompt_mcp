function applyStructuredOutput(prompt) {

    return `
${prompt}

Return the answer in a structured format with headings and bullet points.
`;
}

module.exports = { applyStructuredOutput };