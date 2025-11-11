import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { GithubService, GitHubFile } from './github.service';

export interface Mission {
  // File metadata
  fileName: string;
  filePath: string;
  
  // Mission data
  archetype: string;
  mission_code: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'not-started' | 'in-progress' | 'completed' | 'failed';
  progress: {
    current: number;
    total: number;
  };
  archetype_stat_change: {
    on_complete: any;
    on_failure: any;
  };
  reward: RewardReference[];
  mission_icon: string;
  due_date?: string;
  start_date: string;
  completion_date?: string;
}

export interface RewardReference {
  reward_type: string;
  title: string;
  reward_id: string;
}

export interface Reward {
  reward_id: string;
  title: string;
  description: string;
  associated_mission_ids: string[];
  reward_type: string;
  is_locked: boolean;
  badge_icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class MissionsService {
  private readonly GITHUB_OWNER = 'wannabemrrobot';
  private readonly GITHUB_REPO = 'daily-progress';
  private readonly MISSIONS_BASE_PATH = 'gamification/missions';
  private readonly REWARDS_BASE_PATH = 'gamification/rewards';

  constructor(
    private http: HttpClient,
    private githubService: GithubService
  ) {}

  /**
   * Get list of mission files from GitHub
   */
  getMissionFiles(folder: 'not-completed' | 'completed', limit?: number): Observable<GitHubFile[]> {
    const path = `${this.MISSIONS_BASE_PATH}/${folder}`;
    return this.githubService.getRepoContents(this.GITHUB_OWNER, this.GITHUB_REPO, path).pipe(
      map(files => {
        // Filter only JSON files
        const jsonFiles = files.filter(file => file.type === 'file' && file.name.endsWith('.json'));
        // Apply limit if specified
        return limit ? jsonFiles.slice(0, limit) : jsonFiles;
      }),
      catchError(err => {
        console.error(`Error loading ${folder} missions:`, err);
        return of([]);
      })
    );
  }

  /**
   * Load mission data from file
   */
  loadMissionData(file: GitHubFile): Observable<Mission> {
    if (!file.download_url) {
      return of({} as Mission);
    }

    const timestamp = new Date().getTime();
    return this.http.get<any>(`${file.download_url}?t=${timestamp}`).pipe(
      map(data => ({
        fileName: file.name,
        filePath: file.path,
        ...data
      })),
      catchError(err => {
        console.error(`Error loading mission ${file.name}:`, err);
        return of({} as Mission);
      })
    );
  }

  /**
   * Load multiple missions with lazy loading
   */
  loadMissions(folder: 'not-completed' | 'completed', limit: number = 5): Observable<Mission[]> {
    return this.getMissionFiles(folder, limit).pipe(
      switchMap(files => {
        if (files.length === 0) {
          return of([]);
        }
        
        // Load all mission files in parallel
        const missionRequests = files.map(file => this.loadMissionData(file));
        return forkJoin(missionRequests);
      })
    );
  }

  /**
   * Load both completed and not-completed missions
   */
  loadAllMissions(limitPerCategory: number = 5): Observable<{ notCompleted: Mission[], completed: Mission[] }> {
    return forkJoin({
      notCompleted: this.loadMissions('not-completed', limitPerCategory),
      completed: this.loadMissions('completed', limitPerCategory)
    });
  }

  /**
   * Get reward files from GitHub
   */
  getRewardFiles(folder: 'locked' | 'unlocked'): Observable<GitHubFile[]> {
    const path = `${this.REWARDS_BASE_PATH}/${folder}`;
    return this.githubService.getRepoContents(this.GITHUB_OWNER, this.GITHUB_REPO, path).pipe(
      map(files => files.filter(file => file.type === 'file' && file.name.endsWith('.json'))),
      catchError(err => {
        console.error(`Error loading ${folder} rewards:`, err);
        return of([]);
      })
    );
  }

  /**
   * Load reward data from file
   */
  loadRewardData(file: GitHubFile): Observable<Reward> {
    if (!file.download_url) {
      return of({} as Reward);
    }

    const timestamp = new Date().getTime();
    return this.http.get<Reward>(`${file.download_url}?t=${timestamp}`).pipe(
      catchError(err => {
        console.error(`Error loading reward ${file.name}:`, err);
        return of({} as Reward);
      })
    );
  }

  /**
   * Find reward by reward_id
   */
  findRewardById(rewardId: string): Observable<Reward | null> {
    return forkJoin({
      locked: this.getRewardFiles('locked'),
      unlocked: this.getRewardFiles('unlocked')
    }).pipe(
      switchMap(({ locked, unlocked }) => {
        const allRewardFiles = [...locked, ...unlocked];
        const rewardFile = allRewardFiles.find(file => file.name.startsWith(rewardId));
        
        if (!rewardFile) {
          return of(null);
        }
        
        return this.loadRewardData(rewardFile);
      })
    );
  }

  /**
   * Load rewards for a mission
   */
  loadMissionRewards(mission: Mission): Observable<Reward[]> {
    if (!mission.reward || mission.reward.length === 0) {
      return of([]);
    }

    const rewardRequests = mission.reward.map(ref => 
      this.findRewardById(ref.reward_id).pipe(
        map(reward => reward || {} as Reward)
      )
    );

    return forkJoin(rewardRequests);
  }
}
