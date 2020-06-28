const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
	//Get token from header
	const token = req.header('x-auth-token');

	//Check if token is there or not
	if (!token) {
		return res.status(401).json({ msg: 'No Token, Authorization denied' });
	}

	//Verify Token
	try {
		const decoded = jwt.verify(token, config.get('jwtSecret'));
		req.user = decoded.user;
		next(); //doubt
	} catch (err) {
		return res.status(401).json({ msg: 'Token is not valid' });
	}
};
