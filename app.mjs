import express from "express";
import connectionPool from "./utils/db.mjs";

const app = express();
const port = 4000;

app.use(express.json());

app.get("/test", (req, res) => {
  return res.json("Server API is working 🚀");
});

app.post("/questions", async (req, res) => {
  const { title, description, category } = req.body ?? {};

  const isValidRequest =
    typeof title === "string" &&
    title.trim().length > 0 &&
    typeof description === "string" &&
    description.trim().length > 0 &&
    typeof category === "string" &&
    category.trim().length > 0;

  if (!isValidRequest) {
    return res.status(400).json({ message: "Invalid request data." });
  }

  try {
    await connectionPool.query(
      `
        INSERT INTO questions (title, description, category)
        VALUES ($1, $2, $3)
      `,
      [title.trim(), description.trim(), category.trim()],
    );

    return res
      .status(201)
      .json({ message: "Question created successfully." });
  } catch (error) {
    console.error("Unable to create question:", error.message);
    return res.status(500).json({ message: "Unable to create question." });
  }
});

app.get("/questions", async (req, res) => {
  try {
    const result = await connectionPool.query(
      `
        SELECT id, title, description, category
        FROM questions
        ORDER BY id ASC
      `,
    );

    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Unable to fetch questions:", error.message);
    return res.status(500).json({ message: "Unable to fetch questions." });
  }
});

app.get("/questions/search", async (req, res) => {
  const title = typeof req.query.title === "string" ? req.query.title.trim() : "";
  const category =
    typeof req.query.category === "string" ? req.query.category.trim() : "";

  if (!title && !category) {
    return res.status(400).json({ message: "Invalid search parameters." });
  }

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

app.get("/questions/:questionId", async (req, res) => {
  const questionId = Number(req.params.questionId);

  if (!Number.isInteger(questionId) || questionId <= 0) {
    return res.status(404).json({ message: "Question not found." });
  }

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

app.put("/questions/:questionId", async (req, res) => {
  const questionId = Number(req.params.questionId);
  const { title, description, category } = req.body ?? {};

  const isValidRequest =
    Number.isInteger(questionId) &&
    questionId > 0 &&
    typeof title === "string" &&
    title.trim().length > 0 &&
    typeof description === "string" &&
    description.trim().length > 0 &&
    typeof category === "string" &&
    category.trim().length > 0;

  if (!isValidRequest) {
    return res.status(400).json({ message: "Invalid request data." });
  }

  try {
    const result = await connectionPool.query(
      `
        UPDATE questions
        SET title = $1, description = $2, category = $3
        WHERE id = $4
        RETURNING id
      `,
      [
        title.trim(),
        description.trim(),
        category.trim(),
        questionId,
      ],
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
});

app.delete("/questions/:questionId", async (req, res) => {
  const questionId = Number(req.params.questionId);

  if (!Number.isInteger(questionId) || questionId <= 0) {
    return res.status(404).json({ message: "Question not found." });
  }

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
});

app.post("/questions/:questionId/answers", async (req, res) => {
  const questionId = Number(req.params.questionId);
  const { content } = req.body ?? {};
  const trimmedContent = typeof content === "string" ? content.trim() : "";

  if (trimmedContent.length === 0 || trimmedContent.length > 300) {
    return res.status(400).json({ message: "Invalid request data." });
  }

  if (!Number.isInteger(questionId) || questionId <= 0) {
    return res.status(404).json({ message: "Question not found." });
  }

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
      [trimmedContent, questionId],
    );

    return res
      .status(201)
      .json({ message: "Answer created successfully." });
  } catch (error) {
    console.error("Unable to create answer:", error.message);
    return res.status(500).json({ message: "Unable to create answer." });
  }
});

app.get("/questions/:questionId/answers", async (req, res) => {
  const questionId = Number(req.params.questionId);

  if (!Number.isInteger(questionId) || questionId <= 0) {
    return res.status(404).json({ message: "Question not found." });
  }

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
});

app.delete("/questions/:questionId/answers", async (req, res) => {
  const questionId = Number(req.params.questionId);

  if (!Number.isInteger(questionId) || questionId <= 0) {
    return res.status(404).json({ message: "Question not found." });
  }

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
});

app.post("/questions/:questionId/vote", async (req, res) => {
  const questionId = Number(req.params.questionId);
  const { vote } = req.body ?? {};

  if (vote !== 1 && vote !== -1) {
    return res.status(400).json({ message: "Invalid vote value." });
  }

  if (!Number.isInteger(questionId) || questionId <= 0) {
    return res.status(404).json({ message: "Question not found." });
  }

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
});

app.post("/answers/:answerId/vote", async (req, res) => {
  const answerId = Number(req.params.answerId);
  const { vote } = req.body ?? {};

  if (vote !== 1 && vote !== -1) {
    return res.status(400).json({ message: "Invalid vote value." });
  }

  if (!Number.isInteger(answerId) || answerId <= 0) {
    return res.status(404).json({ message: "Answer not found." });
  }

  try {
    const answerResult = await connectionPool.query(
      "SELECT id FROM answers WHERE id = $1",
      [answerId],
    );

    if (answerResult.rows.length === 0) {
      return res.status(404).json({ message: "Answer not found." });
    }

    await connectionPool.query(
      `
        INSERT INTO answer_votes (answer_id, vote)
        VALUES ($1, $2)
      `,
      [answerId, vote],
    );

    return res.status(200).json({
      message: "Vote on the answer has been recorded successfully.",
    });
  } catch (error) {
    console.error("Unable to vote answer:", error.message);
    return res.status(500).json({ message: "Unable to vote answer." });
  }
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
