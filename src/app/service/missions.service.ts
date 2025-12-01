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
  due_date?: string | null;
  start_date: string;
  completion_date?: string | null;
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
  reward_type: string; // This is the type/category: legendary, street, etc.
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
  
  // Aggregate file paths
  private readonly MISSIONS_ACTIVE_AGGREGATE = `${this.MISSIONS_BASE_PATH}/active.json`;
  private readonly MISSIONS_COMPLETED_AGGREGATE = `${this.MISSIONS_BASE_PATH}/completed.json`;
  private readonly MISSIONS_FAILED_AGGREGATE = `${this.MISSIONS_BASE_PATH}/failed.json`;
  private readonly MISSIONS_NOT_STARTED_AGGREGATE = `${this.MISSIONS_BASE_PATH}/not-started.json`;
  private readonly REWARDS_LOCKED_AGGREGATE = `${this.REWARDS_BASE_PATH}/locked-aggregate.json`;
  private readonly REWARDS_UNLOCKED_AGGREGATE = `${this.REWARDS_BASE_PATH}/unlocked-aggregate.json`;

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
   * Load aggregate missions file from GitHub
   */
  private loadMissionsAggregate(aggregatePath: string): Observable<Mission[]> {
    return this.githubService.getFileContent(this.GITHUB_OWNER, this.GITHUB_REPO, aggregatePath).pipe(
      switchMap(fileData => {
        if (!fileData.download_url) {
          return of([]);
        }
        const timestamp = new Date().getTime();
        return this.http.get<any>(`${fileData.download_url}?t=${timestamp}`).pipe(
          map(aggregateData => {
            // Extract missions array from aggregate structure
            return aggregateData.missions || [];
          })
        );
      }),
      catchError(err => {
        console.error(`Error loading aggregate from ${aggregatePath}:`, err);
        return of([]);
      })
    );
  }

  /**
   * Load multiple missions from aggregate files
   */
  loadMissions(folder: 'not-completed' | 'completed', limit: number = 5): Observable<Mission[]> {
    // Map folder to aggregate files
    const aggregatePaths: string[] = [];
    
    if (folder === 'not-completed') {
      // Load in-progress, not-started, and failed missions
      aggregatePaths.push(
        this.MISSIONS_ACTIVE_AGGREGATE,
        this.MISSIONS_NOT_STARTED_AGGREGATE,
        this.MISSIONS_FAILED_AGGREGATE
      );
    } else {
      // Load completed missions
      aggregatePaths.push(this.MISSIONS_COMPLETED_AGGREGATE);
    }
    
    // Load all relevant aggregates
    const aggregateRequests = aggregatePaths.map(path => this.loadMissionsAggregate(path));
    
    return forkJoin(aggregateRequests).pipe(
      map(results => {
        // Flatten and combine all missions
        const allMissions = results.reduce((acc, missions) => acc.concat(missions), []);
        
        // Apply limit if specified
        return limit ? allMissions.slice(0, limit) : allMissions;
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

  /**
   * Load all rewards from aggregate files
   */
  loadAllRewards(limit?: number): Observable<Reward[]> {
    return forkJoin({
      locked: this.loadRewardsAggregate(this.REWARDS_LOCKED_AGGREGATE),
      unlocked: this.loadRewardsAggregate(this.REWARDS_UNLOCKED_AGGREGATE)
    }).pipe(
      map(({ locked, unlocked }) => {
        const allRewards = [...locked, ...unlocked];
        return limit ? allRewards.slice(0, limit) : allRewards;
      })
    );
  }

  /**
   * Load rewards aggregate file from GitHub
   */
  private loadRewardsAggregate(aggregatePath: string): Observable<Reward[]> {
    return this.githubService.getFileContent(this.GITHUB_OWNER, this.GITHUB_REPO, aggregatePath).pipe(
      switchMap(fileData => {
        if (!fileData.download_url) {
          return of([]);
        }
        const timestamp = new Date().getTime();
        return this.http.get<any>(`${fileData.download_url}?t=${timestamp}`).pipe(
          map(aggregateData => {
            // Extract rewards array from aggregate structure
            return aggregateData.rewards || [];
          })
        );
      })
    );
  }
}
