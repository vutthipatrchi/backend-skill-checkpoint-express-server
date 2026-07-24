export function validateQuestionId(req, res, next) {
  const questionId = Number(req.params.questionId);

  if (!Number.isInteger(questionId) || questionId <= 0) {
    return res.status(404).json({ message: "Question not found." });
  }

  req.questionId = questionId;
  next();
}

export function validateAnswerId(req, res, next) {
  const answerId = Number(req.params.answerId);

  if (!Number.isInteger(answerId) || answerId <= 0) {
    return res.status(404).json({ message: "Answer not found." });
  }

  req.answerId = answerId;
  next();
}

export function validateQuestionBody(req, res, next) {
  const { title, description, category } = req.body ?? {};

  const isValid =
    typeof title === "string" &&
    title.trim().length > 0 &&
    typeof description === "string" &&
    description.trim().length > 0 &&
    typeof category === "string" &&
    category.trim().length > 0;

  if (!isValid) {
    return res.status(400).json({ message: "Invalid request data." });
  }

  req.questionData = {
    title: title.trim(),
    description: description.trim(),
    category: category.trim(),
  };
  next();
}

export function validateAnswerBody(req, res, next) {
  const { content } = req.body ?? {};
  const trimmedContent = typeof content === "string" ? content.trim() : "";

  if (trimmedContent.length === 0 || trimmedContent.length > 300) {
    return res.status(400).json({ message: "Invalid request data." });
  }

  req.answerContent = trimmedContent;
  next();
}

export function validateVoteBody(req, res, next) {
  const { vote } = req.body ?? {};

  if (vote !== 1 && vote !== -1) {
    return res.status(400).json({ message: "Invalid vote value." });
  }

  req.vote = vote;
  next();
}

export function validateSearchParams(req, res, next) {
  const title = typeof req.query.title === "string" ? req.query.title.trim() : "";
  const category =
    typeof req.query.category === "string" ? req.query.category.trim() : "";

  if (!title && !category) {
    return res.status(400).json({ message: "Invalid search parameters." });
  }

  req.searchFilters = { title, category };
  next();
}
