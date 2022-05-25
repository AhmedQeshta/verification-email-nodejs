const { Sequelize } = require('sequelize');

require('env2')('.env');

const { NODE_ENV, DB_URL, TEST_DB_URL, DATABASE_URL, DB_BUILD } = process.env;

let dbUrl = '';
let ssl = false;

switch (NODE_ENV) {
  case 'development':
    dbUrl = DB_URL;
    ssl = false;
    break;
  case 'test':
    dbUrl = TEST_DB_URL;
    ssl = false;
    break;
  case 'production':
    dbUrl = DATABASE_URL;
    ssl = { rejectUnauthorized: false };
    break;
  default:
    throw new Error('NODE_ENV is not set');
}

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectOptions: { ssl, charset: 'utf8' },
  logging: false,
});

if (!DB_BUILD) {
  // sync sequelize when DB_BUILD equals false
  sequelize.sync();
}

module.exports = sequelize;
