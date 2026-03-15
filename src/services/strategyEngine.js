function selectStrategy(category) {

    const strategyMap = {
        marketing: ["role_prompt", "structured_output"],
        technical: ["role_prompt", "chain_of_thought"],
        blog: ["role_prompt", "structured_output"],
        email: ["role_prompt"],
        general: ["role_prompt"]
    };

    return strategyMap[category] || ["role_prompt"];
}

module.exports = { selectStrategy };