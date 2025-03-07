// List of words to filter - this is a basic list, you might want to expand it
const profanityList = [
  'fuck',
  'shit',
  'bitch',
  'cunt',
  'faggot',
  'idiot',
  'retard',
  'dick',
  'pussy',
  'vagina',
  'penis',
  'bitch',
  'dildo',
  'asshole',
  'suck',
  'sucker',
  'cunt',
  'dumb',
  'stupid',
  'pussy',
  'cock',
  'cocksucker',
  'cum',
  'dickhead',
  'fag',
  'fatass',
  'fuckup',
];

export const containsProfanity = (text: string): { hasProfanity: boolean; matches: string[] } => {
  const normalizedText = text.toLowerCase();
  const matches = profanityList.filter(word => 
    normalizedText.includes(word.toLowerCase())
  );
  
  return {
    hasProfanity: matches.length > 0,
    matches
  };
};

// Function to check if text is appropriate
export const isAppropriateText = (text: string): boolean => {
  const { hasProfanity } = containsProfanity(text);
  return !hasProfanity;
}; 