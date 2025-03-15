import { SocketManager } from './socket';
import { AuthManager } from './auth';
import { SupportModeManager } from './supportMode';
import { 
  generateUUID, 
  createElement, 
  throttle,
  formatDate
} from '../utils';
import * as icons from '../utils/icons';
import { ChatWidgetUI } from './components/ChatWidgetUI';
import { ChatWidgetMessages } from './components/ChatWidgetMessages';
import { ChatWidgetAuth } from './components/ChatWidgetAuth';
import { ChatWidgetSupport } from './components/ChatWidgetSupport';
import { ChatWidgetEvents } from './components/ChatWidgetEvents';

import '../styles.css';

/**
 * Main ChatWidget class
 */
export class ChatWidget {
  /**
   * Create a new ChatWidget
   * @param {Object} options - Configuration options
   * @param {string} options.apiUrl - API endpoint for the chat service
   * @param {string} options.websiteId - Unique identifier for the website
   * @param {string} [options.primaryColor='#0066FF'] - Primary color for the chat widget
   * @param {string} [options.secondaryColor='#E8F1FF'] - Secondary color for the chat widget
   * @param {string} [options.companyName='پشتیبان میرزا'] - Company name displayed in the chat header
   * @param {'bottom-right'|'bottom-left'} [options.position='bottom-right'] - Position of the chat widget
   * @param {string} [options.initialMessage='سلام 😊 من میرزا چت هستم. چطور میتونم کمکتون کنم؟ 🤖'] - Initial message shown when chat is opened
   * @param {boolean} [options.debug=false] - Whether to show debug information
   */
  constructor(options) {
    // Define default options
    const defaultOptions = {
      companyName: 'پشتیبان میرزا',
      position: 'bottom-right',
      initialMessage: 'سلام 😊 من میرزا چت هستم. چطور میتونم کمکتون کنم؟ 🤖',
      primaryColor: '#0066FF',
      secondaryColor: '#E8F1FF',
      debug: false
    };
    
    // Merge options with defaults
    this.options = { ...defaultOptions, ...options };
    
    // Required options
    if (!this.options.apiUrl) {
      throw new Error('apiUrl is required');
    }
    if (!this.options.websiteId) {
      throw new Error('websiteId is required');
    }
    
    // Initialize state
    this.isOpen = false;
    this.isTyping = false;
    this.error = null;
    this.messages = [];
    this.isRatingUpdate = false;
    
    // Initialize DOM references
    this.containerEl = null;
    this.modalEl = null;
    this.toggleButtonEl = null;
    this.messageListEl = null;
    
    // Apply mixins first so all methods are available
    this.applyMixins();
    
    // Initialize managers now that methods from mixins are available
    this.initManagers();
    
    // Bind methods
    this.bindMethods();
  }

  /**
   * Initialize the widget
   */
  init() {
    // Create DOM elements
    this.createDomElements();
    
    // Initialize socket connection
    this.socketManager.init();
    
    // Check authentication state and set showAuthForm accordingly
    // Only authenticated users should see the chat interface
    this.showAuthForm = !this.authManager.isAuthenticated;
    
    // Run self-diagnostics with a slight delay to allow socket connection
    setTimeout(() => this.runSelfDiagnostics(), 3000);
    
    // Show debug info if enabled
    if (this.options.debug) {
      this.showDebugInfo();
    }
  }

  /**
   * Initialize managers
   */
  initManagers() {
    const config = {
      apiUrl: this.options.apiUrl,
      websiteId: this.options.websiteId
    };
    
    // Initialize socket manager
    this.socketManager = new SocketManager(config, {
      onAuthenticationResult: this.handleAuthenticationResult.bind(this),
      onMessageReceived: this.handleMessageReceived.bind(this),
      onChatHistoryReceived: this.handleChatHistoryReceived.bind(this),
      onTypingStatusChanged: this.handleTypingStatusChanged.bind(this),
      onMessageRated: this.handleMessageRated.bind(this),
      onHumanSupportRequested: this.handleHumanSupportRequested.bind(this),
      onLogoutSuccess: this.handleLogoutSuccess.bind(this),
      onSupportModeUpdate: this.handleSupportModeUpdate.bind(this),
      onError: this.handleError.bind(this)
    });
    
    // Initialize auth manager
    this.authManager = new AuthManager(
      config,
      this.socketManager,
      this.handleError.bind(this)
    );
    
    // Set showAuthForm flag based on authentication state
    // Default to showing auth form when not authenticated
    this.showAuthForm = !this.authManager.isAuthenticated;
    
    // Initialize support mode manager
    this.supportModeManager = new SupportModeManager(
      config,
      this.socketManager,
      this.handleError.bind(this),
      this.addSystemMessage.bind(this)
    );
  }

