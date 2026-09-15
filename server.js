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
  { id: 'cv_1', username: 'chuyenviena', password: '123', role: 'specialist', avatar: '👨‍💼', displayName: 'Chuyên Viên A', accountId: 'staff_a_02', userAvatarUrl: '/logo.png', isLocked: false },
  { id: 'cv_2', username: 'chuyenvienb', password: '123', role: 'specialist', avatar: '👩‍💼', displayName: 'Chuyên Viên B', accountId: 'staff_b_03', userAvatarUrl: '/logo.png', isLocked: false },
  { id: 'clone_1', username: 'Bot_KếToán', password: '123', role: 'specialist', avatar: '🤖', displayName: 'Bot Kế Toán', accountId: 'bot_ketoan_99', userAvatarUrl: '/logo.png', isLocked: false }
];

let rooms = [
  { id: 'room_general', name: 'Phòng Tổng Đối Soát', clientId: null, assignedSpecialist: null, members: ['admin', 'chuyenviena', 'Bot_KếToán'], pinnedMsg: null, roomAvatarUrl: '/logo.png', status: 'active', isCustomGroup: true }
];

let billRepository = [
  { name: 'Bill_NguyenVanA', amount: '150,000 VNĐ', code: 'TXN_882910', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80' },
  { name: 'Bill_TranThiB', amount: '320,000 VNĐ', code: 'TXN_993821', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80' }
];

let messages = [
  { id: 1, roomId: 'room_general', senderName: 'QUẢN LÍ HỆ THỐNG', text: 'Chào mừng đến với HUBBA! Hãy thử nhắn bất kỳ câu gì, bot clone sẽ tự động hùa theo trả lời.', time: '18:00', imageUrl: null, billInfo: null, reactions: {} }
];

let appSettings = {
  autoOcr: true,
  autoBotsChat: true,
  programScript: 'Chương trình đối soát: Bot tự động hùa theo và tương tác.',
  appLogo: '/logo.png',
  cloneNaming: 'name'
};

app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: appSettings });
});

app.post('/api/settings', (req, res) => {
  const { autoOcr, autoBotsChat, programScript, appLogo, cloneNaming } = req.body;
  if(autoOcr !== undefined) appSettings.autoOcr = autoOcr;
  if(autoBotsChat !== undefined) appSettings.autoBotsChat = autoBotsChat;
  if(programScript !== undefined) appSettings.programScript = programScript;
  if(appLogo !== undefined) appSettings.appLogo = appLogo;
  if(cloneNaming !== undefined) appSettings.cloneNaming = cloneNaming;

  io.emit('update_settings', appSettings);
  res.json({ success: true, settings: appSettings });
});

app.post('/api/admin-manage-client', (req, res) => {
  const { clientId, newPassword, isLocked } = req.body;
  const client = users.find(u => u.id === clientId);
  if(!client) return res.status(400).json({ success: false, message: 'Không tìm thấy khách hàng!' });

  if(newPassword) client.password = newPassword;
  if(isLocked !== undefined) client.isLocked = isLocked;

  io.emit('update_data', { rooms, users });
  res.json({ success: true, users });
});

