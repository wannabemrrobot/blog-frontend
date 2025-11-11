import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface HistoryEntry {
  history_index: number;
  'alter-ego': string;
  mission_associated?: string;
  event_type?: string;
  state?: string;
  delta_changed: any;
  state_after_delta_applied: any;
  date: string;
  reward_unlocked?: string[];
  habit_name?: string;
  streak_days?: number;
  days_missed?: number;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private readonly GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/wannabemrrobot/daily-progress/main/gamification';

  constructor(private http: HttpClient) {}

  /**
   * Get history entries from GitHub
   */
  getHistory(limit?: number): Observable<HistoryEntry[]> {
    const timestamp = new Date().getTime();
    return this.http.get<HistoryEntry[]>(`${this.GITHUB_RAW_BASE}/history.json?t=${timestamp}`).pipe(
      map(history => {
        // Sort by history_index descending and limit if specified
        const sorted = history.sort((a, b) => b.history_index - a.history_index);
        return limit ? sorted.slice(0, limit) : sorted;
      }),
      catchError(err => {
        console.error('Error loading history:', err);
        return of([]);
      })
    );
  }
}
