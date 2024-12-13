import { body, validationResult } from "express-validator";

export const validateComment = [
  body("taskId").notEmpty().withMessage("Task ID is required"),
  body("userId").notEmpty().withMessage("User ID is required"),
  body("content")
    .isLength({ min: 1 })
    .withMessage("Content must be at least 1 character long"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
