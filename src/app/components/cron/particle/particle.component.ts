import { Component, OnInit, OnDestroy } from '@angular/core';
import type { ISourceOptions, Engine, Container } from '@tsparticles/engine';
import { loadBasic } from '@tsparticles/basic';
import * as particleConfig from '../../../../assets/data/particle-config-v3.json';

@Component({
    selector: 'app-particle',
    templateUrl: './particle.component.html',
    styleUrls: ['./particle.component.scss'],
    standalone: false
})
export class ParticleComponent implements OnInit, OnDestroy {

  // particles in cron streak
  particleStyle: any = {};
  particleOptions: ISourceOptions = {};
  particleConfig: any = (particleConfig as any).default;
  id = "tsparticles-cron";
  private particlesContainer?: Container;
  private storageListener: any;

  constructor() { }

  ngOnInit(): void {
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
    
    this.updateParticleColor();
    
    // Listen for storage changes (when theme changes)
    this.storageListener = async () => {
      const newColor = localStorage.getItem("@themeAccent") || "#9fef00";
      
      // Update the container's options directly
      if (this.particlesContainer) {
        this.particlesContainer.options.particles.color.value = newColor;
        await this.particlesContainer.refresh();
      }
    };
    window.addEventListener('storage', this.storageListener);
    
    // Also listen for a custom event for same-window changes
    window.addEventListener('themeChanged', this.storageListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.storageListener);
    window.removeEventListener('themeChanged', this.storageListener);
  }

  updateParticleColor(): void {
    const accentColor = localStorage.getItem("@themeAccent") || "#9fef00";
    this.particleConfig.particles.color.value = accentColor;
    this.particleOptions = { ...this.particleConfig };
  }

  // Initialize particles engine with basic preset
  async particlesInit(engine: Engine): Promise<void> {
    await loadBasic(engine);
  }

  // Store container reference for refresh
  particlesLoaded(container: Container): void {
    this.particlesContainer = container;
  }

}
