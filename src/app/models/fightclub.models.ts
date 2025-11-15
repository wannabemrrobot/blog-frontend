import { AlterEgo } from '../service/gamification.service';

/**
 * User interface from authentication
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  login: string;
  token: string;
}

/**
 * Computed AlterEgo with pre-calculated percentages for template use
 */
export interface ComputedAlterEgo extends AlterEgo {
  abilitiesArray: Array<{ name: string; value: number }>;
  xpPercentage: number;
  healthPercentage: number;
  energyPercentage: number;
}

/**
 * Theme colors extracted from CSS variables
 */
export interface ThemeColors {
  accentPrimary: string;
  accentSecondary: string;
  textPrimary: string;
  textSecondary: string;
}

/**
 * Chart rendering configuration
 */
export interface ChartRenderOptions {
  canvas: HTMLCanvasElement;
  alterEgo: AlterEgo;
  themeColors: ThemeColors;
}
