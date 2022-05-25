const { Router } = require('express');
const { addUser, verifyUser, getUsers } = require('../controllers');

const user = Router();

// {domain-name}/api/v1/user
user.post('/', addUser);
user.get('/', getUsers);

// {domain-name}/api/v1/user/verify/:id/:token
user.get('/verify/:id/:token', verifyUser);

module.exports = user;
