const { Router } = require('express');
const { deleteReport, listPendingReports, moderateReport } = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.use(auth, requireRole('ADMIN'));
router.get('/reports/pending', listPendingReports);
router.patch('/reports/:id/moderate', moderateReport);
router.delete('/reports/:id', deleteReport);

module.exports = router;
