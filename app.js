const express = require('express')   // express 라이브러리 불러오는 코드
const app = express() // express 라이브러리 불러오는 코드
const {ObjectId} = require('mongodb') // new Object 쓰려면 필요함
const methodOverride = require('method-override') // form 태그를 이용하여 PUT,DELETE 요청을 할 때 'method-override'를 설치해줌

let connectDB = require('./database.js') 

app.use(methodOverride('_method'))  // form 태그를 이용하여 PUT,DELETE 요청을 하기 위해 'method-override'를 설치해줌
app.use(express.static(__dirname + '/public')) // static 파일 경로지정
app.set('view engine', 'ejs') // ejs 라이브러리 불러오는 코드
app.use(express.json())    // 유저가 데이터를 보내면 쉽게 꺼내 쓸 수 있도록 하는 코드 , req.body 쓰려면 필요함
app.use(express.urlencoded({extended:true})) // 유저가 데이터를 보내면 쉽게 꺼내 쓸 수 있도록 하는 코드 , req.body 쓰려면 필요함



//database.js에서 가져와서 mongoDB 적용
let db;                    // mongoDB를 적용하는 방법
connectDB.then((client)=>{
  console.log('DB연결성공')
  db = client.db('lsiron')
  app.listen(3000)         // 서버를 띄우는 코드
}).catch((err)=>{
  console.log(err)
})                            

// 초기 페이지 이동
app.get('/', (req, res) => {              
  res.sendFile(__dirname + '/index.html') //응답을 파일로 보내는 방법
})

// // 글 목록 페이지로 이동
// app.get('/list', async (req, res) => {        
//   let result = await db.collection('post').find().toArray() 
//   res.render('list.ejs',{posts : result})  
// }) 

// 글 작성 페이지로 이동
app.get('/write', (req, res) => {    
  res.render('write.ejs')  
}) 

// 글 작성 기능 적용
app.post('/write', async (req, res) => {     // write.ejs의 action URL과 메서드
  try {                                      // 에러상황 처리하고 싶으면 try catch   
    if (req.body.title == ''){               // req.body로 하면 유저가 input 안에 작성한 내용(title, content)이 담겨있음
      res.send('제목입력이 안됐음')
    } else {                                 
      await db.collection('post').insertOne({title : req.body.title , content : req.body.content}) // DB에 데이터를 저장하는 방법, DB document 발행은 .insertOne()
      res.redirect('/list/1')                
    }
  } catch(e) {
    console.log(e)
    res.status(500).send('서버 에러남')
  }

}) 

// 글 상세 페이지로 이동
app.get('/detail/:id', async (req, res) => {        //:id/:id2/:id3 처럼 URL 파라미터를 여러개 넣어도 상관없음. : 뒤엔 아무거나 변수명 입력하면 됨
  try{
    let result = await db.collection('post')        
    .findOne({ _id : new ObjectId(req.params.id)})  // req.params 로 하면, 유저가 URL 파라미터 자리에 입력한 글자가 담겨있음
    if (result == null) {
      res.status(404).send('이상한 url 입력함')
    }
    res.render('detail.ejs', { result : result })   // result를 변수 result에 담아서 보냄 , 변수명은 아무렇게 지어도 상관없음  
  }catch(e){
    console.log(e)
    res.status(404).send('이상한 url 입력함')        // status를 입력하면 유저가 어떤 문제인지 잘 알 수있음 5xx: 서버문제, 4xx: 유저문제
  }
})

// 글 수정 페이지로 이동
app.get('/edit/:id', async (req, res) => {   
  let result = await db.collection('post').findOne({_id : new ObjectId(req.params.id)})
  res.render('edit.ejs', {result : result})
})

// 글 수정 기능 적용
app.put('/edit', async (req, res) => {                                          // method-override 설치 후, 해당 API에 연결되는 form 태그 action칸 작업 하고나서 put요청  
  try{
    if(req.body.title == ''){
      res.send('수정사항을 입력해주세요')
    } else if(req.body.content == ''){
      res.send('수정사항을 입력해주세요')
    } else if(req.body.title.length > 0 && req.body.content.length > 0){
    await db.collection('post').updateOne({_id : new ObjectId(req.body.id) },  
      {$set : {title : req.body.title , content : req.body.content }}          // 왼쪽 = 어떤 doc(보통 id를 넣음)를 , 오른쪽 = $set : 어떤 내용으로 수정할지 , $set은 덮어쓰기 연산자임
    ) 
    res.redirect('/list/1')
    }
  }catch(e){
    console.log(e)
  }
})
    // 이외의 update 문법
    //   await db.collection('post').updateMany({ like : {$gt : 10} }, //updateMany 는 _id와 일치하는 모든 doc를 찾아서 업데이트를 적용 함, like가 10 이상인 doc를 전부 업데이트 해주라는 뜻, $gt 이외에도 $gte, $lt, $lte 가 있음. 이를 '필터링'이라고 함 또 $ne 는 같지 않은것을 뜻함
    //   {$inc : {like : -2}}    // $inc는 기존값에 +/- 하라는 뜻 , $mul는 기존값에 x 하라는 뜻, $unset은 필드값을 삭제하라는 뜻(거의 안 씀)
    // ) 

// 글 삭제 기능 적용
app.delete('/delete', async (req, res) => {    
  await db.collection('post').deleteOne({ _id : new ObjectId(req.query.docid) }) // req.query 로 하면, 유저가 쿼리스트링 자리에 입력한 글자가 담겨있음
  res.send('삭제완료') // ajax 요청 사용 시, res.redirect, res.render 사용 안 하는게 좋음, ajax 쓰는게 새로고침이 안 되는것이 장점인데 사이트를 옮기면 장점이 사라짐
})

// pagination 구현
app.get('/list/:page', async (req, res) => {
  let page = parseInt(req.params.page) || 1;
  const postsPerPage = 5;
  const totalPosts = await db.collection('post').countDocuments();
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  if (page < 1) page = 1;
  if (page > totalPages) page = totalPages;

  let result = await db.collection('post').find()
    .skip((page - 1) * postsPerPage)
    .limit(postsPerPage)
    .toArray();

  res.render('list.ejs', {
    posts: result,
    currentPage: page,
    totalPages: totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages
  });
});

// // pagination(skip 쓴 것) - skip은 성능이 안 좋음, 페이지 수가 많아지면 느려짐
// app.get('/list/:id', async (req, res) => {     
//   let result = await db.collection('post').find()
//   .skip((req.params .id - 1)*5).limit(5).toArray() 
//   res.render('list.ejs',{posts : result})  
// }) 

// // pagination(skip 안 쓴것) - 장점 : 매우 빠름, 단점: '다음' 버튼으로만 사용가능
// app.get('/list/next/:id', async (req, res) => {     
//   let result = await db.collection('post').find({_id : {$gt : new ObjectId(req.params.id)}}) // find 안에 {}를 쓰면 이 안에있는 조건에 맞는 것만 가져옴
//   .limit(5).toArray()   
//   res.render('list.ejs',{posts : result})  
// }) 