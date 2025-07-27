const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  coins: {
    type: mongoose.Schema.Types.Decimal128,
    default: mongoose.Types.Decimal128.fromString("0.0010")
  },
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },
  referralCount: { type: Number, default: 0 }, // ✅ add this
  referralRewards: { type: [Number], default: [] }, // ✅ add this
  activeSession: { type: Boolean, default: false },
  sessionStartTime: { type: Date, default: null },
  lastMultiplyTime: { type: Date, default: null },
  multiplierStep: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);
