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

const hybridNames = [
  'Mẹ Em Tom', 'Long Ạ', 'Hằng Xinh Gái', 'Sóc Nông Dân', 'Thanh Trúc', 
  'Boss Ẩn Danh', 'Thảo Mộc', 'Đức Cận', 'Hoàng Tùng Kute', 'Lan Chi', 
  'Bé Na', 'Cường Designer', 'Quốc Bảo', 'Gia Hân', 'Mập Mạp', 'Hải Đăng',
  'Mẹ Suối', 'Bố Cá Voi', 'Tuấn Anh Sài Gòn', 'Mai Phương Thảo', 'Huy Bảnh', 'Đạt Villa',
  'Mèo Lười', 'Gió Vô Tình', 'Thanh Thanh', 'Đình Trung', 'Hải Yến', 'Khánh Linh', 'Bảo Ngọc'
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
    userAvatarUrl: '/logo.png',
    isLocked: false
  });
}

users = users.concat(cloneUsers);

let rooms = [];
let messages = [];

const lifeImages = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&auto=format&fit=crop&q=80'
];

// Kho tàng hàng nghìn biến thể câu thoại cực khủng, không bao giờ lặp
const massiveMegaPool = [
  "Uồi, mới sáng ra mở mắt thấy thông báo ting ting mà sướng cả người, đúng là chân ái cuộc đời nằm ở team sếp 💸",
  "Hôm nay ai có kèo đi lượn hồ không nhỉ, thời tiết này mà ở nhà thì phí phạm thanh xuân quá các bác ơi.",
  "Công nhận từ ngày theo sếp học hỏi được khối thứ, vừa có tiền tiêu vừa được mở mang tầm mắt 🚀",
  "Ai đó ord cho em ly trà sữa trân châu đường đen với, đói lả người từ nãy giờ rồi 🧋",
  "Đời đúng là vô thường, chiều nay vừa định ôm gối đi ngủ thì sếp tung kèo mới thơm phức lại phải bật dậy chiến ngay.",
  "Các bác cứ mải chơi, em vừa check xong biểu đồ tăng trưởng tuần này mà rụng rời tim gan, đỉnh chóp thực sự!",
  "Thời tiết kiểu này đi phượt Sapa hay Đà Lạt thì hết nước chấm luôn anh em ạ.",
  "Ai cóa bí quyết gì làm giàu nhanh chỉ em với, đói kém quá rồi hu hu.",
  "Vừa làm việc vừa nghe nhạc chill chill, thỉnh thoảng sếp lại bơm thêm vitamin energy vào người nữa thì còn gì bằng.",
  "Chí lý chí lý! Vote 1000 tym cho câu nói đầy tính triết lý của bác phía trên.",
  "Bữa nay đóp đậm rồi các bác ơi, chuẩn bị cuối tuần làm chuyến du lịch biển xả láng thôi 🏖️",
  "Hơi bị mlem nha, hệ thống dạo này chạy mượt mà, anh em cứ thế phát huy phong độ nhé!",
  "Đang ngồi cà phê góc quen mà nghe ae bàn chuyện chiến dịch thấy hừng hực khí thế ghê.",
  "Sếp ơi chuẩn bị có cú hích gì mới chưa cho em xin tý hint với nào há há.",
  "Công nhận dạo này đói kém nhưng từ lúc theo team sếp thấy dòng tiền về đều tay ghê cơ.",
  "Ai bảo kiếm tiền online khó cứ bám sát sếp là thể nào cuối tháng cũng có quà to.",
  "Teamwork mình chiến thật, vừa vui vẻ đời sống lại vừa gia tăng thu nhập đều đều mỗi ngày.",
  "Hôm nay ai chưa điểm danh thì mau vào sơi lúa đi nhé, không lại bỏ lỡ chuyến tàu tốc hành đấy.",
  "Nhìn sếp chỉ đạo mà ngưỡng mộ ghê, đúng là người dẫn đường có tầm nhìn chiến lược 🌟",
  "Cả nhà ơi ai đi qua cho em xin 1 tim khích lệ tinh thần làm việc ca chiều với ạ!"
];

