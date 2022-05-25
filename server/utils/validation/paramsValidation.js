const Joi = require('joi');

const paramsValidation = Joi.object({
  id: Joi.number().integer().positive().required(),
  token: Joi.string().required(),
});

module.exports = paramsValidation;
