require('dotenv').config();

const passport = require('passport');
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const fetch = require('node-fetch');
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(new LinkedInStrategy({
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret:    process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL}/auth/linkedin/callback`,
        scope: ['openid', 'profile', 'email'], 
        state: false,
        skipUserProfile: true                              
    },
    async (accessToken, refreshToken, _, done) => {
        try {
            // Call the OIDC userinfo endpoint
            const res = await fetch('https://api.linkedin.com/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const info = await res.json();

            // Extract fields from the OIDC response
            const linkedinId = info.sub;
            const name = info.name;
            const email = info.email || null;
            const picture = info.picture || null;

            let user = await User.findOne({ linkedinId });
            if (!user) {
                user = await User.create({ linkedinId, name, email, profilePicture: picture });
            } else {
                user.name = name;
                user.email = email;
                user.profilePicture = picture;
                await user.save();
            }

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
};
