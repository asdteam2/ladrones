const { Router } = require('express');
const { login, register } = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

module.exports = router;
