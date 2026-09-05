/**
 * User Routes
 * 
 * Mounts protected endpoints under /api/v1/users:
 * - GET    /me
 * - PATCH  /me
 * - POST   /me/onboarding
 * - POST   /me/change-password
 * - DELETE /me
 */

const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  onboardingSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require('../validators/userValidators');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileSchema), userController.updateMe);
router.post('/me/onboarding', validate(onboardingSchema), userController.saveOnboarding);
router.post('/me/change-password', validate(changePasswordSchema), userController.changePassword);
router.delete('/me', userController.deleteMe);

module.exports = router;
