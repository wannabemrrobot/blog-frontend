/**
 * Constants for FightClub Component
 */

// Timing constants (in milliseconds)
export const TIMING = {
  SCRAMBLER_DELAY: 500,
  CHART_RENDER_DELAY: 100,
  EGO_LOAD_DELAY: 300,
  UNAUTHORIZED_REDIRECT_DELAY: 3000,
  CAROUSEL_DURATION: 5000,
} as const;

// History panel configuration
export const HISTORY_CONFIG = {
  DEFAULT_LIMIT: 20,
} as const;

// Text scrambler configuration
export const SCRAMBLER_CONFIG = {
  MAIN_PHRASES: [
    'One body',
    'Three egoes',
    'Three journey',
    'One destiny',
    'Becoming ME',
    'One body, three egoes, three journey, one destiny. Becoming ME.',
  ],
  ANIMATION_CHARS: '!<>-_\\/[]{}—=+*^?#________',
  MAIN_SELECTOR: '.fightclub-scrambler-text',
  CREED_SELECTOR: '.ego-creed-text',
} as const;

// Event type mappings
export const EVENT_ICONS: Record<string, string> = {
  completed: '✓',
  failed: '✗',
  missed_checkin_penalty: '⚠️',
  streak_milestone: '🎉',
  default: '•',
};

export const EVENT_CLASSES: Record<string, string> = {
  completed: 'event-success',
  failed: 'event-failed',
  missed_checkin_penalty: 'event-penalty',
  streak_milestone: 'event-milestone',
  default: 'event-default',
};

// Chart configuration
export const CHART_CONFIG = {
  DEFAULT_MAX_STAT: 100,
  CHART_PADDING: { top: 6, right: 6, bottom: 6, left: 6 },
  POINT_RADIUS: 4,
  POINT_HOVER_RADIUS: 6,
  BORDER_WIDTH: 1.6,
  NEON_GLOW_PASSES: [
    { width: 12, alpha: 0.06 },
    { width: 6, alpha: 0.12 },
    { width: 3, alpha: 0.22 },
  ],
  NEON_POINT_OUTER_RADIUS: 6.0,
  NEON_POINT_INNER_RADIUS: 2.4,
} as const;

// Theme color fallbacks
export const THEME_DEFAULTS = {
  ACCENT_PRIMARY: '#8eff78',
  ACCENT_SECONDARY: '#8eff78',
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#d6d6d6',
} as const;
