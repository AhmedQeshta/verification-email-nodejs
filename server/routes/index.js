const { Router } = require('express');
const auth = require('./auth');

const routes = Router();

// {domain-name}/api/v1/user
routes.use('/user', auth);

module.exports = routes;
