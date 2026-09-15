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
  { id: 2, roomId: 'room_general', senderName: 'QUẢN LÍ HỆ THỐNG', text: 'Chào mừng sếp đã quay trở lại hệ thống HUBBA!', time: '20:40', imageUrl: null, reactions: {} }
];

// Kho ảnh thực tế 100% đời sống (thỉnh thoảng mới xuất hiện 1 ảnh)
const realLifeImages = [
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=80'
];

const pool1 = [
  "Uồi, ngồi cà phê góc quen tranh thủ check đơn cùng sếp mà thấy rôm rả phết, nay anh em đóp đậm nhé!",
  "Hôm nay ai có kèo đi lượn phố không nhỉ, thời tiết này ở nhà thì phí phạm thanh xuân lắm các bác ơi.",
  "Công nhận từ ngày theo sếp học hỏi được khối thứ, vừa có tiền tiêu vừa được mở mang tầm mắt 🚀",
  "Ai đó ord cho em ly trà sữa trân châu đường đen với, đói lả người từ nãy giờ rồi 🧋",
  "Đời đúng là vô thường, chiều nay vừa định ôm gối đi ngủ thì sếp tung kèo mới thơm phức lại phải bật dậy chiến ngay."
];

const pool2 = [
  "Các bác cứ mải chơi, em vừa check xong biểu đồ tăng trưởng tuần này mà rụng rời tim gan, đỉnh chóp thực sự!",
  "Thời tiết kiểu này ngồi văn phòng nhâm nhi cốc cà phê làm việc thì hết nước chấm luôn anh em ạ.",
  "Ai cóa bí quyết gì làm giàu nhanh chỉ em với, đói kém quá rồi hu hu.",
  "Vừa làm việc vừa nghe nhạc chill chill, thỉnh thoảng sếp lại bơm thêm vitamin energy vào người nữa thì còn gì bằng.",
  "Chí lý chí lý! Vote 1000 tym cho câu nói đầy tính triết lý của bác phía trên."
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

// CLONE TỰ ĐỘNG CHÁY MÁY MỖI 7 GIÂY (THỈNH THỎANG MỚI GỬI 1 ẢNH)
setInterval(() => {
  if (appSettings.autoBotsChat && rooms.length > 0) {
    const activeRoom = rooms[Math.floor(Math.random() * rooms.length)];
    if (activeRoom.id === 'room_hubba_system') return;

    const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
    let c1 = clonePool[Math.floor(Math.random() * clonePool.length)];
    let c2 = clonePool[Math.floor(Math.random() * clonePool.length)];
    let c3 = clonePool[Math.floor(Math.random() * clonePool.length)];
    
    while(c2.id === c1.id) c2 = clonePool[Math.floor(Math.random() * clonePool.length)];
    while(c3.id === c1.id || c3.id === c2.id) c3 = clonePool[Math.floor(Math.random() * clonePool.length)];

    let t1 = pool1[Math.floor(Math.random() * pool1.length)];
    let t2 = `@${c1.displayName} Chuẩn không cần chỉnh luôn bác ơi, quá hợp lý!`;
    let t3 = `@${c2.displayName} Hóng kèo thơm cùng sếp quá cơ 🚀`;
    
    // Tỷ lệ thấp (20%): Thỉnh thoảng mới có 1 con gửi ảnh đời thực
    let shouldSendImg = Math.random() < 0.2;
    let attachImg = shouldSendImg ? realLifeImages[Math.floor(Math.random() * realLifeImages.length)] : null;

    const msg1 = { id: Date.now(), roomId: activeRoom.id, senderName: c1.displayName, text: t1, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), imageUrl: attachImg, reactions: {} };
    const msg2 = { id: Date.now() + 1, roomId: activeRoom.id, senderName: c2.displayName, text: t2, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), imageUrl: null, reactions: {} };
    const msg3 = { id: Date.now() + 2, roomId: activeRoom.id, senderName: c3.displayName, text: t3, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), imageUrl: null, reactions: {} };

    messages.push(msg1);
    io.to(activeRoom.id).emit('receive_message', msg1);

    setTimeout(() => {
      messages.push(msg2);
      io.to(activeRoom.id).emit('receive_message', msg2);
      setTimeout(() => {
        messages.push(msg3);
        io.to(activeRoom.id).emit('receive_message', msg3);
      }, 800);
    }, 800);
  }
}, 7000);

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

    // KHI SẾP NHẮN -> 4 CON CLONE PHẢN HỒI LẬP TỨC TRONG 0.5 GIÂY, THỈNH THỎANG MỚI CÓ 1 ẢNH
    if (appSettings.autoBotsChat) {
      setTimeout(() => {
        const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
        let c1 = clonePool[Math.floor(Math.random() * clonePool.length)];
        let c2 = clonePool[Math.floor(Math.random() * clonePool.length)];
        let c3 = clonePool[Math.floor(Math.random() * clonePool.length)];
        let c4 = clonePool[Math.floor(Math.random() * clonePool.length)];

        while(c2.id === c1.id) c2 = clonePool[Math.floor(Math.random() * clonePool.length)];
        while(c3.id === c1.id || c3.id === c2.id) c3 = clonePool[Math.floor(Math.random() * clonePool.length)];
        while(c4.id === c1.id || c4.id === c2.id || c4.id === c3.id) c4 = clonePool[Math.floor(Math.random() * clonePool.length)];

        let r1 = appSettings.programMode && appSettings.cloneScript ? appSettings.cloneScript : `Dạ em nghe sếp chỉ đạo vụ "${data.text}" đây ạ, anh em đang bám sát chiến dịch từng phút! 🔥`;
        let r2 = `@${c1.displayName} Chuẩn sếp gọi là có mặt ngay lập tức không trượt phát nào!`;
        let r3 = `@${c2.displayName} @${c1.displayName} Cứ theo hướng này mà triển khai thôi các bác ơi.`;
        let r4 = `Quá đỉnh chóp! Vote 1000 tym cho sếp 😍`;
        
        let shouldSendImg = Math.random() < 0.25; // 25% tỷ lệ thỉnh thoảng mới có ảnh
        let attachImg = shouldSendImg ? realLifeImages[Math.floor(Math.random() * realLifeImages.length)] : null;

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
            }, 600);

          }, 600);
        }, 600);

      }, 300);
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
