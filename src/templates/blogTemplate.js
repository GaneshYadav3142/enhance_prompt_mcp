function blogTemplate(prompt) {

    return `
Act as a professional blog writer.

Topic:
${prompt}

Structure:
1. Introduction
2. Background
3. Key concepts
4. Examples
5. Conclusion

Audience: developers or learners
Tone: educational
`;
}

module.exports = { blogTemplate };