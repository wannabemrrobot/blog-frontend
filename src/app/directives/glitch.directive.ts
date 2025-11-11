import { Directive, ElementRef, Input, OnInit, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appGlitch]',
  standalone: true
})
export class GlitchDirective implements AfterViewInit, OnDestroy {
  @Input() glitchText: string = '';
  @Input() glitchDuration: number = 3000; // milliseconds
  @Input() glitchDelay: number = 4000; // milliseconds between glitches
  
  private styleElement: HTMLStyleElement | null = null;
  private animationId: string = '';

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.animationId = `glitch-${Math.random().toString(36).substr(2, 9)}`;
  }

  ngAfterViewInit(): void {
    // Use setTimeout to ensure text content is available
    setTimeout(() => {
      const element = this.el.nativeElement as HTMLElement;
      
      // Get the text content if not provided
      const text = this.glitchText || element.textContent?.trim() || '';
      
      console.log('GlitchDirective initialized:', {
        animationId: this.animationId,
        text: text,
        element: element,
        elementText: element.textContent,
        duration: this.glitchDuration,
        delay: this.glitchDelay
      });
      
      if (!text) {
        console.warn('GlitchDirective: No text content found!');
        return;
      }
      
      // Set up the element
      this.renderer.setStyle(element, 'position', 'relative');
      this.renderer.setStyle(element, 'display', 'inline-block');
      this.renderer.setAttribute(element, 'data-text', text);
      this.renderer.addClass(element, `glitch-wrapper-${this.animationId}`);
      
      console.log('Element setup complete, injecting styles...');
      
      // Inject CSS animation
      this.injectGlitchStyles(text);
      
      console.log('Styles injected successfully');
    }, 0);
  }

  private injectGlitchStyles(text: string): void {
    this.styleElement = this.renderer.createElement('style');
    if (!this.styleElement) {
      console.error('Failed to create style element');
      return;
    }
    
    console.log('Creating styles for text:', text);
    
    // Escape quotes for CSS content property
    const escapedText = text.replace(/"/g, '\\"').replace(/'/g, "\\'");
    
    this.styleElement.textContent = `
      .glitch-wrapper-${this.animationId}::before,
      .glitch-wrapper-${this.animationId}::after {
        content: "${escapedText}";
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: transparent;
      }
      
      .glitch-wrapper-${this.animationId}::before {
        left: 2px;
        text-shadow: -2px 0 #ff00c1;
        clip: rect(44px, 450px, 56px, 0);
        animation: glitch-anim-${this.animationId} ${this.glitchDuration}ms infinite linear alternate-reverse;
        animation-delay: ${this.glitchDelay}ms;
      }
      
      .glitch-wrapper-${this.animationId}::after {
        left: -2px;
        text-shadow: -2px 0 #00fff9, 2px 2px #ff00c1;
        clip: rect(44px, 450px, 56px, 0);
        animation: glitch-anim-2-${this.animationId} ${this.glitchDuration}ms infinite linear alternate-reverse;
        animation-delay: ${this.glitchDelay}ms;
      }
      
      @keyframes glitch-anim-${this.animationId} {
        0% {
          clip: rect(31px, 9999px, 94px, 0);
          transform: skew(0.56deg);
        }
        5% {
          clip: rect(70px, 9999px, 71px, 0);
          transform: skew(0.85deg);
        }
        10% {
          clip: rect(4px, 9999px, 65px, 0);
          transform: skew(0.3deg);
        }
        15% {
          clip: rect(25px, 9999px, 20px, 0);
          transform: skew(0.95deg);
        }
        20% {
          clip: rect(83px, 9999px, 47px, 0);
          transform: skew(0.44deg);
        }
        25% {
          clip: rect(96px, 9999px, 78px, 0);
          transform: skew(0.01deg);
        }
        30% {
          clip: rect(58px, 9999px, 60px, 0);
          transform: skew(0.82deg);
        }
        35% {
          clip: rect(36px, 9999px, 51px, 0);
          transform: skew(0.55deg);
        }
        40% {
          clip: rect(92px, 9999px, 98px, 0);
          transform: skew(0.41deg);
        }
        45% {
          clip: rect(2px, 9999px, 87px, 0);
          transform: skew(0.16deg);
        }
        50% {
          clip: rect(64px, 9999px, 39px, 0);
          transform: skew(0.88deg);
        }
        55% {
          clip: rect(19px, 9999px, 8px, 0);
          transform: skew(0.74deg);
        }
        60% {
          clip: rect(100px, 9999px, 90px, 0);
          transform: skew(0.22deg);
        }
        65% {
          clip: rect(45px, 9999px, 12px, 0);
          transform: skew(0.67deg);
        }
        70% {
          clip: rect(77px, 9999px, 33px, 0);
          transform: skew(0.39deg);
        }
        75% {
          clip: rect(53px, 9999px, 99px, 0);
          transform: skew(0.91deg);
        }
        80% {
          clip: rect(11px, 9999px, 23px, 0);
          transform: skew(0.58deg);
        }
        85% {
          clip: rect(88px, 9999px, 76px, 0);
          transform: skew(0.13deg);
        }
        90% {
          clip: rect(66px, 9999px, 42px, 0);
          transform: skew(0.79deg);
        }
        95% {
          clip: rect(28px, 9999px, 55px, 0);
          transform: skew(0.48deg);
        }
        100% {
          clip: rect(73px, 9999px, 18px, 0);
          transform: skew(0.25deg);
        }
      }
      
      @keyframes glitch-anim-2-${this.animationId} {
        0% {
          clip: rect(65px, 9999px, 119px, 0);
          transform: skew(0.21deg);
        }
        5% {
          clip: rect(52px, 9999px, 44px, 0);
          transform: skew(0.93deg);
        }
        10% {
          clip: rect(86px, 9999px, 34px, 0);
          transform: skew(0.67deg);
        }
        15% {
          clip: rect(14px, 9999px, 98px, 0);
          transform: skew(0.43deg);
        }
        20% {
          clip: rect(71px, 9999px, 27px, 0);
          transform: skew(0.78deg);
        }
        25% {
          clip: rect(39px, 9999px, 105px, 0);
          transform: skew(0.29deg);
        }
        30% {
          clip: rect(93px, 9999px, 62px, 0);
          transform: skew(0.54deg);
        }
        35% {
          clip: rect(21px, 9999px, 81px, 0);
          transform: skew(0.87deg);
        }
        40% {
          clip: rect(48px, 9999px, 9px, 0);
          transform: skew(0.12deg);
        }
        45% {
          clip: rect(77px, 9999px, 56px, 0);
          transform: skew(0.69deg);
        }
        50% {
          clip: rect(33px, 9999px, 112px, 0);
          transform: skew(0.38deg);
        }
        55% {
          clip: rect(95px, 9999px, 73px, 0);
          transform: skew(0.84deg);
        }
        60% {
          clip: rect(59px, 9999px, 17px, 0);
          transform: skew(0.51deg);
        }
        65% {
          clip: rect(6px, 9999px, 91px, 0);
          transform: skew(0.76deg);
        }
        70% {
          clip: rect(82px, 9999px, 38px, 0);
          transform: skew(0.19deg);
        }
        75% {
          clip: rect(44px, 9999px, 103px, 0);
          transform: skew(0.95deg);
        }
        80% {
          clip: rect(68px, 9999px, 29px, 0);
          transform: skew(0.62deg);
        }
        85% {
          clip: rect(15px, 9999px, 85px, 0);
          transform: skew(0.37deg);
        }
        90% {
          clip: rect(91px, 9999px, 50px, 0);
          transform: skew(0.72deg);
        }
        95% {
          clip: rect(26px, 9999px, 66px, 0);
          transform: skew(0.46deg);
        }
        100% {
          clip: rect(55px, 9999px, 11px, 0);
          transform: skew(0.89deg);
        }
      }
    `;
    
    this.renderer.appendChild(document.head, this.styleElement);
    console.log('Style element appended to head, class:', `glitch-wrapper-${this.animationId}`);
  }

  ngOnDestroy(): void {
    // Clean up
    if (this.styleElement && this.styleElement.parentNode) {
      this.renderer.removeChild(document.head, this.styleElement);
    }
  }
}

