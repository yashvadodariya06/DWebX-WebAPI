const User = require('../model/User');


exports.startSession = async (req, res) => {
    try {
        const userId = req.userId; // from your middleware
        console.log(userId);

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: No user ID' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.activeSession = true;
        user.sessionStartTime = new Date();
        user.lastMultiplyTime = null;
        user.multiplierStep = 0;

        await user.save();

        res.status(200).json({
            message: 'Session started successfully',
            activeSession: user.activeSession,
            sessionStartTime: user.sessionStartTime,
            coins: user.coins // ✅ added current coin balance
        });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getSessionStatus = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            activeSession: user.activeSession,
            sessionStartTime: user.sessionStartTime,
            coins: user.coins
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};


exports.getTopCoinUser = async (req, res) => {
    try {
        // Total user count
        const totalUsers = await User.countDocuments();

        // Top 20 users with only username and coins
        const topUsers = await User.find()
            .sort({ coins: -1 })
            .limit(20)
            .select('username coins'); // ✅ Only select needed fields

        res.status(200).json({
            totalUsers,
            topUsers,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

