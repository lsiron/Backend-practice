const express = require('express')   // express 라이브러리 불러오는 코드
const app = express() // express 라이브러리 불러오는 코드
let connectDB = require('./database.js') 

app.use(express.static(__dirname + '/public')) // static 파일 경로지정
app.set('view engine', 'ejs') // ejs 라이브러리 불러오는 코드
app.use(express.json())
app.use(express.urlencoded({extended:true}))

let db;                 // mongoDB를 적용하는 방법
connectDB.then((client)=>{
  console.log('DB연결성공')
  db = client.db('lsiron')
  app.listen(3000)   // 서버를 띄우는 코드
}).catch((err)=>{
  console.log(err)
})                            

app.get('/', (req, res) => {        // 서버를 요청하는 코드
  res.sendFile(__dirname + '/index.html') //응답을 파일로 보내는 방법
})

app.get('/list', async (req, res) => {        // 서버를 요청하는 코드
  let result = await db.collection('post').find().toArray() // 외우기, mongoDB 데이터를 가져오는 방법
  res.render('list.ejs',{posts : result})  // 유저에게 ejs 파일 보내는 법(render), 응답은 1번밖에 안됨
}) 

app.get('/write', (req, res) => {    // 글 작성 기능
  res.render('write.ejs')  
}) 

app.post('/add', async (req, res) => {        
  console.log(req.body)  // 서버에서 요청.body 쓸 수 있음
  try {                     // 에러상황 처리하고 싶으면 try catch
    if (req.body.title == ''){        // 유저가 보낸 데이터 검사는 if else
      res.send('제목입력이 안됐음')
    } else {                     
      await db.collection('post').insertOne({title : req.body.title , content : req.body.content}) // DB에 데이터를 저장하는 방법, DB document 발행은 .insertOne()
      res.redirect('/list')  // 특정 페이지로 유저를 이동시킴
    }
  } catch(e) {
    console.log(e)
    res.status(500).send('서버 에러남')
  }

}) 


