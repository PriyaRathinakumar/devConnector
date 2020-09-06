const router = require('express').Router();
const auth = require('../../middleware/auth');
const User = require('../../Models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// @route   GET api/auth
// @desc    Test route
// @access  Public 
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('server error  ');
    }
    res.send("Auth Route");
});



// @route   POST api/auth
// @desc    Authenticate User and get token
// @access  Public 
router.post('/', [
    check('email', 'Please enter a valid e-mail address').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    console.log(req.body);
    const { email, password } = req.body;
    try {
        //Find if user already exists
        let user = await User.findOne({ email });
        if (user) {

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
            }
        }
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(payload, config.get('jwtSecret'),
            { expiresIn: 36000 }, (err, token) => {
                if (err) throw err;
                res.json({ token });
            });
        //return jsonweb token
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;