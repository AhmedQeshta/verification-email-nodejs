const {
  addUser,
  verifyUser,
  getUsers,
  forgetPassword,
  restPassword,
  formRestPassword,
} = require('./auth');

module.exports = { addUser, verifyUser, getUsers, forgetPassword, restPassword, formRestPassword };
