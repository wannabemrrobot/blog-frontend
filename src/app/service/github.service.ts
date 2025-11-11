import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GithubService { 
  private readonly GITHUB_API_BASE = 'https://api.github.com';

  constructor(private http: HttpClient) { }

  timelinejson_url = "https://raw.githubusercontent.com/wannabemrrobot/daily-progress/main/timeline.json"
  postsjson_url = "https://raw.githubusercontent.com/wannabemrrobot/daily-progress/main/posts.json"

  public postsjson: any;
  
  headers = new HttpHeaders({'Accept': 'application/vnd.github.VERSION.raw'})

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('github_access_token');
    return new HttpHeaders({
      'Authorization': token ? `token ${token}` : '',
      'Accept': 'application/vnd.github.v3+json'
    });
  }

  // Get the timeline json from github
  getTimelineJSON() {
    return this.http.get(this.timelinejson_url)
  }

  getPostsJSON() {
    this.postsjson = this.http.get(this.postsjson_url)
    return this.postsjson;
  }

  getPostsContent(url: any) {
    return this.http.get(url)
  }

  /**
   * Get contents of a folder in a GitHub repository using GitHub API
   * @param owner Repository owner (e.g., 'wannabemrrobot')
   * @param repo Repository name (e.g., 'daily-progress')
   * @param path Path to folder (e.g., 'gamification/missions')
   */
  getRepoContents(owner: string, repo: string, path: string = ''): Observable<GitHubFile[]> {
    const url = `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
    return this.http.get<GitHubFile[]>(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Get file content from GitHub
   * @param owner Repository owner
   * @param repo Repository name
   * @param path Path to file
   */
  getFileContent(owner: string, repo: string, path: string): Observable<any> {
    const url = `${this.GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
    return this.http.get(url, { headers: this.getAuthHeaders() });
  }

  /**
   * Decode base64 content from GitHub API response
   */
  decodeContent(base64Content: string): string {
    return atob(base64Content.replace(/\n/g, ''));
  }
}

