const cache = new Map();

function getCachedPrompt(prompt) {
    return cache.get(prompt);
}

function storePrompt(prompt, enhancedPrompt) {
    cache.set(prompt, enhancedPrompt);
}

module.exports = {
    getCachedPrompt,
    storePrompt
};