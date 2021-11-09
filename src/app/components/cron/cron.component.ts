import { Component, OnInit } from '@angular/core';
import { GithubService } from 'src/app/service/github.service';

// uncomment only for testing purpose
import dailyProgressTestData from './../../../assets/data/daily-progress-test.json';

declare var callScramblerAnimation: any;

@Component({
  selector: 'app-cron',
  templateUrl: './cron.component.html',
  styleUrls: ['./cron.component.scss', './cron.responsive.scss'],
})
export class CronComponent implements OnInit {

  dailyProgressFiles: any;
  dailyProgressList: any = []
  dailyProgressBuffer: any = []
  lastIndex = 0;
  loadMore: boolean = true;

  headerScramblerPhrase = [
    "If there's one way to disrupt a man's plan,",
    "it is to destabilize his timeline.",
    "If there's one way to disrupt a man's plan, it is to destabilize his timeline."
  ]
  streak: any = 0;
  bestStreak: any = 0;
  tabSelected: string = "dailyProgress";
  dailyProgressTab: boolean = true;

  constructor(
    private __githubService: GithubService,
    ) {}

  // expand Accordion
  expandAccordion(event: any) {
    let element = event?.target;
    element.classList.toggle("active");

    let accordionPanel = element.nextSibling;
    if(accordionPanel.style.maxHeight) {
      accordionPanel.style.maxHeight = null;
      element.style.color = 'var(--heading-primary)';
    }else {
      accordionPanel.style.maxHeight = accordionPanel.scrollHeight + "px";
      element.style.color = 'var(--accent-primary)';
    }
  }

  // collapse all accordion on click
  collapseAllAccordion() {

    let accordion_elem: any = document.getElementsByClassName("accordion-panel");
    for(let i=0; i < accordion_elem.length; i++) {
      accordion_elem[i].style.maxHeight = null;
    }

    let heading_elem: any = document.getElementsByClassName("cron__timeline-item__title");
    for(let i=0; i < heading_elem.length; i++) {
      heading_elem[i].style.color = 'var(--heading-primary)';
    }
  }

  // change tab on click
  changeTab(event: any) {
    if(event.target.value == "dailyProgress") {
      this.dailyProgressTab = true;
      this.tabSelected = "dailyProgress";
    } else if(event.target.value == "milestone") {
      this.dailyProgressTab = false;
      this.tabSelected = "milestone";
    }
  }

  // sort list based on time(date)
  sortDateList() {
    let sortedList = this.dailyProgressList.sort((a: any, b: any) => {
      var dateA = +(new Date(a.date).getTime());
      var dateB = +(new Date(b.date).getTime());
      return dateB > dateA ? 1 : -1; 
    })

    return sortedList;
  }

  // calculate the learning streak
  calculateStreak(dailyProgressList: any) {

    // today and the last commited date
    let today = new Date().getTime()
    let lastCommit = new Date(dailyProgressList[0].date).getTime()
    let streakBroke = false;

    this.streak = 1
    this.bestStreak = 1

    let streak = 1

    // iterate to find the streak
    for(let i=1; i<dailyProgressList.length-1; i++) {
      // iterating with 2 consecutive elements
      let prevDate = new Date(dailyProgressList[i-1].date).getTime()
      let curDate = new Date(dailyProgressList[i].date).getTime()
      
      // check if the consecutive array elements are consecutive days by looking for the difference 
      // (1-consecutive)
      if(Math.floor((prevDate - curDate) / 1000 / 60 / 60 / 24) == 1 && streakBroke == false) {
        streak = streak + 1
        this.streak = this.streak + 1
        this.bestStreak = this.streak
      } else if(Math.floor((prevDate - curDate) / 1000 / 60 / 60 / 24) == 1 && streakBroke == true) {
        // calculate the best streak
        streak = streak + 1
        // if(streak > this.bestStreak) {
        //   console.log("bigger streak encountered: ", streak)
        //   this.bestStreak = streak;
        // }
        this.bestStreak = this.bestStreak < streak ? streak : this.bestStreak
      } else {
        streakBroke = true
        streak = 1
      }
    }

    // check if the last commit made is within the last 24 hrs
    if(Math.floor((today - lastCommit) / 1000 / 60 / 60 / 24) > 1) {
      this.streak = 0
    }

    this.streak = "0".repeat(4 - this.streak.toString().length) + this.streak;
    this.bestStreak = "0".repeat(4 - this.bestStreak.toString().length) + this.bestStreak;
  }

  // load more timeline events on btn click
  loadmore() {
    // push elements to list only if there are 10 or more elements in the buffer, to push
    if((this.lastIndex+9) <= this.dailyProgressBuffer.length) {
      for(var i=this.lastIndex; i<this.lastIndex+10; i++) {
        this.dailyProgressList.push(this.dailyProgressBuffer[i])
      }
      this.lastIndex = i;
      // toggle off the load more button, when every element in buffer is pushed to the list
      if(this.lastIndex == this.dailyProgressBuffer.length) {
        this.loadMore = false
      }
    } else {
      // this condition block will get executed when there are less than 10 elements in the buffer to push
      this.loadMore = false;
      for(var i=this.lastIndex; i<this.dailyProgressBuffer.length; i++) {
        this.dailyProgressList.push(this.dailyProgressBuffer[i])
      }
    }
  }

  // angular life cycle hook, when the component gets loaded
  ngOnInit(): void {
    // get timelineJSON and populate the dailyprogresslist
    this.__githubService.getTimelineJSON().subscribe((response: any) => {
      this.dailyProgressFiles = response;

      for(let file of this.dailyProgressFiles) {
        let dailyProgressObj = {
          date: file.date,
          title: file.title,
          milestone: file.milestone,
          url: file.url,
        }
        this.dailyProgressBuffer.push(dailyProgressObj)
      }

      // calculate Learning Streak
      this.calculateStreak(this.dailyProgressBuffer)

      // load the first 10 timelines into the view
      for(var i=0; i<10; i++) {
        this.dailyProgressList.push(this.dailyProgressBuffer[i]);
      }
      this.lastIndex = i;
    })

    ////////////////////////////////////////////////
    // uncomment only to test with local json data

    // this.dailyProgressBuffer = dailyProgressTestData;
    // this.calculateStreak(this.dailyProgressBuffer);

    // load the first 10 timelines into the view

    // for(var i=0; i<10; i++) {
    //   this.dailyProgressList.push(this.dailyProgressBuffer[i]);
    // }
    // this.lastIndex = i;
    ////////////////////////////////////////////////


    setTimeout(() => {
      // animate text in the header
      new callScramblerAnimation(this.headerScramblerPhrase, '.cron__header__text', '!<>-_\\/[]{}—=+*^?#________');
    }, 500)
  }
}
