const Joi = require('joi');

const paramsValidation = Joi.object({
  token: Joi.string().required(),
});

module.exports = paramsValidation;
