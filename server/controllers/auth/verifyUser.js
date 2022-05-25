const { User } = require('../../database');
const { checkToken, CustomError, paramsValidation } = require('../../utils');

const verifyUser = async ({ params }, res, next) => {
  try {
    const { id, token } = await paramsValidation.validateAsync(params);

    // Check if the gym already exists
    const user = await User.findByPk(id);
    // if is exist throw an error
    if (!user) throw CustomError('Sorry, Invalid link', 409);

    const tokenChecked = await checkToken(token);

    if (!tokenChecked) throw CustomError('Sorry, Invalid link', 409);

    await user.update({ verified: true });

    res.json({
      message: 'email verified successfully',
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(CustomError(error.message, 400));
    }
    if (error.name === 'TokenExpiredError') {
      return next(CustomError('Sorry This link was Invalid, try Again', 500));
    }
    return next(error);
  }
};

module.exports = verifyUser;
