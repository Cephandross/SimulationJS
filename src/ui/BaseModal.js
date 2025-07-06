// src/ui/components/BaseModal.js
// Reusable modal container for all UI panels

class BaseModal {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.isVisible = false;
    
    // Default configuration
    this.config = {
      width: 320,
      height: 600,
      x: 20,
      y: 20,
      title: 'Modal',
      closable: true,
      ...config
    };
    
    this.container = null;
    this.background = null;
    this.header = null;
    this.content = null;
    this.footer = null;
    
    this.createModal();
  }

  createModal() {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'game-modal';
    this.container.style.cssText = `
      position: fixed;
      left: ${this.config.x}px;
      top: ${this.config.y}px;
      width: ${this.config.width}px;
      height: ${this.config.height}px;
      background: rgba(17, 24, 39, 0.95);
      border: 1px solid rgb(75, 85, 99);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      font-family: Arial, sans-serif;
      color: white;
      display: none;
    `;

    // Create header
    this.header = document.createElement('div');
    this.header.className = 'modal-header';
    this.header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid rgb(75, 85, 99);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(31, 41, 55, 0.8);
    `;

    const title = document.createElement('h2');
    title.textContent = this.config.title;
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: bold;
    `;
    this.header.appendChild(title);

    // Close button
    if (this.config.closable) {
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = `
        background: none;
        border: none;
        color: rgb(156, 163, 175);
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      closeBtn.onmouseover = () => closeBtn.style.color = 'white';
      closeBtn.onmouseout = () => closeBtn.style.color = 'rgb(156, 163, 175)';
      closeBtn.onclick = () => this.hide();
      this.header.appendChild(closeBtn);
    }

    // Create content area
    this.content = document.createElement('div');
    this.content.className = 'modal-content';
    this.content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    `;

    // Create footer
    this.footer = document.createElement('div');
    this.footer.className = 'modal-footer';
    this.footer.style.cssText = `
      padding: 12px 16px;
      border-top: 1px solid rgb(75, 85, 99);
      background: rgba(31, 41, 55, 0.8);
      font-size: 12px;
      color: rgb(156, 163, 175);
    `;

    // Assemble modal
    this.container.appendChild(this.header);
    this.container.appendChild(this.content);
    this.container.appendChild(this.footer);
    
    // Add to document
    document.body.appendChild(this.container);
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
    this.content.innerHTML = '';
  }

  addToContent(element) {
    this.content.appendChild(element);
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  // Event handlers (override in subclasses)
  onShow() {}
  onHide() {}
}

window.BaseModal = BaseModal;