// Lets async route handlers pass errors to Express without try/catch in each one.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// An error the central handler turns into a clean JSON reply: { error: "message" }.
const httpError = (status, message) => Object.assign(new Error(message), { status });

module.exports = { wrap, httpError };
