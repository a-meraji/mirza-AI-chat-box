import { io } from 'socket.io-client';
import { getAuthTokenKey, getUserIdKey, safeLocalStorageGet } from '../utils';

/**
 * Socket connection manager
 */
export class SocketManager {
  /**
   * Create a new SocketManager
   * @param {Object} config - Configuration object
   * @param {string} config.apiUrl - API URL
   * @param {string} config.websiteId - Website ID
   * @param {Object} handlers - Event handlers
   * @param {Function} handlers.onAuthenticationResult - Authentication result handler
   * @param {Function} handlers.onMessageReceived - Message received handler
   * @param {Function} handlers.onChatHistoryReceived - Chat history received handler
   * @param {Function} handlers.onTypingStatusChanged - Typing status changed handler
   * @param {Function} handlers.onMessageRated - Message rated handler
   * @param {Function} handlers.onHumanSupportRequested - Human support requested handler
   * @param {Function} handlers.onLogoutSuccess - Logout success handler
   * @param {Function} handlers.onSupportModeUpdate - Support mode update handler
   * @param {Function} handlers.onError - Error handler
   */
  constructor(config, handlers) {
    this.apiUrl = config.apiUrl;
    this.websiteId = config.websiteId;
    this.handlers = handlers;
    this.socket = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.reconnectTimer = null;
    this.isAuthenticated = false;
    this.token = null;
    this.userId = null;
    this.connectionStartTime = null;
    this.connectionTimeout = null;
    this.loginTimeout = null;
    this._messageTimeouts = null;
  }

  /**
   * Initialize the socket connection
   */
  init() {
    console.log('[SocketManager] Initializing socket connection to:', this.apiUrl);
    this.isConnecting = true;
    
    // Create socket instance with detailed debugging
    try {
      // Add a timestamp for tracking connection timing
      this.connectionStartTime = Date.now();
      
      console.log('[SocketManager] Creating socket with config:', {
        url: this.apiUrl,
        websiteId: this.websiteId,
        transports: ['websocket'],
        reconnection: true
      });
      
    this.socket = io(this.apiUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectInterval,
      query: {
        websiteId: this.websiteId
        },
        // Add debugging enabled
        debug: true
      });
      
      console.log('[SocketManager] Socket instance created:', this.socket ? 'Success' : 'Failed');
    } catch (error) {
      console.error('[SocketManager] Error creating socket:', error);
      this.handlers.onError('خطا در ایجاد اتصال به سرور. لطفاً صفحه را بارگذاری مجدد کنید.');
      return;
    }

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up socket event listeners
   */
  setupEventListeners() {
    if (!this.socket) {
      console.error('[SocketManager] Cannot setup listeners - socket not created');
      return;
    }

    console.log('[SocketManager] Setting up socket event listeners');

    // Connection events
    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('connect_error', this.handleConnectError.bind(this));
    this.socket.on('error', this.handleError.bind(this));

    // Add a debug listener for all events
    const originalOnevent = this.socket.onevent;
    this.socket.onevent = (packet) => {
      const args = packet.data || [];
      console.log(`[SocketManager] Received event: ${args[0]}`, args.slice(1));
      originalOnevent.call(this.socket, packet);
    };

    // Add a debug listener for all emitted events
    const originalEmit = this.socket.emit;
    this.socket.emit = (...args) => {
      console.log(`[SocketManager] Emitting event: ${args[0]}`, args.slice(1));
      return originalEmit.apply(this.socket, args);
    };

    // Chat events
    this.socket.on('message', this.handleMessage.bind(this));
    this.socket.on('chat_history', this.handleChatHistory.bind(this));
    this.socket.on('typing', this.handleTyping.bind(this));
    this.socket.on('rate_message_response', this.handleRateMessageResponse.bind(this));
    
    // Auth events
    this.socket.on('authentication_result', this.handleAuthenticationResult.bind(this));
    this.socket.on('logout_success', this.handleLogoutSuccess.bind(this));
    
    // Support events
    this.socket.on('human_support_requested', this.handleHumanSupportRequested.bind(this));
    this.socket.on('support_mode_update', this.handleSupportModeUpdate.bind(this));
    
    // Add explicit connection timeout
    this.connectionTimeout = setTimeout(() => {
      if (!this.socket.connected) {
        console.error('[SocketManager] Connection timeout after 10 seconds');
        this.handlers.onError('زمان اتصال به سرور به پایان رسید. لطفاً صفحه را بارگذاری مجدد کنید.');
      }
    }, 10000);
  }

