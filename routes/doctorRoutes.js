import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  registerDoctor,
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctorController.js';
import {
  verifyDoctor,
  getPendingDoctors,
  getVerifiedDoctors,
  getRejectedDoctors,
  getAllDoctorsAdmin,
} from '../controllers/doctorVerificationController.js';

const router = Router();

// Admin-only routes MUST come FIRST (before /:id routes to avoid conflicts)
// POST /api/v1/doctors/admin/verify/:doctorId - admin approves/rejects doctor
router.post('/admin/verify/:doctorId', protect, verifyDoctor);

// GET /api/v1/doctors/admin/pending - admin views pending doctors
router.get('/admin/pending', protect, getPendingDoctors);

// GET /api/v1/doctors/admin/verified - admin views verified doctors
router.get('/admin/verified', protect, getVerifiedDoctors);

// GET /api/v1/doctors/admin/rejected - admin views rejected doctors
router.get('/admin/rejected', protect, getRejectedDoctors);

// GET /api/v1/doctors/admin/all - admin views all doctors
router.get('/admin/all', protect, getAllDoctorsAdmin);

// Public routes
// GET /api/v1/doctors - only returns verified doctors
router.get('/', getDoctors);

// GET /api/v1/doctors/:id - public, view any doctor
router.get('/:id', getDoctorById);

// Doctor routes
// POST /api/v1/doctors/register - doctor registers (sets status to pending_verification)
router.post('/register', protect, registerDoctor);

// PUT /api/v1/doctors/:id - doctor updates their profile (owner or admin)
router.put('/:id', protect, updateDoctor);

// DELETE /api/v1/doctors/:id - admin only
router.delete('/:id', protect, deleteDoctor);

export default router;
