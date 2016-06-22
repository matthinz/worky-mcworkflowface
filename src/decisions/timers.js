function cancelTimer(timerId) {
    return {
        decisionType: 'CancelTimer',
        cancelTimerDecisionAttributes: {
            timerId,
        },
    };
}

function startTimer(timerId, seconds) {
    return {
        decisionType: 'StartTimer',
        startTimerDecisionAttributes: {
            timerId,
            startToFireTimeout: String(seconds),
        },
    };
}

module.exports = {
    cancelTimer,
    startTimer,
};
