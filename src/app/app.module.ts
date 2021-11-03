import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { CronComponent } from './components/cron/cron.component';
import { WhoamiComponent } from './components/whoami/whoami.component';
import { RouterModule } from '@angular/router';
import { Error404Component } from './components/error404/error404.component';
import { PostsComponent } from './components/posts/posts.component';
import { PostpageComponent } from './components/postpage/postpage.component';
import { TagsComponent } from './components/tags/tags.component';
import { ParticlesModule } from 'ngx-particle';
import { FormsModule } from '@angular/forms';
import { ParticleComponent } from './components/cron/particle/particle.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CronComponent,
    WhoamiComponent,
    Error404Component,
    PostsComponent,
    PostpageComponent,
    TagsComponent,
    ParticleComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    ParticlesModule,
    MarkdownModule.forRoot({ loader: HttpClient }),
    RouterModule.forRoot([
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
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
