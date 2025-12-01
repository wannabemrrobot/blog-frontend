import { Injectable } from '@angular/core';
import { Chart } from 'chart.js';
import { AlterEgo, Synergy } from '../service/gamification.service';
import { ThemeColors } from '../models/fightclub.models';
import { CHART_CONFIG, THEME_DEFAULTS } from '../constants/fightclub.constants';

@Injectable({
  providedIn: 'root'
})
export class ChartService {
  
  /**
   * Get theme colors from CSS variables with fallbacks
   */
  getThemeColors(): ThemeColors {
    const rootStyles = getComputedStyle(document.documentElement);
    return {
      accentPrimary: rootStyles.getPropertyValue('--accent-primary').trim() || THEME_DEFAULTS.ACCENT_PRIMARY,
      accentSecondary: rootStyles.getPropertyValue('--accent-secondary').trim() || THEME_DEFAULTS.ACCENT_SECONDARY,
      textPrimary: rootStyles.getPropertyValue('--text-primary').trim() || THEME_DEFAULTS.TEXT_PRIMARY,
      textSecondary: rootStyles.getPropertyValue('--text-secondary').trim() || THEME_DEFAULTS.TEXT_SECONDARY,
    };
  }

  /**
   * Convert hex color to rgba format
   */
  hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /**
   * Format ability names for display
   */
  formatAbilityName(name: string): string {
    return name
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Reorder abilities to place longer labels at top/bottom (north/south)
   * and shorter labels at left/right (east/west) positions
   */
  private reorderAbilitiesForRadarChart(abilities: Array<{ name: string; value: number }>): Array<{ name: string; value: number }> {
    // Sort by label length (descending) - longest first
    const sorted = [...abilities].sort((a, b) => b.name.length - a.name.length);
    
    const count = sorted.length;
    const reordered: Array<{ name: string; value: number }> = new Array(count);
    
    // Radar charts go clockwise from top
    // For even distribution: assign longest to top/bottom, shortest to sides
    // Priority positions: 0 (top), floor(n/2) (bottom), then fill others
    
    // Calculate key positions
    const topIndex = 0;
    const bottomIndex = Math.floor(count / 2);
    const rightIndex = Math.floor(count / 4);
    const leftIndex = Math.floor(3 * count / 4);
    
    // Track which positions are filled
    const filled = new Set<number>();
    let sortedIdx = 0;
    
    // 1. Place longest at top
    reordered[topIndex] = sorted[sortedIdx++];
    filled.add(topIndex);
    
    // 2. Place second longest at bottom (if exists)
    if (count > 1) {
      reordered[bottomIndex] = sorted[sortedIdx++];
      filled.add(bottomIndex);
    }
    
    // 3. Fill remaining positions, avoiding side positions (right/left) for longest labels
    // Fill sides last with shortest labels
    const sidePositions = [rightIndex, leftIndex].filter(pos => !filled.has(pos));
    const otherPositions = [];
    for (let i = 0; i < count; i++) {
      if (!filled.has(i) && !sidePositions.includes(i)) {
        otherPositions.push(i);
      }
    }
    
    // Fill other positions first
    for (const pos of otherPositions) {
      reordered[pos] = sorted[sortedIdx++];
    }
    
    // Fill side positions with shortest remaining labels
    for (const pos of sidePositions) {
      reordered[pos] = sorted[sortedIdx++];
    }
    
    return reordered;
  }

  /**
   * Get abilities as array from ego object
   */
  getAbilitiesArray(ego: AlterEgo): Array<{ name: string; value: number }> {
    return Object.entries(ego.abilities).map(([name, value]) => ({ name, value }));
  }

  /**
   * Create neon outer polygon plugin for charts
   */
  private createNeonPlugin(themeColors: ThemeColors) {
    const hexToRgba = this.hexToRgba.bind(this);
    
    return {
      id: 'neonOuterPolygon',
      afterDraw: (chart: any) => {
        try {
          const ctx = chart.ctx;
          const scale = chart.scales.r;
          if (!scale) return;
          
          const labelsCount = chart.data.labels?.length || 0;
          const maxVal = scale.max;
          const outerPts: any[] = [];
          
          for (let i = 0; i < labelsCount; i++) {
            outerPts.push(scale.getPointPositionForValue(i, maxVal));
          }
          
          ctx.save();
          ctx.lineJoin = 'round';
          
          // Draw glow passes
          for (const pass of CHART_CONFIG.NEON_GLOW_PASSES) {
            ctx.beginPath();
            ctx.moveTo(outerPts[0].x, outerPts[0].y);
            for (let i = 1; i < outerPts.length; i++) {
              ctx.lineTo(outerPts[i].x, outerPts[i].y);
            }
            ctx.closePath();
            ctx.strokeStyle = hexToRgba(themeColors.accentPrimary, pass.alpha);
            ctx.lineWidth = pass.width;
            ctx.stroke();
          }
          
          // Draw main polygon
          ctx.beginPath();
          ctx.moveTo(outerPts[0].x, outerPts[0].y);
          for (let i = 1; i < outerPts.length; i++) {
            ctx.lineTo(outerPts[i].x, outerPts[i].y);
          }
          ctx.closePath();
          ctx.strokeStyle = hexToRgba(themeColors.accentPrimary, 0.95);
          ctx.lineWidth = CHART_CONFIG.BORDER_WIDTH;
          ctx.stroke();
          
          // Draw corner points
          for (let i = 0; i < outerPts.length; i++) {
            const p = outerPts[i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, CHART_CONFIG.NEON_POINT_OUTER_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(themeColors.accentPrimary, 0.95);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(p.x, p.y, CHART_CONFIG.NEON_POINT_INNER_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(themeColors.accentPrimary, 0.95);
            ctx.fill();
          }
          
          ctx.restore();
        } catch (e) {
          console.error('neonOuterPolygon plugin error', e);
        }
      }
    };
  }

  /**
   * Create radar chart for alter ego
   */
  createAlterEgoChart(canvas: HTMLCanvasElement, ego: AlterEgo, themeColors: ThemeColors): Chart | null {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2d context for canvas');
      return null;
    }

    const abilities = this.getAbilitiesArray(ego);
    const reorderedAbilities = this.reorderAbilitiesForRadarChart(abilities);
    const labels = reorderedAbilities.map(a => this.formatAbilityName(a.name));
    const dataValues = reorderedAbilities.map(a => a.value);

    const maxStatValue = Math.max(CHART_CONFIG.DEFAULT_MAX_STAT, ...dataValues);
    const minStatValue = Math.min(0, ...dataValues);
    const maxStat = Math.ceil(maxStatValue / 100) * 100;
    const minStat = Math.floor(minStatValue / 100) * 100;

    const hexToRgba = this.hexToRgba.bind(this);

    return new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: `${ego.name} stats`,
          data: dataValues,
          fill: true,
          backgroundColor: hexToRgba(themeColors.accentPrimary, 0.06),
          borderColor: hexToRgba(themeColors.accentPrimary, 0.85),
          borderWidth: CHART_CONFIG.BORDER_WIDTH,
          pointBackgroundColor: themeColors.textPrimary,
          pointBorderColor: 'rgba(80,80,80,0.25)',
          pointBorderWidth: 1,
          pointRadius: CHART_CONFIG.POINT_RADIUS,
          pointHoverRadius: CHART_CONFIG.POINT_HOVER_RADIUS,
          pointStyle: 'circle',
          tension: 0.12
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: CHART_CONFIG.CHART_PADDING },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            displayColors: false,
            backgroundColor: 'rgba(12,18,12,0.92)',
            titleColor: hexToRgba(themeColors.accentPrimary, 0.98),
            bodyColor: '#ffffff',
            borderColor: hexToRgba(themeColors.accentPrimary, 0.6),
            borderWidth: 1,
            padding: 8,
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 12, weight: 'normal' },
            callbacks: {
              title: () => ego.name,
              label: (context: any) => `${context.label}: ${context.raw}`
            }
          }
        },
        scales: {
          r: {
            beginAtZero: minStat >= 0,
            min: minStat,
            max: maxStat,
            ticks: { display: false },
            grid: { 
              color: (ctx: any) => (ctx.index % 2 === 0) ? 'rgba(20,40,20,0.38)' : 'rgba(40,80,40,0.24)', 
              lineWidth: 1 
            },
            angleLines: { 
              color: 'rgba(60,120,60,0.08)', 
              lineWidth: 1 
            },
            pointLabels: { 
              color: themeColors.textSecondary, 
              font: { size: 12, weight: 'normal' }, 
              padding: 10 
            }
          }
        }
      },
      plugins: [this.createNeonPlugin(themeColors)]
    });
  }

  /**
   * Create synergy radar chart
   */
  createSynergyChart(canvas: HTMLCanvasElement, synergy: Synergy, themeColors: ThemeColors): Chart | null {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2d context for synergy canvas');
      return null;
    }

    const synergyData = synergy.fight_club.synergy;
    const synergyAbilities = [
      { name: 'Mind', value: synergyData.mind },
      { name: 'Body', value: synergyData.body },
      { name: 'Soul', value: synergyData.soul }
    ];
    
    const reorderedSynergy = this.reorderAbilitiesForRadarChart(synergyAbilities);
    const labels = reorderedSynergy.map(s => s.name);
    const dataValues = reorderedSynergy.map(s => s.value);

    const maxStatValue = Math.max(CHART_CONFIG.DEFAULT_MAX_STAT, ...dataValues);
    const maxStat = Math.ceil(maxStatValue / 100) * 100;

    const hexToRgba = this.hexToRgba.bind(this);

    return new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Synergy',
          data: dataValues,
          fill: true,
          backgroundColor: hexToRgba(themeColors.accentPrimary, 0.06),
          borderColor: hexToRgba(themeColors.accentPrimary, 0.85),
          borderWidth: CHART_CONFIG.BORDER_WIDTH,
          pointBackgroundColor: themeColors.textPrimary,
          pointBorderColor: 'rgba(80,80,80,0.25)',
          pointBorderWidth: 1,
          pointRadius: CHART_CONFIG.POINT_RADIUS,
          pointHoverRadius: CHART_CONFIG.POINT_HOVER_RADIUS,
          pointStyle: 'circle',
          tension: 0.12
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: CHART_CONFIG.CHART_PADDING },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            displayColors: false,
            backgroundColor: 'rgba(12,18,12,0.92)',
            titleColor: hexToRgba(themeColors.accentPrimary, 0.98),
            bodyColor: '#ffffff',
            borderColor: hexToRgba(themeColors.accentPrimary, 0.6),
            borderWidth: 1,
            padding: 8,
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 12, weight: 'normal' },
            callbacks: {
              title: () => 'Synergy',
              label: (context: any) => `${context.label}: ${context.raw.toFixed(2)}`
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: maxStat,
            ticks: { display: false },
            grid: { 
              color: (ctx: any) => (ctx.index % 2 === 0) ? 'rgba(20,40,20,0.38)' : 'rgba(40,80,40,0.24)', 
              lineWidth: 1 
            },
            angleLines: { 
              color: 'rgba(60,120,60,0.08)', 
              lineWidth: 1 
            },
            pointLabels: { 
              color: themeColors.textSecondary, 
              font: { size: 12, weight: 'normal' }, 
              padding: 10 
            }
          }
        }
      },
      plugins: [this.createNeonPlugin(themeColors)]
    });
  }

  /**
   * Destroy charts safely
   */
  destroyCharts(charts: Chart[]): void {
    charts.forEach(chart => {
      try {
        chart.destroy();
      } catch (error) {
        console.error('Error destroying chart:', error);
      }
    });
  }
}
