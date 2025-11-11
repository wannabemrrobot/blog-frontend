# Glitch Effect Directive

A reusable Angular directive that adds a cyberpunk-style glitch effect to any text element.

## Usage

### 1. Import the directive in your component

```typescript
import { GlitchDirective } from '../../directives/glitch.directive';

@Component({
  selector: 'app-your-component',
  standalone: false,
  imports: [GlitchDirective], // For standalone components
  templateUrl: './your-component.html'
})
```

For non-standalone components, add it to the `imports` array in your module:

```typescript
import { GlitchDirective } from './directives/glitch.directive';

@NgModule({
  declarations: [YourComponent],
  imports: [GlitchDirective]
})
```

### 2. Use in your template

**Basic usage:**
```html
<h1 appGlitch>GLITCH TEXT</h1>
```

**With custom text:**
```html
<div appGlitch [glitchText]="'Custom Glitch Text'">Original Text</div>
```

**With custom timing:**
```html
<span 
  appGlitch 
  [glitchDuration]="2000" 
  [glitchDelay]="3000">
  Glitch Effect
</span>
```

## Input Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `glitchText` | string | element's text content | The text to display with glitch effect |
| `glitchDuration` | number | 3000 | Duration of the glitch animation in milliseconds |
| `glitchDelay` | number | 4000 | Delay between glitch animations in milliseconds |

## Examples

### Example 1: Dashboard Title
```html
<h1 appGlitch class="dashboard-title">FIGHT CLUB</h1>
```

### Example 2: Ego Names
```html
<h2 appGlitch 
    [glitchText]="ego.name" 
    [glitchDuration]="2500"
    class="ego-name">
  {{ ego.name }}
</h2>
```

### Example 3: Rapid Glitching
```html
<span 
  appGlitch 
  [glitchDuration]="1000" 
  [glitchDelay]="500">
  ERROR_404
</span>
```

## Styling

The directive automatically positions the element relatively. You can add additional styles:

```css
.glitch-title {
  font-size: 48px;
  font-weight: bold;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 4px;
}
```

## Notes

- The effect uses red (#ff00c1) and cyan (#00fff9) glitch colors
- Works best with uppercase text
- Automatically cleans up animations on component destroy
- Each instance gets unique animation keyframes to prevent conflicts
