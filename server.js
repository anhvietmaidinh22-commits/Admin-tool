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
  { id: 'admin_1', username: 'admin', password: '123321', role: 'admin', avatar: '👑', displayName: 'QUẢN LÍ HỆ THỐNG', accountId: 'hubba_admin_01', userAvatarUrl: 'https://i.ibb.co/NdVf8Btz/logo.png', isLocked: false },
  { id: 'cv_1', username: 'chuyenviena', password: '123', role: 'specialist', avatar: '👨‍💼', displayName: 'Chuyên Viên A', accountId: 'staff_a_02', userAvatarUrl: 'https://i.ibb.co/NdVf8Btz/logo.png', isLocked: false }
];

const hybridNames = [
  'Mẹ Em Tom', 'Long Ạ', 'Hằng Xinh Gái', 'Sóc Nông Dân', 'Thanh Trúc', 
  'Boss Ẩn Danh', 'Thảo Mộc', 'Đức Cận', 'Hoàng Tùng Kute', 'Lan Chi', 
  'Bé Na', 'Cường Designer', 'Quốc Bảo', 'Gia Hân', 'Mập Mạp', 'Hải Đăng',
  'Mẹ Suối', 'Bố Cá Voi', 'Tuấn Anh Sài Gòn', 'Mai Phương Thảo', 'Huy Bảnh', 'Đạt Villa'
];

let cloneUsers = [];
for(let i = 1; i <= 300; i++) {
  let randName = hybridNames[Math.floor(Math.random() * hybridNames.length)] + (Math.random() > 0.3 ? ' ' + Math.floor(Math.random()*99) : '');
  cloneUsers.push({
    id: 'clone_' + i,
    username: 'clone_' + i,
    password: '123',
    role: 'specialist',
    avatar: '🤖',
    displayName: randName,
    accountId: 'clone_id_' + (1000 + i),
    userAvatarUrl: 'https://i.ibb.co/NdVf8Btz/logo.png',
    isLocked: false
  });
}

users = users.concat(cloneUsers);

let rooms = [
  { id: 'room_hubba_system', name: 'HUBBA ✔', clientId: null, assignedSpecialist: null, members: users.map(u => u.username), pinnedMsg: null, roomAvatarUrl: 'https://i.ibb.co/NdVf8Btz/logo.png', status: 'system', isCustomGroup: false },
  { id: 'room_general', name: 'Phòng Tổng Đối Soát & Tương Tác', clientId: null, assignedSpecialist: null, members: users.map(u => u.username), pinnedMsg: null, roomAvatarUrl: 'https://i.ibb.co/NdVf8Btz/logo.png', status: 'active', isCustomGroup: true }
];

let messages = [
  { id: 1, roomId: 'room_hubba_system', senderName: 'HUBBA ✔', text: 'Thông báo hệ thống an toàn\n2026/09/15\n\nTài khoản hoạt động ổn định.\nThiết bị: Android\nIP: 123.24.88.148', time: '20:35', imageUrl: null, reactions: {} },
  { id: 2, roomId: 'room_general', senderName: 'QUẢN LÍ HỆ THỐNG', text: 'Chào mừng sếp và hàng trăm anh em đã sẵn sàng bùng nổ!', time: '20:40', imageUrl: null, reactions: {} }
];

// Kho ảnh thực tế 100% đời sống (Góc chụp điện thoại, bàn làm việc, quán nước thật)
const realLifeImages = [
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&auto=format&fit=crop&q=80'
];

let appSettings = {
  autoBotsChat: true,
  programMode: false,
  cloneScript: '',
  appLogo: 'https://i.ibb.co/NdVf8Btz/logo.png'
};

app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: appSettings });
});

