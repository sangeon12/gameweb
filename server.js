const e = require('express');
const express = require('express');
const http = require('http');  //노드의 기본 모듈
const path = require('path'); 
const socket = require('socket.io');
const url = require('url');
// 찾는 순서
//1. program files의 노드 설치 폴더를 뒤진다. 
//2. 없으면 현재 실행되는 파일이 있는 경로의 node_modules뒤진다.
//3. 현재 폴더를 뒤져 
const app = express();
const server = http.createServer(app);
const io = socket(server);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//정적 폴더를 public 폴더로 지정한다.
app.use(express.static( path.join(__dirname, 'public') ));

//request를 받아서 처리후 response를 보낸다.
app.get('/', (req, res)=>{
    res.render('main');
});

let name = '';
app.get('/chating', (req, res)=>{
    let urlParse = url.parse(req.url, true);
    name = urlParse.query;
    res.render('chating');
});

let userList = []; //로그인한 유저들을 저장하는 배열
let roomList = []; //방 목록
let roomInUser = [];//방에 들어간 유저 목록
let roomId = 0;
io.on("connect", socket => {
    console.log(socket.id + "연결");
    
    socket.on('login', data => {        
        userList.push({id:socket.id, nickName:data});
        socket.emit('login-ok', {id:socket.id, nickName:data});
        io.emit('user-list', userList);
    });

    socket.on('disconnect', ()=>{
        let idx = userList.findIndex(x => x.id === socket.id);
        if(idx < 0) return;
        console.log(userList.splice(idx, 1));
        io.emit('user-list', userList);
    });

    socket.on('chat-msg', data =>{
        //메시지를 전송한 유저를 찾는다.
        let sendUser = userList.find(x => x.id === socket.id);
        io.emit('awesome', {id:sendUser.id, nickName:sendUser.nickName, msg:data});
    });

    socket.on('createRoom', data =>{
        roomList.push({roomName:data.roomName, roomPassword:data.roomPassword, selectGame:data.selectGame, max:data.max, user:data.user, nickName:data.nickName, id:data.id, roomId : roomId});
        roomInUser.push({nickName:data.nickName, roomName:data.roomName, id:data.id, selectGame:data.selectGame, roomId:roomId, ready:data.ready});
        socket.join(roomId);
        io.emit('view-room', roomList);
        let roomMax = roomList.find(x => x.roomId === roomId);
        if(data.selectGame === 'chating') socket.emit('chating-in-room');
        else if(data.selectGame === 'mafia') socket.emit('mafia-in-room');
        roomUser(roomMax.roomId);
        roomId++;
    });

    socket.on('room', ()=>{
        io.emit('view-room', roomList);
    });

    socket.on('room-in', data=>{
        roomInUser.push(data);
        socket.join(data.roomId);
        if(data.selectGame === 'chating') socket.emit('chating-in-room');
        else if(data.selectGame === 'mafia') socket.emit('mafia-in-room');
        roomMax({check:true, id:data.roomId});
        roomUser(data.roomId);
        io.emit('view-room', roomList);
    });

    socket.on('room-out', data=>{
        roomInUser.splice(roomInUser.findIndex(x => x.id === data.id), 1);
        socket.leave(data.roomId);
        roomUser(data.id);
        roomMax({check:false, id:data.roomId});
        socket.emit('game');
        io.emit('view-room', roomList);
    });

    let roomUser = data =>{
        let a = []; 
        for(let i =0; i < roomInUser.length; i++){
            if(roomInUser[i].roomId === data){
               a.push(roomInUser[i]);
            }
        }
        io.to(data).emit('room-user', a);
    };

    let roomMax = data =>{
        let roomMax = roomList.find(x => x.roomId === data.id);
        if(data.check){
            roomMax.user++;
        }else{
            roomMax.user--;
            if(roomMax.user === 0) roomList.splice(roomList.findIndex(x=> x.id === data.id), 1);
        }
    };

    socket.on('chating-msg', data=>{
        let sendUser = userList.find(x => x.id === socket.id);
        io.to(data.roomId).emit('chating-awesome', {id:sendUser.id, nickName:sendUser.nickName, msg:data.msg});
    });
});

server.listen(54000, ()=>{
    console.log("서버 실행중");
});
