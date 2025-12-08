import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dna-spinner',
  standalone: false,
  templateUrl: './dna-spinner.component.html',
  styleUrls: ['./dna-spinner.component.scss']
})
export class DnaSpinnerComponent {
  @Input() visible: boolean = true;
  @Input() width: string | number = 80;
  @Input() height: string | number = 80;
  @Input() ariaLabel: string = 'dna-loading';
  @Input() dnaColorOne: string = 'rgba(233, 12, 89, 0.51)';
  @Input() dnaColorTwo: string = '#46dff0';
  @Input() wrapperClass: string = '';

  // Generate animated colors (lighter/brighter versions)
  get animatedColorOne(): string {
    // Brighten the first color
    return this.lightenColor(this.dnaColorOne, 15);
  }

  get animatedColorTwo(): string {
    // Desaturate and fade the second color
    return this.desaturateColor(this.dnaColorTwo);
  }

  private lightenColor(color: string, percent: number): string {
    // Simple color lightening - makes colors brighter
    const isRgba = color.includes('rgba');
    if (isRgba) {
      // Extract RGB values and make them brighter, set alpha to 1
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const r = Math.min(255, parseInt(match[1]) + percent * 2);
        const g = Math.min(255, parseInt(match[2]) + percent * 2);
        const b = Math.min(255, parseInt(match[3]) + percent * 2);
        return `rgb(${r}, ${g}, ${b})`;
      }
    }
    return color;
  }

  private desaturateColor(color: string): string {
    // Make the color more faded/transparent
    const match = color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
    if (match) {
      const r = parseInt(match[1], 16);
      const g = parseInt(match[2], 16);
      const b = parseInt(match[3], 16);
      return `rgba(${r}, ${g}, ${b}, 0.15)`;
    }
    return color;
  }
}
