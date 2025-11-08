import { Component, OnInit , ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {filter} from 'rxjs/operators';
import { GithubService } from './service/github.service';
import { Subject, Subscription } from 'rxjs';
import { ThemeService } from './service/theme.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss', './app.responsive.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class AppComponent implements OnInit {
  title = 'wannabemrrobot';

  breadcrumb_placeholder!: String;
  ValidPostNumbers: any = [];

  themeNames: any = [];
  themeObjList: any = [];

  lastThemeSelection: any;
  defaultThemes: any = [
  {
    "$theme": "Zen White",

    "--accent-primary": "#ff1e56",

    "--text-primary": "#444444",
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
  },
  {
    "$theme": "Dark Knight",

    "--accent-primary": "#ff1e56",

    "--text-primary": "#dfdbd5",
    "--text-secondary": "#aca59a",
    "--home-heading": "#bdb7af",
    "--heading-primary": "#bdb7af",
    "--heading-secondary": "#444",
    "--animation-text": "#9e9689",
    "--badge-text": "#f8f9fa",
    "--tags": "#aca59a",
    "--tag-text": "#9e9689",
    "--tagcount-bg": "#26292b",
    "--tagbg-hover": "#ff5e860c",

    "--background": "#181a1b",
    "--header-bg": "#1b1e1f",
    "--subheader-bg": "#181a1b",
    "--border": "#3d4245",
    "--icons-social": "#ada59b",
    "--drop-shadow": "#2222224f"
  }
  ]


  constructor(
    private router: Router,
    private __githubService: GithubService,
    private __themeService: ThemeService
    ) {}
  
  // dynamic breadcrumb assigner
  breadcrumb() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {

        let url = event.url;
        let postRegex = new RegExp("(\/posts\/)[A-Za-z0-9]{1,}")
        let tagsRegex = new RegExp("(\/tags\/)[A-Za-z0-9]{1,}")

        // breadcrumb for home
        if(url == '/') {
          this.breadcrumb_placeholder = 'hello friend'

        // breadcrumb for cron@daily
        }else if(url == '/crondaily') {
          this.breadcrumb_placeholder = 'cron@daily'

        // breadcrumb for posts
        }else if(url == '/posts') {
          this.breadcrumb_placeholder = 'wget posts'
        
        // breadcrumb for post per page
        }else if(postRegex.test(url)) {
          this.isValidPost(url).subscribe((bool: any) => {
            if(bool == true) {
              this.breadcrumb_placeholder = 'cat post.dat'
            }else {
              this.breadcrumb_placeholder = 'invalid post'
            }
          })

        // breadcrumb for whoami
        }else if(url == '/whoami') {
          this.breadcrumb_placeholder = 'whoami'

        // breadcrumb for tags
        }else if(url == '/tags') {
          this.breadcrumb_placeholder = 'ls tags'

        // breadcrumb for tag id
        } else if(tagsRegex.test(url)) {
          let tag = url.split('/tags/')[1];
          this.breadcrumb_placeholder = `#tags`

        // breadcrumb for error page
        }else if(url == '/404') {
          this.breadcrumb_placeholder = 'errno 404'
        }else {
          this.breadcrumb_placeholder = 'errno 404'
        }
      })
  }

  // test for valid posts to display breadcrumb
  isValidPost(url: any) {
    let postno = Number(url.split('/posts/')[1]);
    let subject = new Subject<Boolean>();

    if(Number.isNaN(postno)) {
      subject.next(false);
    }else {
      // save the postnumbers in a list for valid post path check in breadcrumbs
      this.__githubService.getPostsJSON().subscribe((response: any) => {
        for(let post of response) {
          if(post.postno == postno) {
            subject.next(true);
            break;
          }else{
            subject.next(false);
          }
        }
      })
    }

    return subject.asObservable();
  }

  // change theme on button click
  changeTheme(theme: string) {
    this.lastThemeSelection = theme;
    this.__themeService.setTheme(theme, this.themeObjList);
    // Dispatch custom event for particle color update
    window.dispatchEvent(new Event('themeChanged'));
  }


  ngOnInit(): void {

    // breadcrumb function
    this.breadcrumb();

    // Initiate network call to get the theme if not available locally
    // get the themeList first
    this.__themeService.getThemeList().subscribe((themelist: any) => {
      // iterate through the themelist for url to fetch attributes
      this.__themeService.getThemeConfigs(themelist).subscribe((observableList: any) => {

        this.themeObjList = observableList;

        // INITIATING THEME SWITCHING TASK
        let userThemePreference = localStorage.getItem('@theme');
        // check localStorage for existing theme attributes
        if(userThemePreference != null || userThemePreference != undefined || userThemePreference == '') {
          this.__themeService.setTheme(userThemePreference, this.themeObjList);
          this.lastThemeSelection = userThemePreference;
        } else {
          // set the default themes based on browser themes
          let darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if(darkMode) {
            this.__themeService.setTheme('Dark Knight', this.defaultThemes);
            this.lastThemeSelection = 'Dark Knight';
          }else {
            this.__themeService.setTheme('Zen White', this.defaultThemes);
            this.lastThemeSelection = 'Zen White';
          }
        }
      })

      for(let theme of themelist) {
        this.themeNames.push(theme.theme)
      }
    })
  }
}
