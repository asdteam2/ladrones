require('dotenv').config();
const app = require('./app');

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API ejecutandose en http://localhost:${port}`);
});
