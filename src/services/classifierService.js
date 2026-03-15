function classifyPrompt(prompt) {

    const text = prompt.toLowerCase();

    if (text.includes("email"))
        return "email";

    if (
        text.includes("marketing") ||
        text.includes("copy") ||
        text.includes("advertisement")
    )
        return "marketing";

    if (
        text.includes("code") ||
        text.includes("bug") ||
        text.includes("debug") ||
        text.includes("api")
    )
        return "technical";

    if (
        text.includes("blog") ||
        text.includes("article")
    )
        return "blog";

    return "general";
}

module.exports = { classifyPrompt };