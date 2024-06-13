require('dotenv').config();

const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('DB 연결성공~');
});

module.exports = db;