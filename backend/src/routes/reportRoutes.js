const { Router } = require('express');
const { createReport, getReportById, searchReports } = require('../controllers/reportController');
const auth = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');
const { reportLimiter } = require('../middlewares/rateLimiter');
const { moderateReport } = require('../controllers/adminController');

const router = Router();

router.get('/search', searchReports);
router.get('/:id', getReportById);
router.post('/', auth, reportLimiter, createReport);
router.patch('/:id', auth, requireRole('ADMIN'), moderateReport);

module.exports = router;
