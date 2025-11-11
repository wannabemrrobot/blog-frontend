import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';

export interface AlterEgo {
  name: string;
  nickname: string;
  profile_url: string;
  tag_line: string;
  creed_text: string;
  title: string;
  level: number;
  xp_details: {
    current_xp: number;
    xp_to_next_level: number;
  };
  health_details: {
    current_health: number;
    max_health: number;
  };
  energy_details: {
    current_energy: number;
    max_energy: number;
  };
  abilities: { [key: string]: number }; // Dynamic abilities
  unlocked_rewards?: string[];
  locked_rewards?: string[];
}

export interface Synergy {
  fight_club: {
    level: number;
    chapter: string;
    description: string;
    xp_details: {
      current_xp: number;
      xp_to_next_level: number;
    };
    synergy: {
      mind: number;
      body: number;
      soul: number;
    };
    total_synergy: number;
    missions: {
      total: number;
      completed: number;
      failed: number;
      'not-started': number;
      'in-progress': number;
    };
    rewards: {
      total: number;
      locked: number;
      unlocked: number;
    };
    daily_progress: {
      daily_progress_streak: number;
      days_checked_in: number;
      habits: { [key: string]: any };
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private readonly GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/wannabemrrobot/daily-progress/main/gamification';
  private readonly ALTER_EGOS = ['tyler', 'mr-robot', 'kei'];

  constructor(private http: HttpClient) {}

  getAllAlterEgos(): Observable<AlterEgo[]> {
    // Add timestamp to bypass GitHub's CDN cache
    const timestamp = new Date().getTime();
    const requests = this.ALTER_EGOS.map(ego => 
      this.http.get<AlterEgo>(`${this.GITHUB_RAW_BASE}/alter-egoes/${ego}.json?t=${timestamp}`)
    );
    return forkJoin(requests);
  }

  getSynergy(): Observable<Synergy> {
    const timestamp = new Date().getTime();
    return this.http.get<Synergy>(`${this.GITHUB_RAW_BASE}/synergy.json?t=${timestamp}`);
  }
}
