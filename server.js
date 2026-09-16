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
  'Quạu Cơ', 'Trầm Zn', 'Flexer Chính Hiệu', 'Bảnh Trai Phết', 'Tài Phiệt', 
  'Hệ Đốt Lương', 'Genz Lười', 'Đâm Chồi Nảy Lộc', 'Mất Ngủ', 'Hệ Tư Duy', 
  'Chúa Chốt Đơn', 'Vua Té Nước', 'Lười Nhưng Giàu', 'Hệ Mỏ Lắm', 'Đại Gia Ổi',
  'Boss Ẩn Danh', 'Cục Súc Đại Nhân', 'Thích Đếm Tiền', 'Hệ Sống Lỏ', 'Hệ Bám Sếp',
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

const reactionIcons = ['❤️', '😂', '👍', '🔥', '😍', '👏'];
const bossTag = '@QUẢN LÍ HỆ THỐNG';

// KHO TỪ VỰNG TỰ TƯƠNG TÁC (NHIỆM VỤ, LƯƠNG 300K, MUA ĐỒ, THU NHẬP)
const backgroundPool = [
  "hôm nay cày nhiệm vụ chăm chỉ nên thu nhập tốt hơn hẳn hôm qua",
  "sau 2 ngày thử việc nghiêm túc nay nhận ngay lương cứng 300k sướng quá anh em ơi",
  "kiếm tiền chỗ sếp xong đợt này đủ tiền mua món đồ mình thích từ lâu rồi",
  "nhìn số tiền kiếm được hôm nay mà có động lực làm nhiệm vụ tiếp",
  "thời gian thử việc qua nhanh, nay nhận lương 300k thấy ấm lòng hẳn",
  "cố gắng hoàn thành nhiệm vụ để kiếm thêm thu nhập mua món đồ yêu thích",
  "thu nhập hôm nay tăng vọt vượt qua cả ngày hôm qua nhờ bám sát nhiệm vụ",
  "anh em đang tập trung đẩy mạnh nhiệm vụ để rủng rỉnh ví tiền",
  "làm việc chỗ sếp vừa vui lại vừa có lương cứng 300k sau 2 ngày, tuyệt vời",
  "hôm nay chớp thời cơ làm nhiệm vụ nên số tiền thu về cực kỳ rực rỡ",
  "vừa làm cốc cafe sáng xong ngồi check lại bảng nhiệm vụ thấy trôi phết",
  "ae dạo này làm nhiệm vụ tốc độ thế nào rồi, thấy cày ác chiến quá",
  "ngồi nhìn bảng tiến độ nhảy liên tục mà công nhận cuốn thực sự"
];

function generateVibrantSentence(recentTexts = []) {
  let attempts = 0;
  let candidate = "";
  do {
    let base = backgroundPool[Math.floor(Math.random() * backgroundPool.length)];
    let suffixes = [
      "thật sự quá đã", "anh em cứ thế phát huy nhé", "không uổng công cày cuốc", 
      "chuẩn không cần chỉnh", "căng cực luôn", "cả nhà thấy chuẩn chưa", "quá uy tín"
    ];
    let suf = suffixes[Math.floor(Math.random() * suffixes.length)];

    if (Math.random() > 0.8) {
      candidate = `${bossTag} ${base}, ${suf}`;
    } else {
      candidate = `${base}, ${suf}`;
    }

    attempts++;
  } while (recentTexts.includes(candidate) && attempts < 100);

  return candidate;
}

