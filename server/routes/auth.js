const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../utils/errorHandler');
const { authValidations } = require('../utils/validations');
const {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

const router = express.Router();

// Routes
router.post('/register', authValidations.register, handleValidationErrors, register);
router.post('/login', authValidations.login, handleValidationErrors, login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, authValidations.changePassword, handleValidationErrors, changePassword);
router.post('/forgot-password', authValidations.forgotPassword, handleValidationErrors, forgotPassword);
router.put('/reset-password/:token', authValidations.resetPassword, handleValidationErrors, resetPassword);

module.exports = router;
