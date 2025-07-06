// src/ui/components/ResourceCost.js
// Component for displaying building costs with affordability indicators

class ResourceCost {
  static create(costs, playerResources, options = {}) {
    const config = {
      size: 'small', // 'small' | 'medium' | 'large'
      layout: 'horizontal', // 'horizontal' | 'vertical'
      showIcons: true,
      ...options
    };

    const container = document.createElement('div');
    container.className = 'resource-cost';
    
    const flexDirection = config.layout === 'vertical' ? 'column' : 'row';
    container.style.cssText = `
      display: flex;
      flex-direction: ${flexDirection};
      gap: 4px;
      flex-wrap: wrap;
    `;

    Object.entries(costs).forEach(([resource, amount]) => {
      const available = playerResources[resource] || 0;
      const canAfford = available >= amount;
      
      const costElement = document.createElement('span');
      costElement.className = `cost-${resource} ${canAfford ? 'affordable' : 'unaffordable'}`;
      
      const backgroundColor = canAfford ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      const textColor = canAfford ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
      const fontSize = config.size === 'large' ? '14px' : config.size === 'medium' ? '12px' : '11px';
      
      costElement.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 2px 6px;
        border-radius: 4px;
        background: ${backgroundColor};
        color: ${textColor};
        font-size: ${fontSize};
        font-weight: 500;
        border: 1px solid ${canAfford ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
      `;

      // Add resource icon (simple colored circle for now)
      if (config.showIcons) {
        const icon = document.createElement('div');
        icon.style.cssText = `
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${ResourceCost.getResourceColor(resource)};
        `;
        costElement.appendChild(icon);
      }

      // Add amount and resource name
      const text = document.createElement('span');
      text.textContent = `${amount} ${resource}`;
      costElement.appendChild(text);

      container.appendChild(costElement);
    });

    return container;
  }

  static getResourceColor(resource) {
    const colors = {
      wood: '#8B4513',
      stone: '#696969',
      iron: '#A52A2A',
      copper: '#B87333',
      coal: '#2F2F2F',
      gold: '#FFD700',
      food: '#32CD32',
      coins: '#DAA520'
    };
    return colors[resource] || '#888888';
  }

  static canAfford(costs, playerResources) {
    return Object.entries(costs).every(([resource, amount]) => 
      (playerResources[resource] || 0) >= amount
    );
  }

  // Create a summary of total resources needed
  static createSummary(costs, playerResources) {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px;
      background: rgba(31, 41, 55, 0.5);
      border-radius: 4px;
      border: 1px solid rgb(75, 85, 99);
    `;

    const header = document.createElement('div');
    header.textContent = 'Resource Cost:';
    header.style.cssText = `
      font-size: 12px;
      color: rgb(156, 163, 175);
      margin-bottom: 4px;
    `;
    container.appendChild(header);

    const costDisplay = ResourceCost.create(costs, playerResources, {
      size: 'medium',
      layout: 'horizontal'
    });
    container.appendChild(costDisplay);

    // Add affordability indicator
    const canAfford = ResourceCost.canAfford(costs, playerResources);
    const indicator = document.createElement('div');
    indicator.textContent = canAfford ? '✅ Can afford' : '❌ Insufficient resources';
    indicator.style.cssText = `
      font-size: 11px;
      color: ${canAfford ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'};
      margin-top: 4px;
    `;
    container.appendChild(indicator);

    return container;
  }
}

window.ResourceCost = ResourceCost;