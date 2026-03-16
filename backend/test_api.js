require('dotenv').config({path: './backend/.env'});
const mongoose = require('mongoose');
const User = require('./backend/models/User');
const jwt = require('jsonwebtoken');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne();
  if(!user) return console.log("no user");
  const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log(token);
  process.exit(0);
}
test();
