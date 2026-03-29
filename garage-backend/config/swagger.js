import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Garage Management System API",
      version: "1.0.0",
      description: "Comprehensive API for vehicle repair garages featuring role-based access, inventory tracking, and real-time notifications.",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            UserID: { type: "integer" },
            FullName: { type: "string" },
            Email: { type: "string" },
            Role: { type: "string", enum: ["Customer", "Mechanic", "GarageManager", "SuperAdmin"] },
          },
        },
        Garage: {
          type: "object",
          properties: {
            GarageID: { type: "integer" },
            Name: { type: "string" },
            Location: { type: "string" },
          },
        },
        ServiceRequest: {
          type: "object",
          properties: {
            RequestID: { type: "integer" },
            ServiceType: { type: "string" },
            Status: { type: "string", enum: ["pending", "approved", "rejected", "in_progress", "completed"] },
            Description: { type: "string" },
            IsEmergency: { type: "boolean" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
