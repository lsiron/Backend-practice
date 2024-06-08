const { MongoClient } = require('mongodb') //mongoDB 라이브러리 불러오는 코드

const url = "mongodb+srv://godid2016:971209@lsiron.gfagz76.mongodb.net/?retryWrites=true&w=majority&appName=lsiron";
let connectDB = new MongoClient(url).connect()

module.exports = connectDB