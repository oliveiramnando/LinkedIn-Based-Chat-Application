const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get(
    '/likendin',
    passport.authenticate('linkedin', {
        scope: ['r_liteprofile', 'r_emailaddress']
    })
);

router.get(
    '/linkedin/callback',
    passport.authenticate('linkedin', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                picture: req.user.profilePicture
            }
        });
    }
);

module.exports = router;