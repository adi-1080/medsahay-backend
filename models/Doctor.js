import mongoose from 'mongoose';

const { Schema, model } = mongoose;
/* =========
 * Doctor
 * ========= */

const DoctorSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    name: { type: String, required: true },
    qualifications: [{ type: String }], // e.g. ["MBBS", "MD (General Medicine)"]
    specialty: { type: String, required: true },
    category: { type: String }, // e.g. "Cardiology", "Dentist"

    clinic: { type: String },
    hospital: { type: String },

    availability: { type: Schema.Types.Mixed }, // keep flexible; can be slots, weekly schedule, etc.

    price: { type: Number }, // base consultation fee
    experience: { type: Number, min: 0 }, // years of experience

    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviews_count: { type: Number, default: 0 },

    languages: [{ type: String }],

    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave'],
      default: 'active',
    },

    image: { type: String }, // URL or file path
  },
  { timestamps: true }
);

const Doctor = model('Doctor', DoctorSchema);

export {Doctor};