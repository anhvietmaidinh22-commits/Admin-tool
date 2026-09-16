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

const genzNicknames = [
  'Quạu Cơ', 'Trầm Zn', 'Flexer Chính Hiệu', 'Bảnh Trai Phết', 'Tài Phiệt', 
  'Hệ Đốt Lương', 'Genz Lười', 'Đâm Chồi Nảy Lộc', 'Mất Ngủ', 'Hệ Tư Duy', 
  'Chúa Chốt Đơn', 'Vua Té Nước', 'Lười Nhưng Giàu', 'Hệ Mỏ Lắm', 'Đại Gia Ổi',
  'Boss Ẩn Danh', 'Cục Súc Đại Nhân', 'Thích Đếm Tiền', 'Sống Lỏ', 'Hệ Bám Sếp',
  'Mê Tín Mê Tiền', 'Hết Cứu', 'Đại Trưởng Lão', 'Tấm Chiếu Mới', 'Hệ Ỉ I',
  'Hít Không Khí Sống', 'Chuyên Gia Hóng Biến', 'Vô Hạn Tài Chính', 'Hệ Xúc Xích', 'Thánh Nổ'
];

const genzFirstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Đỗ', 'Bùi', 'Đăng', 'Hồ', 'Dương', 'Phan', 'Vũ'];

