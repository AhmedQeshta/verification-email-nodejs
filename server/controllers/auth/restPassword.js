const { hash } = require('bcryptjs');
const { User } = require('../../database');
const { checkToken, CustomError, restPasswordSchema } = require('../../utils');

const restPassword = async ({ body, cookies }, res, next) => {
  try {
    const { token } = cookies;

    const { password } = body;

    await restPasswordSchema.validateAsync({ token, password });

    const tokenChecked = await checkToken(token);

    if (!tokenChecked) throw CustomError('Sorry, Invalid link', 409);

    const { id } = tokenChecked;
    // Check if the gym already exists
    const user = await User.findByPk(id);

    // if is exist throw an error
    if (!user) throw CustomError('Sorry, Invalid link', 409);

    const hashedPassword = await hash(password, 12);

    await user.update({ password: hashedPassword });

    res.status(201).json({
      message: 'Your password has been changed successfully',
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

module.exports = restPassword;