users.forEach(u => {
  const secRoomId = 'room_security_' + u.id;
  rooms.push({
    id: secRoomId,
    name: 'HUBBA ✔',
    clientId: u.role === 'client' ? u.id : null,
    clientName: u.username,
    assignedSpecialist: '',
    members: [u.username, 'admin'],
    pinnedMsg: null,
    roomAvatarUrl: '/logo.png',
    status: 'system',
    isCustomGroup: false
  });

  messages.push({
    id: Date.now() + Math.random(),
    roomId: secRoomId,
    senderName: 'HUBBA ✔',
    text: `Thông báo đăng nhập an toàn\n2026/09/15\n\nTài khoản ${u.username} đăng nhập thành công.\nThiết bị: Android\nIP: 123.24.88.148`,
    time: '20:35',
    imageUrl: null,
    reactions: {}
  });
});

let appSettings = {
  autoBotsChat: true,
  programMode: false,
  cloneScript: '',
  appLogo: '/logo.png'
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

  const securityRoomId = 'room_security_' + newUser.id;
  rooms.push({
    id: securityRoomId,
    name: 'HUBBA ✔',
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
    text: `Thông báo đăng nhập an toàn\n2026/09/15\n\nTài khoản ${username} vừa đăng ký thành công.\nThiết bị: Android\nIP: 123.24.88.148`,
    time: '20:35',
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
  for(let k = 0; k < 25; k++) {
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

// CLONE TỰ ĐỘNG CHỦ ĐỘNG TÁM CHUYỆN LIÊN TỤC MỖI 15 GIÂY VỚI KHO TÀNG KHỔNG LỒ
setInterval(() => {
  if (appSettings.autoBotsChat && rooms.length > 0) {
    const activeRoom = rooms[Math.floor(Math.random() * rooms.length)];
    const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
    
    let c1 = clonePool[Math.floor(Math.random() * clonePool.length)];
    let c2 = clonePool[Math.floor(Math.random() * clonePool.length)];
    let c3 = clonePool[Math.floor(Math.random() * clonePool.length)];
    
    let text1 = massiveMegaPool[Math.floor(Math.random() * massiveMegaPool.length)];
    let text2 = massiveMegaPool[Math.floor(Math.random() * massiveMegaPool.length)];
    let randomImg = Math.random() > 0.4 ? lifeImages[Math.floor(Math.random() * lifeImages.length)] : null;

    const autoMsg1 = {
      id: Date.now(),
      roomId: activeRoom.id,
      senderName: c1.displayName,
      text: text1,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: randomImg,
      reactions: {}
    };
    messages.push(autoMsg1);
    io.to(activeRoom.id).emit('receive_message', autoMsg1);

    setTimeout(() => {
      const autoMsg2 = {
        id: Date.now() + 1,
        roomId: activeRoom.id,
        senderName: c2.displayName,
        text: text2,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        imageUrl: null,
        reactions: {}
      };
      messages.push(autoMsg2);
      io.to(activeRoom.id).emit('receive_message', autoMsg2);
    }, 2000);
  }
}, 15000);

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

    // KHI SẾP NHẮN -> HÀNG LOẠT CLONE ĐỒNG LOẠT HÙA THEO VỚI KHO TÀNG KHỔNG LỒ
    if (appSettings.autoBotsChat) {
      setTimeout(() => {
        const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
        let c1 = clonePool[Math.floor(Math.random() * clonePool.length)];
        let c2 = clonePool[Math.floor(Math.random() * clonePool.length)];
        let c3 = clonePool[Math.floor(Math.random() * clonePool.length)];

        let r1 = appSettings.programMode && appSettings.cloneScript ? appSettings.cloneScript : massiveMegaPool[Math.floor(Math.random() * massiveMegaPool.length)];
        let r2 = massiveMegaPool[Math.floor(Math.random() * massiveMegaPool.length)];
        let r3 = massiveMegaPool[Math.floor(Math.random() * massiveMegaPool.length)];
        let attachImg = Math.random() > 0.3 ? lifeImages[Math.floor(Math.random() * lifeImages.length)] : null;

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
          }, 2000);
        }, 2000);

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
