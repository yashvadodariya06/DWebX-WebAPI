const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const Otp = require('../model/Otp');
const { default: mongoose } = require('mongoose');

// Utility to generate random referral code
const generateReferralCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();




exports.verifyOtpAndRegister = async (req, res) => {
    try {
        const { username, email, password, referralCode, enteredOtp } = req.body;

        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord || otpRecord.otp !== enteredOtp) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newReferralCode = generateReferralCode();

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            referralCode: newReferralCode,
            referredBy: referralCode || null,
            coins: mongoose.Types.Decimal128.fromString("0.0010")
        });

        await newUser.save();
        await Otp.deleteMany({ email });

        // ✅ Only update referral count
        if (referralCode) {
            const referrer = await User.findOne({ referralCode });
            if (referrer) {
                referrer.referralCount = (referrer.referralCount || 0) + 1;
                await referrer.save();
            }
        }

        const referralLink = `http://localhost:5000/signup?ref=${newReferralCode}`;
        res.status(201).json({
            message: 'User registered successfully',
            referralCode: newReferralCode,
            referralLink
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};



exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id, type: "User" }, process.env.JWT_SECRET, { expiresIn: '365d' });

        res.status(200).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                coins: user.coins,
                referralCode: user.referralCode,
                referredBy: user.referredBy
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.updateUser = async (req, res) => {
    try {
        const { username, email } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.userId, // corrected from req.user_id
            { username, email },
            { new: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ message: 'User updated', user: updatedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


// Get count of users referred by a given referral code
exports.getReferralCount = async (req, res) => {
    try {
        const userId = req.userId;

        // 1. Get current user
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Use current user's referralCode to find referred users
        const referredUsers = await User.find({ referredBy: currentUser.referralCode }).select('-password'); // Exclude password

        res.status(200).json({
            referralCode: currentUser.referralCode,
            referredUsersCount: referredUsers.length,
            referralRewards: currentUser.referralRewards || [],
            referredUsers
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
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


exports.resetPasswordWithOtp = async (req, res) => {
    const { email, enteredOtp, password, confirmPassword } = req.body;

    try {
        // Step 1: Verify OTP
        const otpRecord = await Otp.findOne({ email });
        if (!otpRecord || otpRecord.otp !== enteredOtp) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Step 2: Check password match
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Step 3: Find and update user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        // Step 4: Delete OTP from DB
        await Otp.deleteMany({ email });

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getCoinInc = async (req, res) => {

    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        // if (user.activeSession) {
        //     return res.status(400).json({ message: 'Please wait, coin process already in progress.' });
        // }

        // user.activeSession = true;
        // await user.save();

        // Add coins after 20 seconds
        setTimeout(async () => {
            const currentCoins = parseFloat(user.coins.toString());
            const updatedCoins = currentCoins + 50;

            user.coins = updatedCoins;
            // user.activeSession = false;
            await user.save();

            console.log(`✅ 50 coins added to user: ${user.username}`);
        }, 20000);

        res.status(200).json({ message: '⏳ Coin process started. Please wait 20 seconds.' });

    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.claimReferralReward = async (req, res) => {
    try {
        const userId = req.userId;
        const { level } = req.body; // 1, 3, or 5

        const bonusMap = {
            1: 50,
            3: 250,
            5: 700
        };

        const bonus = bonusMap[level];
        if (!bonus) return res.status(400).json({ message: "Invalid reward level" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.referralRewards.includes(level)) {
            return res.status(400).json({ message: "Reward already claimed" });
        }

        if (user.referralCount < level) {
            return res.status(400).json({ message: `You need ${level} referrals to claim this reward` });
        }

        const currentCoins = parseFloat(user.coins.toString());
        const newCoins = (currentCoins + bonus).toFixed(4);
        user.coins = mongoose.Types.Decimal128.fromString(newCoins);
        user.referralRewards.push(level);

        await user.save();

        res.status(200).json({
            message: `+${bonus} DWX added to your wallet!`,
            coins: newCoins,
            claimedLevel: level
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
