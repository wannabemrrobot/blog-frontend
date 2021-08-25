import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GithubService { 

  constructor(private http: HttpClient) { }

  timelinejson_url = "https://raw.githubusercontent.com/wannabemrrobot/daily-progress/main/timeline.json"
  postsjson_url = "https://raw.githubusercontent.com/wannabemrrobot/daily-progress/main/posts.json"

  public postsjson: any;
  
  headers = new HttpHeaders({'Accept': 'application/vnd.github.VERSION.raw'})

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
}