app.post('/api/update-room-avatar', (req, res) => {
  const { roomId, roomAvatarUrl } = req.body;
  const room = rooms.find(r => r.id === roomId);
  if (!room) return res.status(400).json({ success: false, message: 'Không tìm thấy nhóm!' });

  room.roomAvatarUrl = roomAvatarUrl;
  io.emit('update_data', { rooms, users });
  res.json({ success: true, room, rooms });
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
  const allSpecialists = users.filter(u => u.role === 'specialist').map(u => u.username);

  const securityRoom = {
    id: securityRoomId,
    name: username,
    clientId: newUser.id,
    clientName: username,
    assignedSpecialist: '',
    members: [username, 'admin', ...allSpecialists],
    pinnedMsg: null,
    roomAvatarUrl: '/logo.png',
    status: 'system',
    isCustomGroup: false
  };
  rooms.push(securityRoom);

  messages.push({
    id: Date.now(),
    roomId: securityRoomId,
    senderName: 'HUBBA ✔',
    text: `Thông báo đăng nhập an toàn\n${nowStr}\n\nTài khoản ${username} vừa đăng ký và đăng nhập thành công.\nThiết bị: Android\nIP: 123.24.88.148`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    imageUrl: null,
    billInfo: null,
    reactions: {},
    isSystemSecurity: true
  });

  io.emit('update_data', { rooms, users });
  res.json({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role, displayName: newUser.displayName } });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu!' });

  if(user.isLocked) {
    return res.status(400).json({ success: false, message: 'Tài khoản của bạn đã bị khóa!' });
  }

  if (user.role === 'client') {
    const hasSecRoom = rooms.find(r => r.clientId === user.id);
    if (!hasSecRoom) {
      const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
      const securityRoomId = 'room_security_' + user.id;
      const allSpecialists = users.filter(u => u.role === 'specialist').map(u => u.username);

      rooms.push({
        id: securityRoomId,
        name: user.displayName || user.username,
        clientId: user.id,
        clientName: user.username,
        assignedSpecialist: '',
        members: [user.username, 'admin', ...allSpecialists],
        pinnedMsg: null,
        roomAvatarUrl: '/logo.png',
        status: 'system',
        isCustomGroup: false
      });
      messages.push({
        id: Date.now(),
        roomId: securityRoomId,
        senderName: 'HUBBA ✔',
        text: `Thông báo đăng nhập an toàn\n${nowStr}\n\nTài khoản ${user.username} vừa đăng nhập thành công.\nIP: 123.24.88.148`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        imageUrl: null,
        billInfo: null,
        reactions: {},
        isSystemSecurity: true
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

  const allSpecialists = users.filter(u => u.role === 'specialist').map(u => u.username);

  const newRoom = {
    id: 'room_' + Date.now(),
    name: name,
    clientId: null,
    clientName: clientName || 'Thành viên',
    assignedSpecialist: specialistName || '',
    members: ['admin', ...allSpecialists, clientName].filter(Boolean),
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

  rooms.forEach(r => {
    if(!r.members) r.members = [];
    if(!r.members.includes(username)) r.members.push(username);
  });

  io.emit('update_data', { rooms, users });
  res.json({ success: true, users });
});

app.post('/api/assign-room', (req, res) => {
  const { roomId, specialistName } = req.body;
  const room = rooms.find(r => r.id === roomId);
  if (!room) return res.status(400).json({ success: false, message: 'Không tìm thấy phòng!' });

  room.assignedSpecialist = specialistName;
  room.status = 'assigned';
  if(!room.members) room.members = [];
  if(!room.members.includes(specialistName)) room.members.push(specialistName);

  io.emit('update_data', { rooms, users });
  res.json({ success: true, rooms });
});

io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    const room = rooms.find(r => r.id === roomId);
    const roomMsgs = messages.filter(m => m.roomId === roomId);
    socket.emit('load_room_data', { messages: roomMsgs, pinnedMsg: room ? room.pinnedMsg : null, roomAvatarUrl: room ? room.roomAvatarUrl : '/logo.png' });
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
      billInfo: data.imageUrl ? {
        code: 'TXN_' + Math.floor(100000 + Math.random() * 900000),
        amount: '350,000 VNĐ',
        status: '✅ Quét OCR thành công'
      } : null,
      reactions: {}
    };

    messages.push(newMessage);
    io.to(data.roomId).emit('receive_message', newMessage);

    // KHI ADMIN HOẶC CHUYÊN VIÊN NHẮN TIN TRONG NHÓM -> BOT CLONE TỰ ĐỘNG HÙA THEO TRẢ LỜI NGAY LẬP TỨC
    if (appSettings.autoBotsChat && data.senderName !== 'Bot Kế Toán') {
      setTimeout(() => {
        const botReplies = [
          `Đã rõ lệnh "${data.text}". Em đang tiến hành xử lý ngay ạ! 🚀`,
          `Báo cáo sếp, hệ thống đã ghi nhận nội dung "${data.text}" và đang đồng bộ dữ liệu. ⚡`,
          `Chuẩn luôn! Phần này bên Bot và đội ngũ đang kiểm tra cực kỳ khớp lệnh rồi nhé. 👍`,
          `Đã tiếp nhận yêu cầu đối soát cho "${data.text}". Mọi thứ rất mượt mà! 💯`
        ];
        const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];

        const botMsg = {
          id: Date.now() + 1,
          roomId: data.roomId,
          senderName: 'Bot Kế Toán',
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          imageUrl: null,
          billInfo: null,
          reactions: {}
        };
        messages.push(botMsg);
        io.to(data.roomId).emit('receive_message', botMsg);
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
