// src/ui/components/BaseModal.js
// Modern reusable modal container for all UI panels

class BaseModal {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.isVisible = false;
    
    // Default configuration with modern defaults
    this.config = {
      width: 400,
      height: 650,
      x: 20,
      y: 20,
      title: 'Modal',
      closable: true,
      resizable: false,
      tabs: [], // Array of {id, label, icon} objects
      ...config
    };
    
    this.container = null;
    this.background = null;
    this.header = null;
    this.content = null;
    this.footer = null;
    this.tabNav = null;
    this.tabContents = new Map();
    this.activeTab = null;
    
    this.loadModernStyles();
    this.createModal();
    this.setupTabs();
  }

  loadModernStyles() {
    // Check if modern styles are already loaded
    if (!document.getElementById('modern-ui-styles')) {
      const link = document.createElement('link');
      link.id = 'modern-ui-styles';
      link.rel = 'stylesheet';
      link.href = 'src/ui/styles/modern-ui.css';
      document.head.appendChild(link);
    }
  }

  createModal() {
    // Create main container with modern styling
    this.container = document.createElement('div');
    this.container.className = 'game-modal game-ui';
    this.container.style.cssText = `
      position: fixed;
      left: ${this.config.x}px;
      top: ${this.config.y}px;
      width: ${this.config.width}px;
      height: ${this.config.height}px;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      display: none;
    `;

    // Create header with modern styling
    this.header = document.createElement('div');
    this.header.className = 'modal-header';

    const title = document.createElement('h2');
    title.textContent = this.config.title;
    this.header.appendChild(title);

    // Close button with modern styling
    if (this.config.closable) {
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.className = 'btn btn-secondary btn-sm';
      closeBtn.style.cssText = `
        background: none !important;
        border: none !important;
        color: var(--text-muted) !important;
        font-size: 20px !important;
        cursor: pointer;
        padding: 4px !important;
        width: 28px !important;
        height: 28px !important;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50% !important;
        transition: all var(--transition-fast);
      `;
      closeBtn.onmouseover = () => {
        closeBtn.style.color = 'var(--text-primary) !important';
        closeBtn.style.background = 'var(--bg-tertiary) !important';
      };
      closeBtn.onmouseout = () => {
        closeBtn.style.color = 'var(--text-muted) !important';
        closeBtn.style.background = 'none !important';
      };
      closeBtn.onclick = () => this.hide();
      this.header.appendChild(closeBtn);
    }

    // Create content area with modern styling
    this.content = document.createElement('div');
    this.content.className = 'modal-content';

    // Create footer with modern styling
    this.footer = document.createElement('div');
    this.footer.className = 'modal-footer';

    // Assemble modal
    this.container.appendChild(this.header);
    this.container.appendChild(this.content);
    this.container.appendChild(this.footer);
    
    // Add to document
    document.body.appendChild(this.container);
  }

  setupTabs() {
    if (this.config.tabs && this.config.tabs.length > 0) {
      // Create tab navigation
      this.tabNav = document.createElement('div');
      this.tabNav.className = 'tab-nav';
      
      this.config.tabs.forEach(tab => {
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.innerHTML = `${tab.icon || ''} ${tab.label}`;
        tabButton.onclick = () => this.switchTab(tab.id);
        this.tabNav.appendChild(tabButton);
        
        // Create tab content container
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        tabContent.id = `tab-${tab.id}`;
        this.tabContents.set(tab.id, tabContent);
        this.content.appendChild(tabContent);
      });
      
      // Insert tab nav at the beginning of content
      this.content.insertBefore(this.tabNav, this.content.firstChild);
      
      // Activate first tab
      if (this.config.tabs.length > 0) {
        this.switchTab(this.config.tabs[0].id);
      }
    }
  }

  switchTab(tabId) {
    // Update tab buttons
    const buttons = this.tabNav.querySelectorAll('.tab-button');
    buttons.forEach((btn, index) => {
      if (this.config.tabs[index].id === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Update tab contents
    this.tabContents.forEach((content, id) => {
      if (id === tabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
    
    this.activeTab = tabId;
    this.onTabChange?.(tabId);
  }

  getTabContent(tabId) {
    return this.tabContents.get(tabId);
  }

  show() {
    this.isVisible = true;
    this.container.style.display = 'flex';
    this.onShow?.();
  }

  hide() {
    this.isVisible = false;
    this.container.style.display = 'none';
    this.onHide?.();
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  setTitle(title) {
    const titleElement = this.header.querySelector('h2');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  setFooterText(text) {
    this.footer.textContent = text;
  }

  clearContent() {
    if (this.config.tabs && this.config.tabs.length > 0) {
      // Clear only the active tab content
      if (this.activeTab && this.tabContents.has(this.activeTab)) {
        this.tabContents.get(this.activeTab).innerHTML = '';
      }
    } else {
      this.content.innerHTML = '';
    }
  }

  addToContent(element) {
    if (this.config.tabs && this.config.tabs.length > 0) {
      // Add to active tab content
      if (this.activeTab && this.tabContents.has(this.activeTab)) {
        this.tabContents.get(this.activeTab).appendChild(element);
      }
    } else {
      this.content.appendChild(element);
    }
  }

  // Helper method to create modern UI components
  createCard(title, subtitle = null, icon = null) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const header = document.createElement('div');
    header.className = 'card-header';
    
    const titleEl = document.createElement('h3');
    titleEl.className = 'card-title';
    titleEl.innerHTML = `${icon ? icon + ' ' : ''}${title}`;
    header.appendChild(titleEl);
    
    if (subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.className = 'card-subtitle';
      subtitleEl.textContent = subtitle;
      header.appendChild(subtitleEl);
    }
    
    card.appendChild(header);
    
    const content = document.createElement('div');
    content.className = 'card-content';
    card.appendChild(content);
    
    return { card, content };
  }

  createButton(text, type = 'secondary', icon = null, onClick = null) {
    const btn = document.createElement('button');
    btn.className = `btn btn-${type}`;
    btn.innerHTML = `${icon ? icon + ' ' : ''}${text}`;
    if (onClick) btn.onclick = onClick;
    return btn;
  }

  createProgressBar(value, max = 100, type = 'resource') {
    const container = document.createElement('div');
    container.className = 'progress-container';
    
    const bar = document.createElement('div');
    bar.className = `progress-bar ${type}`;
    bar.style.width = `${(value / max) * 100}%`;
    
    container.appendChild(bar);
    return container;
  }

  createResourceDisplay(icon, name, value, change = null) {
    const display = document.createElement('div');
    display.className = 'resource-display';
    
    const iconEl = document.createElement('span');
    iconEl.className = 'resource-icon';
    iconEl.textContent = icon;
    display.appendChild(iconEl);
    
    const info = document.createElement('div');
    info.className = 'resource-info';
    
    const nameEl = document.createElement('p');
    nameEl.className = 'resource-name';
    nameEl.textContent = name;
    info.appendChild(nameEl);
    
    const valueEl = document.createElement('p');
    valueEl.className = 'resource-value';
    valueEl.textContent = typeof value === 'number' ? value.toLocaleString() : value;
    info.appendChild(valueEl);
    
    display.appendChild(info);
    
    if (change !== null) {
      const changeEl = document.createElement('span');
      changeEl.className = `resource-change ${change >= 0 ? 'positive' : 'negative'}`;
      changeEl.textContent = change >= 0 ? `+${change}` : change.toString();
      display.appendChild(changeEl);
    }
    
    return display;
  }

  createTooltip(element, text) {
    const container = document.createElement('div');
    container.className = 'tooltip-container';
    
    container.appendChild(element);
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    container.appendChild(tooltip);
    
    return container;
  }

  createHelpButton(tooltipText) {
    const btn = document.createElement('button');
    btn.className = 'help-btn';
    btn.textContent = '?';
    return this.createTooltip(btn, tooltipText);
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  // Event handlers (override in subclasses)
  onShow() {}
  onHide() {}
  onTabChange(tabId) {}
}

window.BaseModal = BaseModal;