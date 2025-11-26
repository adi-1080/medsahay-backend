import { Notification } from '../models/Notification.js';

/**
 * GET /api/v1/patients/notifications
 * Auth: required
 * Response: [Notification, ...]
 */
export const getPatientNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ user: userId })
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};