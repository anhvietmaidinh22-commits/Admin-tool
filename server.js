const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Dữ liệu mẫu ban đầu
let users = [
  { id: 'admin_1', username: 'admin', password: '123', role: 'admin', avatar: '👑' },
  { id: 'cv_1', username: 'chuyenviena', password: '123', role: 'specialist', avatar: '👨‍💼' }
];

// Danh sách phòng chat (Mỗi khách hàng đăng ký sẽ tự động tạo một phòng chat riêng)
let rooms = [
  { id: 'room_general', name: 'Phòng Chung Tổng', clientId: null, assignedSpecialist: null, status: 'active' }
];

let messages = [
  { id: 1, roomId: 'room_general', senderName: 'Hệ thống', text: 'Chào mừng đến với tổng đài Hubba!', time: '18:00' }
];

// API Đăng ký tài khoản mới (Khách hàng) -> Đồng thời tạo phòng chat riêng cho khách đó
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
    avatar: '👤'
  };
  users.push(newUser);

  // Tự động tạo phòng chat riêng cho khách hàng mới này để Admin phân quyền
  const newRoom = {
    id: 'room_' + newUser.id,
    name: `Khách: ${username}`,
    clientId: newUser.id,
    clientName: username,
    assignedSpecialist: 'Chưa phân công',
    status: 'waiting' // Trạng thái chờ Admin phân công
  };
  rooms.push(newRoom);

  // Báo realtime cho Admin thấy có khách hàng mới đăng ký & chờ phân công
  io.emit('update_rooms', rooms);

  res.json({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role } });
});

// API Đăng nhập
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu!' });

  res.json({ success: true, user: { id: user.id, username: user.username, role: user.role }, rooms, users });
});

// API Admin phân công Chuyên viên phụ trách phòng chat của khách
app.post('/api/assign-room', (req, res) => {
  const { roomId, specialistName } = req.body;
  const room = rooms.find(r => r.id === roomId);
  if (!room) return res.status(400).json({ success: false, message: 'Không tìm thấy phòng!' });

  room.assignedSpecialist = specialistName;
  room.status = 'assigned'; // Đã được phân công

  // Cập nhật realtime cho toàn hệ thống
  io.emit('update_rooms', rooms);
  res.json({ success: true, rooms });
});

// Socket.io real-time
io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    const roomMsgs = messages.filter(m => m.roomId === roomId);
    socket.emit('load_messages', roomMsgs);
  });

  socket.on('send_message', (data) => {
    let messageText = data.text;
    if (data.hasBill) {
      messageText += ` [🤖 OCR Tự động: Xác thực bill thành công!]`;
    }

    const newMessage = {
      id: Date.now(),
      roomId: data.roomId,
      senderName: data.senderName,
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    messages.push(newMessage);
    io.to(data.roomId).emit('receive_message', newMessage);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Hubba server đang chạy tại cổng ${PORT}`);
});
