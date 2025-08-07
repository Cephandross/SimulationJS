# Modern UI Integration Guide

This guide explains how to integrate the new modern UI design system into SimulationJS components.

## Quick Start

### 1. Using Modern Components in Existing Code

```javascript
// Replace old AdminPanel with ModernAdminPanel
const adminPanel = new ModernAdminPanel(scene);

// Use modern UI helpers in any component
const { card, content } = adminPanel.createCard('📊 Statistics', 'Game metrics');
const button = adminPanel.createButton('Save Game', 'primary', '💾');
```

### 2. Applying Modern Styles to Existing Elements

Add CSS classes to any existing DOM elements:

```javascript
// Make any element use modern styling
element.className = 'card game-ui';
button.className = 'btn btn-primary';
input.className = 'form-input';
```

### 3. Quick Modern Modal Creation

```javascript
const modal = new BaseModal(scene, {
  width: 400,
  height: 600,
  title: 'Game Settings',
  tabs: [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'graphics', label: 'Graphics', icon: '🎨' }
  ]
});
```

## Available Components

### Color Palette
- `--accent-primary`: #10b981 (Emerald)
- `--accent-secondary`: #06b6d4 (Cyan) 
- `--accent-tertiary`: #8b5cf6 (Violet)
- `--text-primary`: #f8fafc (White)
- `--bg-primary`: #0f172a (Dark slate)

### CSS Classes
- `.btn.btn-primary` - Primary action buttons
- `.card` - Modern card containers
- `.form-input` - Styled form inputs
- `.progress-bar` - Animated progress bars
- `.status-indicator` - Color-coded status dots
- `.tooltip-container` - Hover tooltips

### Helper Methods
- `createCard(title, subtitle, icon)` - Creates modern card
- `createButton(text, type, icon, onClick)` - Modern button
- `createProgressBar(value, max, type)` - Colored progress bar
- `createResourceDisplay(icon, name, value)` - Resource counter
- `createTooltip(element, text)` - Tooltip wrapper

## Integration Examples

### Modernizing PlayerOverviewUI

```javascript
// Before
const div = document.createElement('div');
div.style.background = 'rgba(17, 24, 39, 0.95)';

// After  
const div = document.createElement('div');
div.className = 'card game-ui';
```

### Adding Progress Bars

```javascript
// Health bar
const healthBar = this.createProgressBar(player.health, player.maxHealth, 'health');
container.appendChild(healthBar);

// Experience bar
const xpBar = this.createProgressBar(player.xp, player.nextLevel, 'experience');
container.appendChild(xpBar);
```

### Modern Buttons

```javascript
// Old style
const btn = document.createElement('button');
btn.style.cssText = 'background: #10b981; color: white; padding: 8px 16px;';

// Modern style
const btn = this.createButton('Build Unit', 'primary', '⚔️', () => buildUnit());
```

## Migration Path

### Phase 1: Core Components (Current)
- ✅ BaseModal modernized
- ✅ AdminPanel redesigned  
- ✅ CSS design system created

### Phase 2: Game UI (Next)
- [ ] PlayerOverviewUI - Apply modern cards and progress bars
- [ ] SelectionUI - Use modern button and card styling
- [ ] BuildingPlacementUI - Modern modal with tabs

### Phase 3: Integration (Final)
- [ ] UIManager - Coordinate modern components
- [ ] Main game - Apply background and layout improvements
- [ ] Mobile responsiveness - Touch-friendly controls

## Testing

Use `ui_showcase.html` to:
- Preview all modern components
- Test responsive behavior
- Validate color schemes
- Check accessibility

## Best Practices

1. **Consistent Theming**: Use CSS custom properties for colors
2. **Component Reuse**: Prefer helper methods over manual DOM creation
3. **Responsive Design**: Test on different screen sizes
4. **Accessibility**: Maintain proper contrast ratios
5. **Performance**: Reuse modal instances when possible

## Troubleshooting

### Styles Not Loading
```javascript
// Ensure modern CSS is loaded
if (!document.getElementById('modern-ui-styles')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'src/ui/styles/modern-ui.css';
  document.head.appendChild(link);
}
```

### Component Not Showing
```javascript
// Check display property
modal.show(); // Instead of modal.container.style.display = 'flex';
```

### Tab System Issues
```javascript
// Ensure tabs are configured properly
const modal = new BaseModal(scene, {
  tabs: [
    { id: 'overview', label: 'Overview', icon: '📊' }
  ]
});
```