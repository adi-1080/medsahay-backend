import mongoose from 'mongoose';

const { Schema, model } = mongoose;
/* ==================
 * Patient Profile
 * ================== */

const CurrentLocationSchema = new Schema(
  {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    landmark: { type: String },
    lat: {type: String},
    lon: {type: String},
  },
  { _id: false }
);

const PatientProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone_number: { type: String, required: true },
    alternative_phone: { type: String },

    dob: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    blood_group: {
      type: String,
      enum: [
        'A+',
        'A-',
        'B+',
        'B-',
        'O+',
        'O-',
        'AB+',
        'AB-',
        'Unknown',
      ],
      default: 'Unknown',
    },

    permanent_address: { type: String },
    current_location: CurrentLocationSchema,

    preferred_language: { type: String },
    abha_id: { type: String },

    medical_history: [{ type: String }],
    allergies: [{ type: String }],

    // Completion metadata
    completion_percentage: { type: Number, default: 0 },
    missing_critical_fields: [{ type: String }],
    is_complete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const PatientProfile = model('PatientProfile', PatientProfileSchema);

export {PatientProfile};