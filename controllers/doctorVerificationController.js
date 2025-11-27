import { Doctor } from '../models/Doctor.js';
import { User } from '../models/User.js';

/**
 * POST /api/v1/admin/doctors/verify/:doctorId
 * Auth: required (admin only)
 * Body: { approved: boolean, verification_notes?: string }
 * Purpose: Admin approves or rejects a doctor's registration based on HPR ID verification
 */
export const verifyDoctor = async (req, res) => {
  try {
    const adminId = req.user.id;
    const adminRole = req.user.role;

    if (adminRole !== 'admin') {
      return res.status(403).json({ detail: 'Only admin can verify doctors.' });
    }

    const { doctorId } = req.params;
    const { approved, verification_notes } = req.body;

    if (approved === undefined) {
      return res.status(400).json({ detail: 'approved field is required (true/false).' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ detail: 'Doctor not found' });
    }

    if (doctor.verification_status !== 'pending_verification') {
      return res.status(400).json({
        detail: `Doctor is already ${doctor.verification_status}. Cannot re-verify.`,
      });
    }

    // Update verification status
    doctor.verification_status = approved ? 'verified' : 'rejected';
    doctor.verification_notes = verification_notes || '';
    doctor.verification_date = new Date();
    doctor.verified_by_admin = adminId;

    await doctor.save();

    console.log('Doctor verification:', {
      doctorId,
      status: doctor.verification_status,
      notes: verification_notes,
      admin: adminId,
    });

    return res.status(200).json({
      detail: approved ? 'Doctor approved.' : 'Doctor rejected.',
      doctor,
    });
  } catch (err) {
    console.error('Verify doctor error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * GET /api/v1/admin/doctors/pending
 * Auth: required (admin only)
 * Purpose: Get all doctors pending verification
 */
export const getPendingDoctors = async (req, res) => {
  try {
    const adminRole = req.user.role;

    if (adminRole !== 'admin') {
      return res.status(403).json({ detail: 'Only admin can view pending doctors.' });
    }

    const pendingDoctors = await Doctor.find({ verification_status: 'pending_verification' })
      .populate('user', 'fullName email phone_number')
      .lean();

    return res.status(200).json({
      count: pendingDoctors.length,
      doctors: pendingDoctors,
    });
  } catch (err) {
    console.error('Get pending doctors error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * GET /api/v1/admin/doctors/verified
 * Auth: required (admin only)
 * Purpose: Get all verified doctors
 */
export const getVerifiedDoctors = async (req, res) => {
  try {
    const adminRole = req.user.role;

    if (adminRole !== 'admin') {
      return res.status(403).json({ detail: 'Only admin can view verified doctors.' });
    }

    const verifiedDoctors = await Doctor.find({ verification_status: 'verified' })
      .populate('user', 'fullName email phone_number')
      .lean();

    return res.status(200).json({
      count: verifiedDoctors.length,
      doctors: verifiedDoctors,
    });
  } catch (err) {
    console.error('Get verified doctors error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * GET /api/v1/admin/doctors/rejected
 * Auth: required (admin only)
 * Purpose: Get all rejected doctors
 */
export const getRejectedDoctors = async (req, res) => {
  try {
    const adminRole = req.user.role;

    if (adminRole !== 'admin') {
      return res.status(403).json({ detail: 'Only admin can view rejected doctors.' });
    }

    const rejectedDoctors = await Doctor.find({ verification_status: 'rejected' })
      .populate('user', 'fullName email phone_number')
      .lean();

    return res.status(200).json({
      count: rejectedDoctors.length,
      doctors: rejectedDoctors,
    });
  } catch (err) {
    console.error('Get rejected doctors error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * GET /api/v1/admin/doctors/all
 * Auth: required (admin only)
 * Purpose: Get all doctors with any status
 */
export const getAllDoctorsAdmin = async (req, res) => {
  try {
    const adminRole = req.user.role;

    if (adminRole !== 'admin') {
      return res.status(403).json({ detail: 'Only admin can view all doctors.' });
    }

    const allDoctors = await Doctor.find()
      .populate('user', 'fullName email phone_number')
      .populate('verified_by_admin', 'fullName email')
      .lean();

    return res.status(200).json({
      count: allDoctors.length,
      doctors: allDoctors,
    });
  } catch (err) {
    console.error('Get all doctors admin error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export default {
  verifyDoctor,
  getPendingDoctors,
  getVerifiedDoctors,
  getRejectedDoctors,
  getAllDoctorsAdmin,
};
