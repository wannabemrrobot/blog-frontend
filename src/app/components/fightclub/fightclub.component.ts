import { Component, OnInit, AfterViewInit, OnDestroy, ViewChildren, ViewChild, QueryList, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

import { AuthService } from '../../service/auth.service';
import { GamificationService, AlterEgo, Synergy } from '../../service/gamification.service';
import { HistoryService, HistoryEntry } from '../../service/history.service';
import { ChartService } from '../../service/chart.service';
import { AuthUser, ComputedAlterEgo } from '../../models/fightclub.models';
import { 
  TIMING, 
  HISTORY_CONFIG, 
  SCRAMBLER_CONFIG, 
  EVENT_ICONS, 
  EVENT_CLASSES 
} from '../../constants/fightclub.constants';
import { environment } from '../../../environments/environment';

declare var callScramblerAnimation: any;

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

@Component({
  selector: 'app-fight-club',
  standalone: false,
  templateUrl: './fightclub.component.html',
  styleUrls: ['./fightclub.component.scss', './fightclub.responsive.scss']
})
export class FightClubComponent implements OnInit, AfterViewInit, OnDestroy {
  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();
  
  // Authentication state
  isAuthenticated = false;
  user: AuthUser | null = null;
  loading = true;
  error: string | null = null;
  
  // Alter Egos data
  alterEgos: AlterEgo[] = [];
  alterEgosComputed: ComputedAlterEgo[] = [];
  loadingEgos = false;
  
  // Synergy data
  synergy: Synergy | null = null;
  loadingSynergy = false;
  
  // History panel
  showHistoryPanel = false;
  history: HistoryEntry[] = [];
  loadingHistory = false;
  readonly historyLimit = HISTORY_CONFIG.DEFAULT_LIMIT;
  
  // View state
  showChartView = true;
  
  // Carousel state
  autoCarousel = true;
  currentCarouselIndex = 0;
  private carouselInterval: any = null;
  readonly carouselDuration = TIMING.CAROUSEL_DURATION;
  
  // Chart references
  @ViewChildren('radarCanvas') radarCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;
  @ViewChild('synergyCanvas') synergyCanvas!: ElementRef<HTMLCanvasElement>;
  private charts: Chart[] = [];
  private synergyChart: Chart | null = null;
  private chartsRendered = false;
  private themeChangeListener?: () => void;

  constructor(
    private authService: AuthService,
    private gamificationService: GamificationService,
    private historyService: HistoryService,
    private chartService: ChartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscribeToAuthChanges();
  }

  ngAfterViewInit(): void {
    this.setupCanvasChangeListener();
    this.initializeIfAuthenticated();
    this.setupThemeChangeListener();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ========== Lifecycle Helpers ==========

  private subscribeToAuthChanges(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: any) => {
        this.handleAuthStateChange(user);
      });
  }

  private handleAuthStateChange(user: any): void {
    this.user = user;
    this.isAuthenticated = !!user;
    this.loading = false;

    if (!this.isAuthenticated) {
      return;
    }

    if (!user.login) {
      this.error = 'Could not retrieve GitHub username. Please try again.';
      return;
    }

    if (!environment.authorizedUser.includes(user.login)) {
      this.error = `Access denied. Only ${environment.authorizedUser.join(', ')} can access this area. You are: ${user.login}`;
      setTimeout(() => this.logout(), TIMING.UNAUTHORIZED_REDIRECT_DELAY);
      return;
    }

    // User is authorized
    this.error = null;
    this.loadAlterEgos();
    this.loadSynergy();
    this.initializeScrambler();
  }

  private setupCanvasChangeListener(): void {
    this.radarCanvases.changes
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.alterEgos.length > 0 && this.radarCanvases.length > 0 && !this.chartsRendered) {
          this.chartsRendered = true;
          setTimeout(() => this.renderCharts(), TIMING.CHART_RENDER_DELAY);
        }
      });
  }

  private initializeIfAuthenticated(): void {
    if (this.isAuthenticated && this.user?.login && environment.authorizedUser.includes(this.user.login)) {
      this.initializeScrambler();
      
      if (this.alterEgos.length > 0 && this.radarCanvases?.length > 0 && !this.chartsRendered) {
        this.chartsRendered = true;
        setTimeout(() => this.renderCharts(), TIMING.CHART_RENDER_DELAY);
      }
      
      if (this.synergy && this.synergyCanvas) {
        setTimeout(() => this.renderSynergyChart(), TIMING.CHART_RENDER_DELAY);
      }
    }
  }

  private setupThemeChangeListener(): void {
    this.themeChangeListener = () => this.handleThemeChange();
    window.addEventListener('storage', this.themeChangeListener);
    window.addEventListener('themeChanged', this.themeChangeListener);
  }

  private handleThemeChange(): void {
    if (this.showChartView && this.charts.length > 0) {
      this.chartService.destroyCharts(this.charts);
      this.charts = [];
      this.chartsRendered = false;
      setTimeout(() => {
        this.chartsRendered = true;
        this.renderCharts();
      }, TIMING.CHART_RENDER_DELAY);
    }

    if (this.synergy && this.synergyCanvas && this.synergyChart) {
      this.synergyChart.destroy();
      this.synergyChart = null;
      setTimeout(() => this.renderSynergyChart(), TIMING.CHART_RENDER_DELAY);
    }
  }

  private cleanup(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    this.stopCarousel();
    this.chartService.destroyCharts(this.charts);
    
    if (this.synergyChart) {
      this.synergyChart.destroy();
    }
    
    if (this.themeChangeListener) {
      window.removeEventListener('storage', this.themeChangeListener);
      window.removeEventListener('themeChanged', this.themeChangeListener);
    }
  }

  // ========== Authentication Actions ==========

  loginWithGitHub(): void {
    this.loading = true;
    this.error = null;
    
    this.authService.signInWithGitHub()
      .then(() => {
        // Success handled by auth state subscription
      })
      .catch((err: any) => {
        this.loading = false;
        this.error = 'Login failed. Please try again.';
        console.error('Login error:', err);
      });
  }

  logout(): void {
    this.authService.logout().then(() => {
      this.clearComponentState();
      this.router.navigate(['/']);
    });
  }

  logoutAllDevices(): void {
    const message = 'This will clear all session data on THIS device only. Note: Firebase does not support true cross-device logout without a backend. Other devices will remain logged in until tokens expire (~1 hour). Continue?';
    
    if (confirm(message)) {
      this.authService.revokeAllSessions();
    }
  }

  private clearComponentState(): void {
    this.user = null;
    this.isAuthenticated = false;
    this.alterEgos = [];
    this.alterEgosComputed = [];
  }

  // ========== Data Loading ==========

  private loadAlterEgos(): void {
    this.loadingEgos = true;
    this.chartsRendered = false;
    
    this.gamificationService.getAllAlterEgos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (egos) => this.handleAlterEgosLoaded(egos),
        error: (err) => this.handleAlterEgosError(err)
      });
  }

  private handleAlterEgosLoaded(egos: AlterEgo[]): void {
    this.alterEgos = egos;
    this.alterEgosComputed = this.computeAlterEgos(egos);
    this.loadingEgos = false;

    setTimeout(() => {
      this.initializeCreedScramblers();
      
      if (this.radarCanvases?.length > 0 && !this.chartsRendered) {
        this.chartsRendered = true;
        this.renderCharts();
      }
      
      // Start carousel if autoCarousel is enabled
      if (this.autoCarousel) {
        this.startCarousel();
      }
    }, TIMING.EGO_LOAD_DELAY);
  }

  private handleAlterEgosError(err: any): void {
    console.error('Error loading alter egos:', err);
    this.error = 'Failed to load alter egos. Please try again later.';
    this.loadingEgos = false;
  }

  private computeAlterEgos(egos: AlterEgo[]): ComputedAlterEgo[] {
    return egos.map(ego => ({
      ...ego,
      abilitiesArray: this.chartService.getAbilitiesArray(ego),
      xpPercentage: this.calculatePercentage(ego.xp_details.current_xp, ego.xp_details.xp_to_next_level),
      healthPercentage: this.calculatePercentage(ego.health_details.current_health, ego.health_details.max_health),
      energyPercentage: this.calculatePercentage(ego.energy_details.current_energy, ego.energy_details.max_energy),
      rewards_unlocked: ego.unlocked_rewards?.length || 0,
      total_rewards: (ego.unlocked_rewards?.length || 0) + (ego.locked_rewards?.length || 0)
    }));
  }

  private calculatePercentage(current: number, max: number): number {
    return (current / max) * 100;
  }

  private loadSynergy(): void {
    this.loadingSynergy = true;
    
    this.gamificationService.getSynergy()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (synergy) => {
          this.synergy = synergy;
          this.loadingSynergy = false;
          setTimeout(() => this.renderSynergyChart(), TIMING.CHART_RENDER_DELAY);
        },
        error: (err) => {
          console.error('Error loading synergy:', err);
          this.loadingSynergy = false;
        }
      });
  }

  loadHistory(): void {
    this.loadingHistory = true;
    
    this.historyService.getHistory(this.historyLimit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.history = history;
          this.loadingHistory = false;
        },
        error: (err) => {
          console.error('Error loading history:', err);
          this.loadingHistory = false;
        }
      });
  }

  // ========== Animation Initialization ==========

  private initializeScrambler(): void {
    setTimeout(() => {
      try {
        if (typeof callScramblerAnimation !== 'undefined') {
          new callScramblerAnimation(
            SCRAMBLER_CONFIG.MAIN_PHRASES,
            SCRAMBLER_CONFIG.MAIN_SELECTOR,
            SCRAMBLER_CONFIG.ANIMATION_CHARS
          );
        }
      } catch (error) {
        console.error('Error initializing scrambler:', error);
      }
    }, TIMING.SCRAMBLER_DELAY);
  }

  private initializeCreedScramblers(): void {
    try {
      if (typeof callScramblerAnimation === 'undefined') {
        return;
      }

      this.alterEgosComputed.forEach((ego, index) => {
        const creedElement = `${SCRAMBLER_CONFIG.CREED_SELECTOR}[data-ego-index="${index}"]`;
        
        if (ego.creed_text) {
          const creedPhrases = this.parseCreedText(ego.creed_text);
          new callScramblerAnimation(creedPhrases, creedElement, SCRAMBLER_CONFIG.ANIMATION_CHARS);
        }
      });
    } catch (error) {
      console.error('Error initializing creed scramblers:', error);
    }
  }

  private parseCreedText(creedText: string): string[] {
    const creedParts = creedText
      .split('/')
      .map(part => part.trim())
      .filter(part => part.length > 0);

    const fullText = creedParts.join(' ');
    return creedParts.length > 1 ? [...creedParts, fullText] : creedParts;
  }

  // ========== Chart Rendering ==========

  private renderCharts(): void {
    if (!this.radarCanvases || this.radarCanvases.length === 0) {
      return;
    }

    this.chartService.destroyCharts(this.charts);
    this.charts = [];

    const themeColors = this.chartService.getThemeColors();

    this.radarCanvases.forEach((canvasRef: ElementRef<HTMLCanvasElement>, index: number) => {
      const ego = this.alterEgos[index];
      if (!ego) return;

      const chart = this.chartService.createAlterEgoChart(canvasRef.nativeElement, ego, themeColors);
      if (chart) {
        this.charts.push(chart);
      }
    });
  }

  private renderSynergyChart(): void {
    if (!this.synergyCanvas || !this.synergy) {
      return;
    }

    if (this.synergyChart) {
      this.synergyChart.destroy();
      this.synergyChart = null;
    }

    const themeColors = this.chartService.getThemeColors();
    this.synergyChart = this.chartService.createSynergyChart(
      this.synergyCanvas.nativeElement,
      this.synergy,
      themeColors
    );
  }

  // ========== View Toggles ==========

  toggleAbilityView(): void {
    this.showChartView = !this.showChartView;

    if (this.showChartView) {
      this.reRenderChartsAfterViewToggle();
    }
  }

  private reRenderChartsAfterViewToggle(): void {
    this.chartService.destroyCharts(this.charts);
    this.charts = [];
    this.chartsRendered = false;

    if (this.synergyChart) {
      this.synergyChart.destroy();
      this.synergyChart = null;
    }

    setTimeout(() => {
      if (this.radarCanvases?.length > 0) {
        this.chartsRendered = true;
        this.renderCharts();
      }

      if (this.synergyCanvas && this.synergy) {
        this.renderSynergyChart();
      }
    }, TIMING.CHART_RENDER_DELAY);
  }

  toggleHistoryPanel(): void {
    this.showHistoryPanel = !this.showHistoryPanel;

    if (this.showHistoryPanel && this.history.length === 0) {
      this.loadHistory();
    }
  }

  // ========== Carousel Controls ==========

  toggleAutoCarousel(): void {
    this.autoCarousel = !this.autoCarousel;
    this.autoCarousel ? this.startCarousel() : this.stopCarousel();
  }

  private startCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }

    this.carouselInterval = setInterval(() => {
      this.nextCard();
    }, this.carouselDuration);
  }

  private stopCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  nextCard(): void {
    if (this.alterEgosComputed.length > 0) {
      this.currentCarouselIndex = (this.currentCarouselIndex + 1) % this.alterEgosComputed.length;
    }
  }

  prevCard(): void {
    if (this.alterEgosComputed.length > 0) {
      this.currentCarouselIndex = (this.currentCarouselIndex - 1 + this.alterEgosComputed.length) % this.alterEgosComputed.length;
    }
  }

  setActiveCard(index: number): void {
    this.currentCarouselIndex = index;
    
    if (this.autoCarousel) {
      this.startCarousel();
    }
  }

  // ========== Template Helpers ==========

  formatAbilityName(name: string): string {
    return this.chartService.formatAbilityName(name);
  }

  getEventIcon(entry: HistoryEntry): string {
    const eventType = entry.event_type || entry.state || 'default';
    return EVENT_ICONS[eventType] || EVENT_ICONS.default;
  }

  getEventClass(entry: HistoryEntry): string {
    const eventType = entry.event_type || entry.state || 'default';
    return EVENT_CLASSES[eventType] || EVENT_CLASSES.default;
  }

  getEventDescription(entry: HistoryEntry): string {
    const eventType = entry.event_type || entry.state;
    const alterEgo = entry['alter-ego'];

    switch (eventType) {
      case 'completed':
        return `${alterEgo} completed ${entry.mission_associated}`;
      case 'failed':
        return `${alterEgo} failed ${entry.mission_associated}`;
      case 'missed_checkin_penalty':
        return `${alterEgo} missed ${entry.days_missed} days check-in`;
      case 'streak_milestone':
        return `${alterEgo} reached ${entry.streak_days} day streak`;
      default:
        return `${alterEgo} - ${eventType}`;
    }
  }

  // ========== Mobile Card Stack ==========
  
  ngAfterViewChecked(): void {
    // Initialize card stack swipe functionality after view is checked
    if (this.alterEgosComputed.length > 0 && typeof window !== 'undefined') {
      setTimeout(() => {
        this.initializeCardStack();
        this.renderMobileCardCharts();
      }, 0);
    }
  }

  private renderMobileCardCharts(): void {
    if (typeof document === 'undefined') return;
    
    const mobileCanvases = document.querySelectorAll('.stack-card .ego__radar-canvas');
    if (mobileCanvases.length === 0 || this.alterEgosComputed.length === 0) return;

    const themeColors = this.chartService.getThemeColors();

    mobileCanvases.forEach((canvas, index) => {
      const ego = this.alterEgosComputed[index];
      if (!ego || !(canvas instanceof HTMLCanvasElement)) return;

      // Check if chart already exists for this canvas
      if (canvas.hasAttribute('data-chart-rendered')) return;
      canvas.setAttribute('data-chart-rendered', 'true');

      this.chartService.createAlterEgoChart(canvas, ego, themeColors);
    });
  }

  private initializeCardStack(): void {
    const cardStack = document.querySelector('.card-stack');
    if (!cardStack || cardStack.hasAttribute('data-initialized')) {
      return;
    }

    cardStack.setAttribute('data-initialized', 'true');
    
    let cards = Array.from(document.querySelectorAll('.stack-card')) as HTMLElement[];
    let isSwiping = false;
    let startX = 0;
    let currentX = 0;
    let animationFrameId: number | null = null;

    const updatePositions = () => {
      cards.forEach((card, i) => {
        card.style.setProperty('--i', String(i));
        card.style.setProperty('--swipe-x', '0px');
        card.style.setProperty('--swipe-rotate', '0deg');
        card.style.opacity = '1';
      });
    };

    const applySwipeStyles = (deltaX: number) => {
      const card = cards[0];
      if (!card) return;
      card.style.setProperty('--swipe-x', `${deltaX}px`);
      card.style.setProperty('--swipe-rotate', `${deltaX * 0.2}deg`);
      card.style.opacity = String(1 - Math.min(Math.abs(deltaX) / 100, 1) * 0.75);
    };

    const handleStart = (clientX: number) => {
      if (isSwiping) return;
      isSwiping = true;
      startX = currentX = clientX;
      const card = cards[0];
      if (card) {
        card.style.transition = 'none';
      }
    };

    const handleMove = (clientX: number) => {
      if (!isSwiping) return;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        currentX = clientX;
        const deltaX = currentX - startX;
        applySwipeStyles(deltaX);

        if (Math.abs(deltaX) > 50) {
          handleEnd();
        }
      });
    };

    const handleEnd = () => {
      if (!isSwiping) return;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      const deltaX = currentX - startX;
      const threshold = 50;
      const duration = 300;
      const card = cards[0];

      if (card) {
        card.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;

        if (Math.abs(deltaX) > threshold) {
          const direction = Math.sign(deltaX);
          card.style.setProperty('--swipe-x', `${direction * 300}px`);
          card.style.setProperty('--swipe-rotate', `${direction * 20}deg`);

          setTimeout(() => {
            card.style.setProperty('--swipe-rotate', `${-direction * 20}deg`);
          }, duration * 0.5);

          setTimeout(() => {
            cards = [...cards.slice(1), card];
            updatePositions();
            attachListeners(); // Reattach to new top card
          }, duration);
        } else {
          applySwipeStyles(0);
        }
      }

      isSwiping = false;
      startX = currentX = 0;
    };

    const attachListeners = () => {
      const topCard = cards[0];
      if (!topCard) return;

      topCard.addEventListener('pointerdown', (e: Event) => {
        const event = e as PointerEvent;
        handleStart(event.clientX);
      });
      
      topCard.addEventListener('pointermove', (e: Event) => {
        const event = e as PointerEvent;
        handleMove(event.clientX);
      });
      
      topCard.addEventListener('pointerup', () => handleEnd());
      topCard.addEventListener('pointercancel', () => handleEnd());
    };

    updatePositions();
    attachListeners();
  }
}
