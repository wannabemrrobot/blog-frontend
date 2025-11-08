import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { CronComponent } from './components/cron/cron.component';
import { WhoamiComponent } from './components/whoami/whoami.component';
import { Error404Component } from './components/error404/error404.component';
import { PostsComponent } from './components/posts/posts.component';
import { PostpageComponent } from './components/postpage/postpage.component';
import { TagsComponent } from './components/tags/tags.component';
import { NgxParticlesModule } from '@tsparticles/angular';
import { FormsModule } from '@angular/forms';
import { ParticleComponent } from './components/cron/particle/particle.component';

@NgModule({ declarations: [
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
    bootstrap: [AppComponent], imports: [BrowserModule,
        CommonModule,
        FormsModule,
        AppRoutingModule,
        NgxParticlesModule,
        MarkdownModule.forRoot({ loader: HttpClient })], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }
