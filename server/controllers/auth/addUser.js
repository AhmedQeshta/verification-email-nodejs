const { hash } = require('bcryptjs');
const { CustomError, addUserSchema, generateToken } = require('../../utils');
const { User } = require('../../database');

const { verifyEmail } = require('../../utils/email/templates/verifyEmail');
const sendEmail = require('../../utils/email');

const addUser = async (req, res, next) => {
  try {
    const { email, password } = await addUserSchema.validateAsync(req.body, { abortEarly: false });

    // Check if the gym already exists
    const isExist = await User.findOne({
      where: { email },
    });
    // if is exist throw an error
    if (isExist) {
      throw CustomError('Sorry, This Email is already exist', 409);
    }

    const hashedPassword = await hash(password, 12);

    const { id } = await User.create({ email, password: hashedPassword });

    const payload = {
      id,
      email,
    };

    // Generate the token

    const token = await generateToken(payload, {
      expiresIn: '0.5h',
      algorithm: 'HS256',
    });

    const html = verifyEmail(`${process.env.BASE_URL}api/v1/user/verify/${id}/${token}`);
    sendEmail(email, 'Verify Your Email', html);

    res.status(201).json({
      message: 'An Email sent to your account please verify',
    });
  } catch (error) {
    console.log(error);
    if (error.name === 'ValidationError') {
      return next(CustomError(error.message, 400));
    }
    return next(error);
  }
};

module.exports = addUser;
