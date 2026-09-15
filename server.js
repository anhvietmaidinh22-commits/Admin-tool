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
  { id: 'admin_1', username: 'admin', password: '123321', role: 'admin', avatar: '👑', displayName: 'QUẢN LÍ HỆ THỐNG', accountId: 'hubba_admin_01', userAvatarUrl: '/logo.png', isLocked: false }
];

// Tự động sinh hàng trăm danh tính clone đời sống
const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Đặng', 'Bùi'];
const middleNames = ['Văn', 'Thị', 'Đình', 'Hữu', 'Gia', 'Minh', 'Thanh', 'Hồng', 'Tuấn', 'Ngọc'];
const lastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Đức', 'Hà', 'Hải', 'Hiếu', 'Hòa', 'Hùng', 'Linh', 'Long', 'Nam', 'Phong', 'Quân', 'Sơn', 'Tâm', 'Thắng', 'Trang', 'Tùng'];

for(let i = 1; i <= 200; i++) {
  let f = firstNames[Math.floor(Math.random() * firstNames.length)];
  let m = middleNames[Math.floor(Math.random() * middleNames.length)];
  let l = lastNames[Math.floor(Math.random() * lastNames.length)];
  let fullName = `${f} ${m} ${l}`;
  
  users.push({
    id: 'clone_' + i,
    username: 'clone_' + i,
    password: '123',
    role: 'specialist',
    avatar: '🤖',
    displayName: fullName,
    accountId: 'clone_id_' + (1000 + i),
    userAvatarUrl: '/logo.png',
    isLocked: false
  });
}

let rooms = [
  { id: 'room_general', name: 'Phòng Tám Chuyện Đời Sống', clientId: null, assignedSpecialist: null, members: users.map(u => u.username), pinnedMsg: null, roomAvatarUrl: '/logo.png', status: 'active', isCustomGroup: true }
];

let messages = [
  { id: 1, roomId: 'room_general', senderName: 'QUẢN LÍ HỆ THỐNG', text: 'Chào mừng đến với hệ thống HUBBA! Hàng trăm con clone đã sẵn sàng trò chuyện đời sống.', time: '18:00', imageUrl: null, reactions: {} }
];

let appSettings = {
  autoBotsChat: true,
  cloneScript: 'Hôm nay thời tiết đẹp quá nhỉ, mọi người đã ăn gì chưa?',
  appLogo: '/logo.png'
};

// Kho câu chuyện đời sống phong phú để các clone tự đối thoại qua lại nếu không dùng AI API
const lifeTopics = [
  "Công nhận dạo này vật giá leo thang quá, đi chợ cầm 500k về chả còn bao nhiêu.",
  "Có ai ở đây thích nuôi mèo không nhỉ? Sáng nay con mèo nhà mình vừa cào rách cái sofa xong 😭",
  "Tối nay mọi người xem bóng đá hay đi cà phê thế? Gợi ý vài quán ổn áp với.",
  "Đời đúng vô thường, chiều nay vừa định đi chơi thì trời lại đổ mưa lớn.",
  "Mới order ly trà sữa trân châu đường đen mà uống xong thấy có lỗi với cân nặng quá các bác ạ haha.",
  "Ai cóa bí quyết ngủ ngon không, dạo này hay bị mất ngủ quá.",
  "Hôm nay công việc thế nào rồi các bác? Cố gắng lên nhé sắp cuối tuần rồi!"
];

app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: appSettings });
});

app.post('/api/settings', (req, res) => {
  const { autoBotsChat, cloneScript, appLogo } = req.body;
  if(autoBotsChat !== undefined) appSettings.autoBotsChat = autoBotsChat;
  if(cloneScript !== undefined) appSettings.cloneScript = cloneScript;
  if(appLogo !== undefined) appSettings.appLogo = appLogo;

  io.emit('update_settings', appSettings);
  res.json({ success: true, settings: appSettings });
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
      reactions: {}
    };

    messages.push(newMessage);
    io.to(data.roomId).emit('receive_message', newMessage);

    // HÀNG LOẠT CON CLONE (NGẪU NHIÊN TỪ HÀNG TRĂM DANH TÍNH) TỰ ĐỘNG NHẢY VÀO TRÒ CHUYỆN QUA LẠI
    if (appSettings.autoBotsChat) {
      // Chọn ngẫu nhiên 3 con clone khác nhau từ danh sách hàng trăm clone
      const clonePool = users.filter(u => u.role === 'specialist' && !u.username.startsWith('Bot_'));
      let c1 = clonePool[Math.floor(Math.random() * clonePool.length)];
      let c2 = clonePool[Math.floor(Math.random() * clonePool.length)];
      let c3 = clonePool[Math.floor(Math.random() * clonePool.length)];

      // Clone 1 phản hồi sau 3 giây
      setTimeout(() => {
        let text1 = appSettings.cloneScript || lifeTopics[Math.floor(Math.random() * lifeTopics.length)];
        const reply1 = {
          id: Date.now() + 1,
          roomId: data.roomId,
          senderName: c1.displayName,
          text: text1,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: {}
        };
        messages.push(reply1);
        io.to(data.roomId).emit('receive_message', reply1);

        // Clone 2 hùa theo trò chuyện với clone 1 sau 2 giây nữa
        setTimeout(() => {
          let text2 = "Đúng rồi đấy, chuẩn không cần chỉnh luôn haha!";
          const reply2 = {
            id: Date.now() + 2,
            roomId: data.roomId,
            senderName: c2.displayName,
            text: text2,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            reactions: {}
          };
          messages.push(reply2);
          io.to(data.roomId).emit('receive_message', reply2);

          // Clone 3 tiếp tục bàn luận sau thêm 2 giây nữa tạo cảm giác nhóm chat cực kỳ sống động
          setTimeout(() => {
            let text3 = "Thôi mọi người tập trung làm việc đi lát chiều tính tiếp nào 😂";
            const reply3 = {
              id: Date.now() + 3,
              roomId: data.roomId,
              senderName: c3.displayName,
              text: text3,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              reactions: {}
            };
            messages.push(reply3);
            io.to(data.roomId).emit('receive_message', reply3);
          }, 2000);

        }, 2000);

      }, 3000);
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
