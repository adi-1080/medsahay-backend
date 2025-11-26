import { User } from '../models/User.js';
import { PatientProfile } from '../models/PatientProfile.js';
import { Appointment } from '../models/Appointment.js';
import { Notification } from '../models/Notification.js';
import { Doctor } from '../models/Doctor.js';

/**
 * GET /api/v1/patients/dashboard
 * Response:
 * {
 *   user_name,
 *   active_appointments,
 *   upcoming_visits,
 *   notifications_count,
 *   // optionally more stats...
 * }
 */
export const getPatientDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    // Active appointments (pending + confirmed)
    const activeStatuses = ['pending', 'confirmed'];

    // If the authenticated user is a doctor, return doctor-specific dashboard
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: userId });
      const doctorName = doctor?.name || user?.fullName || user?.email || 'Doctor';

      const [activeCount, upcomingCount, unreadNotifications] = await Promise.all([
        Appointment.countDocuments({
          doctor: doctor?._id,
          status: { $in: activeStatuses },
        }),
        Appointment.countDocuments({
          doctor: doctor?._id,
          status: { $in: activeStatuses },
          appointment_date: { $gte: dayStart },
        }),
        Notification.countDocuments({
          user: userId,
          is_read: false,
        }),
      ]);

      console.log('Doctor dashboard:', { userId, doctor: doctor?._id, activeCount, upcomingCount, unreadNotifications, now: now.toISOString() });

      return res.status(200).json({
        user_name: doctorName,
        active_appointments: activeCount,
        upcoming_visits: upcomingCount,
        notifications_count: unreadNotifications,
      });
    }

    // Default: patient dashboard
    const profile = await PatientProfile.findOne({ user: userId });

    const user_name = profile?.full_name || user?.fullName || user?.email || 'User';

    const [activeCount, upcomingCount, unreadNotifications] = await Promise.all([
      Appointment.countDocuments({
        patient: userId,
        status: { $in: activeStatuses },
      }),
      Appointment.countDocuments({
        patient: userId,
        status: { $in: activeStatuses },
        appointment_date: { $gte: dayStart },
      }),
      Notification.countDocuments({
        user: userId,
        is_read: false,
      }),
    ]);

    console.log('Patient dashboard:', { userId, activeCount, upcomingCount, unreadNotifications, now: now.toISOString() });

    return res.status(200).json({
      user_name,
      active_appointments: activeCount,
      upcoming_visits: upcomingCount,
      notifications_count: unreadNotifications,
    });
  } catch (err) {
    console.error('Patient dashboard error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * GET /api/v1/patients/appointments/upcoming
 * Response: [Appointment, ...]
 */
export const getUpcomingAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

      // If doctor, return appointments for their doctor profile
      if (req.user.role === 'doctor') {
        const doctor = await Doctor.findOne({ user: userId });
        const appointments = await Appointment.find({
          doctor: doctor?._id,
          status: { $in: ['pending', 'confirmed'] },
          appointment_date: { $gte: dayStart },
        })
          .sort({ appointment_date: 1 })
          .lean();

        console.log('Upcoming appointments fetched for doctor', { userId, doctor: doctor?._id, count: appointments.length, dayStart: dayStart.toISOString() });

        return res.status(200).json(appointments);
      }

      const appointments = await Appointment.find({
        patient: userId,
        status: { $in: ['pending', 'confirmed'] },
        appointment_date: { $gte: dayStart },
      })
        .sort({ appointment_date: 1 })
        .lean();

      console.log('Upcoming appointments fetched', { userId, count: appointments.length, dayStart: dayStart.toISOString() });

      return res.status(200).json(appointments);

    console.log('Upcoming appointments fetched', { userId, count: appointments.length, dayStart: dayStart.toISOString() });

    return res.status(200).json(appointments);
  } catch (err) {
    console.error('Upcoming appointments error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * GET /api/v1/patients/doctors/recent
 * Response: array of doctors the patient recently interacted with
 * [
 *   {
 *     id,
 *     doctor_name,
 *     specialty,
 *     clinic,
 *     hospital,
 *     rating,
 *     price,
 *     image,
 *   }, ...
 * ]
 */
export const getRecentDoctors = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get recent appointments and populate doctor
    const recentAppointments = await Appointment.find({
      patient: userId,
      status: { $in: ['pending', 'confirmed', 'completed'] },
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('doctor')
      .lean();

    // Deduplicate doctors (keep order)
    const seen = new Set();
    const recentDoctors = [];

    for (const appt of recentAppointments) {
      const doc = appt.doctor;
      if (!doc || !doc._id) continue;
      const idStr = String(doc._id);
      if (seen.has(idStr)) continue;
      seen.add(idStr);

      recentDoctors.push({
        id: doc._id,
        doctor_name: doc.name,
        specialty: doc.specialty,
        clinic: doc.clinic,
        hospital: doc.hospital,
        rating: doc.rating,
        price: doc.price,
        image: doc.image,
        experience: doc.experience,
      });
    }

    return res.status(200).json(recentDoctors);
  } catch (err) {
    console.error('Recent doctors error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};