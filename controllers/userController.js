const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

// @desc Register new user
// @route POST /api/users/register
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        username,
        email,
        password_hash: hashedPassword
    });

    res.status(201).json({ message: 'User registered successfully' });
});

// @desc Login user
// @route POST /api/users/login
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    console.log("login userid")
    console.log(user.id)
    if (user && (await bcrypt.compare(password, user.password_hash))) {
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            token: jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' })
        });
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

module.exports = { registerUser, loginUser };
