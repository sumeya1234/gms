const validate = (schema, source = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true // Optional: clean up extra fields if they aren't in the schema
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors: errorMessages });
  }

  // Update request with coerced/cleaned values
  req[source] = value;
  next();
};

export default validate;
