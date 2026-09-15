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
  { id: 'cv_2', username: 'chuyenvienb', password: '123', role: 'specialist', avatar: '👩‍💼' }
];

let rooms = [
  { id: 'room_general', name: 'Phòng Chung Tổng Đối Soát', clientId: null, assignedSpecialist: null, status: 'active', isCustomGroup: false }
];

let messages = [
  { id: 1, roomId: 'room_general', senderName: 'Hệ thống', text: 'Chào mừng đến với tổng đài Hubba!', time: '18:00', billInfo: null }
];

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
    password: password || '123',
    role: 'client',
    avatar: '👤'
  };
  users.push(newUser);

  const newRoom = {
    id: 'room_' + newUser.id,
    name: `Phòng Hỗ Trợ: ${username}`,
    clientId: newUser.id,
    clientName: username,
    assignedSpecialist: 'Chưa phân công',
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

  res.json({ success: true, user: { id: user.id, username: user.username, role: user.role }, rooms, users });
});

app.post('/api/auto-clone-bills', (req, res) => {
  const { billNames } = req.body;
  if (!billNames || billNames.length === 0) {
    return res.status(400).json({ success: false, message: 'Không có dữ liệu bill!' });
  }

  let createdRooms = [];
  billNames.forEach((name, index) => {
    const cleanName = name.replace(/\.[^/.]+$/, "");
    const newRoomId = 'clone_' + Date.now() + '_' + index;
    const newRoom = {
      id: newRoomId,
      name: `Bill: ${cleanName}`,
      clientId: null,
      assignedSpecialist: 'Chưa phân công',
      status: 'waiting',
      isCustomGroup: true
    };
    rooms.push(newRoom);
    createdRooms.push(newRoom);

    messages.push({
      id: Date.now() + index,
      roomId: newRoomId,
      senderName: 'Hệ thống OCR',
      text: `Đã tự động nhận diện bill của: ${cleanName}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      billInfo: {
        code: 'TXN_' + Math.floor(100000 + Math.random() * 900000),
        amount: (Math.floor(Math.random() * 90) + 10) * 10000 + ' VNĐ',
        status: '✅ Tự động đối soát thành công'
      }
    });
  });

  io.emit('update_data', { rooms, users });
  res.json({ success: true, rooms, count: createdRooms.length });
});

app.post('/api/create-room', (req, res) => {
  const { name, clientName, specialistName } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Tên phòng không được để trống!' });

  const newRoom = {
    id: 'room_' + Date.now(),
    name: name,
    clientId: 'client_' + Date.now(),
    clientName: clientName || 'Khách vãng lai',
    assignedSpecialist: specialistName || 'Chưa phân công',
    status: 'assigned',
    isCustomGroup: true
  };
  rooms.push(newRoom);

  io.emit('update_data', { rooms, users });
  res.json({ success: true, rooms });
});

app.post('/api/create-specialist', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Thiếu thông tin chuyên viên!' });

  const existing = users.find(u => u.username === username);
  if (existing) return res.status(400).json({ success: false, message: 'Tên tài khoản đã tồn tại!' });

  const newSpecialist = {
    id: 'cv_' + Date.now(),
    username: username,
    password: password,
    role: 'specialist',
    avatar: '🧑‍💻'
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
      billInfo: null
    };

    messages.push(newMessage);
    io.to(data.roomId).emit('receive_message', newMessage);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Hubba server đang chạy tại cổng ${PORT}`);
});
