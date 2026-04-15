const { Router } = require('express');
const { createReport, searchReports } = require('../controllers/reportController');
const auth = require('../middlewares/auth');
const { reportLimiter } = require('../middlewares/rateLimiter');

const router = Router();

router.get('/search', searchReports);
router.post('/', auth, reportLimiter, createReport);

module.exports = router;
