import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private themelistURL = "https://raw.githubusercontent.com/wannabemrrobot/daily-progress/main/themelist.json";
  
  themeList: any = {};
  // private __themeUpdated:BehaviorSubject<string> = new BehaviorSubject("#ff1e56");
  // public readonly themeUpdated: Observable<string> = this.__themeUpdated.asObservable();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private http: HttpClient
    ) { }

  getThemeList() {
    return this.http.get(this.themelistURL);
  }
  
  getThemeConfigs(themeList: any) {

    return forkJoin(
      themeList.map((theme: any) =>
        this.http.get<any[]>(theme.url))
    ).pipe(
      map((themeObjectList: any) => themeObjectList.reduce((list: any, theme: any) => list.concat(theme), []))
    )
  }

  setTheme(name: string, themeObjList: any) {

    let fallBack = false;
    let themeName = name;
    let themeList = themeObjList;

    for(let theme of themeList) {
      if((theme.$theme).toLowerCase() == themeName.toLowerCase()) {

        Object.keys(theme).forEach((key: any) => {
          this.document.documentElement.style.setProperty(key, theme[key]);
        })
        
        // setting localstorage items for app level access
        localStorage.setItem('@theme', theme.$theme)
        localStorage.setItem('@themeAccent', theme['--accent-primary'])
        localStorage.setItem('@themeAttributes', theme)
        // this.__themeUpdated.next(theme['--accent-primary']);

        fallBack = false;
        break;

      }else {
        fallBack = true;
      }
    }

    // sets the fallback theme
    if(fallBack == true) {

      let fallBackTheme: any = {
        "$theme": "Zen White",

        "--accent-primary": "#ff1e56",
    
        "--text-primary": "#444444",
        "--text-btn": "#fff",
        "--text-secondary": "#4d4d4d",
        "--home-heading": "#646464",
        "--heading-primary": "#3d3d3d",
        "--heading-secondary": "#444",
        "--animation-text": "#757575",
        "--badge-text": "#f8f9fa",
        "--tags": "#a0a0a0",
        "--tag-text": "#757575",
        "--tagcount-bg": "#e6e6e6",
        "--tagbg-hover": "#ff5e860c",
    
        "--background": "#fff",
        "--header-bg": "#f8f9fa",
        "--subheader-bg": "#fff",
        "--border": "#d1d1d1",
        "--icons-social": "#5e5e5e",
        "--drop-shadow": "#2222224f"
      }

      localStorage.setItem('@theme', fallBackTheme.$theme)
      localStorage.setItem('@themeAccent', fallBackTheme['--accent-primary'])
      // this.__themeUpdated.next(fallBackTheme['--accent-primary']);

      Object.keys(fallBackTheme).forEach((key: any) => {
        this.document.documentElement.style.setProperty(key, fallBackTheme[key]);
      })
    }
  }
}
