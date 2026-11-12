import { Topic, DifficultyLevel } from '@/types/betalky';

export const DEFAULT_TOPICS: Topic[] = [
  // Beginner Topics (10 diverse everyday prompts)
  {
    id: 'b-1',
    title: 'Do you have a hobby? Describe it.',
    level: 'Beginner',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Lifestyle'
  },
  {
    id: 'b-2',
    title: 'Describe the people in your family.',
    level: 'Beginner',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Personal'
  },
  {
    id: 'b-3',
    title: 'Describe a shop you visit often.',
    level: 'Beginner',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Daily Life'
  },
  {
    id: 'b-4',
    title: 'Describe your favourite place in your city.',
    level: 'Beginner',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Places'
  },
  {
    id: 'b-5',
    title: 'What is your favorite meal and how is it prepared?',
    level: 'Beginner',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Food'
  },
  {
    id: 'b-6',
    title: 'What is your daily morning routine before starting work or study?',
    level: 'Beginner',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Daily Life'
  },
  {
    id: 'b-7',
    title: 'Talk about your best friend and what makes your friendship special.',
    level: 'Beginner',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Personal'
  },
  {
    id: 'b-8',
    title: 'Describe your favorite season of the year and what you enjoy doing.',
    level: 'Beginner',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Nature'
  },
  {
    id: 'b-9',
    title: 'What is a movie or book you enjoyed recently and why?',
    level: 'Beginner',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Entertainment'
  },
  {
    id: 'b-10',
    title: 'Describe the room where you spend most of your time.',
    level: 'Beginner',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Home'
  },

  // Intermediate Topics (10 conversational & reflective prompts)
  {
    id: 'i-1',
    title: 'How could your city become friendlier for pedestrians?',
    level: 'Intermediate',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Urban Living'
  },
  {
    id: 'i-2',
    title: 'Should companies allow employees to work remotely forever?',
    level: 'Intermediate',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Workplace'
  },
  {
    id: 'i-3',
    title: 'What is a skill you would like to master and why?',
    level: 'Intermediate',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Growth'
  },
  {
    id: 'i-4',
    title: 'How has social media changed the way we form friendships?',
    level: 'Intermediate',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Technology'
  },
  {
    id: 'i-5',
    title: 'Describe an unforgettable trip you took and what made it special.',
    level: 'Intermediate',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Travel'
  },
  {
    id: 'i-6',
    title: 'How can people maintain a healthy work-life balance in a busy world?',
    level: 'Intermediate',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Wellness'
  },
  {
    id: 'i-7',
    title: 'Do you prefer living in a quiet rural town or a bustling metropolis? Why?',
    level: 'Intermediate',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Lifestyle'
  },
  {
    id: 'i-8',
    title: 'What are the biggest advantages and disadvantages of public transportation?',
    level: 'Intermediate',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Society'
  },
  {
    id: 'i-9',
    title: 'Describe a difficult decision you had to make and how you handled it.',
    level: 'Intermediate',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Experience'
  },
  {
    id: 'i-10',
    title: 'How has modern technology influenced the way we communicate with family?',
    level: 'Intermediate',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Culture'
  },

  // Advanced Topics (10 nuanced, debate & analytical prompts)
  {
    id: 'a-1',
    title: 'How will artificial intelligence reshape modern education and critical thinking?',
    level: 'Advanced',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Technology'
  },
  {
    id: 'a-2',
    title: 'Evaluate whether economic growth should take precedence over environmental sustainability.',
    level: 'Advanced',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Environment'
  },
  {
    id: 'a-3',
    title: 'Analyze the ethical implications of autonomous decision-making in healthcare.',
    level: 'Advanced',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Ethics'
  },
  {
    id: 'a-4',
    title: 'Discuss whether globalization has led to cultural homogenization or cultural revival.',
    level: 'Advanced',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Culture'
  },
  {
    id: 'a-5',
    title: 'How can leaders maintain team cohesion and innovation in distributed organizations?',
    level: 'Advanced',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Leadership'
  },
  {
    id: 'a-6',
    title: 'Should space exploration be primarily funded by public governments or private enterprises?',
    level: 'Advanced',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Policy'
  },
  {
    id: 'a-7',
    title: 'To what extent does language shape our perception of reality and cognitive thought?',
    level: 'Advanced',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Linguistics'
  },
  {
    id: 'a-8',
    title: 'Examine the social impact of algorithmic content curation on democratic discourse.',
    level: 'Advanced',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Media'
  },
  {
    id: 'a-9',
    title: 'Will universal basic income become an economic necessity in an automated economy?',
    level: 'Advanced',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Economics'
  },
  {
    id: 'a-10',
    title: 'How should societies balance individual privacy rights against national security imperatives?',
    level: 'Advanced',
    instructions: 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.',
    category: 'Jurisprudence'
  }
];

export function getTopicsByLevel(level: DifficultyLevel): Topic[] {
  return DEFAULT_TOPICS.filter(t => t.level.toLowerCase() === level.toLowerCase());
}

const SEEN_STORAGE_KEY_PREFIX = 'betalky_seen_topics_';

function getSeenTopicIds(level: DifficultyLevel): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${SEEN_STORAGE_KEY_PREFIX}${level.toLowerCase()}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSeenTopicIds(level: DifficultyLevel, ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${SEEN_STORAGE_KEY_PREFIX}${level.toLowerCase()}`, JSON.stringify(ids));
  } catch {}
}

/**
 * Gets a fresh topic without repetition.
 * Guarantees that a topic will NOT be shown again until all available topics for this level have been shown.
 */
export function getNextShuffledTopic(level: DifficultyLevel, currentTopicId?: string): Topic {
  const topics = getTopicsByLevel(level);
  if (topics.length === 0) return DEFAULT_TOPICS[0];

  let seenIds = getSeenTopicIds(level);

  // If current topic isn't in seenIds, add it
  if (currentTopicId && !seenIds.includes(currentTopicId)) {
    seenIds.push(currentTopicId);
  }

  // Filter topics that haven't been shown yet in the current cycle
  let remaining = topics.filter(t => !seenIds.includes(t.id));

  // If all topics have been shown, reset cycle
  if (remaining.length === 0) {
    seenIds = currentTopicId ? [currentTopicId] : [];
    remaining = topics.filter(t => t.id !== currentTopicId);
    if (remaining.length === 0) remaining = topics;
  }

  // Pick a random topic from the remaining unseen pool
  const randomIndex = Math.floor(Math.random() * remaining.length);
  const selected = remaining[randomIndex];

  // Record that this topic was shown
  seenIds.push(selected.id);
  saveSeenTopicIds(level, seenIds);

  return selected;
}

export function getRandomTopic(level: DifficultyLevel, excludeId?: string): Topic {
  return getNextShuffledTopic(level, excludeId);
}
