export function normalizeRut(input: string) {
  const raw = input.toUpperCase().replace(/[^0-9K]/g, '')
  if (raw.length < 2) return { ok: false, value: '' }

  const dv = raw.slice(-1)
  const body = raw.slice(0, -1).replace(/\D/g, '')
  if (!body) return { ok: false, value: '' }

  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = 11 - (sum % 11)
  const expected = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder)
  const value = `${body}-${dv}`

  return { ok: expected === dv, value }
}

export function normalizePlate(input: string) {
  const value = input.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const oldPattern = /^[A-Z]{2}\d{4}$/
  const newPattern = /^[A-Z]{2}\d{2}[A-Z]{2}$/

  return {
    ok: oldPattern.test(value) || newPattern.test(value),
    value,
  }
}
