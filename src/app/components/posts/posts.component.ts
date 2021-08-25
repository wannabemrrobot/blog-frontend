import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { GithubService } from 'src/app/service/github.service';

declare var callScramblerAnimation: any;

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.scss', './posts.responsive.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PostsComponent implements OnInit {

  postsJSON: any;                             // store posts detail JSON from github
  postsObjList: any = [];                     // store the post obj in this list

  searchToggle: boolean = false;              // toggle search results 
  @ViewChild('searchbar') searchbar: any;     // reference for the searchbar input field
  @ViewChild('searchbarmobile') searchbarmobile: any;     // reference for the searchbar input field

  searchResults: any = []                     // search results list

  sortMode: Boolean = false;                  // sorting mode boolean (false - latest first)
  sortButtonText = 'Latest';                  

  viewMode: Boolean = false;                  // view mode boolean (false - detailed, true - minified)
  viewButtonText = 'Detailed';

  headerScramblerPhrase = [                   // phrases for the header text animation
    "The secret of the perfect hack?",
    "Make it infallible.",
    "The secret of the perfect hack?<br> Make it infallible."
  ]

  constructor(
    private __githubService: GithubService,
    ) {}


  // search posts
  searchPost(event: any){
    
    let searchTerm = (event.target.value).toLowerCase();
    this.searchResults = [];
    this.viewMode = false;
    this.viewButtonText = 'Detailed';

    if(searchTerm == "") {
      this.searchToggle = false;
      return;
    }

    function tagSubstrCheck(this: any, post: any) {
      let flag = false;
      for(let tag of post.tags) {
        if((tag.toLowerCase()).includes(searchTerm)) {
          flag = true;
          break;
        }
      }
      return flag;
    }

    this.searchToggle = true;
    for(let post of this.postsObjList) {
      if((post.tags).includes(searchTerm) 
      || ((post.title).toLowerCase()).includes(searchTerm) 
      || ((post.description).toLowerCase()).includes(searchTerm)
      || tagSubstrCheck(post)) {

        this.searchResults.push(post);
      }
    }
  }

  // clears the search bar
  clearSearch( ) {
    this.searchbar.nativeElement.value = '';
    this.searchbarmobile.nativeElement.value = '';
    this.searchToggle = false;
  }

  // change the sorting mode
  changeSort() {
    this.sortMode = !this.sortMode;
    this.sortButtonText = this.sortMode ? 'Oldest' : 'Latest';
  }

  // change the view mode
  changeView() {
    this.viewMode = !this.viewMode;
    this.viewButtonText = this.viewMode ? 'Minified' : 'Detailed'
  }

  // page scroll button
  scrollPage(scrollType: any) {
    if(scrollType == 'pageup') {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }else if(scrollType == 'pagedown') {
      document.body.scrollTo(0,document.body.scrollHeight);
      document.documentElement.scrollTo(0,document.body.scrollHeight);
    }
  }

  // sorts the list based on latest date first
  sortPostList() {
    if(this.sortMode == false) {
      return  this.postsObjList.sort((a: any, b: any) => {
        var dateA = (new Date(a.date).getTime());
        var dateB = (new Date(b.date).getTime());
        return dateB > dateA ? 1 : -1;
      })
    }else {
      return  this.postsObjList.sort((a: any, b: any) => {
        var dateA = (new Date(a.date).getTime());
        var dateB = (new Date(b.date).getTime());
        return dateA > dateB ? 1 : -1;
      })
    }
  }

  ngOnInit(): void {
    // gets the postsJSON and populates the postsList
    this.__githubService.getPostsJSON().subscribe((response: any) => {
      this.postsJSON = response;

      for(let post of this.postsJSON) {

        let postsObj = {
          postno: post.postno,
          title: post.title,
          date: post.date,
          url: post.url,
          tags: post.tags,
          description: post.description
        }

        this.postsObjList.push(postsObj)
      }
    })

    setTimeout(() => {
      // animate text in the header
      new callScramblerAnimation(this.headerScramblerPhrase, '.posts__header__text', '!<>-_\\/[]{}—=+*^?#________');
    }, 500)  
  }
}
