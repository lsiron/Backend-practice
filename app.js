const express = require('express')                  // express 라이브러리 불러오는 코드
const app = express()                               // express 라이브러리 불러오는 코드
const {ObjectId} = require('mongodb')               // new Object 쓰려면 필요함
const methodOverride = require('method-override')   // form 태그를 이용하여 PUT,DELETE 요청을 할 때 'method-override'를 설치해줌
const bcrypt = require('bcrypt')                    // bcrypt 라이브러리 불러오는 코드


let connectDB = require('./database.js') 

app.use(methodOverride('_method'))                  // form 태그를 이용하여 PUT,DELETE 요청을 하기 위해 'method-override'를 설치해줌
app.use(express.static(__dirname + '/public'))      // static 파일 경로지정
app.set('view engine', 'ejs')                       // ejs 라이브러리 불러오는 코드
app.use(express.json())                             // 유저가 데이터를 보내면 쉽게 꺼내 쓸 수 있도록 하는 코드 , req.body 쓰려면 필요함
app.use(express.urlencoded({extended:true}))        // 유저가 데이터를 보내면 쉽게 꺼내 쓸 수 있도록 하는 코드 , req.body 쓰려면 필요함

//passport 라이브러리 셋팅
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const MongoStore = require('connect-mongo')         // 세션을 DB에 저장하기 위한 라이브러리 connect-mongo 불러오는 코드

app.use(passport.initialize())
app.use(session({
  secret: '암호화에 쓸 비번',                 // 세션의 doc id는 암호화해서 유저에게 보냄
  resave : false,                            // 유저가 서버로 요청할 때마다 세선 갱신 할 건지? false가 일반적 
  saveUninitialized : false,                 // 유저가 로그인 안해도 세션을 만들 것 인지? false가 일반적
  cookie : {maxAge : 60  * 60 * 1000 },      // 세션을 1시간 동안 유지 해 줌
  store : MongoStore.create({                // 유저가 로그인 시 DB에 세션 doc 발행해 줌 - mongo-connect 사용법
    mongoUrl : process.env.DB_URL,
    dbName : 'lsiron'
  })
}))

app.use(passport.session()) 

//database.js에서 가져와서 mongoDB 적용
let db;                               // mongoDB를 적용하는 방법
connectDB.then((client)=>{
  console.log('DB연결성공')
  db = client.db('lsiron')
  app.listen(process.env.PORT)        // 서버를 띄우는 코드
}).catch((err)=>{
  console.log(err)
})                            

// 초기 페이지 이동
app.get('/', (req, res) => {              
  res.sendFile(__dirname + '/index.html') //응답을 파일로 보내는 방법
})

// 글 작성 페이지로 이동
app.get('/write', (req, res) => {    
  res.render('write.ejs')  
}) 

// 글 작성 기능 적용
app.post('/write', async (req, res) => {                                // write.ejs의 action URL과 메서드
  try {                                                                 // 에러상황 처리하고 싶으면 try catch   
    if (req.body.title == ''){                                          // req.body로 하면 유저가 input 안에 작성한 내용(title, content)이 담겨있음
      res.send('제목입력이 안됐음')
    } else {                                 
      await db.collection('post')
      .insertOne({title : req.body.title , content : req.body.content}) // DB에 데이터를 저장하는 방법, DB document 발행은 .insertOne()
      
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
app.put('/edit', async (req, res) => {                                            // method-override 설치 후, 해당 API에 연결되는 form 태그 action칸 작업 하고나서 put요청  
  try{
    if(req.body.title == ''){
      res.send('수정사항을 입력해주세요')
    } else if(req.body.content == ''){
      res.send('수정사항을 입력해주세요')
    } else if(req.body.title.length > 0 && req.body.content.length > 0){          // cf. $gt, $gte, $lt, $lte 가 있음. 이를 '필터링'이라고 함 또 $ne 는 같지 않은것을 뜻함. 사용법 => {$gt : 10} 10보다 큰 것.
      await db.collection('post').updateOne({_id : new ObjectId(req.body.id) },   // updateOne 은 _id와 일치하는 하나의 doc를 찾아서 업데이트를 적용함, cf. updateMany 는 _id와 일치하는 모든 doc를 찾아서 업데이트를 적용 함
      {$set : {title : req.body.title , content : req.body.content }}             // 왼쪽 = 어떤 doc(보통 id를 넣음)를 , 오른쪽 = $set : 어떤 내용으로 수정할지 , $set은 덮어쓰기 연산자임
    )                                                                             // $inc는 기존값에 +/- 하라는 뜻 , $mul는 기존값에 x 하라는 뜻, $unset은 필드값을 삭제하라는 뜻(거의 안 씀)
    res.redirect('/list/1')
    }
  }catch(e){
    console.log(e)
  }
})

// 글 삭제 기능 적용
app.delete('/delete', async (req, res) => {    
  await db.collection('post').deleteOne({ _id : new ObjectId(req.query.docid) })   // req.query 로 하면, 유저가 쿼리스트링 자리에 입력한 글자가 담겨있음
  res.send('삭제완료')                                                              // ajax 요청 사용 시, res.redirect, res.render 사용 안 하는게 좋음, ajax 쓰는게 새로고침이 안 되는것이 장점인데 사이트를 옮기면 장점이 사라짐
})

// pagination 구현 (글 목록 페이지로 이동)
app.get('/list', async (req, res) => {
  let page = parseInt(req.query.page) || 1;
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

// 가입기능
app.get('/register', (req,res) => {
  res.render('register.ejs')
})

app.post('/register', async (req,res) => {
  let hash = await bcrypt.hash(req.body.password, 10)             // 비밀번호 암호화 작업, 오른쪽 파라미터는 얼마나 꼬아줄것인지 결정하는 부분

  await db.collection('user').insertOne({ 
    username : req.body.username,
    password : hash
   })
   res.redirect('/')
})

// 유저가 입력한 id와 pw 검사. 다른것도 검사 하려면 passReqToCallback 옵션 사용
passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
  let result = await db.collection('user').findOne({ username : 입력한아이디})
  if (!result) {
    return cb(null, false, { message: '아이디 DB에 없음' })
  }
  
  if (await bcrypt.compare(입력한비번, result.password)) {
    return cb(null, result)
  } else {
    return cb(null, false, { message: '비번불일치' });
  }
}))

// 로그인 성공시 세션 만들고 쿠키를 유저에게 보내주기.
passport.serializeUser((user, done) => {
  process.nextTick(() => {    // 내부 코드를 비동기적으로 처리해줌
    done(null, { id: user._id, username: user.username })
  })
})

// 유저가 보낸 쿠키를 분석
passport.deserializeUser( async (user, done) => {
  let result = await db.collection('user').findOne({_id : new ObjectId(user.id)})
  delete result.password
  process.nextTick(() => {
    return done(null, result)
  })
})

// 로그인 기능 구현
app.get('/login', async (req, res)=> {
  res.render('login.ejs')
})

app.post('/login', async (req, res, next)=> {
  passport.authenticate('local', (error, user, info)=> {
    if (error) return res.status(500).json(error)
    if (!user) return res.status(401).json(info.message)
    req.logIn(user, (err)=> {
      if (err) return next(err)
      res.redirect('/')  
    })
  })(req, res, next)
})