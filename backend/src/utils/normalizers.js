function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanAlnum(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function calculateRutDv(body) {
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return String(remainder);
}

function normalizeRut(input) {
  const raw = cleanAlnum(input);
  if (raw.length < 2) {
    return { ok: false, value: null, reason: 'RUT incompleto' };
  }

  const dv = raw.slice(-1);
  const body = raw.slice(0, -1).replace(/\D/g, '');

  if (!body) {
    return { ok: false, value: null, reason: 'RUT invalido' };
  }

  const expectedDv = calculateRutDv(body);
  const normalized = `${body}-${dv}`;

  if (expectedDv !== dv) {
    return { ok: false, value: normalized, reason: 'Digito verificador invalido' };
  }

  return { ok: true, value: normalized };
}

function normalizePlate(input) {
  const value = cleanAlnum(input);
  const oldPattern = /^[A-Z]{2}\d{4}$/;
  const newPattern = /^[A-Z]{2}\d{2}[A-Z]{2}$/;

  if (!value) {
    return { ok: false, value: null, reason: 'Patente vacia' };
  }

  if (!(oldPattern.test(value) || newPattern.test(value))) {
    return { ok: false, value, reason: 'Formato de patente invalido' };
  }

  return { ok: true, value };
}

module.exports = {
  normalizeWhitespace,
  normalizeRut,
  normalizePlate,
};
