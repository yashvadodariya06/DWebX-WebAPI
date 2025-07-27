const mongoose = require('mongoose');
const User = require('../model/User'); // Adjust path as per your project structure

// Coin multiplier worker function
async function multiplyCoins() {
  try {
    const users = await User.find({ activeSession: true });
    const now = new Date();

    for (const user of users) {
      // End session after 24 hours
      const hoursPassed = (now - user.sessionStartTime) / (1000 * 60 * 60);
      if (hoursPassed >= 24) {
        user.activeSession = false;
        user.sessionStartTime = null;
        user.lastMultiplyTime = null;
        user.multiplierStep = 0;
        await user.save();
        console.log(`⛔️ Session ended for user ${user._id}`);
        continue;
      }

      // Initialize lastMultiplyTime if not set
      if (!user.lastMultiplyTime) {
        user.lastMultiplyTime = now;
        await user.save();
        continue;
      }

      // Check if at least 3 seconds passed
      const secondsPassed = (now - user.lastMultiplyTime) / 1000;
      if (secondsPassed >= 3) {
        let currentCoins = user.coins ? parseFloat(user.coins.toString()) : 0.001;

        // This multiplier is tuned to reach ~10 coins in 24 hours
        const multiplier = 1.00032;

        let newCoins = currentCoins * multiplier;

        // Set new coins with 4 decimal precision
        user.coins = mongoose.Types.Decimal128.fromString(newCoins.toFixed(4));
        user.lastMultiplyTime = now;

        await user.save();

        console.log(`✅ User ${user._id}: ${currentCoins.toFixed(4)} → ${newCoins.toFixed(4)}`);
      }
    }
  } catch (err) {
    console.error('❌ Error in multiplyCoins:', err);
  }
}

module.exports = { multiplyCoins };
