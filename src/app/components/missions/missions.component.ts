import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { MissionsService, Mission, Reward } from '../../service/missions.service';
import { GamificationService, Badge, BadgesAggregate } from '../../service/gamification.service';
import { environment } from '../../../environments/environment';

interface MissionWithRewards extends Mission {
  rewards?: Reward[];
  loadingRewards?: boolean;
}

@Component({
  selector: 'app-missions',
  standalone: false,
  templateUrl: './missions.component.html',
  styleUrl: './missions.component.scss'
})
export class MissionsComponent implements OnInit {
  isAuthenticated = false;
  user: any = null;
  loading = true; // Start with loading true to prevent flash of content
  error: string | null = null;

  // Missions data
  notCompletedMissions: MissionWithRewards[] = [];
  completedMissions: MissionWithRewards[] = [];
  loadingMissions = false;
  
  // View state
  currentView: 'active' | 'completed' | 'rewards' | 'badges' = 'active';
  
  // Rewards data
  allRewards: Reward[] = [];
  
  // Badges data
  badgesData: BadgesAggregate | null = null;
  loadingBadges = false;
  
  // Filter states
  activeMissionFilters = {
    hasRewards: null as boolean | null,
    hasDeadline: null as boolean | null,
    alterEgo: null as string | null
  };
  
  completedMissionFilters = {
    hasRewards: null as boolean | null,
    hasCompletionDate: null as boolean | null,
    alterEgo: null as string | null
  };
  
  rewardFilters = {
    locked: null as boolean | null,
    type: null as string | null
  };
  
  badgeFilters = {
    alterEgo: null as string | null,
    locked: null as boolean | null,
    rarity: null as string | null
  };
  
  // Lazy load settings
  initialLoadLimit = 1000; // Load all missions

  constructor(
    private authService: AuthService,
    private missionsService: MissionsService,
    private gamificationService: GamificationService,
    private router: Router
  ) {}

  setView(view: 'active' | 'completed' | 'rewards' | 'badges'): void {
    this.currentView = view;
    if (view === 'badges' && !this.badgesData) {
      this.loadBadges();
    }
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: any) => {
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
        setTimeout(() => {
          this.logout();
        }, 3000);
        return;
      }

