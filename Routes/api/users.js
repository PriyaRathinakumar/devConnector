const router = require('express').Router();
const { check, validationResult } = require('express-validator');
const User = require('../../Models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// @route   POST api/users
// @desc    Register User
// @access  Public 
router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please enter a valid e-mail address').isEmail(),
    check('password', 'Password should be 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    console.log(req.body);
    const { name, email, password } = req.body;
    try {
        //Find if user already exists
        let user = await User.findOne({ email });
        if (user) {
            res.status(400).json({ errors: [{ msg: 'User already exists' }] });
        }

        // Get users gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        });

        user = new User({
            name,
            email,
            avatar,
            password
        });

        // Encrypt pwd using bcrypt
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password.toString(), salt);

        await user.save();

        console.log('SAVED');

        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(payload, config.get('jwtSecret'),
            { expiresIn: 36000 }, (err, token) => {
                if (err) throw err;
                res.json({token});
            });

    } catch (err) {
        res.status(500).send('Server error');
    }
});



module.exports = router;