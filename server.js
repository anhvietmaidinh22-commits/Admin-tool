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
  'Quạu Cơ', 'Trầm Zn', 'Flexer Chính Hiệu', 'Bảnh Trai Phết', 'Đói Kém', 
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

// KHO TỪ VỰNG ĐỘC LẬP ĐỒ SỘ (TRỘN ĐA TẦNG CHỐNG TRÙNG LẶP TUYỆT ĐỐI)
const poolPartsA = [
  "Thật sự là nhìn cách", "Phải công nhận rằng", "Không thể chối cãi là", 
  "Mỗi lần nghe chỉ đạo", "Càng ngẫm về kế hoạch", "Từ lúc áp dụng mô hình", "Tính toán kỹ thì thấy"
];
const poolPartsB = [
  "sếp vạch ra", "định hướng của sếp", "cách sếp scale hệ thống", 
  "chiến lược sếp vừa chốt", "phương án vận hành này", "bước đi của sếp"
];
const poolPartsC = [
  "mang lại nguồn lợi nhuận khủng khiếp", "giúp anh em hốt bạc mỏi tay không kịp đếm", 
  "làm dòng tiền thông suốt mượt mà như lụa", "đẩy tốc độ chốt đơn bùng nổ vượt mọi giới hạn",
  "kéo dài chuỗi ngày ting ting rủng rỉnh ví", "giúp team mình thống lĩnh trọn vẹn thị phần"
];
const poolPartsD = [
  "không tìm ra điểm yếu nào luôn mấy ô ơi", "đỉnh chóp chữ ê kéo dài thực sự đấy", 
  "quá uy tín cho một màn bứt tốc ngoạn mục", "làm ae đứng ngồi không yên vì quá phấn khởi",
  "khiến đối thủ nhìn vào chỉ biết khóc thét", "xứng đáng điểm tuyệt đối cho tầm nhìn chiến lược"
];
const poolEmojis = ["🔥", "🚀", "💰", "🌟", "💸", "🎯", "😎", "💪", "⚡", "🏆"];

function generateStrictUniqueSentence(recentTexts = []) {
  let attempts = 0;
  let candidate = "";
  
  do {
    let a = poolPartsA[Math.floor(Math.random() * poolPartsA.length)];
    let b = poolPartsB[Math.floor(Math.random() * poolPartsB.length)];
    let c = poolPartsC[Math.floor(Math.random() * poolPartsC.length)];
    let d = poolPartsD[Math.floor(Math.random() * poolPartsD.length)];
    let e = poolEmojis[Math.floor(Math.random() * poolEmojis.length)];
    
    candidate = `${a} ${b} ${c}, ${d} ${e}`;
    attempts++;
  } while (recentTexts.includes(candidate) && attempts < 20);

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

// VÒNG LẶP BACKGROUND CHÉM GIÓ 2.5 GIÂY
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
      let recentTexts = roomMsgs.slice(-40).map(m => m.text);

      let text1 = generateStrictUniqueSentence(recentTexts);
      let text2 = `@${cl1.displayName} Công nhận chuẩn không cần chỉnh, số liệu nhảy múa thế này thì ấm cái bụng rồi!`;

      const m1 = { id: Date.now(), roomId: activeRoom.id, senderName: cl1.displayName, text: text1, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), imageUrl: null, reactions: {} };
      const m2 = { id: Date.now() + 1, roomId: activeRoom.id, senderName: cl2.displayName, text: text2, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), imageUrl: null, reactions: {} };

      messages.push(m1);
      io.to(activeRoom.id).emit('receive_message', m1);

      setTimeout(() => {
        messages.push(m2);
        io.to(activeRoom.id).emit('receive_message', m2);
      }, 800);
    });
  }
}, 2500);

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

    // KHI SẾP VỪA NHẮN -> PHÂN TÍCH THÔNG MINH, KHÔNG BAO GIỜ LẶP LẠI VĂN CŨ, TỐC ĐỘ 2.5 GIÂY
    if (appSettings.autoBotsChat) {
      setTimeout(() => {
        const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
        let kw = data.text;
        let lowerKw = kw.toLowerCase();
        
        let totalBatches = 15; 
        let batchInterval = 2500; 

        for(let b = 0; b < totalBatches; b++) {
          setTimeout(() => {
            let randUser = clonePool[Math.floor(Math.random() * clonePool.length)];
            let peer1 = clonePool[Math.floor(Math.random() * clonePool.length)];
            while(peer1.id === randUser.id) peer1 = clonePool[Math.floor(Math.random() * clonePool.length)];

            const roomMsgs = messages.filter(m => m.roomId === data.roomId);
            let recentTexts = roomMsgs.slice(-50).map(m => m.text);

            let replyText = "";
            
            // BẮT LỜI GỌI TƯƠNG TÁC TỪ SẾP (KHÔNG DÙNG CÂU THÔ KỆCH)
            if (lowerKw.includes('mọi người') || lowerKw.includes('anh em') || lowerKw.includes('ae') || lowerKw.includes('ai ơi') || lowerKw.includes('chào') || lowerKw.includes('sếp')) {
              let callReplies = [
                `Dạ tụi em có mặt đầy đủ, sẵn sàng nhận chỉ đạo mới từ sếp rồi ạ! 🔥`,
                `Điểm danh không thiếu một ai, sếp cứ quăng bài toán đi tụi em lo trọn gói 🚀`,
                `Anh em đang túc trực đông đủ đây sếp ơi, chuẩn bị hốt bạc thôi nào 💰`,
                `Nghe tiếng sếp gọi cái là ae nhao vào liền, có kèo gì thơm thế sếp ơi!`
              ];
              replyText = callReplies[Math.floor(Math.random() * callReplies.length)];
            } else {
              let uniqueMsg = generateStrictUniqueSentence(recentTexts);
              let tagPrefix = (b > 0 && Math.random() > 0.3) ? `@${peer1.displayName} ` : '';
              replyText = tagPrefix + uniqueMsg;
            }

            const mRep = {
              id: Date.now() + b,
              roomId: data.roomId,
              senderName: randUser.displayName,
              text: replyText,
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
