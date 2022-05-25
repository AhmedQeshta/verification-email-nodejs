// ${process.env.BASE_URL}api/v1/user/rest/?token=${token}
const form = () => `
<form action="/api/v1/user/rest" method="POST">
  <input type="password" name="password" placeholder="password">
  <button type="submit">Submit</button>
</form>
`;

// Can be send to route in framework frontend like react
const formRestPassword = async ({ query }, res, next) => {
  try {
    const { token } = query;

    res.cookie('token', token).send(form());
  } catch (error) {
    return next(error);
  }
};

module.exports = formRestPassword;
