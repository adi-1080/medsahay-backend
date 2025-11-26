import mongoose from 'mongoose';

const { Schema, model } = mongoose;
/* ==============
 * Notification
 * ============== */

const NotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    type: {
      type: String,
      enum: ['reminder', 'lab', 'appointment', 'system', 'general'],
      default: 'general',
    },

    title: { type: String, required: true },
    message: { type: String, required: true },

    is_read: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const Notification = model('Notification', NotificationSchema);

export {Notification};