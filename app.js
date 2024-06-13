require('dotenv').config();                             // .env 파일에서 환경 변수를 로드

const express = require('express');                     // express 라이브러리 불러오기
const app = express();                                  // express 라이브러리 불러오기
const methodOverride = require('method-override');      // form 태그를 이용하여 PUT,DELETE 요청을 할 때 'method-override'를 설치해줌
const bcrypt = require('bcrypt');                       // bcrypt 라이브러리 불러오기(pw 해쉬 암호화)

// passport 라이브러리 셋팅
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const MongoStore = require('connect-mongo');            // 세션을 DB에 저장하기 위한 라이브러리 connect-mongo 불러오는 코드

const db = require('./db/database');                    // 데이터베이스 연결
const authRoutes = require('./routes/auth');            // 유저관련 라우터 불러오기
const postRoutes = require('./routes/posts');           // 게시글관련 라우터 불러오기
const User = require('./models/User');                  // User Schema 불러오기

app.use(methodOverride('_method'));                     // 'method-override' 셋팅 
app.use(express.static(__dirname + '/public'));         // static 파일 경로지정
app.set('view engine', 'ejs');                          // ejs 라이브러리 불러오기
app.use(express.json());                                // 유저가 데이터를 서버로 보내면 쉽게 꺼내 쓸 수 있도록 하는 코드 , 서버에서 req.body 쓰려면 필요함
app.use(express.urlencoded({ extended: true }));        // 유저가 데이터를 서버로 보내면 쉽게 꺼내 쓸 수 있도록 하는 코드 , 서버에서 req.body 쓰려면 필요함

app.use(
  session({
    secret: '암호화에 쓸 비번',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 },
    store: MongoStore.create({
      mongoUrl: process.env.DB_URL,
      dbName: process.env.DB_NAME,
    }),
  })
);


// 유저가 입력한 id와 pw 검사. 다른것도 검사 하려면 passReqToCallback 옵션 사용
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: '아이디 DB에 없음' });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: '비번불일치' });
      }
        return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// 로그인 성공시 세션 만들고 쿠키를 유저에게 보내주기.
passport.serializeUser((user, done) => {
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username });
  });
});

// 유저가 보낸 쿠키를 분석
passport.deserializeUser(async (user, done) => {
  try {
    const foundUser = await User.findById(user.id);
    delete foundUser.password;
    process.nextTick(() => {
      done(null, foundUser);
    });
  } catch (err) {
    done(err);
  }
});

app.use(passport.initialize());
app.use(passport.session());

app.use('/', authRoutes);                               // 유저관련 라우터 사용 
app.use('/', postRoutes);                               // 게시글관련 라우터 사용 

app.listen(process.env.PORT, () => {                    // 서버시작 코드
  console.log('Server is running on port', process.env.PORT);
});
