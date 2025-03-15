import { ChatWidget } from './core/chatWidget';

// Import styles
import './styles.css';

// Create MirzaChatBox constructor
const MirzaChatBox = ChatWidget;

// Make MirzaChatBox available globally
if (typeof window !== 'undefined') {
  window.MirzaChatBox = MirzaChatBox;
}

// Export for module usage
export { MirzaChatBox };

/**
 * Initialize Mirza Chat with dynamic configuration
 * @param {Object} customConfig - Optional custom configuration
 */
window.MirzaChat = {
  init: function(customConfig = {}) {
    // Default configuration
    const defaultConfig = {
      apiUrl: 'http://localhost:8000', // Default development API
      websiteId: '655aac0e-d812-42d3-ae19-11cdb47cba7b', // Default websiteId
      primaryColor: '#0066FF',
      secondaryColor: '#E8F1FF',
      companyName: 'پشتیبان میرزا',
      position: 'bottom-right',
      initialMessage: 'سلام 😊 من میرزا چت هستم. چطور میتونم کمکتون کنم؟ 🤖',
      debug: false
    };
    
    // Get configuration from data attributes on script tag
    const scriptConfig = this.getScriptConfig();
    
    // Get configuration from global variable if it exists
    const globalConfig = window.MIRZA_CHAT_CONFIG || {};
    
    // Merge all configurations (priority: customConfig > globalConfig > scriptConfig > defaultConfig)
    const config = {
      ...defaultConfig,
      ...scriptConfig,
      ...globalConfig,
      ...customConfig
    };
    
    // Validate required fields
    if (!config.websiteId) {
      console.error('[MirzaChat] Error: websiteId is required');
      return;
    }
    
    if (!config.apiUrl) {
      console.error('[MirzaChat] Error: apiUrl is required');
      return;
    }
    
    // Log configuration if debug is enabled
    if (config.debug) {
      console.log('[MirzaChat] Initializing with config:', config);
    }
    
    // Initialize the chat widget
    try {
      const chatWidget = new ChatWidget(config);
      chatWidget.init();
      
      // Store reference to chat widget
      this.widget = chatWidget;
      
      // Return the widget instance
      return chatWidget;
    } catch (error) {
      console.error('[MirzaChat] Error initializing chat widget:', error);
    }
  },
  
  /**
   * Get configuration from script data attributes
   * @returns {Object} Configuration from script data attributes
   */
  getScriptConfig: function() {
    const config = {};
    const scriptTag = document.querySelector('script[src*="mirza-chat"]');
    
    if (scriptTag) {
      // Get all data attributes
      Array.from(scriptTag.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .forEach(attr => {
          // Convert data-api-url to apiUrl
          const key = attr.name.replace('data-', '').split('-')
            .map((part, index) => 
              index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
            )
            .join('');
          
          // Handle boolean values
          if (attr.value === 'true') {
            config[key] = true;
          } else if (attr.value === 'false') {
            config[key] = false;
          } else {
            config[key] = attr.value;
          }
        });
    }
    
    return config;
  },
  
  /**
   * Open the chat widget programmatically
   */
  openChat: function() {
    if (this.widget) {
      this.widget.openChat();
    }
  },
  
  /**
   * Close the chat widget programmatically
   */
  closeChat: function() {
    if (this.widget) {
      this.widget.closeChat();
    }
  },
  
  /**
   * Update configuration dynamically
   * @param {Object} newConfig - New configuration options
   */
  updateConfig: function(newConfig) {
    if (this.widget) {
      // Handle visual updates only (some properties can't be changed after initialization)
      const visualProperties = ['primaryColor', 'secondaryColor', 'companyName', 'position'];
      
      for (const key of visualProperties) {
        if (newConfig[key] !== undefined) {
          this.widget.options[key] = newConfig[key];
        }
      }
      
      // Rebuild UI to reflect changes
      if (this.widget.isOpen) {
        this.widget.closeChat();
        setTimeout(() => this.widget.openChat(), 300);
      }
      
      // Update toggle button color
      if (newConfig.primaryColor && this.widget.toggleButtonEl) {
        this.widget.toggleButtonEl.style.backgroundColor = newConfig.primaryColor;
      }
      
      if (newConfig.debug !== undefined) {
        this.widget.options.debug = newConfig.debug;
      }
      
      return true;
    }
    
    return false;
  },
  
  /**
   * Create a configuration UI for the chat widget
   * Only available in development mode
   */
  showConfigUI: function() {
    if (!this.widget || !this.widget.options.debug) {
      console.error('[MirzaChat] Config UI is only available in debug mode');
      return;
    }
    
    // Create a simple configuration modal
    const modal = document.createElement('div');
    modal.className = 'mirza-chat-config-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: system-ui, sans-serif;
      direction: rtl;
      width: 400px;
      max-width: 90vw;
    `;
    
    // Create form
    const form = document.createElement('form');
    form.onsubmit = (e) => {
      e.preventDefault();
      
      // Get form values
      const newConfig = {
        apiUrl: form.querySelector('#mirza-config-apiUrl').value,
        websiteId: form.querySelector('#mirza-config-websiteId').value,
        primaryColor: form.querySelector('#mirza-config-primaryColor').value,
        secondaryColor: form.querySelector('#mirza-config-secondaryColor').value,
        companyName: form.querySelector('#mirza-config-companyName').value,
        position: form.querySelector('#mirza-config-position').value,
        debug: form.querySelector('#mirza-config-debug').checked
      };
      
      // Store in global variable for persistence
      window.MIRZA_CHAT_CONFIG = newConfig;
      
      // Reload with new config
      modal.remove();
      this.widget.socketManager.disconnect();
      this.init(newConfig);
    };
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'تنظیمات چت میرزا';
    title.style.marginTop = '0';
    form.appendChild(title);
    
    // Add fields
    const createField = (id, label, value, type = 'text') => {
      const div = document.createElement('div');
      div.style.marginBottom = '15px';
      
      const labelEl = document.createElement('label');
      labelEl.htmlFor = id;
      labelEl.textContent = label;
      labelEl.style.display = 'block';
      labelEl.style.marginBottom = '5px';
      div.appendChild(labelEl);
      
      if (type === 'select') {
        const select = document.createElement('select');
        select.id = id;
        select.style.width = '100%';
        select.style.padding = '8px';
        select.style.borderRadius = '4px';
        select.style.border = '1px solid #ddd';
        
        for (const option of value) {
          const optionEl = document.createElement('option');
          optionEl.value = option.value;
          optionEl.textContent = option.label;
          optionEl.selected = option.selected;
          select.appendChild(optionEl);
        }
        
        div.appendChild(select);
      } else if (type === 'checkbox') {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = id;
        checkbox.checked = value;
        div.appendChild(checkbox);
      } else {
        const input = document.createElement('input');
        input.type = type;
        input.id = id;
        input.value = value;
        input.style.width = '100%';
        input.style.padding = '8px';
        input.style.borderRadius = '4px';
        input.style.border = '1px solid #ddd';
        div.appendChild(input);
      }
      
      return div;
    };
    
    // Add configuration fields
    form.appendChild(createField('mirza-config-apiUrl', 'آدرس API', this.widget.options.apiUrl));
    form.appendChild(createField('mirza-config-websiteId', 'شناسه وبسایت', this.widget.options.websiteId));
    form.appendChild(createField('mirza-config-primaryColor', 'رنگ اصلی', this.widget.options.primaryColor, 'color'));
    form.appendChild(createField('mirza-config-secondaryColor', 'رنگ ثانویه', this.widget.options.secondaryColor, 'color'));
    form.appendChild(createField('mirza-config-companyName', 'نام شرکت', this.widget.options.companyName));
    
    const positionOptions = [
      { value: 'bottom-right', label: 'پایین راست', selected: this.widget.options.position === 'bottom-right' },
      { value: 'bottom-left', label: 'پایین چپ', selected: this.widget.options.position === 'bottom-left' }
    ];
    
    form.appendChild(createField('mirza-config-position', 'موقعیت چت', positionOptions, 'select'));
    form.appendChild(createField('mirza-config-debug', 'حالت اشکال‌زدایی', this.widget.options.debug, 'checkbox'));
    
    // Add buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.marginTop = '20px';
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'انصراف';
    cancelButton.type = 'button';
    cancelButton.style.padding = '8px 16px';
    cancelButton.style.backgroundColor = '#f2f2f2';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.onclick = () => modal.remove();
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'ذخیره';
    saveButton.type = 'submit';
    saveButton.style.padding = '8px 16px';
    saveButton.style.backgroundColor = this.widget.options.primaryColor;
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '4px';
    saveButton.style.cursor = 'pointer';
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(saveButton);
    form.appendChild(buttonContainer);
    
    modal.appendChild(form);
    document.body.appendChild(modal);
  }
};

// Auto-initialize if global config is available or script has data attributes
if (window.MIRZA_CHAT_CONFIG || document.querySelector('script[src*="mirza-chat"][data-website-id]')) {
  window.addEventListener('DOMContentLoaded', () => {
    window.MirzaChat.init();
  });
}

// Export both MirzaChat and MirzaChatBox for module usage
export default { MirzaChat: window.MirzaChat, MirzaChatBox }; 