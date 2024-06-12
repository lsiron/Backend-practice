const { MongoClient } = require('mongodb') //mongoDB 라이브러리 불러오는 코드

const url = process.env.DB_URL;
let connectDB = new MongoClient(url).connect()

module.exports = connectDB