  /**
   * Handle socket connect event
   */
  handleConnect() {
    const connectionTime = Date.now() - this.connectionStartTime;
    console.log(`[SocketManager] Socket connected after ${connectionTime}ms`);
    console.log(`[SocketManager] Socket ID: ${this.socket.id}`);
    console.log(`[SocketManager] Socket transport: ${this.socket.io.engine.transport.name}`);
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Clear any reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Check if we have auth credentials and attempt authentication
    const authAttempted = this.checkAndAttemptAuthentication();
    console.log(`[SocketManager] Authentication attempted on connect: ${authAttempted}`);
  }

  /**
   * Handle socket disconnect event
   * @param {string} reason - Disconnect reason
   */
  handleDisconnect(reason) {
    console.log(`[SocketManager] Socket disconnected: ${reason}`);
    this.isConnecting = false;
    
    // If we've reached max reconnect attempts, notify the user
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handlers.onError('اتصال به سرور قطع شد. لطفاً صفحه را رفرش کنید.');
    }
  }

  /**
   * Handle socket connect error
   * @param {Error} error - Connection error
   */
  handleConnectError(error) {
    console.error('[SocketManager] Socket connection error:', error);
    this.isConnecting = false;
    this.reconnectAttempts++;
    
    // If we've reached max reconnect attempts, notify the user
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handlers.onError('خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
    }
  }

  /**
   * Handle socket error
   * @param {Error} error - Socket error
   */
  handleError(error) {
    console.error('[SocketManager] Socket error:', error);
    this.handlers.onError('خطایی رخ داد. لطفاً دوباره تلاش کنید.');
  }

  /**
   * Handle incoming message
   * @param {Object} message - Message object
   */
  handleMessage(message) {
    console.log('[SocketManager] Message received:', message);
    
    // Clear any message timeouts since we received a response
    if (this._messageTimeouts && this._messageTimeouts.size > 0) {
      console.log('[SocketManager] Clearing message timeouts');
      // Clear all timeouts as we received a response
      this._messageTimeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
      this._messageTimeouts.clear();
    }
    
    this.handlers.onMessageReceived(message);
  }

  /**
   * Handle chat history
   * @param {Object|Array} data - Chat history data
   */
  handleChatHistory(data) {
    console.log('[SocketManager] Chat history received:', data);
    
    // Handle different response formats
    let messages = [];
    let chatInfo = {};
    
    if (Array.isArray(data)) {
      // If data is an array, it's the messages array
      messages = data;
      console.log('[SocketManager] Chat history is an array of messages');
    } else if (data && typeof data === 'object') {
      // If data is an object, extract messages and chatInfo
      messages = data.messages || [];
      chatInfo = data.chatInfo || {};
      console.log('[SocketManager] Chat history is an object with messages and chatInfo');
    }
    
    // Log each message's sender for debugging
    messages.forEach((msg, index) => {
      console.log(`[SocketManager] Message ${index} sender: "${msg.sender}" (${typeof msg.sender})`);
    });
    
    console.log(`[SocketManager] Processed ${messages.length} messages from chat history`);
    this.handlers.onChatHistoryReceived(messages, chatInfo);
  }

  /**
   * Handle typing status
   * @param {Object|boolean} data - Typing status data (can be a boolean or an object with isTyping property)
   */
  handleTyping(data) {
    console.log('[SocketManager] Typing status received:', data);
    
    // Handle both formats: direct boolean or object with isTyping property
    const isTyping = typeof data === 'boolean' ? data : (data && data.isTyping);
    
    console.log('[SocketManager] Processed typing status:', isTyping);
    this.handlers.onTypingStatusChanged(isTyping);
  }

  /**
   * Handle rate message response
   * @param {Object} response - Rate message response
   */
  handleRateMessageResponse(response) {
    console.log('[SocketManager] Rate message response:', response);
    this.handlers.onMessageRated(response);
  }

  /**
   * Handle authentication result
   * @param {Object} result - Authentication result
   */
  handleAuthenticationResult(result) {
    console.log('[SocketManager] Authentication result received:', result);
    
    if (result.success) {
      this.isAuthenticated = true;
      this.userId = result.userId;
      this.token = result.token;
      
      // Request chat history after successful authentication
      // Add a small delay to ensure the authentication is fully processed
      setTimeout(() => {
        console.log('[SocketManager] Requesting chat history after authentication');
        this.requestChatHistory();
      }, 500);
    } else {
      this.isAuthenticated = false;
      this.userId = null;
      this.token = null;
      console.error('[SocketManager] Authentication failed:', result.error || 'unknown error');
    }
    
    this.handlers.onAuthenticationResult(result);
  }

  /**
   * Handle logout success
   * @param {Object} response - Logout response
   */
  handleLogoutSuccess(response) {
    console.log('[SocketManager] Logout success:', response);
    
    if (response.success) {
      this.isAuthenticated = false;
      this.token = null;
      this.userId = null;
    }
    
    this.handlers.onLogoutSuccess(response);
  }

  /**
   * Handle human support requested
   * @param {Object} data - Human support data
   */
  handleHumanSupportRequested(data) {
    console.log('[SocketManager] Human support requested:', data);
    this.handlers.onHumanSupportRequested(data);
  }

  /**
   * Handle support mode update
   * @param {Object} data - Support mode data
   */
  handleSupportModeUpdate(data) {
    console.log('[SocketManager] Support mode update:', data);
    this.handlers.onSupportModeUpdate(data);
  }

  /**
   * Check if we have auth credentials and attempt authentication
   * @returns {boolean} Whether authentication was attempted
   */
  checkAndAttemptAuthentication() {
    if (!this.socket || !this.socket.connected) {
      console.log('[SocketManager] Cannot authenticate - socket not connected');
      return false;
    }
    
    // Check if we have token and userId in localStorage
    const token = safeLocalStorageGet(getAuthTokenKey(this.websiteId));
    const userId = safeLocalStorageGet(getUserIdKey(this.websiteId));
    
    if (token && userId) {
      console.log('[SocketManager] Found credentials in localStorage, attempting authentication');
      this.authenticate(token, userId);
      return true;
    }
    
    console.log('[SocketManager] No credentials found in localStorage');
    return false;
  }

  /**
   * Authenticate with the server
   * @param {string} token - Authentication token
   * @param {string} userId - User ID
   */
  authenticate(token, userId) {
    if (!this.socket || !this.socket.connected) {
      console.log('[SocketManager] Cannot authenticate - socket not connected');
      return;
    }
    
    console.log('[SocketManager] Authenticating with token and userId');
    this.token = token;
    this.userId = userId;
    
    this.socket.emit('authenticate', {
      token,
      userId,
      websiteId: this.websiteId
    });
  }

  /**
   * Request chat history from the server
   */
  requestChatHistory() {
    if (!this.socket || !this.socket.connected) {
      console.log('[SocketManager] Cannot request chat history - socket not connected');
      return;
    }
    
    console.log('[SocketManager] Requesting chat history');
    this.socket.emit('get_chat_history', {
      websiteId: this.websiteId,
      userId: this.userId || 'anonymous'
    });
  }

  /**
   * Send a message
   * @param {Object} message - Message object
   */
  sendMessage(message) {
    if (!this.socket || !this.socket.connected) {
      console.log('[SocketManager] Cannot send message - socket not connected');
      this.handlers.onError('اتصال به سرور برقرار نیست. لطفاً صفحه را رفرش کنید.');
      return;
    }
    
    console.log('[SocketManager] Sending message:', message);
    
    // Add a timeout to detect if the server doesn't respond
    const messageTimeout = setTimeout(() => {
      console.log('[SocketManager] Message response timeout');
      this.handlers.onError('پاسخی از سرور دریافت نشد. لطفاً دوباره تلاش کنید.');
    }, 30000); // 30 seconds timeout
    
    // Store the timeout in a map to clear it when we receive a response
    if (!this._messageTimeouts) {
      this._messageTimeouts = new Map();
    }
    this._messageTimeouts.set(message.id, messageTimeout);
    
    // Send the message
    this.socket.emit('message', message, (error) => {
      // Clear the timeout
      if (this._messageTimeouts && this._messageTimeouts.has(message.id)) {
        clearTimeout(this._messageTimeouts.get(message.id));
        this._messageTimeouts.delete(message.id);
      }
      
      // Handle error
      if (error) {
        console.error('[SocketManager] Error sending message:', error);
        this.handlers.onError('خطا در ارسال پیام. لطفاً دوباره تلاش کنید.');
      }
    });
  }

  /**
   * Send typing status
   * @param {boolean} isTyping - Whether the user is typing
   */
  sendTypingStatus(isTyping) {
    if (!this.socket || !this.socket.connected) return;
    
    this.socket.emit('typing', {
      isTyping,
      websiteId: this.websiteId,
      userId: this.userId || 'anonymous'
    });
  }

  /**
   * Rate a message
   * @param {string} messageId - Message ID
   * @param {'NONE'|'LIKE'|'DISLIKE'} rating - Rating
   */
  rateMessage(messageId, rating) {
    if (!this.socket || !this.socket.connected) {
      console.log('[SocketManager] Cannot rate message - socket not connected');
      this.handlers.onError('اتصال به سرور برقرار نیست. لطفاً صفحه را رفرش کنید.');
      return;
    }
    
    console.log(`[SocketManager] Rating message ${messageId} as ${rating}`);
    this.socket.emit('rate_message', {
      messageId,
      rating,
      websiteId: this.websiteId,
      userId: this.userId || 'anonymous'
    });
  }

  /**
   * Request human support
   */
  requestHumanSupport() {
    if (!this.socket || !this.socket.connected) {
      console.log('[SocketManager] Cannot request human support - socket not connected');
      this.handlers.onError('اتصال به سرور برقرار نیست. لطفاً صفحه را رفرش کنید.');
      return;
    }
    
    console.log('[SocketManager] Requesting human support');
    this.socket.emit('request_human_support', {
      websiteId: this.websiteId,
      userId: this.userId || 'anonymous'
    });
  }

  /**
   * Cancel human support
   */
  cancelHumanSupport() {
    if (!this.socket || !this.socket.connected) {
      console.log('[SocketManager] Cannot cancel human support - socket not connected');
      this.handlers.onError('اتصال به سرور برقرار نیست. لطفاً صفحه را رفرش کنید.');
      return;
    }
    
    console.log('[SocketManager] Canceling human support');
    this.socket.emit('cancel_human_support', {
      websiteId: this.websiteId,
      userId: this.userId || 'anonymous'
    });
  }

  /**
   * Login with credentials
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.phone - Phone number
   * @param {string} credentials.password - Password
   */
  login(credentials) {
    // Check socket connection first
    if (!this.socket) {
      console.error('[SocketManager] Socket not initialized for login');
      this.handlers.onError('خطا در اتصال به سرور. لطفاً صفحه را بارگذاری مجدد کنید.');
      this.handlers.onAuthenticationResult({ success: false, error: 'خطا در اتصال به سرور' });
      return;
    }

    if (!this.socket.connected) {
      console.error('[SocketManager] Socket not connected for login, attempting to reconnect');
      
      // Try to connect and then login
      this.socket.connect();
      
      // Wait for connection or timeout after 5 seconds
      let connectionTimeout = setTimeout(() => {
        console.error('[SocketManager] Socket connection timeout for login');
        this.handlers.onError('زمان اتصال به سرور به پایان رسید. لطفاً دوباره تلاش کنید.');
        this.handlers.onAuthenticationResult({ success: false, error: 'زمان اتصال به سرور به پایان رسید' });
      }, 5000);
      
      // When connected, try to login
      this.socket.once('connect', () => {
        clearTimeout(connectionTimeout);
        console.log('[SocketManager] Socket reconnected, attempting login');
        this.performLogin(credentials);
      });
      
      return;
    }
    
    // If already connected, login directly
    this.performLogin(credentials);
  }
  
  /**
   * Perform the actual login request
   * @private
   * @param {Object} credentials - Login credentials
   */
  performLogin(credentials) {
    console.log('[SocketManager] Sending login request with phone:', credentials.phone);
    
    // Clear any existing login timeout
    if (this.loginTimeout) {
      clearTimeout(this.loginTimeout);
    }
    
    // Add event listener for timeout
    this.loginTimeout = setTimeout(() => {
      console.error('[SocketManager] Login request timed out');
      this.handlers.onError('زمان پاسخ از سرور به پایان رسید. لطفاً دوباره تلاش کنید.');
      this.handlers.onAuthenticationResult({ success: false, error: 'زمان پاسخ از سرور به پایان رسید' });
      this.loginTimeout = null;
    }, 10000);
    
    // Add one-time listener for auth result to clear timeout
    this.socket.once('authentication_result', (result) => {
      console.log('[SocketManager] Got authentication_result in one-time listener:', result);
      if (this.loginTimeout) {
        clearTimeout(this.loginTimeout);
        this.loginTimeout = null;
      }
    });
    
    // Test server connection before sending login
    this.socket.emit('ping', null, (err, response) => {
      if (err) {
        console.error('[SocketManager] Ping failed before login:', err);
      } else {
        console.log('[SocketManager] Ping successful before login:', response);
      }
    });
    
    // First try to use HTTP login as fallback
    this.tryHttpLogin(credentials).catch(error => {
      console.log('[SocketManager] HTTP login fallback failed, trying socket login:', error);
      
      // If HTTP login fails, try socket login
      // Send the login request with proper payload structure
      const payload = {
      ...credentials,
      websiteId: this.websiteId
      };
      
      console.log('[SocketManager] Emitting login with payload:', payload);
      this.socket.emit('login', payload);
      
      // Double-check connection status after emit
      setTimeout(() => {
        console.log('[SocketManager] Socket status after login request:',
          this.socket ? {
            connected: this.socket.connected,
            id: this.socket.id,
            nsp: this.socket.nsp
          } : 'Socket destroyed');
      }, 500);
    });
  }
  
  /**
   * Try HTTP login as a fallback mechanism
   * @private
   * @param {Object} credentials - Login credentials
   * @returns {Promise} - Promise that resolves with login result
   */
  async tryHttpLogin(credentials) {
    try {
      console.log('[SocketManager] Attempting HTTP login fallback');
      
      // Create HTTP request to auth API
      const apiUrl = `${this.apiUrl}/api/auth/login`;
      console.log('[SocketManager] HTTP login URL:', apiUrl);
      
      // Create payload
      const payload = {
        ...credentials,
        websiteId: this.websiteId
      };
      
      // Use fetch API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      // Parse response
      const result = await response.json();
      console.log('[SocketManager] HTTP login result:', result);
      
      // Check if the response contains user and token (successful login)
      if (result.user && result.token) {
        console.log('[SocketManager] HTTP login successful, handling result');
        
        // Clear the login timeout since we got a successful response
        if (this.loginTimeout) {
          clearTimeout(this.loginTimeout);
          this.loginTimeout = null;
        }
        
        // Transform the result to match the expected format for handleAuthenticationResult
        const authResult = {
          success: true,
          userId: result.user.id,
          token: result.token,
          user: result.user
        };
        
        this.handleAuthenticationResult(authResult);
        
        // Request chat history after successful authentication
        this.requestChatHistory();
        
        return authResult;
      } else {
        console.error('[SocketManager] HTTP login failed:', result.error);
        throw new Error(result.error || 'HTTP login failed');
      }
    } catch (error) {
      console.error('[SocketManager] HTTP login error:', error);
      throw error;
    }
  }

  /**
   * Signup with credentials
   * @param {Object} credentials - Signup credentials
   * @param {string} credentials.phone - Phone number
   * @param {string} credentials.password - Password
   * @param {string} [credentials.email] - Email (optional)
   */
  signup(credentials) {
    // Check socket connection first
    if (!this.socket) {
      console.error('[SocketManager] Socket not initialized for signup');
      this.handlers.onError('خطا در اتصال به سرور. لطفاً صفحه را بارگذاری مجدد کنید.');
      this.handlers.onAuthenticationResult({ success: false, error: 'خطا در اتصال به سرور' });
      return;
    }

    if (!this.socket.connected) {
      console.error('[SocketManager] Socket not connected for signup, attempting to reconnect');
      
      // Try to connect and then signup
      this.socket.connect();
      
      // Wait for connection or timeout after 5 seconds
      let connectionTimeout = setTimeout(() => {
        console.error('[SocketManager] Socket connection timeout for signup');
        this.handlers.onError('زمان اتصال به سرور به پایان رسید. لطفاً دوباره تلاش کنید.');
        this.handlers.onAuthenticationResult({ success: false, error: 'زمان اتصال به سرور به پایان رسید' });
      }, 5000);
      
      // When connected, try to signup
      this.socket.once('connect', () => {
        clearTimeout(connectionTimeout);
        console.log('[SocketManager] Socket reconnected, attempting signup');
        this.performSignup(credentials);
      });
      
      return;
    }
    
    // If already connected, signup directly
    this.performSignup(credentials);
  }
  
  /**
   * Perform the actual signup request
   * @private
   * @param {Object} credentials - Signup credentials
   */
  performSignup(credentials) {
    console.log('[SocketManager] Sending signup request with credentials');
    
    // Add event listener for timeout
    const signupTimeout = setTimeout(() => {
      console.error('[SocketManager] Signup request timed out');
      this.handlers.onError('زمان پاسخ از سرور به پایان رسید. لطفاً دوباره تلاش کنید.');
      this.handlers.onAuthenticationResult({ success: false, error: 'زمان پاسخ از سرور به پایان رسید' });
    }, 10000);
    
    // Add one-time listener for auth result to clear timeout
    this.socket.once('authentication_result', () => {
      clearTimeout(signupTimeout);
    });
    
    // Send the signup request
    this.socket.emit('signup', {
      ...credentials,
      websiteId: this.websiteId
    });
  }

  /**
   * Logout
   */
  logout() {
    // Even if socket is not connected, we should still notify the handlers
    // to ensure the UI is updated properly
    if (!this.socket || !this.socket.connected) {
      console.log('[SocketManager] Socket not connected during logout, forcing logout success');
      this.isAuthenticated = false;
      this.token = null;
      this.userId = null;
      
      // Notify handlers of logout success even though we couldn't send to server
      this.handlers.onLogoutSuccess({ success: true });
      return;
    }
    
    // If not authenticated, still force a logout success
    if (!this.isAuthenticated || !this.token || !this.userId) {
      console.log('[SocketManager] Not authenticated during logout, forcing logout success');
      this.isAuthenticated = false;
      this.token = null;
      this.userId = null;
      
      // Notify handlers of logout success
      this.handlers.onLogoutSuccess({ success: true });
      return;
    }
    
    console.log('[SocketManager] Logging out');
    
    // Set a timeout to ensure logout success is called even if server doesn't respond
    const logoutTimeout = setTimeout(() => {
      console.log('[SocketManager] Logout request timed out, forcing logout success');
      this.isAuthenticated = false;
      this.token = null;
      this.userId = null;
      this.handlers.onLogoutSuccess({ success: true });
    }, 3000);
    
    // Add one-time listener for logout success to clear timeout
    this.socket.once('logout_success', () => {
      clearTimeout(logoutTimeout);
    });
    
    // Send logout request
    this.socket.emit('logout', {
      token: this.token,
      userId: this.userId,
      websiteId: this.websiteId
    });
  }

  /**
   * Reconnect the socket
   */
  reconnect() {
    console.log('[SocketManager] Manually reconnecting socket');
    
    if (this.socket) {
      // Disconnect and clean up existing socket
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }
    
    // Initialize a new socket connection
    this.init();
  }

  /**
   * Disconnect the socket
   */
  disconnect() {
    console.log('[SocketManager] Disconnecting socket');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }
    
    this.isConnecting = false;
    this.isAuthenticated = false;
    this.token = null;
    this.userId = null;
    
    // Clear any reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
} 