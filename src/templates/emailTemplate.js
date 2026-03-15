function emailTemplate(prompt) {

    return `
Act as a professional email writer.

Task:
${prompt}

Format:

Subject:
Email Body:
Closing:

Tone: professional and concise
`;
}

module.exports = { emailTemplate };