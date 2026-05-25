import Joi from "joi";

export const validateProfileUpdate = Joi.object({
  fullName: Joi.string().min(6).max(50).regex(/^[a-zA-Z\s\-]+$/).optional().messages({
    "string.pattern.base": "Please use only letters for your name.",
    "string.min": "Name must be at least 6 characters long."
  }),
  phone: Joi.string().regex(/^\+?[0-9]{10,15}$/).optional().messages({
    "string.pattern.base": "Please enter a valid phone number (10-15 digits)."
  })
}).min(1);

export const validatePasswordChange = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-])[A-Za-z\d@$!%*?&\-]{8,}$/)
    .invalid(Joi.ref('oldPassword'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters.',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      'any.invalid': 'New password must be different from current password.'
    })
});

export const validateRoleUpdate = Joi.object({
  role: Joi.string().valid('Customer', 'Mechanic', 'GarageManager', 'GarageOwner', 'Accountant', 'SuperAdmin').required()
});

export const validateGarageAssignment = Joi.object({
  garageId: Joi.number().integer().positive().required()
});

export const validatePushToken = Joi.object({
  token: Joi.string().required(),
  deviceType: Joi.string().valid('Android', 'iOS').optional().default('Android')
});

export const validateMechanicCreation = Joi.object({
  fullName: Joi.string().min(6).max(50).regex(/^[a-zA-Z\s\-]+$/).required().messages({
    "string.pattern.base": "Please use only letters for the name.",
    "string.min": "Name must be at least 6 characters long."
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address."
  }),
  phone: Joi.string().regex(/^\+?[0-9]{10,15}$/).required().messages({
    "string.pattern.base": "Please enter a valid phone number (10-15 digits)."
  }),
  password: Joi.string().min(6).allow('', null).optional().messages({
    "string.min": "Password must be at least 6 characters."
  }),
  skills: Joi.array().items(Joi.string()).optional()
});

export const validateMechanicStatusUpdate = Joi.object({
  status: Joi.string().valid('Active', 'Suspended', 'Archived').required()
});
