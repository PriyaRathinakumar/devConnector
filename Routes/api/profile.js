const router = require('express').Router();
const auth = require('../../middleware/auth');
const Profile = require('../../Models/Profile');
const User = require('../../Models/User');
const { check, validationResult, body } = require('express-validator');
const { route } = require('./users');
const request = require('request');
const config = require('config');
const { response } = require('express');

// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private 
router.get('/me', auth, async (req, res) => { // whatever you need to be private or protect add auth as param
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
        res.send(profile);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/profile/me
// @desc    Create or Update user profile
// @access  Private 
router.post('/', [auth, [
    check('status', 'Status is required').notEmpty(),
    check('skills', 'Skills is required').notEmpty()

]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
    const {
        company,
        location,
        website,
        bio,
        skills,
        status,
        githubusername,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook
    } = req.body;

    // Build Profile Objects
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (githubusername) profileFields.githubusername = githubusername;
    if (status) profileFields.status = status;
    if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // Build Social Object for profile
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
        let profile = await Profile.findOne({ user: req.user.id });
        if (profile) {
            // update
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, {
                new: true
            });
            return res.json(profile);
        }
        // not found, then create new profile
        profile = new Profile(profileFields);

        await profile.save();
        res.json(profile);
    }
    catch (err) {
        res.status(500).send('Server Error');
    }

    console.log(profileFields);
    res.send('Hello');

});


// @route   GET api/profile/
// @desc    Get all profiles
// @access  Public 
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user id
// @access  Public
router.get('/user/:user_id', async (req, res) => {
    try {
        let profiles = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
        if (!profiles) {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.send(profiles);
    } catch (err) {
        if (err.kind == 'ObjectId') {
            res.status(400).send('Profile not found');
        }
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/profile
// @desc    DELETE profile , user and posts
// @access  private
router.delete('/', auth, async (req, res) => {
    try {
        // @todo remove users posts
        // Remove Profile
        await Profile.findOneAndRemove({ user: req.user.id });
        // Remove User
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User Deleted' })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  private
router.put('/experience', [auth, [
    check('title', 'Title is required').notEmpty(),
    check('company', 'Company is required').notEmpty(),
    check('from', 'From Date is required').notEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        title, company, location, from, to, current, description
    } = req.body;

    const newExp = {
        title, company, location, from, to, current, description
    };

    try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.experience.unshift(newExp); //unshift() is an array function from Node. js 
        //that is used to insert element to the front of an array. 
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});


// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete profile experience
// @access  private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        //GET remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1); // remove and save
        await profile.save();

        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT api/profile/educatipn
// @desc    Add profile education
// @access  private
router.put('/education', [auth, [
    check('school', 'School is required').notEmpty(),
    check('degree', 'Degree is required').notEmpty(),
    check('from', 'From date is required')
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { school, degree, fieldofstudy, from, to, current, description } = req.body;
    const newEducation = { school, degree, fieldofstudy, from, to, current, description };
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.education.unshift(newEducation);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
}
);
// @route   DELETE api/profile/education
// @desc    Delete profile education
// @access  private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        // GET index of education element to be removed
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});


// @route   GET api/profile/github/:username
// @desc    Get user repos from github
// @access  private
router.get('/github/:username', async (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&
            sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}}`,
            method: 'GET',
            headers: {'user-agent':'node.js'}
        }
        request(options,(error,response, body)=>{
            if(error) console.error(error.message);
            if(response.statusCode !== 200) {
               return res.status(400).json({msg: 'No Github profile found'});
            }
            res.json(JSON.parse(body));
        });
    } catch (error) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

module.exports = router;