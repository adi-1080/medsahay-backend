import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctorController.js';

const router = Router();

// GET /api/v1/doctors
router.get('/', getDoctors);

// GET /api/v1/doctors/:id
router.get('/:id', getDoctorById);

// POST /api/v1/doctors  (create doctor profile) - auth required
router.post('/', protect, createDoctor);

// PUT /api/v1/doctors/:id - auth required (owner or admin)
router.put('/:id', protect, updateDoctor);

// DELETE /api/v1/doctors/:id - auth required (admin)
router.delete('/:id', protect, deleteDoctor);

export default router;
