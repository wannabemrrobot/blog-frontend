import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { GithubService } from 'src/app/service/github.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-postpage',
    templateUrl: './postpage.component.html',
    styleUrls: ['./postpage.component.scss', './postpage.responsive.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class PostpageComponent implements OnInit {

  postnum: any;
  postObj: any;

  constructor(
    private __githubService: GithubService,
    private route: ActivatedRoute,
    private router: Router
    ) { }

  ngOnInit(): void {

    this.route.paramMap.subscribe( paramMap => {
      this.postnum = paramMap.get('postno');

      // if(isNaN(this.postnum)) {
      //   this.router.navigate(['/404'])
      //   return;
      // }

      this.__githubService.getPostsJSON().subscribe((response: any) => {

        for(let post of response) {
          if(post.postno == Number(this.postnum)) {

            this.postObj = {
              postno: post.postno,
              title: post.title,
              date: post.date,
              url: post.url,
              tags: post.tags,
              description: post.description
            }
          }
        }
      })
    })
  }
}
