const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = (req, res, next) => {
    //fetch the token 
    const token = req.header('x-auth-token');
    // check if it is token presernt
    if (!token) {
        return res.status(401).json({ msg: 'No Token, authorization denied' });
    }

    // verify token
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(402).json({ msg: 'Token is not valid' });
    }

}   