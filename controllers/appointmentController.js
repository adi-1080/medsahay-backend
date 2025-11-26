import { Appointment } from '../models/Appointment.js';
import mongoose from 'mongoose';

/**
 * POST /api/v1/patients/appointments/book
 * Auth: required
 * Body: { doctor: doctorId, appointment_date: ISODateString, appointment_time?, type?, fee? }
 * Response: 201 with created appointment (includes token_number)
 *
 * Token assignment: FCFS per doctor per day. The controller computes the token by
 * finding the highest token_number already assigned for the given doctor and date
 * and increments it by 1. If none exist, token = 1.
 */
export const bookAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctor, appointment_date, appointment_time, type, fee, reason } = req.body;

    if (!doctor || !appointment_date) {
      return res.status(400).json({ detail: 'doctor and appointment_date are required.' });
    }

    const apptDate = new Date(appointment_date);
    if (Number.isNaN(apptDate.getTime())) {
      return res.status(400).json({ detail: 'Invalid appointment_date. Use ISO date string.' });
    }

    // compute day range (midnight to next midnight) to assign tokens per-day
    const dayStart = new Date(apptDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Find the current max token for the doctor on that date
    const latest = await Appointment.findOne({
      doctor: doctor,
      appointment_date: { $gte: dayStart, $lt: dayEnd },
    })
      .sort({ token_number: -1 })
      .select('token_number')
      .lean();

    const nextToken = latest && latest.token_number ? latest.token_number + 1 : 1;

    const appointment = new Appointment({
      patient: patientId,
      doctor: doctor,
      appointment_date: apptDate,
      appointment_time: appointment_time || undefined,
      type: type || 'In-person',
      fee: fee || 0,
      reason: reason || undefined,
      token_number: nextToken,
      status: 'pending',
    });

    await appointment.save();

    // Debug log to help verify booking flow
    console.log('Appointment created:', {
      id: appointment._id,
      patient: appointment.patient,
      doctor: appointment.doctor,
      appointment_date: appointment.appointment_date,
      token_number: appointment.token_number,
    });

    return res.status(201).json({ appointment });
  } catch (err) {
    console.error('Book appointment error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

export default { bookAppointment };
