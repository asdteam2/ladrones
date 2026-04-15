const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { loginSchema, registerSchema } = require('../utils/schemas');

function createToken(user) {
  const secret = process.env.JWT_SECRET;

  if (!secret || !secret.trim()) {
    const error = new Error('JWT_SECRET no esta configurado en el servidor.');
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return res.status(409).json({ error: 'El email ya esta registrado' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
    },
  });

  const token = createToken(user);

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }

  const token = createToken(user);

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
}

module.exports = {
  register,
  login,
};
