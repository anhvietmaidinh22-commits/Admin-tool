const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let users = [
  { id: 'admin_1', username: 'admin', password: '123321', role: 'admin', avatar: '👑', displayName: 'QUẢN LÍ HỆ THỐNG', accountId: 'hubba_admin_01', userAvatarUrl: '/logo.png', isLocked: false },
  { id: 'cv_1', username: 'chuyenviena', password: '123', role: 'specialist', avatar: '👨‍💼', displayName: 'Chuyên Viên A', accountId: 'staff_a_02', userAvatarUrl: '/logo.png', isLocked: false }
];

let rooms = [];
let messages = [];

const cloneNames = ['Minh Hoàng', 'Lan Anh', 'Đức Anh', 'Thanh Hằng', 'Quốc Bảo', 'Thuỳ Linh', 'Gia Hân', 'Hoàng Long'];

let appSettings = {
  autoBotsChat: true,
  cloneScript: 'Dạ em nghe sếp ơi, để em xử lý ngay và luôn ạ!',
  appLogo: '/logo.png'
};

app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: appSettings });
});

app.post('/api/settings', (req, res) => {
  const { autoBotsChat, cloneScript, appLogo } = req.body;
  if(autoBotsChat !== undefined) appSettings.autoBotsChat = autoBotsChat;
  if(cloneScript !== undefined) appSettings.cloneScript = cloneScript;
  if(appLogo !== undefined) appSettings.appLogo = appLogo;

  io.emit('update_settings', appSettings);
  res.json({ success: true, settings: appSettings });
});

app.post('/api/update-room-info', (req, res) => {
  const { roomId, roomName, roomAvatarUrl } = req.body;
  const room = rooms.find(r => r.id === roomId);
  if (!room) return res.status(400).json({ success: false, message: 'Không tìm thấy nhóm!' });

  if(roomName) room.name = roomName;
  if(roomAvatarUrl) room.roomAvatarUrl = roomAvatarUrl;

  io.emit('update_data', { rooms, users });
  res.json({ success: true, room, rooms });
});

app.post('/api/add-member', (req, res) => {
  const { roomId, username } = req.body;
  const room = rooms.find(r => r.id === roomId);
  if (!room) return res.status(400).json({ success: false, message: 'Không tìm thấy nhóm!' });

  if(!room.members) room.members = [];
  if(!room.members.includes(username)) room.members.push(username);

  io.emit('update_data', { rooms, users });
  res.json({ success: true, rooms });
});

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Thiếu thông tin!' });
  
  if (username === 'admin') {
    return res.status(400).json({ success: false, message: 'Tên tài khoản không hợp lệ!' });
  }

  const existing = users.find(u => u.username === username);
  if (existing) return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại!' });

  const newUser = {
    id: 'user_' + Date.now(),
    username: username,
    password: password,
    role: 'client',
    avatar: '👤',
    displayName: username,
    accountId: 'client_' + Math.floor(1000 + Math.random() * 9000),
    userAvatarUrl: '/logo.png',
    isLocked: false
  };
  users.push(newUser);

  const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const securityRoomId = 'room_security_' + newUser.id;

  rooms.push({
    id: securityRoomId,
    name: 'HUBBA',
    clientId: newUser.id,
    clientName: username,
    assignedSpecialist: '',
    members: [username, 'admin'],
    pinnedMsg: null,
    roomAvatarUrl: '/logo.png',
    status: 'system',
    isCustomGroup: false
  });

  messages.push({
    id: Date.now(),
    roomId: securityRoomId,
    senderName: 'HUBBA ✔',
    text: `Thông báo đăng nhập an toàn\n${nowStr}\n\nTài khoản của bạn vừa đăng ký thành công trên thiết bị mới.\nThời gian: ${new Date().toLocaleTimeString()}\nIP đăng nhập: 123.24.88.148\n\nNếu đây không phải là thao tác của bạn, vui lòng liên hệ ngay bộ phận quản trị!`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    imageUrl: null,
    reactions: {}
  });

  io.emit('update_data', { rooms, users });
  res.json({ success: true, user: newUser });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu!' });

  if(user.isLocked) return res.status(400).json({ success: false, message: 'Tài khoản đã bị khóa!' });

  if (user.role === 'client') {
    const hasSecRoom = rooms.find(r => r.clientId === user.id);
    if (!hasSecRoom) {
      const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
      const securityRoomId = 'room_security_' + user.id;

      rooms.push({
        id: securityRoomId,
        name: 'HUBBA',
        clientId: user.id,
        clientName: user.username,
        assignedSpecialist: '',
        members: [user.username, 'admin'],
        pinnedMsg: null,
        roomAvatarUrl: '/logo.png',
        status: 'system',
        isCustomGroup: false
      });
      messages.push({
        id: Date.now(),
        roomId: securityRoomId,
        senderName: 'HUBBA ✔',
        text: `Thông báo đăng nhập an toàn\n${nowStr}\n\nTài khoản của bạn vừa đăng nhập thành công trên thiết bị mới.\nThời gian: ${new Date().toLocaleTimeString()}\nIP đăng nhập: 123.24.88.148`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        imageUrl: null,
        reactions: {}
      });
    }
  }

  res.json({ success: true, user, rooms, users, settings: appSettings });
});

