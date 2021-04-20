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
                this.game = true;
                this.socket.emit('createRoom', {roomName:this.roomName, roomPassword:this.roomPassword, selectGame:selectGame, max:4, user:1, nickName:this.nickName, id:this.socket.id});
                this.room = false;
                this.roomName = "";
                this.roomPassword = "";
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
                            this.game = true;
                            this.socket.emit('room-in', {nickName:this.nickName, roomName:roomName, id:this.socket.id, selectGame:selectGame, roomId : roomId});
                        }   
                    }else{ 
                        return;
                    }
                }
            }
        }
    })

    const chating = new Vue({
        el:".mainChating",
        mounted(){
            this.socket = socket;
            this.socket.on('room-user', data => {this.roomInUser = data; this.roomName = this.roomInUser.roomName;});
            this.socket.on('chating-in-room', () =>{this.isChating = true});
            this.socket.on('chating-awesome', data=> {this.chatList.push(data); this.scroll();});
        },
        data:{
            socket: null,
            roomInUser:[],
            roomName:'',
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
                if(this.nickName === ""){
                    return;
                }else{
                    if(this.isChating === false) return;
                    const msgBox = document.querySelector(".mainChating .msgBox");
                    let scrollInterval = setInterval(() => {
                    msgBox.scrollTop = msgBox.scrollHeight;
                    clearInterval(scrollInterval);
                }, 10);
                }
            },
            roomOut(){
                if (confirm("정말 나가시겠습니까?") == true){
                    this.isChating = false;
                    this.socket.emit('room-out', {id:this.socket.id, roomId:this.roomInUser[0].roomId });
                }else{ 
                    return;
                }
            }
        }
    })

    const mafia = new Vue({
        el:".mainMafia",
        mounted(){
            this.socket = socket;
            this.socket.on('room-user', data => {this.roomInUser = data; this.roomName = this.roomInUser.roomName;});
            this.socket.on('mafia-in-room', () =>{this.isMafia = true});
            this.socket.on('chating-awesome', data=> {this.chatList.push(data); this.scroll();});
        },
        data:{
            socket: null,
            roomInUser:[],
            roomName:'',
            isMafia:false,
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
                if(this.nickName === ""){
                    return;
                }else{
                    if(this.isChating === false) return;
                    const msgBox = document.querySelector(".mainChating .msgBox");
                    let scrollInterval = setInterval(() => {
                    msgBox.scrollTop = msgBox.scrollHeight;
                    clearInterval(scrollInterval);
                }, 10);
                }
            },
            roomOut(){
                if (confirm("정말 나가시겠습니까?") == true){
                    this.isChating = false;
                    this.socket.emit('room-out', {id:this.socket.id, roomId:this.roomInUser[0].roomId });
                }else{ 
                    return;
                }
            }
        }
    })
}