module.exports = {
    name: 'Ping',
    versions: {
        '1.0': {
            func(input) {
                return {
                    pong: input,
                };
            },
        },
    },
};
