require('dotenv').config();
const passport = require('passport');
const LinkedInStrategy = require('passport-linkedidn-oauth2').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(new LinkedInStrategy({
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL}/auth/linkedin/callback`,
        scope: ['r_liteprofile', 'r_emailaddress'],
        state: true
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const linkedinID = profile.id;
            const name = `${profile.name.givenName} ${profile.name.familyName}`;
            const email = profile.emails[0].value;
            const picture = profile.photos[0].value;

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
    }
));
}