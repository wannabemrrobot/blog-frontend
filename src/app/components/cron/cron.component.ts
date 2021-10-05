import { Component, OnDestroy, OnInit } from '@angular/core';
import { GithubService } from 'src/app/service/github.service';

declare var callScramblerAnimation: any;

@Component({
  selector: 'app-cron',
  templateUrl: './cron.component.html',
  styleUrls: ['./cron.component.scss', './cron.responsive.scss', './orb.animation.scss']
})
export class CronComponent implements OnInit {

  // particles in cron streak
  myStyle: any = {};
  myParams: any = {};
  width: number = 100;
  height: number = 100;

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



    this.myStyle = {
      'position': 'absolute',
      'width': '100%',
      'height': '100%',
      'z-index': -1,
      'top': 0,
      'left': 0,
      'right': 0,
      'bottom': 0,
    };

    this.myParams = {
        particles: {
          "number": {
            "value": 99,
            "density": {
              "enable": false,
              "value_area": 800
            }
          },
          "color": {
            "value": "#9fef00"
          },
          "shape": {
            "type": "circle",
            "stroke": {
              "width": 0,
              "color": "#000000"
            },
            "polygon": {
              "nb_sides": 9
            },
            "image": {
              "src": "img/github.svg",
              "width": 100,
              "height": 100
            }
          },
          "opacity": {
            "value": 1,
            "random": true,
            "anim": {
              "enable": true,
              "speed": 0.48691418137553294,
              "opacity_min": 0.1,
              "sync": false
            }
          },
          "size": {
            "value":10,
            "random": true,
            "anim": {
              "enable": false,
              "speed": 63.29884357881928,
              "size_min": 5.680665449381218,
              "sync": false
            }
          },
          "line_linked": {
            "enable": false,
            "distance": 0,
            "color": "#ffffff",
            "opacity": 0,
            "width": 1
          },
          "move": {
            "enable": true,
            "speed": 2,
            "direction": "left",
            "random": false,
            "straight": false,
            "out_mode": "out",
            "bounce": false,
            "attract": {
              "enable": false,
              "rotateX": 600,
              "rotateY": 1200
            }
          }
        },
        "interactivity": {
          "detect_on": "canvas",
          "events": {
            "onhover": {
              "enable": false,
              "mode": "repulse"
            },
            "onclick": {
              "enable": false,
              "mode": "push"
            },
            "resize": true
          },
          "modes": {
            "grab": {
              "distance": 400,
              "line_linked": {
                "opacity": 1
              }
            },
            "bubble": {
              "distance": 400,
              "size": 40,
              "duration": 2,
              "opacity": 8,
              "speed": 3
            },
            "repulse": {
              "distance": 200,
              "duration": 0.4
            },
            "push": {
              "particles_nb": 4
            },
            "remove": {
              "particles_nb": 2
            }
          }
        },
        "retina_detect": false
    };
  }
}
