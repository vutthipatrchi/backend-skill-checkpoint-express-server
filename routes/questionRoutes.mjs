import express from "express";
import connectionPool from "../utils/db.mjs";
import {
  validateAnswerBody,
  validateQuestionBody,
  validateQuestionId,
  validateSearchParams,
  validateVoteBody,
} from "../middlewares/validation.mjs";

const questionRouter = express.Router();

questionRouter.post("/", validateQuestionBody, async (req, res) => {
  const { title, description, category } = req.questionData;

  try {
    await connectionPool.query(
      `
        INSERT INTO questions (title, description, category)
        VALUES ($1, $2, $3)
      `,
      [title, description, category],
    );

    return res
      .status(201)
      .json({ message: "Question created successfully." });
  } catch (error) {
    console.error("Unable to create question:", error.message);
    return res.status(500).json({ message: "Unable to create question." });
  }
});

questionRouter.get("/", async (req, res) => {
  try {
    const result = await connectionPool.query(`
      SELECT id, title, description, category
      FROM questions
      ORDER BY id ASC
    `);

    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Unable to fetch questions:", error.message);
    return res.status(500).json({ message: "Unable to fetch questions." });
  }
});

questionRouter.get("/search", validateSearchParams, async (req, res) => {
  const { title, category } = req.searchFilters;
  const conditions = [];
  const values = [];

  if (title) {
    values.push(`%${title}%`);
    conditions.push(`title ILIKE $${values.length}`);
  }

  if (category) {
    values.push(`%${category}%`);
    conditions.push(`category ILIKE $${values.length}`);
  }

  try {
    const result = await connectionPool.query(
      `
        SELECT id, title, description, category
        FROM questions
        WHERE ${conditions.join(" OR ")}
        ORDER BY id ASC
      `,
      values,
    );

    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Unable to search questions:", error.message);
    return res.status(500).json({ message: "Unable to fetch a question." });
  }
});

questionRouter.get("/:questionId", validateQuestionId, async (req, res) => {
  const { questionId } = req;

  try {
    const result = await connectionPool.query(
      `
        SELECT id, title, description, category
        FROM questions
        WHERE id = $1
      `,
      [questionId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Question not found." });
    }

    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    console.error("Unable to fetch question:", error.message);
    return res.status(500).json({ message: "Unable to fetch questions." });
  }
});

questionRouter.put(
  "/:questionId",
  validateQuestionId,
  validateQuestionBody,
  async (req, res) => {
    const { questionId } = req;
    const { title, description, category } = req.questionData;

    try {
      const result = await connectionPool.query(
        `
          UPDATE questions
          SET title = $1, description = $2, category = $3
          WHERE id = $4
          RETURNING id
        `,
        [title, description, category, questionId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Question not found." });
      }

      return res
        .status(200)
        .json({ message: "Question updated successfully." });
    } catch (error) {
      console.error("Unable to update question:", error.message);
      return res.status(500).json({ message: "Unable to fetch questions." });
    }
  },
);

questionRouter.delete(
  "/:questionId",
  validateQuestionId,
  async (req, res) => {
    const { questionId } = req;

    try {
      const result = await connectionPool.query(
        `
          DELETE FROM questions
          WHERE id = $1
          RETURNING id
        `,
        [questionId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Question not found." });
      }

      return res
        .status(200)
        .json({ message: "Question post has been deleted successfully." });
    } catch (error) {
      console.error("Unable to delete question:", error.message);
      return res.status(500).json({ message: "Unable to delete question." });
    }
  },
);

questionRouter.post(
  "/:questionId/answers",
  validateQuestionId,
  validateAnswerBody,
  async (req, res) => {
    const { questionId, answerContent } = req;

    try {
      const questionResult = await connectionPool.query(
        "SELECT id FROM questions WHERE id = $1",
        [questionId],
      );

      if (questionResult.rows.length === 0) {
        return res.status(404).json({ message: "Question not found." });
      }

      await connectionPool.query(
        `
          INSERT INTO answers (content, question_id)
          VALUES ($1, $2)
        `,
        [answerContent, questionId],
      );

      return res
        .status(201)
        .json({ message: "Answer created successfully." });
    } catch (error) {
      console.error("Unable to create answer:", error.message);
      return res.status(500).json({ message: "Unable to create answer." });
    }
  },
);

questionRouter.get(
  "/:questionId/answers",
  validateQuestionId,
  async (req, res) => {
    const { questionId } = req;

    try {
      const questionResult = await connectionPool.query(
        "SELECT id FROM questions WHERE id = $1",
        [questionId],
      );

      if (questionResult.rows.length === 0) {
        return res.status(404).json({ message: "Question not found." });
      }

      const answerResult = await connectionPool.query(
        `
          SELECT id, content
          FROM answers
          WHERE question_id = $1
          ORDER BY id ASC
        `,
        [questionId],
      );

      return res.status(200).json({ data: answerResult.rows });
    } catch (error) {
      console.error("Unable to fetch answers:", error.message);
      return res.status(500).json({ message: "Unable to fetch answers." });
    }
  },
);

questionRouter.delete(
  "/:questionId/answers",
  validateQuestionId,
  async (req, res) => {
    const { questionId } = req;

    try {
      const questionResult = await connectionPool.query(
        "SELECT id FROM questions WHERE id = $1",
        [questionId],
      );

      if (questionResult.rows.length === 0) {
        return res.status(404).json({ message: "Question not found." });
      }

      await connectionPool.query(
        "DELETE FROM answers WHERE question_id = $1",
        [questionId],
      );

      return res.status(200).json({
        message:
          "All answers for the question have been deleted successfully.",
      });
    } catch (error) {
      console.error("Unable to delete answers:", error.message);
      return res.status(500).json({ message: "Unable to delete answers." });
    }
  },
);

questionRouter.post(
  "/:questionId/vote",
  validateQuestionId,
  validateVoteBody,
  async (req, res) => {
    const { questionId, vote } = req;

    try {
      const questionResult = await connectionPool.query(
        "SELECT id FROM questions WHERE id = $1",
        [questionId],
      );

      if (questionResult.rows.length === 0) {
        return res.status(404).json({ message: "Question not found." });
      }

      await connectionPool.query(
        `
          INSERT INTO question_votes (question_id, vote)
          VALUES ($1, $2)
        `,
        [questionId, vote],
      );

      return res.status(200).json({
        message: "Vote on the question has been recorded successfully.",
      });
    } catch (error) {
      console.error("Unable to vote question:", error.message);
      return res.status(500).json({ message: "Unable to vote question." });
    }
  },
);

export default questionRouter;
