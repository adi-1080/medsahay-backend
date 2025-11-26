import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getCurrentProfile,
  updateProfile,
  createProfile,
  updateSingleField,
  getProfileHealth,
} from '../controllers/patientController.js';
import {getPatientDashboard, getRecentDoctors, getUpcomingAppointments} from '../controllers/patientDashboardController.js';
import { bookAppointment } from '../controllers/appointmentController.js';
import { getPatientNotifications } from '../controllers/notificationController.js';

const router = Router();

// Debug / health – usually no auth
// GET /api/v1/profile/health
router.get('/health', getProfileHealth);

// GET /api/v1/profile/current
router.get('/current', protect, getCurrentProfile);

// PUT /api/v1/profile/update
router.put('/update', protect, updateProfile);

// PATCH /api/v1/profile/update-field?field_name=...
router.patch('/update-field', protect, updateSingleField);

// POST /api/v1/profile/create
router.post('/create', protect, createProfile);

// GET /api/v1/patients/dashboard
router.get('/dashboard', protect, getPatientDashboard);

// GET /api/v1/patients/appointments/upcoming
router.get('/appointments/upcoming', protect, getUpcomingAppointments);

// POST /api/v1/patients/appointments/book
router.post('/appointments/book', protect, bookAppointment);

// GET /api/v1/patients/doctors/recent
router.get('/doctors/recent', protect, getRecentDoctors);

// NEW: GET /api/v1/patients/notifications
router.get('/notifications', protect, getPatientNotifications);

export default router;
