const mongoose = require('mongoose');
require('dotenv').config();
const Content = require('./models/Content');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const contents = await Content.find().sort({ createdAt: -1 }).limit(5);
  console.log(JSON.stringify(contents, null, 2));
  await mongoose.disconnect();
}

check();
