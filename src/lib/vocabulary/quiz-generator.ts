import { VocabularyWord, QuizQuestion } from './types';

/**
 * Deterministic quiz question generator using curated vocabulary database.
 * Strictly zero external AI API required.
 */

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateMeaningQuestion(
  targetWord: VocabularyWord,
  allWords: VocabularyWord[]
): QuizQuestion {
  // Find 3 distractors from the pool
  const distractors = allWords
    .filter((w) => w.id !== targetWord.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map((w) => w.english_definition);

  const options = shuffle([targetWord.english_definition, ...distractors]);

  return {
    id: `meaning-${targetWord.id}`,
    word_id: targetWord.id,
    type: 'meaning',
    prompt: `What is the correct meaning of "${targetWord.word}"?`,
    options,
    correct_answer: targetWord.english_definition,
    explanation: `"${targetWord.word}" (${targetWord.part_of_speech}): ${targetWord.english_definition} — বাংলা: ${targetWord.bengali_meaning}`,
    bengali_hint: targetWord.bengali_meaning,
  };
}

export function generateFillInBlankQuestion(
  targetWord: VocabularyWord,
  allWords: VocabularyWord[]
): QuizQuestion {
  // Replace the target word in its example sentence with a blank
  // Handles capitalized, lowercase, and inflections
  const regex = new RegExp(`\\b${targetWord.word}\\w*`, 'i');
  let blankedSentence = targetWord.example_sentence.replace(regex, '______');

  // Fallback if regex didn't match
  if (!blankedSentence.includes('______')) {
    blankedSentence = `She will ______ her decision soon.`;
  }

  const distractors = allWords
    .filter((w) => w.id !== targetWord.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map((w) => w.word);

  const options = shuffle([targetWord.word, ...distractors]);

  return {
    id: `blank-${targetWord.id}`,
    word_id: targetWord.id,
    type: 'fill_in_blank',
    prompt: blankedSentence,
    options,
    correct_answer: targetWord.word,
    explanation: `Complete sentence: "${targetWord.example_sentence}" (${targetWord.example_translation})`,
    bengali_hint: targetWord.example_translation,
  };
}

export function generateMatchingQuestion(
  words: VocabularyWord[]
): QuizQuestion {
  // Pick 4 words for a matching drill
  const selected = words.slice(0, 4);
  const pairs = selected.map((w) => ({
    word: w.word,
    meaning: w.bengali_meaning.split(',')[0].trim(),
  }));

  return {
    id: `matching-${selected.map((w) => w.id).join('-')}`,
    word_id: selected[0]?.id || 'matching',
    type: 'matching',
    prompt: 'Match each English word with its correct Bengali meaning',
    correct_answer: 'all_paired',
    explanation: 'Great job matching all vocabulary pairs!',
    matching_pairs: pairs,
  };
}

export function generateSentenceBuilderQuestion(
  targetWord: VocabularyWord
): QuizQuestion {
  return {
    id: `sentence-${targetWord.id}`,
    word_id: targetWord.id,
    type: 'sentence_builder',
    prompt: `Write your own English sentence using the word "${targetWord.word}"`,
    correct_answer: '',
    explanation: `Tip: Try collocations like "${targetWord.collocations?.[0] || targetWord.word}". Example: "${targetWord.example_sentence}"`,
    bengali_hint: `বাংলা অর্থ: ${targetWord.bengali_meaning}`,
  };
}

/**
 * Generate a complete practice session quiz for a set of studied words.
 */
export function generateQuizForWords(
  words: VocabularyWord[],
  allAvailableWords: VocabularyWord[]
): QuizQuestion[] {
  if (words.length === 0) return [];

  const questions: QuizQuestion[] = [];

  // Exercise 1: Choose Correct Meaning for up to 4 words
  const meaningSample = words.slice(0, Math.min(3, words.length));
  meaningSample.forEach((w) => {
    questions.push(generateMeaningQuestion(w, allAvailableWords));
  });

  // Exercise 2: Fill in the Blanks for up to 3 words
  const blankSample = words.slice(Math.min(3, words.length), Math.min(6, words.length));
  blankSample.forEach((w) => {
    questions.push(generateFillInBlankQuestion(w, allAvailableWords));
  });

  // Exercise 3: Match the Words (if at least 3 words)
  if (words.length >= 3) {
    questions.push(generateMatchingQuestion(words));
  }

  // Exercise 4: Sentence Builder for 1 key word
  const sentenceWord = words[0];
  if (sentenceWord) {
    questions.push(generateSentenceBuilderQuestion(sentenceWord));
  }

  return questions;
}

