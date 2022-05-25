/* eslint-disable no-useless-escape */
const Joi = require('joi');

const restPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{6,})/)
    .min(6)
    .required(),
});

module.exports = restPasswordSchema;
