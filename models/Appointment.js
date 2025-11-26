import mongoose from 'mongoose';

const { Schema, model } = mongoose;
/* =============
 * Appointment
 * ============= */

const AppointmentSchema = new Schema(
  {
    // Either store a numeric/uuid appointment_id as string OR use _id. Optional field:
    appointment_id: { type: String },

    patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },

    doctor_name: { type: String }, // denormalized snapshot (for faster dashboard rendering)
    specialty: { type: String },
    hospital: { type: String },
    clinic: { type: String },

    // Can store as single Date; if you want to keep date+time separate for UI, store both.
    appointment_date: { type: Date, required: true },
    appointment_time: { type: String }, // e.g. "10:30 AM"

    status: {
      type: String,
      enum: ['confirmed', 'pending', 'completed', 'cancelled'],
      default: 'pending',
    },

    type: {
      type: String,
      enum: ['In-person', 'Video Call'],
      default: 'In-person',
    },

    fee: { type: Number }, // actual charged fee
    rating: { type: Number, min: 0, max: 5 }, // patient can rate after completion
    // Patient's reason/complaint for the appointment
    reason: { type: String },
    // FCFS token number for the appointment (assigned per doctor per day)
    token_number: { type: Number },
  },
  { timestamps: true }
);

const Appointment = model('Appointment', AppointmentSchema);

export {Appointment};