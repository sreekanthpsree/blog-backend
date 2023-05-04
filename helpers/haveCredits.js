const User = require("../models/Users");

module.exports = async (id) => {
  const user = await User.findById(id);
  const haveCredits = user.credit < 1;
  return !haveCredits;
};