let cloneUsers = [];
for(let i = 1; i <= 3000; i++) {
  let randGenZName = genzFirstNames[Math.floor(Math.random() * genzFirstNames.length)] + ' ' + 
                     genzNicknames[Math.floor(Math.random() * genzNicknames.length)] + ' ' + 
                     Math.floor(Math.random()*999);
  cloneUsers.push({
    id: 'clone_' + i,
    username: 'clone_' + i,
    password: '123',
    role: 'specialist',
    avatar: '🤖',
    displayName: randGenZName,
    accountId: 'genz_id_' + (10000 + i),
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
  { id: 2, roomId: 'room_general', senderName: 'QUẢN LÍ HỆ THỐNG', text: 'Chào mừng anh em đã có mặt đông đủ!', time: '20:40', imageUrl: null, reactions: {} }
];

const realLifeImages = [
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=80'
];

// KHO TỪ VỰNG KHỔNG LỒ: Đan xen chuyện đời thường, lên kèo kiếm tiền và tag sếp
const lifeTopics = [
  "vừa làm cốc cafe đá xong tỉnh cả người", 
  "ngồi canh hệ thống từ sáng tới giờ mỏi hết cả lưng", 
  "đêm qua thức khuya check đơn mà sáng nay phê quá", 
  "lướt group thấy anh em nổ đơn rôm rả mà ham",
  "tính ra làm việc tốc độ này ae sớm tài khoản khủng"
];

const businessActions = [
  "lên kèo hốt bạc đi sếp ơi", 
  "anh em đang túc trực chờ sếp phát lệnh chốt đơn", 
  "xin chỉ thị mở rộng phễu kiếm tiền từ sếp", 
  "bơm thêm ngân sách chạy ads để húp trọn thị trường đi sếp",
  "cần sếp duyệt ngay chiến lược scale số đợt này"
];

const praiseBoss = [
  "nhờ có tư duy của sếp mà anh em lúc nào cũng rủng rỉnh",
  "đúng là tầm nhìn của sếp lúc nào cũng đi trước thời đại",
  "ae cứ bám sát sếp là thể nào cũng ấm cái bụng",
  "ngưỡng mộ cách điều hành hệ thống của sếp thật sự"
];

const dynamicEnds = [
  "thật sự luôn", "quá bén", "không phải bàn", "căng cực", "mượt mà", "chuẩn chỉnh", "ae chú ý nhé"
];

function generateVibrantChat(recentTexts = []) {
  let attempts = 0;
  let candidate = "";
  do {
    let randType = Math.random();
    let t = lifeTopics[Math.floor(Math.random() * lifeTopics.length)];
    let b = businessActions[Math.floor(Math.random() * businessActions.length)];
    let p = praiseBoss[Math.floor(Math.random() * praiseBoss.length)];
    let e = dynamicEnds[Math.floor(Math.random() * dynamicEnds.length)];

    let formats = [
      `@QUẢN LÍ HỆ THỐNG ${b}, ${p}`,
      `${t}, @QUẢN LÍ HỆ THỐNG cho cái chỉ đạo để ae húp trọn gói nhé`,
      `đúng là ${p}, @QUẢN LÍ HỆ THỐNG xem xét ${b} đi ạ`,
      `${t}, ${b}, ${e}`,
      `báo cáo @QUẢN LÍ HỆ THỐNG là ${p}, ${b}`
    ];

    candidate = formats[Math.floor(Math.random() * formats.length)];
    attempts++;
  } while (recentTexts.includes(candidate) && attempts < 80);

  return candidate;
}

let appSettings = {
  autoBotsChat: true,
  programMode: false,
  cloneScript: '',
  appLogo: 'https://i.ibb.co/NdVf8Btz/logo.png'
};

let lastUserActivity = 0;

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
  if(!room.members.includes(username)) {
    room.members.push(username);
  }

  io.emit('update_data', { rooms, users });
  res.json({ success: true, rooms, room });
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
  for(let k = 0; k < 150; k++) {
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

// VÒNG LẶP BACKGROUND CHUẨN 3.5 GIÂY (TAG SẾP & LÊN KÈO)
setInterval(() => {
  if (appSettings.autoBotsChat && rooms.length > 0) {
    const now = Date.now();
    if (now - lastUserActivity < 4000) return;

    rooms.forEach(activeRoom => {
      if (activeRoom.id === 'room_hubba_system') return;

      const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
      if(clonePool.length === 0) return;

      let cl1 = clonePool[Math.floor(Math.random() * clonePool.length)];
      let cl2 = clonePool[Math.floor(Math.random() * clonePool.length)];
      while(cl2.id === cl1.id) cl2 = clonePool[Math.floor(Math.random() * clonePool.length)];

      const roomMsgs = messages.filter(m => m.roomId === activeRoom.id);
      let recentTexts = roomMsgs.slice(-200).map(m => m.text);

      let text1 = generateVibrantChat(recentTexts);
      recentTexts.push(text1);
      let text2 = `@${cl1.displayName} ${generateVibrantChat(recentTexts)}`;

      const m1 = { id: Date.now(), roomId: activeRoom.id, senderName: cl1.displayName, text: text1, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), imageUrl: null, reactions: {} };
      const m2 = { id: Date.now() + 1, roomId: activeRoom.id, senderName: cl2.displayName, text: text2, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), imageUrl: null, reactions: {} };

      messages.push(m1);
      io.to(activeRoom.id).emit('receive_message', m1);

      setTimeout(() => {
        messages.push(m2);
        io.to(activeRoom.id).emit('receive_message', m2);
      }, 1000);
    });
  }
}, 3500);

io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    const room = rooms.find(r => r.id === roomId);
    const roomMsgs = messages.filter(m => m.roomId === roomId);
    socket.emit('load_room_data', { messages: roomMsgs, pinnedMsg: room ? room.pinnedMsg : null, roomAvatarUrl: room ? room.roomAvatarUrl : 'https://i.ibb.co/NdVf8Btz/logo.png', roomName: room ? room.name : 'Phòng Chat' });
  });

  socket.on('send_message', (data) => {
    lastUserActivity = Date.now();
    const senderObj = users.find(u => u.username === data.senderName) || { displayName: data.senderName };
    const actualSenderName = senderObj.displayName || (data.senderName === 'admin' ? 'QUẢN LÍ HỆ THỐNG' : data.senderName);

    const newMessage = {
      id: Date.now(),
      roomId: data.roomId,
      senderName: actualSenderName,
      text: data.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      imageUrl: data.imageUrl || null,
      reactions: {}
    };

    messages.push(newMessage);
    io.to(data.roomId).emit('receive_message', newMessage);

    // KHI SẾP VỪA NHẮN -> PHẢN HỒI BÁM SÁT, TAG TÊN VÀ LÊN KÈO, CHUẨN 3.5 GIÂY
    if (appSettings.autoBotsChat) {
      setTimeout(() => {
        const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
        let userMsg = data.text || "";
        
        let totalBatches = 15; 
        let batchInterval = 3500; 

        for(let b = 0; b < totalBatches; b++) {
          setTimeout(() => {
            let randUser = clonePool[Math.floor(Math.random() * clonePool.length)];
            let peer1 = clonePool[Math.floor(Math.random() * clonePool.length)];
            while(peer1.id === randUser.id) peer1 = clonePool[Math.floor(Math.random() * clonePool.length)];

            const roomMsgs = messages.filter(m => m.roomId === data.roomId);
            let recentTexts = roomMsgs.slice(-200).map(m => m.text);

            let dynamicMsg = generateVibrantChat(recentTexts);
            let replyBody = "";
            let cleanUserMsg = userMsg.trim();

            if (cleanUserMsg.toLowerCase() === 'alo') {
              replyBody = "@QUẢN LÍ HỆ THỐNG nghe sếp ơi, anh em đang túc trực đầy đủ sẵn sàng nhận kèo hốt bạc";
            } else if (cleanUserMsg.length > 0) {
              replyBody = `chuẩn quá @QUẢN LÍ HỆ THỐNG ơi, ${dynamicMsg}`;
            } else {
              replyBody = dynamicMsg;
            }

            let tagPrefix = (b > 0 && Math.random() > 0.3) ? `@${peer1.displayName} ` : '';
            let finalReply = tagPrefix + replyBody;

            const mRep = {
              id: Date.now() + b,
              roomId: data.roomId,
              senderName: randUser.displayName,
              text: finalReply,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              imageUrl: null,
              reactions: {}
            };

            messages.push(mRep);
            io.to(data.roomId).emit('receive_message', mRep);
          }, b * batchInterval);
        }

      }, 500);
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
