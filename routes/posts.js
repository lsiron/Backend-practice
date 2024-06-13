const express = require('express');      // express 불러오기 (router 쓰기위함)
const router = express.Router();         // router 불러오기
const Post = require('../models/Post');  // Post Schema 불러오기

// 메인 페이지 이동 구현
router.get('/', (req, res) => {
  res.render('home.ejs');
});

// 글 작성 페이지로 이동 구현
router.get('/write', (req, res) => {
  res.render('write.ejs');
});

// 글 작성 기능 구현
router.post('/write', async (req, res) => {                                       // write.ejs의 action URL과 메서드
  try {                                                                           // 에러상황 처리하고 싶으면 try catch                          
    if (req.body.title == '') {                                                   // req.body로 하면 유저가 input 안에 작성한 내용(title, content)이 담겨있음        
      res.send('제목입력이 안됐음');
    } else {
      await Post.create({ title: req.body.title, content: req.body.content });    // DB에 데이터를 저장하는 방법, DB document 발행은 .create()
      res.redirect('/list');
    }
  } catch (e) {
    console.log(e);
    res.status(500).send('서버 에러남');
  }
});

// 글 상세 페이지로 이동 구현
router.get('/detail/:id', async (req, res) => {              //:id/:id2/:id3 처럼 URL 파라미터를 여러개 넣어도 상관없음. : 뒤엔 아무거나 변수명 입력하면 됨
  try {
    let result = await Post.findById(req.params.id);         // req.params 로 하면, 유저가 URL 파라미터 자리에 입력한 글자가 담겨있음
    if (result == null) {
      res.status(404).send('이상한 url 입력함');
    }
    res.render('detail.ejs', { result: result });            // result를 변수 result에 담아서 보냄 , 변수명은 아무렇게 지어도 상관없음
  } catch (e) {
    console.log(e);
    res.status(404).send('이상한 url 입력함');                // status를 입력하면 유저가 어떤 문제인지 잘 알 수있음 5xx: 서버문제, 4xx: 유저문제
  }
});

// 글 수정 페이지로 이동 구현
router.get('/edit/:id', async (req, res) => {
  let result = await Post.findById(req.params.id);
  res.render('edit.ejs', { result: result });
});

// 글 수정 기능 구현
router.put('/edit', async (req, res) => {                    // method-override 설치 후, 해당 API에 연결되는 form 태그 action칸 작업 하고나서 put요청  
  try {
    if (req.body.title == '' || req.body.content == '') {
      res.send('수정사항을 입력해주세요');
    } else {
      await Post.findByIdAndUpdate(req.body.id, {
        title: req.body.title,
        content: req.body.content,
      });
      res.redirect('/list');
    }
  } catch (e) {
    console.log(e);
  }
});

// 글 삭제 기능 구현
router.delete('/delete', async (req, res) => {
  await Post.findByIdAndDelete(req.query.docid);             // req.query 로 하면, 유저가 쿼리스트링 자리에 입력한 글자가 담겨있음
  res.send('삭제완료');                                       // ajax 요청 사용 시, res.redirect, res.render 사용 안 하는게 좋음, ajax 쓰는게 새로고침이 안 되는것이 장점인데 사이트를 옮기면 장점이 사라짐
});

// 글 목록 페이지로 이동 및 페이지 옮기는 기능 구현
router.get('/list', async (req, res) => {
  let page = parseInt(req.query.page) || 1;
  const postsPerPage = 5;
  const totalPosts = await Post.countDocuments();
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  // Ensure the page number is within the valid range
  if (page < 1) page = 1;
  if (page > totalPages) page = totalPages;

  const skip = (page - 1) * postsPerPage;
  
  // Make sure skip is not negative
  if (skip < 0) {
    return res.status(400).send('게시글이 없습니다.');
  }

  let result = await Post.find()
    .skip(skip)
    .limit(postsPerPage)
    .exec();

  res.render('list.ejs', {
    posts: result,
    currentPage: page,
    totalPages: totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  });
});

module.exports = router;