      // User is authorized
      this.error = null;
      this.loadMissions();
    });
  }

  loadMissions(): void {
    this.loadingMissions = true;
    this.missionsService.loadAllMissions(this.initialLoadLimit).subscribe({
      next: ({ notCompleted, completed }) => {
        console.log('Missions loaded:', { notCompleted, completed });
        this.notCompletedMissions = notCompleted.map(m => ({ ...m, loadingRewards: false }));
        this.completedMissions = completed.map(m => ({ ...m, loadingRewards: false }));
        
        // Load rewards for mission cards
        this.loadRewardsForMissions();
        
        // Load all rewards for rewards section
        this.loadAllRewards();
        
        this.loadingMissions = false;
      },
      error: (err) => {
        console.error('Error loading missions:', err);
        this.error = 'Failed to load missions. Please try again.';
        this.loadingMissions = false;
      }
    });
  }

  loadAllRewards(): void {
    this.missionsService.loadAllRewards(1000).subscribe({
      next: (rewards) => {
        console.log('All rewards loaded:', rewards);
        console.log('Rewards count before filter:', rewards.length);
        this.allRewards = rewards
          .filter(r => r.reward_id) // Filter out empty rewards
          .sort((a, b) => {
            // Sort by reward type priority: mythic > apex > legendary > vanguard > street
            const typePriority: { [key: string]: number } = {
              'mythic': 5,
              'apex': 4,
              'legendary': 3,
              'vanguard': 2,
              'street': 1
            };
            return (typePriority[b.reward_type.toLowerCase()] || 0) - (typePriority[a.reward_type.toLowerCase()] || 0);
          });
        console.log('All rewards after processing:', this.allRewards);
        console.log('All rewards count:', this.allRewards.length);
      },
      error: (err) => {
        console.error('Error loading all rewards:', err);
      }
    });
  }

  loadRewardsForMissions(): void {
    // Load rewards for not-completed missions
    this.notCompletedMissions.forEach(mission => {
      if (mission.reward && mission.reward.length > 0) {
        mission.loadingRewards = true;
        this.missionsService.loadMissionRewards(mission).subscribe({
          next: (rewards) => {
            mission.rewards = rewards.filter(r => r.reward_id); // Filter out empty rewards
            mission.loadingRewards = false;
          },
          error: (err) => {
            console.error(`Error loading rewards for ${mission.mission_code}:`, err);
            mission.loadingRewards = false;
          }
        });
      }
    });

    // Load rewards for completed missions
    this.completedMissions.forEach(mission => {
      if (mission.reward && mission.reward.length > 0) {
        mission.loadingRewards = true;
        this.missionsService.loadMissionRewards(mission).subscribe({
          next: (rewards) => {
            mission.rewards = rewards.filter(r => r.reward_id);
            mission.loadingRewards = false;
          },
          error: (err) => {
            console.error(`Error loading rewards for ${mission.mission_code}:`, err);
            mission.loadingRewards = false;
          }
        });
      }
    });
  }

  getProgressPercentage(mission: Mission): number {
    if (mission.progress.total === 0) return 0;
    return (mission.progress.current / mission.progress.total) * 100;
  }

  getDifficultyClass(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'difficulty-easy';
      case 'medium': return 'difficulty-medium';
      case 'hard': return 'difficulty-hard';
      default: return 'difficulty-medium';
    }
  }

  getRewardTypeClass(rewardType: string): string {
    switch (rewardType.toLowerCase()) {
      case 'street': return 'reward-street';
      case 'vanguard': return 'reward-vanguard';
      case 'legendary': return 'reward-legendary';
      case 'apex': return 'reward-apex';
      case 'mythic': return 'reward-mythic';
      default: return 'reward-street';
    }
  }

  loadBadges(): void {
    this.loadingBadges = true;
    this.gamificationService.getBadges().subscribe({
      next: (data) => {
        this.badgesData = data;
        this.loadingBadges = false;
      },
      error: (err) => {
        console.error('Error loading badges:', err);
        this.loadingBadges = false;
      }
    });
  }

  getRarityClass(rarity: string): string {
    switch (rarity.toLowerCase()) {
      case 'common': return 'badge-common';
      case 'uncommon': return 'badge-uncommon';
      case 'rare': return 'badge-rare';
      case 'epic': return 'badge-epic';
      case 'legendary': return 'badge-legendary';
      default: return 'badge-common';
    }
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'progression': '📊',
      'streaks': '🔥',
      'missions': '🎯',
      'stats': '💪',
      'abilities': '⚡',
      'synergy': '🔗',
      'soap': '💎',
      'redemption': '🔄',
      'rewards': '🎁'
    };
    return icons[category.toLowerCase()] || '🏆';
  }

  getUnlockedRewardsCount(): number {
    return this.allRewards.filter(reward => !reward.is_locked).length;
  }
  
  getFilteredUnlockedRewardsCount(): number {
    return this.filteredRewards.filter(reward => !reward.is_locked).length;
  }
  
  // Filter methods
  get filteredActiveMissions(): MissionWithRewards[] {
    return this.notCompletedMissions.filter(mission => {
      if (this.activeMissionFilters.hasRewards !== null) {
        const hasRewards = mission.reward && mission.reward.length > 0;
        if (hasRewards !== this.activeMissionFilters.hasRewards) return false;
      }
      if (this.activeMissionFilters.hasDeadline !== null) {
        const hasDeadline = !!mission.due_date;
        if (hasDeadline !== this.activeMissionFilters.hasDeadline) return false;
      }
      if (this.activeMissionFilters.alterEgo && mission.archetype !== this.activeMissionFilters.alterEgo) {
        return false;
      }
      return true;
    });
  }
  
  get filteredCompletedMissions(): MissionWithRewards[] {
    return this.completedMissions.filter(mission => {
      if (this.completedMissionFilters.hasRewards !== null) {
        const hasRewards = mission.reward && mission.reward.length > 0;
        if (hasRewards !== this.completedMissionFilters.hasRewards) return false;
      }
      if (this.completedMissionFilters.hasCompletionDate !== null) {
        const hasCompletionDate = !!mission.completion_date;
        if (hasCompletionDate !== this.completedMissionFilters.hasCompletionDate) return false;
      }
      if (this.completedMissionFilters.alterEgo && mission.archetype !== this.completedMissionFilters.alterEgo) {
        return false;
      }
      return true;
    });
  }
  
  get filteredRewards(): Reward[] {
    const filtered = this.allRewards.filter(reward => {
      if (this.rewardFilters.locked !== null && reward.is_locked !== this.rewardFilters.locked) {
        return false;
      }
      if (this.rewardFilters.type && reward.reward_type !== this.rewardFilters.type) {
        return false;
      }
      return true;
    });
    console.log('Filtered rewards:', filtered.length, 'of', this.allRewards.length);
    return filtered;
  }
  
  get filteredBadges(): Badge[] {
    if (!this.badgesData) return [];
    
    return this.badgesData.badges.filter((badge: Badge) => {
      if (this.badgeFilters.alterEgo) {
        const badgeEgos = badge.earned_by.map(e => e.archetype);
        if (!badgeEgos.includes(this.badgeFilters.alterEgo)) {
          return false;
        }
      }
      if (this.badgeFilters.locked !== null) {
        const isLocked = badge.status === 'locked';
        if (isLocked !== this.badgeFilters.locked) return false;
      }
      if (this.badgeFilters.rarity && badge.rarity !== this.badgeFilters.rarity) {
        return false;
      }
      return true;
    });
  }
  
  // Filter toggle methods
  toggleActiveMissionFilter(filterType: 'hasRewards' | 'hasDeadline', value: boolean | null): void {
    if (this.activeMissionFilters[filterType] === value) {
      this.activeMissionFilters[filterType] = null;
    } else {
      this.activeMissionFilters[filterType] = value;
    }
  }
  
  cycleActiveMissionAlterEgo(): void {
    const egos = [null, 'tyler', 'mr-robot', 'kei'];
    const currentIndex = egos.indexOf(this.activeMissionFilters.alterEgo);
    const nextIndex = (currentIndex + 1) % egos.length;
    this.activeMissionFilters.alterEgo = egos[nextIndex];
  }
  
  getActiveMissionAlterEgoLabel(): string {
    return this.activeMissionFilters.alterEgo ? this.formatAlterEgoName(this.activeMissionFilters.alterEgo) : 'All Egos';
  }
  
  toggleCompletedMissionFilter(filterType: 'hasRewards' | 'hasCompletionDate', value: boolean | null): void {
    if (this.completedMissionFilters[filterType] === value) {
      this.completedMissionFilters[filterType] = null;
    } else {
      this.completedMissionFilters[filterType] = value;
    }
  }
  
  cycleCompletedMissionAlterEgo(): void {
    const egos = [null, 'tyler', 'mr-robot', 'kei'];
    const currentIndex = egos.indexOf(this.completedMissionFilters.alterEgo);
    const nextIndex = (currentIndex + 1) % egos.length;
    this.completedMissionFilters.alterEgo = egos[nextIndex];
  }
  
  getCompletedMissionAlterEgoLabel(): string {
    return this.completedMissionFilters.alterEgo ? this.formatAlterEgoName(this.completedMissionFilters.alterEgo) : 'All Egos';
  }
  
  toggleRewardFilter(filterType: 'locked', value: boolean | null): void {
    if (this.rewardFilters[filterType] === value) {
      this.rewardFilters[filterType] = null;
    } else {
      this.rewardFilters[filterType] = value;
    }
  }
  
  setRewardType(type: string | null): void {
    this.rewardFilters.type = this.rewardFilters.type === type ? null : type;
  }
  
  toggleBadgeFilter(filterType: 'locked', value: boolean | null): void {
    if (this.badgeFilters[filterType] === value) {
      this.badgeFilters[filterType] = null;
    } else {
      this.badgeFilters[filterType] = value;
    }
  }
  
  cycleBadgeAlterEgo(): void {
    const egos = [null, 'tyler', 'mr-robot', 'kei'];
    const currentIndex = egos.indexOf(this.badgeFilters.alterEgo);
    const nextIndex = (currentIndex + 1) % egos.length;
    this.badgeFilters.alterEgo = egos[nextIndex];
  }
  
  getBadgeAlterEgoLabel(): string {
    return this.badgeFilters.alterEgo ? this.formatAlterEgoName(this.badgeFilters.alterEgo) : 'All Egos';
  }
  
  formatAlterEgoName(ego: string): string {
    switch(ego) {
      case 'tyler': return 'TYLER';
      case 'mr-robot': return 'MR. ROBOT';
      case 'kei': return 'KEI';
      default: return 'All Egos';
    }
  }
  
  setBadgeRarity(rarity: string | null): void {
    this.badgeFilters.rarity = this.badgeFilters.rarity === rarity ? null : rarity;
  }
  
  clearActiveMissionFilters(): void {
    this.activeMissionFilters = {
      hasRewards: null,
      hasDeadline: null,
      alterEgo: null
    };
  }
  
  clearCompletedMissionFilters(): void {
    this.completedMissionFilters = {
      hasRewards: null,
      hasCompletionDate: null,
      alterEgo: null
    };
  }
  
  clearRewardFilters(): void {
    this.rewardFilters = {
      locked: null,
      type: null
    };
  }
  
  clearBadgeFilters(): void {
    this.badgeFilters = {
      alterEgo: null,
      locked: null,
      rarity: null
    };
  }

  loginWithGitHub(): void {
    this.loading = true;
    this.error = null;
    this.authService.signInWithGitHub()
      .then((result) => {
        console.log('Login successful:', result);
      })
      .catch((err: any) => {
        this.loading = false;
        this.error = 'Login failed. Please try again.';
        console.error('Login error:', err);
      });
  }

  logout(): void {
    this.authService.logout().then(() => {
      this.user = null;
      this.isAuthenticated = false;
      this.router.navigate(['/']);
    });
  }
}
