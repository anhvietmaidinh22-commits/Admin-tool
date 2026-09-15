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
  { id: 'admin_1', username: 'admin', password: '123321', role: 'admin', avatar: '👑' },
  { id: 'cv_1', username: 'chuyenviena', password: '123', role: 'specialist', avatar: '👨‍💼' },
  { id: 'clone_1', username: 'Bot_KếToán', password: '123', role: 'specialist', avatar: '🤖' },
  { id: 'clone_2', username: 'Bot_ĐốiSoát', password: '123', role: 'specialist', avatar: '⚡' },
  { id: 'clone_3', username: 'Bot_CSKH', password: '123', role: 'specialist', avatar: '🎯' }
];

let rooms = [
  { id: 'room_general', name: 'Phòng Chung Tổng Đối Soát', clientId: null, assignedSpecialist: null, members: ['admin', 'chuyenviena', 'Bot_KếToán'], status: 'active', isCustomGroup: false }
];

let messages = [
  { id: 1, roomId: 'room_general', senderName: 'Hệ thống', text: 'Chào mừng đến với Hubba Pro! Giao diện đã được nâng cấp font chữ tinh tế và thêm tính năng quản lý thành viên nhóm.', time: '18:00', imageUrl: null, billInfo: null }
];

let appSettings = {
  autoOcr: true,
  cloneNaming: 'name',
  autoBotsChat: true,
  programScript: 'Chương trình đối soát tự động: Kiểm tra mã GD, số tiền và khớp lệnh chuyển khoản.',
  appLogo: '/logo.png'
};

app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: appSettings });
});

app.post('/api/settings', (req, res) => {
  const { autoOcr, cloneNaming, autoBotsChat, programScript, appLogo } = req.body;
  if(autoOcr !== undefined) appSettings.autoOcr = autoOcr;
  if(cloneNaming !== undefined) appSettings.cloneNaming = cloneNaming;
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
    return res.status(400).json({ success: false, message: 'Tên tài khoản admin đã tồn tại!' });
  }

  const existing = users.find(u => u.username === username);
  if (existing) return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại!' });

  const newUser = {
    id: 'user_' + Date.now(),
    username: username,
    password: password,
    role: 'client',
    avatar: '👤'
  };
  users.push(newUser);

  const newRoom = {
    id: 'room_' + newUser.id,
    name: `Hỗ trợ: ${username}`,
    clientId: newUser.id,
    clientName: username,
    assignedSpecialist: 'Chưa phân công',
    members: [username, 'admin'],
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

  res.json({ success: true, user: { id: user.id, username: user.username, role: user.role }, rooms, users, settings: appSettings });
});

// API Thêm thành viên vào phòng chat
app.post('/api/add-member', (req, res) => {
  const { roomId, username } = req.body;
  const room = rooms.find(r => r.id === roomId);
  if (!room) return res.status(400).json({ success: false, message: 'Không tìm thấy phòng!' });

  if (!room.members) room.members = [];
  if (!room.members.includes(username)) {
    room.members.push(username);
  }

  io.emit('update_data', { rooms, users });
  res.json({ success: true, rooms });
});

app.post('/api/auto-clone-bills', (req, res) => {
  const { billNames } = req.body;
  if (!billNames || billNames.length === 0) {
    return res.status(400).json({ success: false, message: 'Không có dữ liệu bill!' });
  }

  const botList = users.filter(u => u.role === 'specialist');
  let createdRooms = [];

  billNames.forEach((name, index) => {
    const cleanName = name.replace(/\.[^/.]+$/, "");
    const roomTitle = `Bill: ${cleanName}`;
    const assignedBot = botList[index % botList.length] ? botList[index % botList.length].username : 'Bot_KếToán';

    const newRoomId = 'clone_' + Date.now() + '_' + index;
    const newRoom = {
      id: newRoomId,
      name: roomTitle,
      clientId: null,
      assignedSpecialist: assignedBot,
      members: ['admin', assignedBot],
      status: 'assigned',
      isCustomGroup: true
    };
    rooms.push(newRoom);
    createdRooms.push(newRoom);

    messages.push({
      id: Date.now() + index,
      roomId: newRoomId,
      senderName: assignedBot,
      text: `[Auto Clone] Đã tiếp nhận hóa đơn của ${cleanName}. Tiến hành đối soát theo kịch bản.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
      billInfo: {
        code: 'TXN_' + Math.floor(100000 + Math.random() * 900000),
        amount: (Math.floor(Math.random() * 90) + 10) * 10000 + ' VNĐ',
        status: '✅ Đối soát thành công tự động'
      }
    });
  });

  io.emit('update_data', { rooms, users });
  res.json({ success: true, rooms, count: createdRooms.length });
});

app.post('/api/create-room', (req, res) => {
  const { name, clientName, specialistName } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Thiếu tên phòng!' });

  const newRoom = {
    id: 'room_' + Date.now(),
    name: name,
    clientId: 'client_' + Date.now(),
    clientName: clientName || 'Khách vãng lai',
    assignedSpecialist: specialistName || 'Bot_KếToán',
    members: ['admin', specialistName || 'Bot_KếToán', clientName],
    status: 'assigned',
    isCustomGroup: true
  };
  rooms.push(newRoom);

  io.emit('update_data', { rooms, users });
  res.json({ success: true, rooms });
});

app.post('/api/create-specialist', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Thiếu thông tin!' });

  const existing = users.find(u => u.username === username);
  if (existing) return res.status(400).json({ success: false, message: 'Tên tài khoản đã tồn tại!' });

  const newSpecialist = {
    id: 'cv_' + Date.now(),
    username: username,
    password: password,
    role: 'specialist',
    avatar: '🤖'
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
    const roomMsgs = messages.filter(m => m.roomId === roomId);
    socket.emit('load_messages', roomMsgs);
  });

  socket.on('send_message', (data) => {
    const newMessage = {
      id: Date.now(),
      roomId: data.roomId,
      senderName: data.senderName,
      text: data.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: data.imageUrl || null,
      billInfo: data.imageUrl ? {
        code: 'TXN_' + Math.floor(100000 + Math.random() * 900000),
        amount: '350,000 VNĐ',
        status: '✅ Quét OCR thành công'
      } : null
    };

    messages.push(newMessage);
    io.to(data.roomId).emit('receive_message', newMessage);

    if (appSettings.autoBotsChat && data.senderName === 'admin') {
      setTimeout(() => {
        const botReply = {
          id: Date.now() + 1,
          roomId: data.roomId,
          senderName: 'Bot_KếToán',
          text: `Đã ghi nhận yêu cầu từ Admin theo kịch bản: "${appSettings.programScript.substring(0, 30)}..." ⚡`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          imageUrl: null,
          billInfo: null
        };
        messages.push(botReply);
        io.to(data.roomId).emit('receive_message', botReply);
      }, 1000);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Hubba server đang chạy tại cổng ${PORT}`);
});
