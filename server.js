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

const hybridFirstNames = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Ý', 'Hải', 'Minh', 'Hoàng', 'Thanh'
];
const hybridMiddleNames = [
  'Văn', 'Thị', 'Đình', 'Hữu', 'Gia', 'Hoàng', 'Thành', 'Bảo', 'Quốc', 'Kim', 
  'Ngọc', 'Đức', 'Sơn', 'Tấn', 'Nhật', 'Tuấn', 'Phương', 'Mai', 'Thùy', 'Hồng'
];
const hybridLastNames = [
  'Anh', 'Bình', 'Cường', 'Dũng', 'Đạt', 'Hà', 'Hải', 'Hiếu', 'Hòa', 'Huy', 
  'Khánh', 'Long', 'Nam', 'Nghĩa', 'Phong', 'Phúc', 'Quân', 'Sơn', 'Tài', 'Thắng', 
  'Thiện', 'Thuận', 'Toàn', 'Trung', 'Tùng', 'Việt', 'Yến', 'Trang', 'Linh', 'Nhung',
  'Hân', 'Thảo', 'Vy', 'Nhi', 'Hương', 'Diệu', 'Quyên', 'Loan', 'Hạnh', 'Vân'
];

// GENERATE NGẪU HÀNG NGÀN CON CLONE ĐỘC LẬP
let cloneUsers = [];
for(let i = 1; i <= 2000; i++) {
  let randFullName = hybridFirstNames[Math.floor(Math.random() * hybridFirstNames.length)] + ' ' + 
                     hybridMiddleNames[Math.floor(Math.random() * hybridMiddleNames.length)] + ' ' + 
                     hybridLastNames[Math.floor(Math.random() * hybridLastNames.length)] + (Math.random() > 0.4 ? ' ' + Math.floor(Math.random()*99) : '');
  cloneUsers.push({
    id: 'clone_' + i,
    username: 'clone_' + i,
    password: '123',
    role: 'specialist',
    avatar: '🤖',
    displayName: randFullName,
    accountId: 'clone_id_' + (10000 + i),
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

// Kho từ vựng khổng lồ chống lặp
const thousandClonesDialoguePool = [
  "Cứ đi theo sếp là kiểu gì cuối tháng cũng có tiền rủng rỉnh túi, ae tranh thủ hốt mạnh đi",
  "Vừa mở app lên thấy số liệu nhảy múa chóng mặt, sếp chỉ đường quá đỉnh luôn",
  "Đoạn này ai không theo sát sếp thì đúng là bỏ lỡ cơ hội hốt bạc lớn trong đời",
  "Nhìn cái ví dày lên từng ngày mà mát cả ruột, cảm ơn sếp đã mở đường dẫn lối",
  "Thề là từ lúc về đội sếp làm ăn phát đạt hẳn, tiền vào như nước sông Đà",
  "Anh em cứ cày cuốc hết mình theo chỉ đạo của sếp đi, lo gì không giàu",
  "Mấy ông cứ thắc mắc kiếm tiền ở đâu, cứ nhìn cách sếp vận hành là hiểu đỉnh cỡ nào rồi",
  "Chốt đơn mỏi tay không hết việc, đúng là theo sếp chỉ có hốt trọn thị phần",
  "Hôm nay hệ thống bên mình lại vừa phá kỷ lục doanh thu mới, phê quá mấy ông ơi",
  "Đang ngồi uống cà phê mà app cứ ting ting liên tục thế này thì có mà mất ngủ",
  "Tư duy chiến lược của sếp lúc nào cũng đi trước thời đại một bước, tuyệt vời thật",
  "Cứ đà này thì chẳng mấy chốc anh em mình tậu xế hộp, lên đời nhà lầu hết lượt",
  "Vừa đối soát xong dòng tiền tuần này, nhìn con số mà thấy ấm lòng hẳn ra",
  "Ai còn đang chần chừ thì mau vào việc cùng sếp đi, cơ hội không đợi một ai đâu",
  "Công nhận theo sát các chiến dịch của sếp là bài học kinh doanh đắt giá nhất",
  "Làm việc với đội ngũ năng suất cao thế này tự nhiên bản thân cũng phải cố gắng x2",
  "Vừa chốt nóng mấy hợp đồng to bự, cảm giác hốt bạc nó sướng gì đâu á",
  "Cứ bám sát nút định hướng của sếp là kiểu gì cũng về đích rực rỡ",
  "Hôm nay dòng tiền lưu thông mượt quá, anh em cứ đà này mà phát huy nhé",
  "Theo sếp làm kinh tế đúng là không có điểm chê vào đâu được"
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
  for(let k = 0; k < 50; k++) {
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

// VÒNG LẶP HÀNG NGÀN CLONE CHÉM GIÓ 24/7 (2.5 GIÂY)
setInterval(() => {
  if (appSettings.autoBotsChat && rooms.length > 0) {
    const now = Date.now();
    if (now - lastUserActivity < 3000) return;

    rooms.forEach(activeRoom => {
      if (activeRoom.id === 'room_hubba_system') return;

      const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
      if(clonePool.length === 0) return;

      let cl1 = clonePool[Math.floor(Math.random() * clonePool.length)];
      let cl2 = clonePool[Math.floor(Math.random() * clonePool.length)];

      while(cl2.id === cl1.id) cl2 = clonePool[Math.floor(Math.random() * clonePool.length)];

      const roomMsgs = messages.filter(m => m.roomId === activeRoom.id);
      const recentTexts = roomMsgs.slice(-50).map(m => m.text);

      let availablePool = thousandClonesDialoguePool.filter(item => !recentTexts.includes(item));
      if (availablePool.length === 0) availablePool = thousandClonesDialoguePool;

      let text1 = availablePool[Math.floor(Math.random() * availablePool.length)];
      let text2 = `@${cl1.displayName} Quá chuẩn luôn bác ơi, cứ theo sếp là ấm cái bụng!`;

      const m1 = { id: Date.now(), roomId: activeRoom.id, senderName: cl1.displayName, text: text1, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), imageUrl: null, reactions: {} };
      const m2 = { id: Date.now() + 1, roomId: activeRoom.id, senderName: cl2.displayName, text: text2, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), imageUrl: null, reactions: {} };

      messages.push(m1);
      io.to(activeRoom.id).emit('receive_message', m1);

      setTimeout(() => {
        messages.push(m2);
        io.to(activeRoom.id).emit('receive_message', m2);
      }, 400);
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

    // KHI SẾP VỪA NHẮN -> KÍCH HOẠT HÀNG LOẠT CLONE NGẪU HÀNG NGÀN CON LẦN LƯỢT TUNG HÔ TRONG VÀI GIÂY
    if (appSettings.autoBotsChat) {
      setTimeout(() => {
        const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
        let kw = data.text;
        
        let dynamicVariations = [
          `Đúng rồi đấy, vụ "${kw}" này để sếp lo là chuẩn bài, anh em chỉ việc hốt tiền thôi`,
          `Nghe sếp nói về "${kw}" là thấy máu chiến nổi lên rồi, triển khai ngay và luôn nào`,
          `Chuẩn không cần chỉnh, theo sát chỉ đạo của sếp vụ "${kw}" kiểu gì cũng bội thu`,
          `Quá chuẩn luôn, ai chứ sếp phán vụ "${kw}" thì chỉ có chuẩn xác từng centimet`,
          `Vụ "${kw}" này thơm phức luôn các bác ạ, theo sếp đúng là không bao giờ lỗ`,
          `Nói thật là từ lúc nghe sếp bàn về "${kw}" là thấy tương lai rủng rỉnh tiền tiêu rồi đấy`,
          `Quá đỉnh cao, quả này anh em lại chuẩn bị tinh thần đếm tiền mỏi tay với "${kw}"`,
          `Tuyệt vời ông mặt trời, bám sát chiến lược của sếp vụ "${kw}" này là chắc chắn thắng lớn`
        ];

        let totalClones = 50;
        let delayStep = 150;

        for(let i = 0; i < totalClones; i++) {
          setTimeout(() => {
            let randUser = clonePool[Math.floor(Math.random() * clonePool.length)];
            let randVar = dynamicVariations[Math.floor(Math.random() * dynamicVariations.length)];
            let tagPrefix = (i > 0 && Math.random() > 0.4) ? `@${clonePool[Math.floor(Math.random() * clonePool.length)].displayName} ` : '';
            let finalMsgText = tagPrefix + randVar;

            const mRep = {
              id: Date.now() + i,
              roomId: data.roomId,
              senderName: randUser.displayName,
              text: finalMsgText,
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
