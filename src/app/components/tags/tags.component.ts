import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GithubService } from 'src/app/service/github.service';

declare var callScramblerAnimation: any;

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss', './tags.responsive.scss']
})
export class TagsComponent implements OnInit {

  postWithTags: any = [];           // taglist for selected tags
  allTags: any = []                 // taglist contains all the tags
  tagID: any;                       // tagID for selected tags
  tagsDict: any = {};

  toggleAllTags = true;

  headerScramblerPhrase = [
    "Every beginning is difficult.",
    "To begin is easy.",
    "To persist is an art.",
    "Every beginning is difficult. To begin is easy. To persist is an art"
  ]

  constructor(
    private __githubService: GithubService,
    private route: ActivatedRoute,
  ) { }

  // sorts the list based on latest date first
  sortPostList() {
    return  this.postWithTags.sort((a: any, b: any) => {
      var dateA = (new Date(a.date).getTime());
      var dateB = (new Date(b.date).getTime());
      return dateB > dateA ? 1 : -1;
    })
  }

  ngOnInit(): void {
    
    this.route.paramMap.subscribe( paramMap => {
      this.tagID = paramMap.get('tagid');

      this.postWithTags = [] // clears the list on clicking new tag
      this.__githubService.getPostsJSON().subscribe((response: any) => {
        for(let post of response) {
          if((post.tags).includes(this.tagID)) {
            this.postWithTags.push(post)
          }

          for(let tag of post.tags) {
            if(this.tagsDict.hasOwnProperty(tag)) {
              this.tagsDict[tag] = this.tagsDict[tag] + 1;
            }else {
              this.tagsDict[tag] = 1;
            }
          }

          this.tagsDict = Object.keys(this.tagsDict).sort().reduce(
            (obj: any, key: any) => { 
              obj[key] = this.tagsDict[key]; 
              return obj;
            }, {}
          );
        }
      })
    })

    setTimeout(() => {
      new callScramblerAnimation(this.headerScramblerPhrase, '.tags__header__text', '!<>-_\\/[]{}—=+*^?#_');
    }, 500)
    
  }

}
