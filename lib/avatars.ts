// Avatar generator utility
export const avatarStyles = [
  'adventurer',
  'avataaars',
  'big-smile',
  'bottts',
  'croodles',
  'fun-emoji',
  'lorelei',
  'micah',
  'miniavs',
  'notionists',
  'open-peeps',
  'personas',
  'pixel-art',
] as const;

export type AvatarStyle = typeof avatarStyles[number];

export function generateAvatar(name: string, style: AvatarStyle = 'fun-emoji'): string {
  // Using DiceBear API for avatar generation
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

export function getRandomAvatarStyle(): AvatarStyle {
  return avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
}

// Predefined fun emoji avatars for quick selection
export const predefinedAvatars = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😎', '🤓', '🧐', '😏', '😌', '😋', '😛', '😝',
  '🤑', '🤗', '🤡', '🥳', '🤠', '😺', '😸', '😻',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🦁', '🐯', '🐸', '🐵', '🐔', '🐧', '🐦', '🦄',
  '🎮', '🎲', '🎯', '🎪', '🎨', '🎭', '🎬', '🏆',
  '💎', '👑', '⚡', '🔥', '⭐', '🌟', '✨', '💫',
];

export function getRandomEmoji(): string {
  return predefinedAvatars[Math.floor(Math.random() * predefinedAvatars.length)];
}

export function textToEmoji(text: string): string {
  // Convert name to emoji based on first character
  const firstChar = text.charAt(0).toUpperCase();
  const charCode = firstChar.charCodeAt(0);
  const index = charCode % predefinedAvatars.length;
  return predefinedAvatars[index];
}

