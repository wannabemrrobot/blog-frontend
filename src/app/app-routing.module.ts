import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CronComponent } from './components/cron/cron.component';
import { PostsComponent } from './components/posts/posts.component';
import { WhoamiComponent } from './components/whoami/whoami.component';
import { PostpageComponent } from './components/postpage/postpage.component';
import { TagsComponent } from './components/tags/tags.component';
import { Error404Component } from './components/error404/error404.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'crondaily',
    component: CronComponent
  },
  {
    path: 'posts',
    component: PostsComponent
  },
  {
    path: 'whoami',
    component: WhoamiComponent
  },
  {
    path: 'posts/:postno',
    component: PostpageComponent
  },
  {
    path: 'tags',
    component: TagsComponent
  },
  {
    path: 'tags/:tagid',
    component: TagsComponent
  },
  {
    path: '404',
    component: Error404Component
  },
  {
    path: '**',
    redirectTo: '404'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
