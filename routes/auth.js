const express = require('express');       // express 불러오기(router 사용하기 위함)
const router = express.Router();          // router 불러오기
const bcrypt = require('bcrypt');         // bcrypt 라이브러리 불러오기(해쉬 암호화)
const passport = require('passport');     // passport 불러오기(로그인 할 때 세션부여)
const User = require('../models/User');   // User Schema 불러오기(회원가입 할 때 db에 데이터 넣을때 사용)


// 회원가입 페이지 이동 구현
router.get('/register', (req, res) => {
  res.render('register.ejs');
});

// 회원가입 기능 구현
router.post('/register', async (req, res) => {
  let hash = await bcrypt.hash(req.body.password, 10);      // 비밀번호 암호화 작업, 오른쪽 파라미터는 얼마나 꼬아줄것인지 결정하는 부분
  await User.create({
    username: req.body.username,
    password: hash,
  });
  res.redirect('/');
});

// 로그인 페이지 이동 구현
router.get('/login', async (req, res) => {
  res.render('login.ejs');
});

// 로그인 기능 구현
router.post('/login', async (req, res, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) return res.status(500).json(error);
    if (!user) return res.status(401).json(info.message);
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.redirect('/');
    });
  })(req, res, next);
});

module.exports = router;