app.post('/api/update-profile', (req, res) => {
  const { userId, displayName, userAvatarUrl } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(400).json({ success: false, message: 'Không tìm thấy người dùng!' });

  if(displayName) user.displayName = displayName;
  if(userAvatarUrl) user.userAvatarUrl = userAvatarUrl;

  io.emit('update_data', { rooms, users });
  res.json({ success: true, user, users });
});

app.post('/api/delete-specialist', (req, res) => {
  const { specialistId } = req.body;
  users = users.filter(u => u.id !== specialistId);
  io.emit('update_data', { rooms, users });
  res.json({ success: true, users });
});

app.post('/api/create-room', (req, res) => {
  const { name, clientName, specialistName } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Thiếu tên nhóm!' });

  const newRoom = {
    id: 'room_' + Date.now(),
    name: name,
    clientId: null,
    clientName: clientName || 'Thành viên',
    assignedSpecialist: specialistName || '',
    members: ['admin', clientName].filter(Boolean),
    pinnedMsg: null,
    roomAvatarUrl: '/logo.png',
    status: 'assigned',
    isCustomGroup: true
  };
  rooms.push(newRoom);

  io.emit('update_data', { rooms, users });
  res.json({ success: true, rooms });
});

app.post('/api/create-specialist', (req, res) => {
  const { username, password, displayName } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Thiếu thông tin!' });

  const existing = users.find(u => u.username === username);
  if (existing) return res.status(400).json({ success: false, message: 'Tên tài khoản đã tồn tại!' });

  const newSpecialist = {
    id: 'cv_' + Date.now(),
    username: username,
    password: password,
    role: 'specialist',
    avatar: '🤖',
    displayName: displayName || username,
    accountId: 'staff_' + Math.floor(1000 + Math.random() * 9000),
    userAvatarUrl: '/logo.png',
    isLocked: false
  };
  users.push(newSpecialist);

  io.emit('update_data', { rooms, users });
  res.json({ success: true, users });
});

io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    const room = rooms.find(r => r.id === roomId);
    const roomMsgs = messages.filter(m => m.roomId === roomId);
    socket.emit('load_room_data', { messages: roomMsgs, pinnedMsg: room ? room.pinnedMsg : null, roomAvatarUrl: room ? room.roomAvatarUrl : '/logo.png', roomName: room ? room.name : 'Phòng Chat' });
  });

  socket.on('send_message', (data) => {
    const senderObj = users.find(u => u.username === data.senderName) || { displayName: data.senderName };
    const actualSenderName = senderObj.displayName || data.senderName;

    const newMessage = {
      id: Date.now(),
      roomId: data.roomId,
      senderName: actualSenderName,
      text: data.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: data.imageUrl || null,
      reactions: {}
    };

    messages.push(newMessage);
    io.to(data.roomId).emit('receive_message', newMessage);

    // CLONE TỰ ĐỘNG HÙA THEO SAU 3 GIÂY VỚI NỘI DUNG CÀI ĐẶT RIÊNG
    if (appSettings.autoBotsChat) {
      setTimeout(() => {
        const randomCloneName = cloneNames[Math.floor(Math.random() * cloneNames.length)];
        const replyText = appSettings.cloneScript || "Dạ em nghe sếp ơi, để em kiểm tra ngay lập tức ạ!";

        const botReply = {
          id: Date.now() + 1,
          roomId: data.roomId,
          senderName: randomCloneName,
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          imageUrl: null,
          reactions: {}
        };
        messages.push(botReply);
        io.to(data.roomId).emit('receive_message', botReply);
      }, 3000);
    }
  });

  socket.on('pin_message', (data) => {
    const room = rooms.find(r => r.id === data.roomId);
    if(room) {
      room.pinnedMsg = data.text;
      io.to(data.roomId).emit('update_pinned', { pinnedMsg: room.pinnedMsg });
    }
  });

  socket.on('react_message', (data) => {
    const msg = messages.find(m => m.id === data.msgId);
    if(msg) {
      if(!msg.reactions) msg.reactions = {};
      msg.reactions[data.username] = data.emoji;
      io.to(data.roomId).emit('update_reaction', { msgId: data.msgId, reactions: msg.reactions });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HUBBA server đang chạy tại cổng ${PORT}`);
});
