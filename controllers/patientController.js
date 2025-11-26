import {PatientProfile} from '../models/PatientProfile.js';

// ---- helper from above ----
const computeCompletion = (profile) => {
  const missing = [];

  const get = (path) => {
    const parts = path.split('.');
    let curr = profile;
    for (const p of parts) {
      if (!curr) return undefined;
      curr = curr[p];
    }
    return curr;
  };

  const criticalFields = [
    'full_name',
    'email',
    'phone_number',
    'dob',
    'gender',
    'blood_group',
    'permanent_address',
    'current_location.address',
    'current_location.city',
    'current_location.state',
    'current_location.pincode',
    'preferred_language',
    'abha_id',
  ];

  criticalFields.forEach((field) => {
    const value = get(field);
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      missing.push(field);
    }
  });

  const total = criticalFields.length;
  const completed = total - missing.length;
  const percentage = Math.round((completed / total) * 100);

  return {
    completion_percentage: percentage,
    missing_critical_fields: missing,
    is_complete: missing.length === 0,
  };
};

/**
 * GET /api/v1/profile/current
 * Auth: required
 * Response:
 *  200: { profile_data, completion_percentage, missing_critical_fields, is_complete }
 *  404: { detail: 'Profile not found' }
 */
export const getCurrentProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await PatientProfile.findOne({ user: userId });

    if (!profile) {
      return res.status(404).json({ detail: 'Profile not found' });
    }

    const {
      completion_percentage,
      missing_critical_fields,
      is_complete,
    } = computeCompletion(profile);

    return res.status(200).json({
      profile_data: profile,
      completion_percentage,
      missing_critical_fields,
      is_complete,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * PUT /api/v1/profile/update
 * Auth: required
 * Body:
 * {
 *   full_name, email, phone_number, alternative_phone,
 *   dob, gender, blood_group,
 *   permanent_address, preferred_language, abha_id,
 *   medical_history: [], allergies: [],
 *   current_location?: { address, city, state, pincode, landmark }
 * }
 * Response:
 *  200: { profile_data, completion_percentage, missing_critical_fields, is_complete }
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;

    // Ensure user field is always set
    let profile = await PatientProfile.findOne({ user: userId });

    if (!profile) {
      profile = new PatientProfile({ user: userId });
    }

    // Update allowed fields
    const fields = [
      'full_name',
      'email',
      'phone_number',
      'alternative_phone',
      'dob',
      'gender',
      'blood_group',
      'permanent_address',
      'preferred_language',
      'abha_id',
      'medical_history',
      'allergies',
      'current_location',
    ];

    fields.forEach((field) => {
      if (data[field] !== undefined) {
        profile[field] = data[field];
      }
    });

    // Compute completion meta
    const {
      completion_percentage,
      missing_critical_fields,
      is_complete,
    } = computeCompletion(profile);

    profile.completion_percentage = completion_percentage;
    profile.missing_critical_fields = missing_critical_fields;
    profile.is_complete = is_complete;

    await profile.save();

    return res.status(200).json({
      profile_data: profile,
      completion_percentage,
      missing_critical_fields,
      is_complete,
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * POST /api/v1/profile/create
 * Auth: recommended (but you can remove protect from route if you want open debug)
 * Body: full profile payload (same as update)
 */
export const createProfile = async (req, res) => {
  try {
    const userId = req.user?.id; // might be undefined if you decide not to use auth

    const data = req.body;

    // If you want to force auth: require userId
    if (!userId) {
      return res.status(401).json({ detail: 'Not authorized' });
    }

    const existing = await PatientProfile.findOne({ user: userId });

    if (existing) {
      return res.status(400).json({
        detail: 'Profile already exists. Use /profile/update instead.',
      });
    }

    const profile = new PatientProfile({
      user: userId,
      ...data,
    });

    const {
      completion_percentage,
      missing_critical_fields,
      is_complete,
    } = computeCompletion(profile);

    profile.completion_percentage = completion_percentage;
    profile.missing_critical_fields = missing_critical_fields;
    profile.is_complete = is_complete;

    await profile.save();

    return res.status(201).json({
      profile_data: profile,
      completion_percentage,
      missing_critical_fields,
      is_complete,
    });
  } catch (err) {
    console.error('Create profile error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * PATCH /api/v1/profile/update-field?field_name=<name>
 * Auth: required
 * Body: { field_value: any }
 */
export const updateSingleField = async (req, res) => {
  try {
    const userId = req.user.id;
    const { field_name } = req.query;
    const { field_value } = req.body;

    if (!field_name) {
      return res.status(400).json({ detail: 'field_name query parameter is required.' });
    }

    let profile = await PatientProfile.findOne({ user: userId });

    if (!profile) {
      // If no profile exists, create one and then set the field
      profile = new PatientProfile({ user: userId });
    }

    // Support dot notation: e.g. current_location.city
    const pathParts = field_name.split('.');
    let target = profile;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (target[part] === undefined || target[part] === null) {
        target[part] = {};
      }
      target = target[part];
    }

    const lastKey = pathParts[pathParts.length - 1];
    target[lastKey] = field_value;

    const {
      completion_percentage,
      missing_critical_fields,
      is_complete,
    } = computeCompletion(profile);

    profile.completion_percentage = completion_percentage;
    profile.missing_critical_fields = missing_critical_fields;
    profile.is_complete = is_complete;

    await profile.save();

    return res.status(200).json({
      profile_data: profile,
      updated_field: field_name,
      new_value: field_value,
      completion_percentage,
      missing_critical_fields,
      is_complete,
    });
  } catch (err) {
    console.error('Update single field error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * GET /api/v1/profile/health
 * Simple service health check for debug usage
 * Auth: not required
 */
export const getProfileHealth = async (req, res) => {
  try {
    // Optionally check DB connectivity / counts, etc.
    const dbState = mongoose.connection.readyState; // 1 = connected
    const dbStatusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const status =
      dbState === 1
        ? 'ok'
        : dbState === 2
        ? 'degraded'
        : 'down';

    return res.status(200).json({
      status,
      version: '1.0.0',
      services: {
        database: dbStatusMap[dbState] || 'unknown',
        profile_service: 'online',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Profile health error:', err);
    return res.status(500).json({ status: 'down', detail: 'Internal server error' });
  }
};