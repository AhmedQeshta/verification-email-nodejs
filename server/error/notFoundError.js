const notFoundError = (_, res) => {
  res.status(404).json({ status: 404, message: 'Not Found Page' });
};

module.exports = notFoundError;
