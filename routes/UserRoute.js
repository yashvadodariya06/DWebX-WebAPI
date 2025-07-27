const express = require('express');
const router = express.Router();

const userController = require('../controller/UserController');
const genrateCoinController = require('../controller/GenrateCoinController');
const OtpController = require('../controller/OtpController');
const verifyToken = require('../middleware/UserTokenCheck');

// OTP
router.post('/send-otp', OtpController.sendOtp);

// Public routes
router.post('/register', userController.verifyOtpAndRegister);
router.post('/login', userController.login);

// Protected routes (require valid token)
router.get('/get', verifyToken, userController.getCurrentUser);
router.put('/update', verifyToken, userController.updateUser);

router.get('/get-refer-user', verifyToken, userController.getReferralCount);

// 
router.post('/start-session', verifyToken,genrateCoinController.startSession);
router.get('/session-status', verifyToken, genrateCoinController.getSessionStatus);
router.get('/top-user', userController.getTopCoinUser);


router.post('/reset-password', userController.resetPasswordWithOtp);
router.post('/start-coin-process', verifyToken , userController.getCoinInc);
router.post('/claim-reward', verifyToken, userController.claimReferralReward);



















module.exports = router;
