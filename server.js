const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Danh sách nhân sự hệ thống
let users = [
  { id: 'admin_1', username: 'Admin Tổng', role: 'admin', avatar: '👑' },
  { id: 'cv_1', username: 'Chuyên Viên A', role: 'specialist', avatar: '👨‍💼' },
  { id: 'cv_2', username: 'Giao Dịch Viên B', role: 'specialist', avatar: '👩‍💼' }
];

let groups = [
  { id: 'group_general', name: 'Nhóm Chung & Đối Soát Bill', members: ['admin_1', 'cv_1', 'cv_2'] }
];

let messages = [
  { id: 1, groupId: 'group_general', senderId: 'admin_1', senderName: 'Admin Tổng', text: 'Chào mừng anh em đến với hệ thống Hubba!', time: '18:00' }
];

// API khởi tạo dữ liệu
app.get('/api/init', (req, res) => {
  res.json({ users, groups, messages });
});

// API Admin tạo Chuyên viên mới
app.post('/api/specialists', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Tên không được để trống' });
  
  const newCv = {
    id: 'cv_' + Date.now(),
    username: username,
    role: 'specialist',
    avatar: '🧑‍💻'
  };
  users.push(newCv);
  io.emit('update_users', users);
  res.json({ success: true, user: newCv });
});

// Xử lý Socket.io real-time
io.on('connection', (socket) => {
  socket.on('join_group', (groupId) => {
    socket.join(groupId);
  });

  socket.on('send_message', (data) => {
    let messageText = data.text;
    
    // Giả lập OCR bóc tách bill tự động
    if (data.hasBill) {
      messageText += ` [🤖 OCR Tự động: Đã xác thực chuyển khoản thành công!]`;
    }

    const newMessage = {
      id: Date.now(),
      groupId: data.groupId,
      senderId: data.senderId,
      senderName: data.senderName,
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    messages.push(newMessage);
    io.to(data.groupId).emit('receive_message', newMessage);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Hubba server đang chạy tại cổng ${PORT}`);
});
