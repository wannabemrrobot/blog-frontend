import { Component, OnDestroy, OnInit } from '@angular/core';
import { GithubService } from 'src/app/service/github.service';

declare var callScramblerAnimation: any;

@Component({
  selector: 'app-cron',
  templateUrl: './cron.component.html',
  styleUrls: ['./cron.component.scss', './cron.responsive.scss']
})
export class CronComponent implements OnInit {

  dailyProgressFiles: any;
  dailyProgressList: any = []
  headerScramblerPhrase = [
    "If there's one way to disrupt a man's plan,",
    "it is to destabilize his timeline.",
    "If there's one way to disrupt a man's plan, it is to destabilize his timeline."
  ]
  streak: number = 0;

  constructor(
    private __githubService: GithubService
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
  calculateStreak(list: any) {

    let dailyProgressList = [...list]
    dailyProgressList.reverse()

    let today = new Date().getTime()
    let lastCommit = new Date(dailyProgressList[dailyProgressList.length-1].date).getTime()

    for(let i=1; i<dailyProgressList.length; i++) {
      
      let prevDate = new Date(dailyProgressList[i-1].date).getTime()
      let curDate = new Date(dailyProgressList[i].date).getTime()

      if(Math.abs(Math.floor((prevDate - curDate) / 1000 / 60 / 60 / 24)) == 1 || Math.abs(Math.floor((prevDate - curDate) / 1000 / 60 / 60 / 24)) == 0) {
        this.streak = this.streak + 1
      } else {
        this.streak = 0
      }
    }

    if(Math.floor((today - lastCommit) / 1000 / 60 / 60 / 24) > 1) {
      this.streak = 0
    } else {
      this.streak = this.streak + 1;
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
          url: file.url,
        }
        this.dailyProgressList.push(dailyProgressObj)
      }

      // calculate Learning Streak
      this.calculateStreak(this.dailyProgressList)
    })

    setTimeout(() => {
      // animate text in the header
      new callScramblerAnimation(this.headerScramblerPhrase, '.cron__header__text', '!<>-_\\/[]{}—=+*^?#________');
    }, 500)
  }
}
