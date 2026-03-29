const validate = (schema, source = "body") => (req, res, next) => {
  const { error } = schema.validate(req[source], { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors: errorMessages });
  }
  next();
};

export default validate;
