const express = require('express');
const router = express.Router();
const authMiddle = require('../../middleware/authMiddle');
const config = require('config');
const request = require('request');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const { check, validationResult } = require('express-validator');

//@route-------GET api/profile/me
//@desc--------Get current user's profile
//@access------Private
router.get('/me', authMiddle, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

		if (!profile) {
			return res.status(400).json({ msg: 'User profile does not exist' });
		}

		res.json(profile);
	} catch (err) {
		console.error(err.message);
		return res.status(500).send('Server Error');
	}
});

//@route-------Post api/profile
//@desc--------Create or update User profile
//@access------Private

router.post('/', [
	authMiddle,
	[check('status', 'Status is required').not().isEmpty(), check('skills', 'Skills are required').not().isEmpty()],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

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
			facebook,
		} = req.body;

		const profileFields = {};
		profileFields.user = req.user.id;
		if (company) profileFields.company = company;
		if (location) profileFields.location = location;
		if (bio) profileFields.bio = bio;
		if (status) profileFields.status = status;
		if (githubusername) profileFields.githubusername = githubusername;

		if (skills) profileFields.skills = skills.split(',').map((skill) => skill.trim());

		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (twitter) profileFields.social.twitter = twitter;
		if (instagram) profileFields.social.instagram = instagram;
		if (linkedin) profileFields.social.linkedin = linkedin;
		if (facebook) profileFields.social.facebook = facebook;
		try {
			let profile = await Profile.findOne({ user: req.user.id });

			if (profile) {
				profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });

				return res.json(profile);
			}
			profile = new Profile(profileFields);
			await profile.save();
			res.json(profile);
		} catch (err) {
			console.error(err);
			return res.status(500).send('Server Error');
		}
	},
]);

//@route-------GET api/profile
//@desc--------Get all profiles
//@access------Public

router.get('/', async (req, res) => {
	try {
		const profiles = await Profile.find().populate('user', ['name', 'avatar']);
		return res.json(profiles);
	} catch (err) {
		console.error(err);
		return res.status(500).send('Server Error');
	}
});

//@route-------GET api/profile/user/:user_id
//@desc--------Get profile by user ID
//@access------Public

router.get('/user/:user_id', async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

		if (!profile) {
			return res.status(400).json({ msg: 'User profile not found' });
		}

		return res.json(profile);
	} catch (err) {
		//console.error(err);
		if (err.kind == 'ObjectId') {
			return res.status(400).json({ msg: 'User profile not found' });
		}

		return res.status(500).send('Server Error');
	}
});

//@route-------Delete api/profile
//@desc--------Delete profile, user
//@access------Private

router.delete('/', authMiddle, async (req, res) => {
	try {
		await Profile.findOneAndRemove({ user: req.user.id });
		await User.findOneAndRemove({ _id: req.user.id });
		return res.json({ msg: 'User deleted' });
	} catch (err) {
		console.error(err);
		return res.status(500).send('Server Error');
	}
});

//@route-------Put api/profile/experience
//@desc--------Add profile experience
//@access------Private

router.put(
	'/experience',
	[
		authMiddle,
		[
			check('title', 'Title is required').not().isEmpty(),
			check('company', 'Company is required').not().isEmpty(),
			check('from', 'From date is required').not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { title, company, location, from, to, current, description } = req.body;

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });

			profile.experience.unshift(newExp);
			await profile.save();
			return res.json(profile);
		} catch (err) {
			console.error(err);
			return res.status(500).send('Server Error');
		}
	}
);

//@route-------Delete api/profile/experience/:exp_id
//@desc--------Delete experience
//@access------Private

router.delete('/experience/:exp_id', authMiddle, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });
		const removeIndex = profile.experience.map((item) => item.id).indexOf(req.params.exp_id);
		profile.experience.splice(removeIndex, 1);
		await profile.save();
		return res.json(profile);
	} catch (err) {
		console.error(err);
		return res.status(500).send('Server Error');
	}
});

//@route-------Put api/profile/education
//@desc--------Add profile education
//@access------Private

router.put(
	'/education',
	[
		authMiddle,
		[
			check('school', 'School is required').not().isEmpty(),
			check('degree', 'Degree is required').not().isEmpty(),
			check('fieldofstudy', 'Field of study is required').not().isEmpty(),
			check('from', 'From date is required').not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { school, degree, fieldofstudy, from, to, current, description } = req.body;

		const newEdu = {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });

			profile.education.unshift(newEdu);
			await profile.save();
			return res.json(profile);
		} catch (err) {
			console.error(err);
			return res.status(500).send('Server Error');
		}
	}
);

//@route-------Delete api/profile/education/:edu_id
//@desc--------Delete education
//@access------Private

router.delete('/education/:edu_id', authMiddle, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });
		const removeIndex = profile.education.map((item) => item.id).indexOf(req.params.edu_id);
		profile.education.splice(removeIndex, 1);
		await profile.save();
		return res.json(profile);
	} catch (err) {
		console.error(err);
		return res.status(500).send('Server Error');
	}
});

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public
router.get('/github/:username', async (req, res) => {
	try {
		const options = {
			uri: `https://api.github.com/users/${
				req.params.username
			}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get(
				'githubClientSecret'
			)}`,
			method: 'GET',
			headers: {
				'user-agent': 'node.js',
			},
		};

		request(options, (error, response, body) => {
			if (error) console.error(error);

			if (response.statusCode !== 200) {
				return res.status(404).json({ msg: 'Github profile not found!' });
			}

			res.json(JSON.parse(body));
		});
	} catch (err) {
		console.error(err.message);
		return res.status(404).json({ msg: 'No Github profile found' });
	}
});

module.exports = router;
