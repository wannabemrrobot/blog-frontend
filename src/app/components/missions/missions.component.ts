import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { MissionsService, Mission, Reward } from '../../service/missions.service';

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
  loading = false;
  error: string | null = null;

  // Missions data
  notCompletedMissions: MissionWithRewards[] = [];
  completedMissions: MissionWithRewards[] = [];
  loadingMissions = false;
  
  // Lazy load settings
  initialLoadLimit = 5; // Load 5 from each category initially

  constructor(
    private authService: AuthService,
    private missionsService: MissionsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: any) => {
      this.user = user;
      this.isAuthenticated = !!user;
      this.loading = false;

      if (this.isAuthenticated && user.login && user.login !== 'wannabemrrobot') {
        this.error = `Access denied. Only wannabemrrobot can access this area. You are: ${user.login}`;
        setTimeout(() => {
          this.logout();
        }, 3000);
      } else if (this.isAuthenticated && user.login === 'wannabemrrobot') {
        this.error = null;
        this.loadMissions();
      }
    });
  }

  loadMissions(): void {
    this.loadingMissions = true;
    this.missionsService.loadAllMissions(this.initialLoadLimit).subscribe({
      next: ({ notCompleted, completed }) => {
        console.log('Missions loaded:', { notCompleted, completed });
        this.notCompletedMissions = notCompleted.map(m => ({ ...m, loadingRewards: false }));
        this.completedMissions = completed.map(m => ({ ...m, loadingRewards: false }));
        
        // Load rewards for all missions
        this.loadRewardsForMissions();
        
        this.loadingMissions = false;
      },
      error: (err) => {
        console.error('Error loading missions:', err);
        this.error = 'Failed to load missions. Please try again.';
        this.loadingMissions = false;
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
