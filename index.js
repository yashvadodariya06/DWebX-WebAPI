const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http'); // ✅ Needed for socket.io
const socketIo = require('socket.io');

dotenv.config();
const app = express();
const server = http.createServer(app); // ✅ Create raw HTTP server
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for now (adjust in production)
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const DB_URI = process.env.DB_LINK.replace('1NGhkT7i3Do4YRAs', process.env.DB_PASS);
mongoose.connect(DB_URI, {
  dbName: process.env.DB_NAME,
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
const adminRoutes = require('./routes/AdminRoute');
const userRoutes = require('./routes/UserRoute');
const User = require('./model/User');

app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
  res.send('Server is running...!! This Project .....!!');
});

// ✅ Socket.io connection
io.on("connection", (socket) => {
  console.log("📡 A user connected:", socket.id);

  // Optional: User joins their own room
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("👋 A user disconnected:", socket.id);
  });
});

// ✅ Coin mining loop – every 2 seconds
setInterval(async () => {
  try {
    const miningUsers = await User.find({ activeSession: true });

    for (const user of miningUsers) {
      const now = new Date();
      const sessionStart = new Date(user.sessionStartTime);
      const hoursPassed = (now - sessionStart) / (1000 * 60 * 60); // convert ms to hours

      if (hoursPassed >= 24) {
        // End session after 24 hours
        user.activeSession = false;
        user.sessionStartTime = null;
        user.multiplierStep = 0;
        user.lastMultiplyTime = null;

        await user.save();
        console.log(`Session ended for user: ${user._id}`);

        // Optionally notify user
        io.to(user._id.toString()).emit("session_ended", {
          message: "⏱️ Mining session ended after 24 hours",
        });

        continue; // skip further mining logic
      }

      // Mining logic
      const newCoins = parseFloat(user.coins || 0) + 0.0008;
      user.coins = newCoins.toFixed(4);
      await user.save();

      io.to(user._id.toString()).emit("coin_updated", {
        userId: user._id,
        coins: user.coins
      });
    }
  } catch (error) {
    console.error("⛔ Error in MongoDB coin mining loop:", error);
  }
}, 2000);


// ✅ Start the server using the raw HTTP server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
