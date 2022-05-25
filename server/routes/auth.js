const { Router } = require('express');
const {
  addUser,
  verifyUser,
  getUsers,
  forgetPassword,
  restPassword,
  formRestPassword,
} = require('../controllers');

const user = Router();

// {domain-name}/api/v1/user
user.post('/', addUser);
user.get('/', getUsers);

// {domain-name}/api/v1/user/verify?token=${token}
user.get('/verify', verifyUser);

// {domain-name}/api/v1/user/forget
user.post('/forget', forgetPassword);

// {domain-name}/api/v1/user/forget?token=${token}
user.post('/rest', restPassword);

// {domain-name}/api/v1/user/form-rest
user.get('/form-rest', formRestPassword);

module.exports = user;
