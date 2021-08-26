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
let jobList = [{jobCode:0,jobName:'마피아',jobMent:'죽일 사람들 선택하여주세요.',life:true,vote:0},{jobCode:1,jobName:'경찰',jobMent:'조사할 사람을 선택하여주세요.',life:true,vote:0},
{jobCode:2,jobName:'의사',jobMent:'살릴 사람을 선택하여주세요.',life:true,vote:0},{jobCode:3,jobName:'정치인',jobMent:'',life:true,vote:0}]; //직업 리스트
io.on("connect", socket => {
    console.log(socket.id + "연결");
    
    socket.on('login', data => {        
        userList.push({id:socket.id, nickName:data});
        socket.emit('login-ok', {id:socket.id, nickName:data});
        io.emit('user-list', userList);
    });

    socket.on('disconnect', ()=>{
        let idx = userList.findIndex(x => x.id === socket.id);
        let idx2 = roomInUser.findIndex(x => x.id === socket.id);
        if(idx < 0) return;
        console.log(userList.splice(idx, 1));
        roomInUser.splice(idx2,1);
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
        roomUser(roomMax.roomId);
        roomId++;
        if(data.selectGame === 'chating') socket.emit('chating-in-room');
        else if(data.selectGame === 'mafia') socket.emit('mafia-in-room');
    });

    socket.on('room', ()=>{
        io.emit('view-room', roomList);
    });

    socket.on('room-in', data=>{
        roomInUser.push(data);
        socket.join(data.roomId);
        roomMax({check:true, id:data.roomId});
        roomUser(data.roomId);
        if(data.selectGame === 'chating') socket.emit('chating-in-room');
        else if(data.selectGame === 'mafia') socket.emit('mafia-in-room');
        io.emit('view-room', roomList);
    });

    socket.on('room-out', data=>{
        roomInUser.splice(roomInUser.findIndex(x => x.id === data.id), 1);
        socket.leave(data.roomId);
        roomUser(data.roomId);
        roomMax({check:false, id:data.roomId});
        socket.emit('game');
        io.emit('view-room', roomList);
    });

    socket.on('chating-msg', data=>{
        let sendUser = userList.find(x => x.id === socket.id);
        io.to(data.roomId).emit('chating-awesome', {id:sendUser.id, nickName:sendUser.nickName, msg:data.msg});
    });

    socket.on('mafia-msg', data=>{
        let sendUser = userList.find(x => x.id === socket.id);
        switch(data.system){
            case true:
                io.to(data.roomId).emit('mafia-awesome', {id:null, nickName:'ststem', msg:data.msg});
                break;
            case false:
                io.to(data.roomId).emit('mafia-awesome', {id:sendUser.id, nickName:sendUser.nickName, msg:data.msg});
                break;
        }
    });

    socket.on('ready', data=>{
        let readyUser = roomInUser.find(x => x.id === socket.id);
        readyUser.ready = data;
        roomUser(readyUser.roomId);
    });

    socket.on('mafia-gamestart', data=>{        
        shuffleArray(jobList);
        io.to(data.roomId).emit('mafia-gamestart', {jobList:jobList});
    });

    function roomUser(data){
        let a = []; 
        let host = '';
        for(let i =0; i < roomInUser.length; i++){
            if(roomInUser[i].roomId === data){
               a.push(roomInUser[i]);
            }
        }
        for(let i =0; i < roomList.length; i++){
            if(roomList[i].roomId === data){
               host = roomList[i].id;
            }
        }
        io.to(data).emit('room-user', {roomInUser:a, host :host});
    };

    function roomMax(data){
        let roomMax = roomList.find(x => x.roomId === data.id);
        if(data.check){
            roomMax.user++;
        }else{
            roomMax.user--;
            if(roomMax.user === 0) roomList.splice(roomList.findIndex(x=> x.id === data.id), 1);
        }
    };

    function shuffleArray(inputArray){
        inputArray.sort(()=> Math.random() - 0.5);
    };
});

server.listen(54000, ()=>{
    console.log("서버 실행중");
});
