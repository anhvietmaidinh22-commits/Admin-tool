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
  'Mẹ Suối', 'Bố Cá Voi', 'Tuấn Anh Sài Gòn', 'Mai Phương Thảo', 'Huy Bảnh', 'Đạt Villa',
  'Hải Yến', 'Khánh Linh', 'Bảo Ngọc', 'Minh Triều', 'Hoàng Long', 'Thu Trang',
  'Tuấn Kiệt', 'Phương Linh', 'Thanh Sơn', 'Hồng Nhung', 'Quang Hải', 'Diệu Linh',
  'Đức Huy', 'Hồng Sơn', 'Ngọc Mai', 'Vân Anh', 'Hữu Thắng', 'Kim Oanh',
  'Thành Nam', 'Mỹ Tâm', 'Quốc Huy', 'Lan Phương', 'Đình Trọng', 'Thùy Dương'
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
  { id: 2, roomId: 'room_general', senderName: 'QUẢN LÍ HỆ THỐNG', text: 'Chào mừng anh em đã có mặt đông đủ!', time: '20:40', imageUrl: null, reactions: {} }
];

const realLifeImages = [
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=80'
];

const moneyAndLifePool = [
  "Mấy nay nhìn biểu đồ doanh thu tăng trưởng mà rụng rời tim gan, đúng là theo sếp chỉ có hốt bạc 💸",
  "Vừa check app thấy ting ting reo liên tục, phen này cuối tháng lại dư dả tiền đi du lịch bét nhè rồi 🚀",
  "Công nhận từ ngày bám sát chiến lược của sếp, tiền về đều như vắt chanh, sướng thế không biết",
  "Ai cứ bảo kiếm tiền online khó chứ gặp đúng team sếp thì chỉ có chuẩn bài từ A tới Z",
  "Chiều nay vừa chốt xong mấy đơn khủng, nhìn ví rủng rỉnh mà phấn khởi hẳn người lên các bác ạ",
  "Đời đúng là bước sang trang mới từ ngày gia nhập hệ thống này, vừa vui vẻ lại vừa ra tiền đều đều",
  "Nói gì thì nói, tầm này anh em cứ tập trung 200% năng lượng chiến đấu cùng sếp là thể nào cũng phất lớn",
  "Vừa làm cốc cà phê sáng vừa mở app đếm tiền lãi tuần này, đỉnh chóp thực sự luôn mấy ông ơi 🌟",
  "Ai còn đang mải chơi thì mau vào xem số liệu đi kìa, tăng phi mã thế này thì chả mấy chốc tậu xế hộp"
];

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

// VÒNG LẶP TỰ ĐỘNG CHÉM GIÓ 24/7 (TỐC ĐỘ 1.3 GIÂY)
setInterval(() => {
  if (appSettings.autoBotsChat && rooms.length > 0) {
    const now = Date.now();
    if (now - lastUserActivity < 2500) return;

    rooms.forEach(activeRoom => {
      if (activeRoom.id === 'room_hubba_system') return;

      const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
      if(clonePool.length === 0) return;

      let cl1 = clonePool[Math.floor(Math.random() * clonePool.length)];
      let cl2 = clonePool[Math.floor(Math.random() * clonePool.length)];

      while(cl2.id === cl1.id) cl2 = clonePool[Math.floor(Math.random() * clonePool.length)];

      const roomMsgs = messages.filter(m => m.roomId === activeRoom.id);
      const recentTexts = roomMsgs.slice(-30).map(m => m.text);

      let availablePool = moneyAndLifePool.filter(item => !recentTexts.includes(item));
      if (availablePool.length === 0) availablePool = moneyAndLifePool;

      let text1 = availablePool[Math.floor(Math.random() * availablePool.length)];
      let text2 = `@${cl1.displayName} Chuẩn không cần chỉnh luôn bác ơi, tiền về rủng rỉnh!`;

      const m1 = { id: Date.now(), roomId: activeRoom.id, senderName: cl1.displayName, text: text1, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), imageUrl: null, reactions: {} };
      const m2 = { id: Date.now() + 1, roomId: activeRoom.id, senderName: cl2.displayName, text: text2, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), imageUrl: null, reactions: {} };

      messages.push(m1);
      io.to(activeRoom.id).emit('receive_message', m1);

      setTimeout(() => {
        messages.push(m2);
        io.to(activeRoom.id).emit('receive_message', m2);
      }, 300);
    });
  }
}, 1300); // 1.3 giây chuẩn xác

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
    const actualSenderName = senderObj.displayName || data.senderName;

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

    // KHI SẾP VỪA NHẮN -> KÍCH HOẠT KHOẢNG 50 CON CLONE LẦN LƯỢT TUNG HÔ TRONG VÒNG VÀI GIÂY
    if (appSettings.autoBotsChat) {
      setTimeout(() => {
        const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
        
        let lower = data.text.toLowerCase();
        let baseKeyword = data.text;
        
        let templates = [
          `Nghe sếp chỉ đạo vụ "${baseKeyword}" là anh em biết chuẩn bị hốt bạc to, rủng rỉnh tiền tiêu rồi 🔥`,
          `Quá chuẩn luôn sếp ơi, theo sát sếp vụ "${baseKeyword}" là lúc nào tài khoản cũng ting ting!`,
          `Chuẩn bài, đợt này anh em lại chuẩn bị xây nhà tậu xe nhờ chiến dịch "${baseKeyword}" thôi 😍`,
          `Tầm nhìn chiến lược của sếp về vụ "${baseKeyword}" thì đỉnh chóp khỏi phải bàn cãi rồi!`,
          `Hóng thành quả cùng sếp nhé, năng lượng chiến dịch "${baseKeyword}" ngập tràn luôn 🌟`,
          `Cứ để tụi em lo trọn gói khâu vận hành vụ "${baseKeyword}" nha sếp, yên tâm tuyệt đối về doanh thu luôn ạ!`
        ];

        // Tạo chuỗi phản hồi liên tục từ 45-50 con clone khác nhau
        let totalClonesToTrigger = 48;
        let delayStep = 120; // Khoảng cách thời gian giữa các tin nhắn phản hồi

        for(let i = 0; i < totalClonesToTrigger; i++) {
          setTimeout(() => {
            let randomClone = clonePool[Math.floor(Math.random() * clonePool.length)];
            let randomTemplate = templates[Math.floor(Math.random() * templates.length)];
            let replyText = (i > 0 && Math.random() > 0.4) ? `@${clonePool[Math.floor(Math.random() * clonePool.length)].displayName} ${randomTemplate}` : randomTemplate;

            const mRep = {
              id: Date.now() + i,
              roomId: data.roomId,
              senderName: randomClone.displayName,
              text: replyText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              imageUrl: null,
              reactions: {}
            };

            messages.push(mRep);
            io.to(data.roomId).emit('receive_message', mRep);
          }, i * delayStep);
        }

      }, 100);
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
