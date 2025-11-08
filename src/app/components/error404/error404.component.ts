import { Component, OnInit } from '@angular/core';

declare var callScramblerAnimation: any;


@Component({
    selector: 'app-error404',
    templateUrl: './error404.component.html',
    styleUrls: ['./error404.component.scss', './error404.responsive.scss'],
    standalone: false
})
export class Error404Component implements OnInit {

  headerScramblerPhrase = [                   // phrases for the header text animation
    "When we lose our principles,",
    "we invite Chaos.",
    "When we lose our principles, we invite Chaos."
  ]

  bodyScramblerPhrase = [
    "ERROR!",
    "HELP?!",
    "404",
    "You are lost, only to find better!"
  ]

  constructor() { }

  animateOnHover(phraseList: any, querySelector: any, scrambleChars: any) {
    new callScramblerAnimation(phraseList, querySelector, scrambleChars);
  }

  ngOnInit(): void {

    setTimeout(() => {
      // animate text in the header
      new callScramblerAnimation(this.headerScramblerPhrase, '.page404__header__text', '!<>-_\\/[]{}—=+*^?#________');
      new callScramblerAnimation(this.bodyScramblerPhrase, '.page404__body__scrambler__text', '!<>-_\\/[]{}—=+*^?#__');

    }, 500)
  }

}
