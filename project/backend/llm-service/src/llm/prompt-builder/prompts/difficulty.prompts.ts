import { Difficulty } from '../../dto/difficulty-llm-generation.dto';

export const DIFFICULTY_PROMPTS: Record<Difficulty, string> = {
  [Difficulty.EASY]:
    'Write a straightforward, generic message. No personalization.',
  [Difficulty.MEDIUM]:
    'Write a moderately personalized message using the provided variables naturally.',
  [Difficulty.HARD]:
    'Write a highly targeted, convincing message that makes full use of the provided context.',
};
