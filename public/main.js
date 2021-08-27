window.onload = function () {
    let socket = null;
    const main = new Vue({
        el: "#main",
        mounted() {
            this.socket = new io();
            socket = this.socket;
            this.socket.on('user-list', data => { this.userList = data });
            this.socket.on('login-ok', data => { this.isLogin = true; });
            this.socket.on('awesome', data => {this.chatList.push(data); this.scroll();} );
            this.socket.emit('room');
            this.socket.on('view-room', data=>{this.roomList = data});
            this.socket.on('game', ()=> {this.game = false;});
        },
        data: {
            game:false,
            nickName: '',
            isLogin: false,
            socket: null,
            userList: [],
            msg: '',
            chatList: [],
            nullValue:/\s/,
            room: false,
            roomName:'',
            roomPassword:'',
            roomList:[],
            check:''
        },

        methods: {
            login() {
                if (this.nullValue.exec(this.nickName) || this.nickName === ""){
                    alert("닉네임에 공백은 넣을 수 없습니다.");
                    return;
                } 
                if(this.userList.findIndex(x => x.nickName === this.nickName) >= 0){
                    alert("중복되는 닉네임 입니다.");
                    return;
                }
                this.socket.emit('login', this.nickName);
            },
            sendMsg() {
                if (this.msg === "" || this.msg.length >= 500) return;
                this.socket.emit('chat-msg', this.msg);
                this.msg = "";
            },
            scroll() {
                if(this.nickName === ""){
                    return;
                }else{
                    if(this.game === true) return;
                    const msgBox = document.querySelector("#main .msgBox");
                    let scrollInterval = setInterval(() => {
                    msgBox.scrollTop = msgBox.scrollHeight;
                    clearInterval(scrollInterval);
                }, 10);
                }
            },
            createRoom(){
                const selectGame = document.querySelector("#selectGame").value;
                if(this.roomName === "" || selectGame === ""){
                    alert("방 이름 또는 게임을 선택해주세요.");
                    return;   
                }
                this.socket.emit('createRoom', {roomName:this.roomName, roomPassword:this.roomPassword, selectGame:selectGame, max:4, user:1, nickName:this.nickName, id:this.socket.id, ready:false});
                this.game = true;
                this.room = false;
                this.roomName = "";
                this.roomPassword = "";
                this.chatList = [];
            },
            inRoom(roomPassword, roomName, selectGame, roomId){
                if(roomPassword !== ""){
                    alert("비밀번호를 입력해주세요.")
                    return;
                }else{
                    if (confirm("방에 들어가시겠습니까?") == true){
                        let room = this.roomList.find(x=> x.roomId === roomId);
                        if(room.user === room.max) alert("인원이 꽉찼습니다.");
                        else{
                            this.socket.emit('room-in', {nickName:this.nickName, roomName:roomName, id:this.socket.id, selectGame:selectGame, roomId : roomId, ready:false});
                            this.game = true;
                            this.chatList = [];
                        }   
                    }else{ 
                        return;
                    }
                }
            }
        }
    })
//---------------------------------------------------------------------------------------------------------------------------------------
    const chating = new Vue({
        el:".mainChating",
        mounted(){
            this.socket = socket;
            this.socket.on('room-user', data => {this.roomInUser = data.roomInUser;});
            this.socket.on('chating-in-room', () =>{this.isChating = true});
            this.socket.on('chating-awesome', data=> {this.chatList.push(data); this.scroll();});
        },
        data:{
            socket: null,
            roomInUser:[],
            isChating:false,
            msg:'',
            chatList:[]
        },
        methods:{
            sendMsg(){
                if (this.msg === "" || this.msg.length >= 500) return;
                this.socket.emit('chating-msg', {msg:this.msg, roomId:this.roomInUser[0].roomId});
                this.msg = "";
            },
            scroll() {
                
                if(this.isChating === false) return;
                    const msgBox = document.querySelector(".mainChating .msgBox");
                    let scrollInterval = setInterval(() => {
                    msgBox.scrollTop = msgBox.scrollHeight;
                    clearInterval(scrollInterval);
                }, 10);
            },
            roomOut(){
                if (confirm("정말 나가시겠습니까?") == true){
                    this.isChating = false;
                    this.chatList = [];
                    this.socket.emit('room-out', {id:this.socket.id, roomId:this.roomInUser[0].roomId });
                }else{ 
                    return;
                }
            }
        }
    })
//---------------------------------------------------------------------------------------------------------------------------------------
    const mafia = new Vue({
        el:".mainMafia",
        mounted(){
            this.socket = socket;
            this.socket.on('room-user', data => {this.roomInUser = data.roomInUser;  this.host = data.host;});
            this.socket.on('mafia-in-room', () =>{this.isMafia = true; this.idx = this.roomInUser.length;});
            this.socket.on('mafia-awesome', data=> {this.chatList.push(data); this.scroll();});
            this.socket.on('mafia-gamestart', data=>{this.gameStart = true; this.job = data.jobList[this.idx - 1]; this.jobList = data.jobList; this.cycle();});
        },
        data:{
            socket: null,
            roomInUser:[],
            isMafia:false,
            msg:'',
            chatList:[],
            host:'',
            readyBtn:false,
            gameStart:false,
            idx:0,
            job:'',
            jobList:[],
            guide:'게임 가이드 창입니다.',
            page:0,
            time:0,
            overlap:true
        },
        methods:{
            sendMsg(system){
                switch(system){
                    case null:
                        if (this.msg === "" || this.msg.length >= 500) return;
                        this.socket.emit('mafia-msg', {msg:this.msg, roomId:this.roomInUser[0].roomId,system:false});
                        this.msg = "";
                        break;
                    default:
                        if (this.msg === "" || this.msg.length >= 500) return;
                        this.socket.emit('mafia-msg', {msg:this.msg, roomId:this.roomInUser[0].roomId,system:true});
                        this.msg = "";
                        break;
                }
            },
            scroll() {
                if(this.isMafia === false) return;
                let masBox;
                switch(this.gameStart){
                    case false:
                        msgBox = document.querySelector(".mainMafia .msgBoxM");
                        break;
                    case true:
                        msgBox = document.querySelector(".mainMafia .playMsgBoxM");
                        break; 
                }
                let scrollInterval = setInterval(() => {
                    msgBox.scrollTop = msgBox.scrollHeight;
                    clearInterval(scrollInterval);
                }, 10);
            },
            roomOut(){
                if (confirm("정말 나가시겠습니까?") == true){
                    this.isMafia = false;
                    this.gameStart = false;
                    this.page = 0;
                    this.time = 0;
                    this.chatList = [];
                    this.socket.emit('room-out', {id:this.socket.id, roomId:this.roomInUser[0].roomId });
                    this.cycle(true);
                }else{ 
                    return;
                }
            },
            gameStart2(){
                if(this.roomInUser.length < 0){
                    alert("인원수가 적습니다."); 
                    return;
                }else{
                    let check = true;
                    for(let i = 0; i < this.roomInUser.length; i++){
                        if(this.roomInUser[i].id === this.host) i++;
                        else if(!this.roomInUser[i].ready) check = false;
                    }
                    if(check){
                        alert("게임을 시작합니다.");
                        this.socket.emit('mafia-gamestart', {roomId:this.roomInUser[0].roomId});
                    }else{
                        alert("준비를 안한 유저가 있습니다.");
                        return;
                    }
                } 
            },
            ready(){
                this.readyBtn = !this.readyBtn;
                this.socket.emit('ready', this.readyBtn);
            },
            cycle(){
                let pageCycle = setInterval(()=>{
                    if(this.time !==0) this.time--;
                    if(this.time === 0){
                        switch(this.page){
                            case 3:
                                this.page = 1;
                                clearInterval(pageCycle);
                                this.cycle();
                                break;
                            case 4:
                                break;
                            case 5:
                                break;
                            default:
                                this.page++;
                                clearInterval(pageCycle);
                                this.cycle();
                                break;
                        }
                    }
                }, 1000);

                switch(this.page){
                    case 0:
                        this.time = 5;
                        this.guide = '낮이 되었습니다. 당신의 직업은 '+this.job.jobName+'입니다.';
                        break;
                    case 1:
                        this.time = 15;
                        this.guide = '투표시간입니다. 의심되는 사람을 투표해주세요.';
                        break;
                    case 2:
                        this.time = 5;
                        this.overlap = true;
                        this.result();
                        this.guide = '밤이 되었습니다. '+this.job.jobMent;
                        break;
                    case 3:
                        this.time = 5;
                        this.overlap = true;
                        this.guide = '낮이 되었습니다.';
                        break;
                    case 4:
                        this.time = 5;
                        this.guide = '시민의 승리입니다.';
                        break;
                    case 5:
                        this.time = 5;
                        this.guide = '마피아의 승리입니다.';
                        break;
                }
            },
            clickEvent(nickName){
                switch(this.page){
                    case 1:
                        if(!this.overlap) return;
                        if(this.roomInUser[this.idx - 1].nickName === nickName) return;
                        for(let i = 0; i < this.roomInUser.length; i++){
                            if(this.roomInUser[i].nickName === nickName){
                                this.jobList[i].vote++;
                            }
                        }
                        this.msg = nickName+"님 1표";
                        this.sendMsg();
                        this.overlap = false;
                        break;
                    case 2:
                        break;
                }
            },
            result(){
                switch(this.page){
                    case 2:
                        let max = 0;
                        let death = [];
                        for(let i = 0; i < this.jobList.length; i++){
                            if(this.jobList[i].vote > max){
                                max = this.jobList[i].vote;
                                death = this.jobList[i];
                            }else if(this.jobList[i].vote === max){
                                max = 0;
                                death = [];
                            }
                        }
                        this.death(death);
                        break;
                }
            },
            death(death){
                switch(death){
                    case !null:
                        break;
                }
            }
        }
    })
}
