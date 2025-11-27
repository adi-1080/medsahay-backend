import { Doctor } from '../models/Doctor.js';
import { User } from '../models/User.js';

/**
 * POST /api/v1/doctors/register
 * Auth: required (user with doctor role or patient role who wants to be a doctor)
 * Body: { hpr_id, name, qualifications, specialty, clinic, hospital, availability, price, experience, languages, image }
 * Purpose: Doctor user registers and creates a doctor profile (status: pending_verification)
 */
export const registerDoctor = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    // Allow doctor role to register, or patient role to upgrade to doctor
    if (role !== 'doctor' && role !== 'patient') {
      return res.status(403).json({ detail: 'Only doctor or patient users can register as a doctor.' });
    }

    // If a doctor profile already exists for this user, return error
    const existing = await Doctor.findOne({ user: userId });
    if (existing) {
      return res.status(400).json({ detail: 'Doctor profile already exists for this user.' });
    }

    const data = req.body || {};

    if (!data.hpr_id) {
      return res.status(400).json({ detail: 'HPR ID is required.' });
    }

    if (!data.name || !data.specialty) {
      return res.status(400).json({ detail: 'name and specialty are required.' });
    }

    // Check if HPR ID is already used by another doctor
    const hprExists = await Doctor.findOne({ hpr_id: data.hpr_id });
    if (hprExists) {
      return res.status(409).json({ detail: 'HPR ID already registered.' });
    }

    const doc = new Doctor({
      user: userId,
      hpr_id: data.hpr_id,
      name: data.name,
      qualifications: data.qualifications || [],
      specialty: data.specialty,
      category: data.category,
      clinic: data.clinic,
      hospital: data.hospital,
      availability: data.availability || {},
      price: data.price || 0,
      experience: data.experience || 0,
      rating: data.rating || 0,
      languages: data.languages || [],
      image: data.image || '',
      verification_status: 'pending_verification', // Default status on registration
    });

    await doc.save();

    console.log('Doctor registered:', { userId, hpr_id: data.hpr_id, name: data.name, userRole: role });

    return res.status(201).json({
      detail: 'Doctor profile created. Awaiting admin verification.',
      doctor: doc,
    });
  } catch (err) {
    console.error('Register doctor error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * POST /api/v1/doctors
 * Auth: required (admin only for manual doctor creation)
 * Body: { user, hpr_id, name, qualifications, specialty, clinic, hospital, availability, price, experience, languages, image, verification_status }
 * Purpose: Admin can directly create a doctor (for testing or direct verification)
 */
export const createDoctor = async (req, res) => {
  try {
    const role = req.user.role;

    if (role !== 'admin') {
      return res.status(403).json({ detail: 'Only admin can create doctor profiles directly. Use /doctors/register as a doctor user.' });
    }

    const data = req.body || {};

    if (!data.user || !data.hpr_id || !data.name || !data.specialty) {
      return res.status(400).json({ detail: 'user, hpr_id, name, and specialty are required.' });
    }

    // If a doctor profile already exists for this user, return error
    const existing = await Doctor.findOne({ user: data.user });
    if (existing) {
      return res.status(400).json({ detail: 'Doctor profile already exists for this user.' });
    }

    // Check if HPR ID is already used
    const hprExists = await Doctor.findOne({ hpr_id: data.hpr_id });
    if (hprExists) {
      return res.status(409).json({ detail: 'HPR ID already registered.' });
    }

    const doc = new Doctor({
      user: data.user,
      hpr_id: data.hpr_id,
      name: data.name,
      qualifications: data.qualifications || [],
      specialty: data.specialty,
      category: data.category,
      clinic: data.clinic,
      hospital: data.hospital,
      availability: data.availability || {},
      price: data.price || 0,
      experience: data.experience || 0,
      rating: data.rating || 0,
      languages: data.languages || [],
      image: data.image || '',
      verification_status: data.verification_status || 'pending_verification',
    });

    await doc.save();

    return res.status(201).json({ doctor: doc });
  } catch (err) {
    console.error('Create doctor error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const getDoctors = async (req, res) => {
  try {
    // Only return verified doctors to public
    const doctors = await Doctor.find({ verification_status: 'verified' }).lean();
    return res.status(200).json(doctors);
  } catch (err) {
    console.error('Get doctors error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findById(id).lean();
    if (!doctor) return res.status(404).json({ detail: 'Doctor not found' });
    return res.status(200).json(doctor);
  } catch (err) {
    console.error('Get doctor by id error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const doctor = await Doctor.findById(id);
    if (!doctor) return res.status(404).json({ detail: 'Doctor not found' });

    // Allow update if admin or owner
    if (role !== 'admin' && String(doctor.user) !== String(userId)) {
      return res.status(403).json({ detail: 'Forbidden' });
    }

    // Prevent verified doctor from modifying their profile after verification (optional)
    // You can remove this check if you want verified doctors to update their info
    if (doctor.verification_status === 'verified' && role !== 'admin') {
      return res.status(400).json({
        detail: 'Verified doctor profile cannot be updated. Contact admin for changes.',
      });
    }

    const data = req.body || {};
    const updatable = [
      'qualifications', 'specialty', 'category', 'clinic', 'hospital',
      'availability', 'price', 'experience', 'rating', 'languages', 'image'
    ];

    updatable.forEach((key) => {
      if (data[key] !== undefined) doctor[key] = data[key];
    });

    // Admin can update verification_status, notes
    if (role === 'admin') {
      if (data.verification_status) doctor.verification_status = data.verification_status;
      if (data.verification_notes) doctor.verification_notes = data.verification_notes;
    }

    await doctor.save();
    return res.status(200).json({ doctor });
  } catch (err) {
    console.error('Update doctor error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role;

    if (role !== 'admin') {
      return res.status(403).json({ detail: 'Only admin can delete doctor profiles.' });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) return res.status(404).json({ detail: 'Doctor not found' });

    await Doctor.deleteOne({_id:id},{});
    return res.status(200).json({ detail: 'Doctor deleted' });
  } catch (err) {
    console.error('Delete doctor error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export default { createDoctor, getDoctors, getDoctorById, updateDoctor, deleteDoctor };
