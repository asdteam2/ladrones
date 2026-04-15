const { Prisma } = require('@prisma/client');

function mapPrismaError(err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return { statusCode: 409, message: 'El recurso ya existe.' };
    }

    if (err.code === 'P2021') {
      return {
        statusCode: 503,
        message: 'La base de datos no esta inicializada. Intenta nuevamente en unos minutos.',
      };
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return {
      statusCode: 503,
      message: 'No fue posible conectar con la base de datos.',
    };
  }

  return null;
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const prismaMapped = mapPrismaError(err);
  const statusCode = prismaMapped?.statusCode || err.statusCode || 500;
  const message = prismaMapped?.message || err.message || 'Error interno del servidor';

  return res.status(statusCode).json({
    error: message,
  });
}

module.exports = errorHandler;
