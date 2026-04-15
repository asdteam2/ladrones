require('dotenv').config();
const app = require('./app');

function ensureRequiredEnv() {
  const requiredKeys = ['JWT_SECRET'];
  const missing = requiredKeys.filter((key) => !process.env[key] || !process.env[key].trim());

  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno requeridas: ${missing.join(', ')}`);
  }
}

ensureRequiredEnv();

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API ejecutandose en http://localhost:${port}`);
});
