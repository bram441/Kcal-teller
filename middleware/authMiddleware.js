const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token = req.headers.authorization;

    if (!token || !token.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized, no token' });
    }

    token = token.split(' ')[1]; // Extract actual token
    console.log("Extracted Token:", token);
    console.log(process.env.JWT_SECRET)

    try {
        console.log("Decoded Token:", jwt.decode(token)); // Debugging
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id }; // Attach user ID
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error);
        res.status(401).json({ message: 'Unauthorized, invalid token' });
    }
};

module.exports = protect;
