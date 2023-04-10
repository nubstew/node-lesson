/** 서버를 띄우기 위한 기본 셋팅 (express 라이브러리) */
const express = require('express');
const app = express();

/** MongoDB 연결 */
const MongoClient = require('mongodb').MongoClient;

/** http 요청 get/post 외에 put/delete까지 사용가능하게 해주는 라이브러리 */
const methodOverride = require('method-override');
app.use(methodOverride('_method'))

/** body-parser (input 요청내용 서버에서 쉽게받기위한 라이브러리) */
app.use(express.urlencoded({extended: true})) 

/** ejs 뷰엔진 사용 */
app.set('view engine', 'ejs');

/*
//listen(서버띄울 포트번호, 띄운 후 실행할 코드)
app.listen(8080, function(){
    console.log('listening on 8080');
});
**/

//누군가 /pet으로 방문하면.. pet 관련된 안내문을 띄워주자.
//.get('경로', function(요청내용,응답할방법)) post요청은 post
app.get('/pet', function(요청, 응답){
    응답.send('펫용품 쇼핑할 수 있는 페이지입니다.');
});

//서버로 html 파일 전송하기 -> 응답.sendFile(보낼파일경로)
app.get('/', function(요청, 응답){
    응답.sendFile(__dirname + '/index.html');
});

app.get('/write', function(req,res){
    res.sendFile(__dirname + '/write.html');
})

app.post('/add', function(req,res){
    res.send('전송완료');
    console.log(req.body);
})

var db;
// 몽고db 붙이기
// mongodb+srv://디비계정아이디:디비계정패스워드@어쩌구/?retryWrites=true&w=majority
MongoClient.connect('mongodb+srv://nubstew:sky02794@cluster0.q2o696f.mongodb.net/?retryWrites=true&w=majority', function(에러, client){
    //연결 성공시 할일
    if (에러) return console.log(에러);

    //todoapp이라는 db에 연결좀요
    db = client.db('todoapp');

    //db 인서트하기 .insertOne('저장할데이터', function(에러,결과){ console.log('저장완료');    })
    //mongoDB는 비관계형db.. 인서트하면 걍 json처럼 오브젝트 저장함. 키 _id로 unique값 저장가능
    //collection => 테이블같은거
    /*
    //post라는 이름의 컬렉션안에 이름kim 나이20이라는 데이터 하나 넣어주셈
    db.collection('post').insertOne({이름:'Kim', 나이:'20'}, function(error, result){
        console.log('저장완료');
    });
    **/

    app.listen('8080', function(){
      console.log('listening on 8080')
    });


    //등록
    app.post('/post',function(req,res){
        res.send('전송완료');
        //단일조회. counter 콜렉션에서 name이 게시물개수인 데이터 꺼내오셈
        db.collection('counter').findOne({name: '게시물갯수'}, function(err,result){
            let count = result.totalPost;

            //인서트하기
            db.collection('post').insertOne({ _id:count+1, 제목: req.body.todoTitle, 내용: req.body.todoDetail }, function(error,result){
                if(error){
                    console.log('저장실패');
                }
                console.log('저장성공');
            });
            //단일 업데이트하기(바꿀대상조건, 바꾸는내용, 바꾸고나서할일)
            //$set : 변경 $set:{totalPost:100} => totalPost 값 100으로 바꾸기
            //$inc : 증가 $inc:{totalPost:1} => totalPost 값 1 증가시키기
            //$min : 기존값보다 적을 때만 변경하기
            //$rename : key값 이름 바꾸기
            //궁금하면 알아서 찾아보셈
            db.collection('counter').updateOne({name:'게시물갯수'}, {$inc:{totalPost:1}}, function(err,result){
                console.log('수정완료');
            })
        });
    })

    //목록조회
    app.get('/list', function(req,res){
        //db에 저장된 post라는 컬렉션 안의 모든 데이터를 꺼내주세요
        db.collection('post').find().toArray(function(err,result){
            console.log(result);
            //list.ejs 파일을 렌더링해주세요. result 데이터를 posts라는 키에다 집어넣어서 list.ejs에다 주세요
            res.render('list.ejs', { posts : result });
        });
    });

    //단일삭제
    app.delete('/delete', function(req,res){
        req.body._id = parseInt(req.body._id);
        db.collection('post').deleteOne(req.body,function(err,result){
            console.log('삭제완료');
            //200번대 : 성공
            //400번대 : 사용자잘못 실패
            //500번대 : 서버오류
            res.status(200).send({ message: '성공했어요' }); // 클라이언트한테 응답코드 200을 보내주셈&메세지도 보내주셈
        })
    })
})

//단일조회. 사용자가 '/detail/어쩌구'로 get요쳥시
app.get('/detail/:id', function(req, res){
    req.params.id = parseInt(req.params.id);
    db.collection('post').findOne({_id: req.params.id }, function(err,rslt){
        if(err){
            console.log('에러발생했어요');
        }
        console.log(rslt);
        if(rslt != null){

            res.render('detail.ejs', { data : rslt } );
        } else {
            res.redirect('/list'); // 목록페이지로 리다이렉트
        }
    });
})

//단일수정
app.get('/edit/:id', function(req,res){
    req.params.id = parseInt(req.params.id);
    db.collection('post').findOne({_id: req.params.id }, function(err,rslt){
        if(err){
            console.log('에러발생했어요');
        }
        console.log(rslt);
        if(rslt != null){

            res.render('edit.ejs', { data : rslt } );
        } else {
            db.collection('post').find().toArray(function(err,result){
                console.log(result);
                //list.ejs 파일을 렌더링해주세요. result 데이터를 posts라는 키에다 집어넣어서 list.ejs에다 주세요
                res.render('list.ejs', { posts : result });
            });
        }
    });
})
app.put('/edit', function(req, res){
    res.send('전송성공');
    req.body._id = parseInt(req.body._id);
    db.collection('post').updateOne({_id : req.body._id}, {$set:{제목:req.body.todoTitle, 내용:req.body.todoDetail}}, function(err, rslt){
        console.log('수정완료');
        res.redirect('/list'); // 목록페이지로 리다이렉트
    })
})