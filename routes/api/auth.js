const express = require('express');
const router = express.Router();
const authMiddle = require('../../middleware/authMiddle');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

//
//@route-------Get api/auth
//@desc--------Test route
//@access------Public
router.get('/', authMiddle, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password');
		return res.json(user);
	} catch (err) {
		return res.status(500).send('Server Error');
	}
});

//@route-------POST api/auth
//@desc--------Authenticate user and get token
//@access------Public
router.post(
	'/',
	[check('email', 'Please include valid email').isEmail(), check('password', 'Please enter password').exists()],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			const { email, password } = req.body;

			//See if the user exists
			let user = await User.findOne({ email });
			if (!user) {
				return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
			}

			// Matching password
			const isMatch = await bcrypt.compare(password, user.password);

			if (!isMatch) {
				return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
			}

			//json Web Token
			const payload = {
				user: {
					id: user.id,
				},
			};

			jwt.sign(
				payload,
				config.get('jwtSecret'),
				//{ expiresIn: 360000 },
				(err, token) => {
					if (err) throw err;
					res.send({ token });
				}
			);
		} catch (err) {
			res.status(500).send('Server Error');
		}
	}
);

module.exports = router;
