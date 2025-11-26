import mongoose from 'mongoose';

const { Schema, model } = mongoose;
/* =========================
 * User (Auth / LocalStorage)
 * ========================= */

const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // Hashed password (not selected by default)
  password: { type: String, required: true, select: false },
    phone_number: { type: String, required: true },
    role: {
      type: String,
      enum: ['doctor', 'patient', 'admin'],
      required: true,
      default: 'patient',
    },

    // Optional links to profiles (if you separate them as different collections)
    patient_profile: { type: Schema.Types.ObjectId, ref: 'PatientProfile' },
    doctor_profile: { type: Schema.Types.ObjectId, ref: 'Doctor' },
  },
  { timestamps: true }
);

const User = model('User', UserSchema);

export {User};