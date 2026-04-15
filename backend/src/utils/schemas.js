const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
});

const loginSchema = registerSchema;

const evidenceSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE']),
  value: z.string().min(3, 'La evidencia debe tener contenido'),
});

const reportSchema = z
  .object({
    type: z.enum(['SCAM', 'STOLEN_VEHICLE']),
    name: z.string().max(120).optional().or(z.literal('')),
    rut: z.string().max(20).optional().or(z.literal('')),
    plate: z.string().max(20).optional().or(z.literal('')),
    description: z.string().min(20, 'La descripcion debe tener al menos 20 caracteres').max(3000),
    legalAccepted: z.boolean().refine((value) => value, {
      message: 'Debes aceptar el disclaimer legal',
    }),
    evidence: z.array(evidenceSchema).max(10).optional().default([]),
  })
  .superRefine((value, ctx) => {
    if (!value.name && !value.rut && !value.plate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes incluir al menos nombre, RUT o patente',
      });
    }
  });

const moderationSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  moderationNote: z.string().max(300).optional().or(z.literal('')),
});

module.exports = {
  registerSchema,
  loginSchema,
  reportSchema,
  moderationSchema,
};
