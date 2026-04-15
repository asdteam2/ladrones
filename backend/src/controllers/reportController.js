const prisma = require('../config/prisma');
const { reportSchema } = require('../utils/schemas');
const { normalizePlate, normalizeRut, normalizeWhitespace } = require('../utils/normalizers');
const { sanitizeOptionalText, sanitizeText } = require('../utils/sanitize');

function buildSearchWhere(query) {
  const where = {
    status: 'APPROVED',
  };

  const normalizedQuery = normalizeWhitespace(query);
  if (!normalizedQuery) return where;

  const rut = normalizeRut(normalizedQuery);
  const plate = normalizePlate(normalizedQuery);

  where.OR = [
    { name: { contains: normalizedQuery, mode: 'insensitive' } },
  ];

  if (rut.ok && rut.value) {
    where.OR.push({ rut: rut.value });
  }

  if (plate.ok && plate.value) {
    where.OR.push({ plate: plate.value });
  }

  return where;
}

async function searchReports(req, res) {
  const q = req.query.q || '';
  const where = buildSearchWhere(q);

  const reports = await prisma.report.findMany({
    where,
    include: {
      evidence: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  return res.json({
    items: reports,
  });
}

async function getReportById(req, res) {
  const reportId = Number(req.params.id);
  if (Number.isNaN(reportId)) {
    return res.status(400).json({ error: 'ID invalido' });
  }

  const isAdmin = req.user?.role === 'ADMIN';
  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      ...(isAdmin ? {} : { status: 'APPROVED' }),
    },
    include: {
      evidence: true,
    },
  });

  if (!report) {
    return res.status(404).json({ error: 'Reporte no encontrado' });
  }

  return res.json({ item: report });
}

async function createReport(req, res) {
  const parsed = reportSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const payload = parsed.data;
  const normalizedRut = payload.rut ? normalizeRut(payload.rut) : { ok: true, value: null };
  const normalizedPlate = payload.plate ? normalizePlate(payload.plate) : { ok: true, value: null };

  if (payload.rut && !normalizedRut.ok) {
    return res.status(400).json({ error: normalizedRut.reason });
  }

  if (payload.plate && !normalizedPlate.ok) {
    return res.status(400).json({ error: normalizedPlate.reason });
  }

  const name = sanitizeOptionalText(payload.name);
  const description = sanitizeText(payload.description);

  const duplicate = await prisma.report.findFirst({
    where: {
      type: payload.type,
      rut: normalizedRut.value,
      plate: normalizedPlate.value,
      description,
      status: {
        in: ['PENDING', 'APPROVED'],
      },
    },
    select: { id: true },
  });

  if (duplicate) {
    return res.status(409).json({
      error: 'Ya existe un reporte similar en revision o publicado',
      duplicateReportId: duplicate.id,
    });
  }

  const report = await prisma.report.create({
    data: {
      type: payload.type,
      name,
      rut: normalizedRut.value,
      plate: normalizedPlate.value,
      description,
      legalAccepted: true,
      status: 'PENDING',
      createdById: req.user.id,
      evidence: {
        create: (payload.evidence || []).map((item) => {
          const cleanValue = sanitizeText(item.value);

          return {
            type: item.type,
            url: item.type === 'IMAGE' ? cleanValue : null,
            text: item.type === 'TEXT' ? cleanValue : null,
          };
        }),
      },
    },
    include: {
      evidence: true,
    },
  });

  return res.status(201).json({
    message: 'Reporte enviado para revision',
    item: report,
  });
}

module.exports = {
  searchReports,
  getReportById,
  createReport,
};
