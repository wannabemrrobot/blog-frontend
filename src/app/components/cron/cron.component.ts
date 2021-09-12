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
  streak: any = 0;

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
  calculateStreak(dailyProgressList: any) {

    // today and the last commited date
    let today = new Date().getTime()
    let lastCommit = new Date(dailyProgressList[0].date).getTime()

    for(let i=1; i<dailyProgressList.length-1; i++) {
      // iterating with 2 consecutive elements
      let prevDate = new Date(dailyProgressList[i-1].date).getTime()
      let curDate = new Date(dailyProgressList[i].date).getTime()
      
      // check if the consecutive array elements are consecutive days by looking for the difference 
      // (1-consecutive)
      if(Math.floor((prevDate - curDate) / 1000 / 60 / 60 / 24) == 1) {
        // console.log("on streak")
        this.streak = this.streak + 1
        // console.log("streak: ", this.streak)
      } else {
        // console.log("streak failed")
        break;
      }
    }

    if(Math.floor((today - lastCommit) / 1000 / 60 / 60 / 24) > 1) {
      this.streak = 0
    } else {
      this.streak = this.streak + 1;
    }

    this.streak = "0".repeat(4 - this.streak.toString().length) + this.streak;
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
