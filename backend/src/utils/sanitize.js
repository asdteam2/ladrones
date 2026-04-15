function sanitizeText(input) {
  if (input === null || input === undefined) return '';

  return String(input)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeOptionalText(input) {
  const sanitized = sanitizeText(input);
  return sanitized.length ? sanitized : null;
}

module.exports = {
  sanitizeText,
  sanitizeOptionalText,
};
