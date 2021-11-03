import { Component, OnInit } from '@angular/core';
import * as particleConfig from '../../../../assets/data/particle-config.json';

@Component({
  selector: 'app-particle',
  templateUrl: './particle.component.html',
  styleUrls: ['./particle.component.scss']
})
export class ParticleComponent implements OnInit {

  // particles in cron streak
  particleStyle: any = {};
  particleParams: any = {};
  particleConfig: any = (particleConfig as any).default;
  width: number = 100;
  height: number = 100;

  constructor() { }

  ngOnInit(): void {
    this.particleConfig.particles.color.value = localStorage.getItem("@themeAccent");
    this.particleParams = this.particleConfig;
    this.particleStyle = {
      'position': 'absolute',
      'width': '100%',
      'height': '100%',
      'z-index': -1,
      'top': 0,
      'left': 0,
      'right': 0,
      'bottom': 0,
    };
  }

}
