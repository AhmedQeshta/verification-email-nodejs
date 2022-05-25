const { User } = require('../../database');
const {
  CustomError,
  forgetPasswordSchema,
  generateToken,
  sendEmail,
} = require('../../utils');
const { resetEmail } = require('../../utils/email/templates/resetEmail');

const forgetPassword = async ({ body }, res, next) => {
  try {
    const { email } = await forgetPasswordSchema.validateAsync(body);

    // Check if the gym already exists
    const user = await User.findOne({ where: { email } });
    // if is exist throw an error
    if (!user) throw CustomError('Sorry, This email will never used', 409);

    // send email to user to reset password

    const payload = {
      id: user.id,
      email,
    };

    // Generate the token

    const token = await generateToken(payload, {
      expiresIn: '0.5h',
      algorithm: 'HS256',
    });

    const html = resetEmail(`${process.env.BASE_URL}api/v1/user/form-rest?token=${token}`);

    sendEmail(email, 'Reset Password', html);

    res.status(201).json({
      message: 'Email sent, please check your email',
      link: `${process.env.BASE_URL}api/v1/user/rest/?token=${token}`,
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

module.exports = forgetPassword;
