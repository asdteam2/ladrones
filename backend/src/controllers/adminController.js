const prisma = require('../config/prisma');
const { moderationSchema } = require('../utils/schemas');
const { sanitizeOptionalText } = require('../utils/sanitize');

async function listPendingReports(req, res) {
  const items = await prisma.report.findMany({
    where: { status: 'PENDING' },
    include: {
      evidence: true,
      createdBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return res.json({ items });
}

async function moderateReport(req, res) {
  const reportId = Number(req.params.id);
  if (Number.isNaN(reportId)) {
    return res.status(400).json({ error: 'ID invalido' });
  }

  const existing = await prisma.report.findUnique({ where: { id: reportId } });
  if (!existing) {
    return res.status(404).json({ error: 'Reporte no encontrado' });
  }

  const parsed = moderationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const status = parsed.data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  const moderationNote = sanitizeOptionalText(parsed.data.moderationNote);

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      moderationNote,
    },
  });

  return res.json({ item: updated });
}

async function deleteReport(req, res) {
  const reportId = Number(req.params.id);
  if (Number.isNaN(reportId)) {
    return res.status(400).json({ error: 'ID invalido' });
  }

  const existing = await prisma.report.findUnique({ where: { id: reportId } });
  if (!existing) {
    return res.status(404).json({ error: 'Reporte no encontrado' });
  }

  await prisma.report.delete({ where: { id: reportId } });
  return res.status(204).send();
}

module.exports = {
  listPendingReports,
  moderateReport,
  deleteReport,
};
