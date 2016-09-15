module.exports = {
    name: 'Wait',
    versions: {
        '1.0': {
            func(seconds) {
                return new Promise((resolve) => {
                    setTimeout(resolve, seconds * 1000);
                });
            },
        },
    },
};
