const sequelize = require('./config/connection');
const { User } = require('./models');

module.exports = {
  User,
  sequelize,
};
