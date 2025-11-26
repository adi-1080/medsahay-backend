import { Doctor } from '../models/Doctor.js';
import { User } from '../models/User.js';

/**
 * POST /api/v1/doctors
 * Auth: required (doctor or admin)
 * Body: { name, qualifications, specialty, clinic, hospital, availability, price, experience, languages, image }
 */
export const createDoctor = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role !== 'doctor' && role !== 'admin') {
      return res.status(403).json({ detail: 'Only doctor or admin users can create a doctor profile.' });
    }

    // If a doctor profile already exists for this user, return error
    const existing = await Doctor.findOne({ user: userId });
    if (existing) {
      return res.status(400).json({ detail: 'Doctor profile already exists for this user.' });
    }

    const data = req.body || {};

    const doc = new Doctor({
      user: userId,
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
    const doctors = await Doctor.find().lean();
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

    const data = req.body || {};
    const updatable = [
      'name', 'qualifications', 'specialty', 'category', 'clinic', 'hospital',
      'availability', 'price', 'experience', 'rating', 'languages', 'image', 'status'
    ];

    updatable.forEach((key) => {
      if (data[key] !== undefined) doctor[key] = data[key];
    });

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

    await doctor.remove();
    return res.status(200).json({ detail: 'Doctor deleted' });
  } catch (err) {
    console.error('Delete doctor error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export default { createDoctor, getDoctors, getDoctorById, updateDoctor, deleteDoctor };
