const GenerateMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    };
};

const GenerateLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    };
};

module.exports = {
    GenerateMessage,
    GenerateLocationMessage
};