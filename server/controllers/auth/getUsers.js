const { User } = require('../../database');

const getUsers = async (_, res, next) => {
  try {
    const user = await User.findAll();
    res.json({
      message: 'Get All User',
      user,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = getUsers;
