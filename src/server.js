const express = require('express');
const passport = require('passport');

require('./config/passport')(passport);

const app = express();
app.use(passport.initialize());

const authRoutes = requre('./routes/auth');
app.use('/auth', authRoutes);