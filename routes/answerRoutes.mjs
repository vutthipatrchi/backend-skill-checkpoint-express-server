import express from "express";
import connectionPool from "../utils/db.mjs";
import {
  validateAnswerId,
  validateVoteBody,
} from "../middlewares/validation.mjs";

const answerRouter = express.Router();

answerRouter.post(
  "/:answerId/vote",
  validateAnswerId,
  validateVoteBody,
  async (req, res) => {
    const { answerId, vote } = req;

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
  },
);

export default answerRouter;
