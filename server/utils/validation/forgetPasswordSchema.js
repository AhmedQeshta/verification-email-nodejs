/* eslint-disable no-useless-escape */
const Joi = require('joi');

const forgetPasswordSchema = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ['com', 'net'] },
    })
    .required(),
});

module.exports = forgetPasswordSchema;