app.post('/api/settings', (req, res) => {
  const { autoBotsChat, programMode, cloneScript, appLogo } = req.body;
  if(autoBotsChat !== undefined) appSettings.autoBotsChat = autoBotsChat;
  if(programMode !== undefined) appSettings.programMode = programMode;
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

app.post('/api/update-profile', (req, res) => {
  const { userId, displayName, userAvatarUrl } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(400).json({ success: false, message: 'Không tìm thấy người dùng!' });

  if(displayName) user.displayName = displayName;
  if(userAvatarUrl) user.userAvatarUrl = userAvatarUrl;

  io.emit('update_data', { rooms, users });
  res.json({ success: true, user, users });
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
    userAvatarUrl: 'https://i.ibb.co/NdVf8Btz/logo.png',
    isLocked: false
  };
  users.push(newUser);

  io.emit('update_data', { rooms, users });
  res.json({ success: true, user: newUser });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu!' });

  if(user.isLocked) return res.status(400).json({ success: false, message: 'Tài khoản đã bị khóa!' });

  io.emit('update_data', { rooms, users });
  res.json({ success: true, user, rooms, users, settings: appSettings });
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

  const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
  let selectedClones = [];
  for(let k = 0; k < 30; k++) {
    let randC = clonePool[Math.floor(Math.random() * clonePool.length)];
    if(randC && !selectedClones.includes(randC.username)) selectedClones.push(randC.username);
  }

  const newRoom = {
    id: 'room_' + Date.now(),
    name: name,
    clientId: null,
    clientName: clientName || 'Thành viên',
    assignedSpecialist: specialistName || '',
    members: ['admin', ...selectedClones, clientName].filter(Boolean),
    pinnedMsg: null,
    roomAvatarUrl: 'https://i.ibb.co/NdVf8Btz/logo.png',
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
  if (existing) return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại!' });

  const newSpecialist = {
    id: 'cv_' + Date.now(),
    username: username,
    password: password,
    role: 'specialist',
    avatar: '🤖',
    displayName: displayName || username,
    accountId: 'staff_' + Math.floor(1000 + Math.random() * 9000),
    userAvatarUrl: 'https://i.ibb.co/NdVf8Btz/logo.png',
    isLocked: false
  };
  users.push(newSpecialist);

  io.emit('update_data', { rooms, users });
  res.json({ success: true, users });
});

// CLONE TỰ ĐỘNG CHÁY MÁY LIÊN TỤC MỖI 8 GIÂY (NHÓM KHÔNG BAO GIỜ IM LẶNG)
setInterval(() => {
  if (appSettings.autoBotsChat && rooms.length > 0) {
    const activeRoom = rooms[Math.floor(Math.random() * rooms.length)];
    if (activeRoom.id === 'room_hubba_system') return;

    const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
    let c1 = clonePool[Math.floor(Math.random() * clonePool.length)];
    let c2 = clonePool[Math.floor(Math.random() * clonePool.length)];
    let c3 = clonePool[Math.floor(Math.random() * clonePool.length)];
    
    let msg1 = { id: Date.now(), roomId: activeRoom.id, senderName: c1.displayName, text: "Uồi nhóm mình dạo này xôm tụ phết nhờ anh em ơi, ae điểm danh cái nào 😂", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), reactions: {} };
    let msg2 = { id: Date.now() + 1, roomId: activeRoom.id, senderName: c2.displayName, text: `@${c1.displayName} Có mặt luôn bác ơi, đang ngồi cày quốc cùng sếp đây nè hì hì!`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), reactions: {} };
    let msg3 = { id: Date.now() + 2, roomId: activeRoom.id, senderName: c3.displayName, text: `@${c2.displayName} Hóng kèo thơm cùng sếp quá cơ, nhìn ví reo vui ghê 🚀`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), imageUrl: realLifeImages[Math.floor(Math.random() * realLifeImages.length)], reactions: {} };

    messages.push(msg1);
    io.to(activeRoom.id).emit('receive_message', msg1);

    setTimeout(() => {
      messages.push(msg2);
      io.to(activeRoom.id).emit('receive_message', msg2);
      setTimeout(() => {
        messages.push(msg3);
        io.to(activeRoom.id).emit('receive_message', msg3);
      }, 1000);
    }, 1000);
  }
}, 8000); // 8 giây tự động chat liên tục

io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    const room = rooms.find(r => r.id === roomId);
    const roomMsgs = messages.filter(m => m.roomId === roomId);
    socket.emit('load_room_data', { messages: roomMsgs, pinnedMsg: room ? room.pinnedMsg : null, roomAvatarUrl: room ? room.roomAvatarUrl : 'https://i.ibb.co/NdVf8Btz/logo.png', roomName: room ? room.name : 'Phòng Chat' });
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

    // KHI SẾP NHẮN -> 4 CON CLONE ĐỒNG LOẠT TAG TÊN NHAU HÙA THEO CỰC KỲ SỐNG ĐỘNG
    if (appSettings.autoBotsChat) {
      setTimeout(() => {
        const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
        let c1 = clonePool[Math.floor(Math.random() * clonePool.length)];
        let c2 = clonePool[Math.floor(Math.random() * clonePool.length)];
        let c3 = clonePool[Math.floor(Math.random() * clonePool.length)];
        let c4 = clonePool[Math.floor(Math.random() * clonePool.length)];

        let r1 = appSettings.programMode && appSettings.cloneScript ? appSettings.cloneScript : `Dạ em nghe sếp ơi! Anh em đang túc trực đầy đủ chiến cùng sếp câu "${data.text}" đây ạ 🔥`;
        let r2 = `@${c1.displayName} Chuẩn sếp gọi là có mặt ngay lập tức không trượt phát nào!`;
        let r3 = `@${c2.displayName} @${c1.displayName} Hôm nay có chỉ đạo gì mới thơm phức không các bác ơi?`;
        let r4 = `Tuyệt vời ông mặt trời! Vote 1000 tym cho sếp 😍`;
        let attachImg = realLifeImages[Math.floor(Math.random() * realLifeImages.length)];

        const m1 = { id: Date.now() + 1, roomId: data.roomId, senderName: c1.displayName, text: r1, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), imageUrl: attachImg, reactions: {} };
        messages.push(m1);
        io.to(data.roomId).emit('receive_message', m1);

        setTimeout(() => {
          const m2 = { id: Date.now() + 2, roomId: data.roomId, senderName: c2.displayName, text: r2, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), imageUrl: null, reactions: {} };
          messages.push(m2);
          io.to(data.roomId).emit('receive_message', m2);

          setTimeout(() => {
            const m3 = { id: Date.now() + 3, roomId: data.roomId, senderName: c3.displayName, text: r3, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), imageUrl: null, reactions: {} };
            messages.push(m3);
            io.to(data.roomId).emit('receive_message', m3);

            setTimeout(() => {
              const m4 = { id: Date.now() + 4, roomId: data.roomId, senderName: c4.displayName, text: r4, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), imageUrl: null, reactions: {} };
              messages.push(m4);
              io.to(data.roomId).emit('receive_message', m4);
            }, 1000);

          }, 1000);
        }, 1000);

      }, 1500);
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
