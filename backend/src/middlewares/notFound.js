function notFound(req, res) {
  return res.status(404).json({
    error: 'Ruta no encontrada',
  });
}

module.exports = notFound;
