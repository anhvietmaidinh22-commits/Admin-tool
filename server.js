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
  { id: 'admin_1', username: 'admin', password: '123321', role: 'admin', avatar: '👑', displayName: 'QUẢN LÍ HỆ THỐNG', accountId: 'hubba_admin_01', userAvatarUrl: '/logo.png' },
  { id: 'cv_1', username: 'chuyenviena', password: '123', role: 'specialist', avatar: '👨‍💼', displayName: 'Chuyên Viên A', accountId: 'staff_a_02', userAvatarUrl: '/logo.png' }
];

let rooms = [
  { id: 'room_general', name: 'Phòng Chung Tổng Đối Soát', clientId: null, assignedSpecialist: null, members: ['admin', 'chuyenviena'], pinnedMsg: null, status: 'active', isCustomGroup: false }
];

let billRepository = [
  { name: 'Bill_NguyenVanA', amount: '150,000 VNĐ', code: 'TXN_882910', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80' },
  { name: 'Bill_TranThiB', amount: '320,000 VNĐ', code: 'TXN_993821', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80' }
];

let messages = [
  { id: 1, roomId: 'room_general', senderName: 'QUẢN LÍ HỆ THỐNG', text: 'Chào mừng đến với HUBBA! Hãy trải nghiệm thanh chat mới và tính năng ghim tin nhắn.', time: '18:00', imageUrl: null, billInfo: null, reactions: {} }
];

let appSettings = {
  autoOcr: true,
  autoBotsChat: true,
  programScript: 'Chương trình đối soát: Bot tự động gửi bill khi nhận lệnh.',
  appLogo: '/logo.png'
};

app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: appSettings });
});

app.post('/api/settings', (req, res) => {
  const { autoOcr, autoBotsChat, programScript, appLogo } = req.body;
  if(autoOcr !== undefined) appSettings.autoOcr = autoOcr;
  if(autoBotsChat !== undefined) appSettings.autoBotsChat = autoBotsChat;
  if(programScript !== undefined) appSettings.programScript = programScript;
  if(appLogo !== undefined) appSettings.appLogo = appLogo;

  io.emit('update_settings', appSettings);
  res.json({ success: true, settings: appSettings });
});

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Thiếu thông tin!' });
  
  if (username === 'admin') {
    return res.status(400).json({ success: false, message: 'Tên tài khoản admin không được trùng!' });
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
    userAvatarUrl: '/logo.png'
  };
  users.push(newUser);

  const newRoom = {
    id: 'room_' + newUser.id,
    name: `Hỗ trợ: ${username}`,
    clientId: newUser.id,
    clientName: username,
    assignedSpecialist: 'Chưa phân công',
    members: [username, 'admin'],
    pinnedMsg: null,
    status: 'waiting',
    isCustomGroup: false
  };
  rooms.push(newRoom);

  io.emit('update_data', { rooms, users });
  res.json({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role } });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu!' });

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
  if (!name) return res.status(400).json({ success: false, message: 'Thiếu tên phòng!' });

  const newRoom = {
    id: 'room_' + Date.now(),
    name: name,
    clientId: 'client_' + Date.now(),
    clientName: clientName || 'Khách vãng lai',
    assignedSpecialist: specialistName || 'Chưa phân công',
    members: ['admin', specialistName, clientName].filter(Boolean),
    pinnedMsg: null,
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
    userAvatarUrl: '/logo.png'
  };
  users.push(newSpecialist);

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
    socket.emit('load_room_data', { messages: roomMsgs, pinnedMsg: room ? room.pinnedMsg : null });
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

    const lowerText = data.text.toLowerCase();
    if (appSettings.autoBotsChat && (lowerText.includes('gửi bill') || lowerText.includes('đối soát') || lowerText.includes('lệnh'))) {
      setTimeout(() => {
        const randomBill = billRepository[Math.floor(Math.random() * billRepository.length)] || billRepository[0];
        const botReply = {
          id: Date.now() + 1,
          roomId: data.roomId,
          senderName: 'Bot Kế Toán',
          text: `[Hệ thống tự động] Xin gửi bill theo yêu cầu đối soát:`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          imageUrl: randomBill.url,
          billInfo: {
            code: randomBill.code,
            amount: randomBill.amount,
            status: '✅ Khớp lệnh chuyển khoản'
          },
          reactions: {}
        };
        messages.push(botReply);
        io.to(data.roomId).emit('receive_message', botReply);
      }, 1200);
    }
  });

  // Ghim tin nhắn (Chỉ Admin)
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
  console.log(`Hubba server đang chạy tại cổng ${PORT}`);
});