  /**
   * Bind methods
   */
  bindMethods() {
    this.handleToggleChat = this.handleToggleChat.bind(this);
    this.handleSendMessage = this.handleSendMessage.bind(this);
    this.handleInputKeyPress = this.handleInputKeyPress.bind(this);
    this.handleRateMessage = this.handleRateMessage.bind(this);
    this.handleRequestHumanSupport = this.handleRequestHumanSupport.bind(this);
    this.handleCancelHumanSupport = this.handleCancelHumanSupport.bind(this);
    this.handleReconnect = this.handleReconnect.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleSignup = this.handleSignup.bind(this);
    this.handleSwitchAuthMode = this.handleSwitchAuthMode.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.handleCloseChat = this.handleCloseChat.bind(this);
    
    // Throttled methods
    this.sendTypingStatus = throttle(this.sendTypingStatus.bind(this), 1000);
  }

  /**
   * Apply mixins from component classes
   */
  applyMixins() {
    // Copy methods from UI component
    Object.getOwnPropertyNames(ChatWidgetUI.prototype).forEach(name => {
      if (name !== 'constructor') {
        this[name] = ChatWidgetUI.prototype[name];
      }
    });
    
    // Copy methods from Messages component
    Object.getOwnPropertyNames(ChatWidgetMessages.prototype).forEach(name => {
      if (name !== 'constructor') {
        this[name] = ChatWidgetMessages.prototype[name];
      }
    });
    
    // Copy methods from Auth component
    Object.getOwnPropertyNames(ChatWidgetAuth.prototype).forEach(name => {
      if (name !== 'constructor') {
        this[name] = ChatWidgetAuth.prototype[name];
      }
    });
    
    // Copy methods from Support component
    Object.getOwnPropertyNames(ChatWidgetSupport.prototype).forEach(name => {
      if (name !== 'constructor') {
        this[name] = ChatWidgetSupport.prototype[name];
      }
    });
    
    // Copy methods from Events component
    Object.getOwnPropertyNames(ChatWidgetEvents.prototype).forEach(name => {
      if (name !== 'constructor') {
        this[name] = ChatWidgetEvents.prototype[name];
      }
    });
  }

  /**
   * Run self-diagnostics to check for common issues
   */
  runSelfDiagnostics() {
    console.log('[ChatWidget] Running self-diagnostics...');
    
    // Check socket connection
    const socketConnected = this.socketManager.socket && this.socketManager.socket.connected;
    console.log(`[ChatWidget] Socket connection: ${socketConnected ? 'Connected' : 'Disconnected'}`);
    
    // Check listeners
    if (this.socketManager.socket) {
      const authListeners = this.socketManager.socket.listeners('authentication_result').length;
      console.log(`[ChatWidget] Authentication listeners: ${authListeners}`);
      
      // List all event listeners
      const events = Object.keys(this.socketManager.socket._callbacks || {});
      console.log('[ChatWidget] Socket event listeners:', events);
      
      // Try to ping the server
      this.socketManager.socket.emit('ping', null, (err, response) => {
        if (err) {
          console.error('[ChatWidget] Diagnostic ping failed:', err);
        } else {
          console.log('[ChatWidget] Diagnostic ping successful:', response);
        }
      });
    }
    
    // Check API URL configuration
    console.log(`[ChatWidget] API URL: ${this.options.apiUrl}`);
    console.log(`[ChatWidget] Website ID: ${this.options.websiteId}`);
    
    // Verify auth state
    console.log(`[ChatWidget] Auth state:`, {
      isAuthenticated: this.authManager.isAuthenticated,
      isAuthenticating: this.authManager.isAuthenticating,
      isLoggingIn: this.authManager.isLoggingIn,
      userId: this.authManager.userId,
      loginRequired: this.authManager.loginRequired
    });
  }
}
