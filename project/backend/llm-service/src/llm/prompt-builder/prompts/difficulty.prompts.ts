import { Difficulty } from '../../dto/difficulty-llm-generation.dto';

export const DIFFICULTY_PROMPTS: Record<Difficulty, string> = {
  [Difficulty.EASY]:
    'Write a straightforward, generic message. No personalization.',
  [Difficulty.MEDIUM]:
    'Write a moderately personalized message using the provided variables naturally.',
  [Difficulty.HARD]:
    'Write a highly targeted, convincing message that makes full use of the provided context. At the end of the message, after the link, add a brief line offering that the recipient can simply reply to this email with the information instead, as an alternative to clicking the link.',
};