// BOT KIỂM DUYỆT CHỐNG SPAM / XÓA SẠCH TIN NHẮN TRÙNG LẶP
function checkAndCleanDuplicates(roomId, ioServer) {
  const roomMsgs = messages.filter(m => m.roomId === roomId);
  const seenTexts = new Set();
  let validMessages = [];
  let hasDeleted = false;

  roomMsgs.forEach(m => {
    if (seenTexts.has(m.text)) {
      hasDeleted = true; // Trùng lặp -> Xóa vĩnh viễn
    } else {
      seenTexts.add(m.text);
      validMessages.push(m);
    }
  });

  if (hasDeleted) {
    messages = messages.filter(m => m.roomId !== roomId).concat(validMessages);
    ioServer.to(roomId).emit('load_room_data', { 
      messages: validMessages, 
      pinnedMsg: null, 
      roomAvatarUrl: 'https://i.ibb.co/NdVf8Btz/logo.png', 
      roomName: 'Phòng Chat' 
    });
  }
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

// VÒNG LẶP BACKGROUND CHUẨN 3.5 GIÂY (CLONE TỰ TƯƠNG TÁC CHÉO KHI KHÔNG CÓ SẾP)
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
      let recentTexts = roomMsgs.slice(-200).map(m => m.text);

      let text1 = generateVibrantSentence(recentTexts);
      recentTexts.push(text1);
      let tagPeer = (Math.random() > 0.5) ? `@${cl1.displayName} ` : '';
      let text2 = tagPeer + generateVibrantSentence(recentTexts);

      const m1 = { id: Date.now(), roomId: activeRoom.id, senderName: cl1.displayName, text: text1, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), imageUrl: null, reactions: {} };
      const m2 = { id: Date.now() + 1, roomId: activeRoom.id, senderName: cl2.displayName, text: text2, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), imageUrl: null, reactions: {} };

      messages.push(m1);
      io.to(activeRoom.id).emit('receive_message', m1);
      checkAndCleanDuplicates(activeRoom.id, io);

      if (roomMsgs.length > 0 && Math.random() > 0.3) {
        let targetMsg = roomMsgs[Math.floor(Math.random() * roomMsgs.length)];
        let randomIcon = reactionIcons[Math.floor(Math.random() * reactionIcons.length)];
        if(!targetMsg.reactions) targetMsg.reactions = {};
        targetMsg.reactions[cl2.displayName] = randomIcon;
        io.to(activeRoom.id).emit('update_reaction', { msgId: targetMsg.id, reactions: targetMsg.reactions });
      }

      setTimeout(() => {
        messages.push(m2);
        io.to(activeRoom.id).emit('receive_message', m2);
        checkAndCleanDuplicates(activeRoom.id, io);
      }, 1000);
    });
  }
}, 3500);

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
    checkAndCleanDuplicates(data.roomId, io);

    // KHI SẾP VỪA NHẮN -> TOÀN BỘ CLONE ĐỔ HƯỚNG TẬP TRUNG TUNG HÔ ĐÚNG CHỦ ĐỀ SẾP NÓI
    if (appSettings.autoBotsChat) {
      setTimeout(() => {
        const clonePool = users.filter(u => u.role === 'specialist' && u.username.startsWith('clone_'));
        let userMsg = data.text || "";
        let cleanUserMsg = userMsg.trim();
        
        let totalBatches = 15; 
        let batchInterval = 3500; 

        for(let b = 0; b < totalBatches; b++) {
          setTimeout(() => {
            let randUser = clonePool[Math.floor(Math.random() * clonePool.length)];
            let peer1 = clonePool[Math.floor(Math.random() * clonePool.length)];
            while(peer1.id === randUser.id) peer1 = clonePool[Math.floor(Math.random() * clonePool.length)];

            const roomMsgs = messages.filter(m => m.roomId === data.roomId);
            let recentTexts = roomMsgs.slice(-200).map(m => m.text);

            let replyBody = "";
            let snippet = cleanUserMsg.length > 25 ? cleanUserMsg.substring(0, 25) + "..." : cleanUserMsg;

            if (cleanUserMsg.toLowerCase() === 'alo') {
              replyBody = `${bossTag} nghe sếp ơi, ae đang tập trung cày nhiệm vụ nhiệt tình đây ạ`;
            } else if (cleanUserMsg.length > 0) {
              let directFocusOptions = [
                `nhất trí cao với ý kiến "${snippet}" của ${bossTag}, thu nhập hôm nay của ae chắc chắn sẽ tốt hơn hôm qua`,
                `nghe ${bossTag} chỉ đạo về "${snippet}" là ae có thêm động lực cày nhiệm vụ mua món đồ mình thích rồi`,
                `chuẩn xác luôn ${bossTag} ơi, bám sát vụ "${snippet}" này thì lương cứng 300k sau 2 ngày thử việc quá xứng đáng`,
                `hoàn toàn đồng tình với ${bossTag} về "${snippet}", ae đang đẩy mạnh nhiệm vụ để rủng rỉnh ví tiền đây`
              ];
              replyBody = directFocusOptions[Math.floor(Math.random() * directFocusOptions.length)];
            } else {
              replyBody = generateVibrantSentence(recentTexts);
            }

            let tagPrefix = (b > 0 && Math.random() > 0.4) ? `@${peer1.displayName} ` : '';
            let finalReply = tagPrefix + replyBody;

            const mRep = {
              id: Date.now() + b,
              roomId: data.roomId,
              senderName: randUser.displayName,
              text: finalReply,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              imageUrl: null,
              reactions: {}
            };

            messages.push(mRep);
            io.to(data.roomId).emit('receive_message', mRep);
            checkAndCleanDuplicates(data.roomId, io);

            if (roomMsgs.length > 0 && Math.random() > 0.4) {
              let targetMsg = roomMsgs[Math.floor(Math.random() * roomMsgs.length)];
              let randomIcon = reactionIcons[Math.floor(Math.random() * reactionIcons.length)];
              if(!targetMsg.reactions) targetMsg.reactions = {};
              targetMsg.reactions[randUser.displayName] = randomIcon;
              io.to(data.roomId).emit('update_reaction', { msgId: targetMsg.id, reactions: targetMsg.reactions });
            }
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
