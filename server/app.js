require('env2')('.env');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { notFundError, serverError } = require('./error');

const routes = require('./routes');

const app = express();

app.disable('x-powered-by');

app.use([
  compression(),
  cors(),
  cookieParser(),
  express.json({ limit: '50mb' }),
  express.urlencoded({ extended: false }),
]);

app.set('port', process.env.PORT || 8080);

app.use('/api/v1/', routes);

app.use(notFundError);
app.use(serverError);

module.exports = app;
