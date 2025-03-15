/**
 * Auth-related methods for ChatWidget
 */
export class ChatWidgetAuth {
  /**
   * Handle login
   * @param {string} phone - Phone number
   * @param {string} password - Password
   */
  handleLogin(phone, password) {
    console.log('[ChatWidget] Handling login for phone:', phone);
    
    // Clear previous errors
    this.error = null;
    
    // Set authenticating state
    this.authManager.isAuthenticating = true;
    
    // Call auth manager
    this.authManager.handleLogin({ phone, password });
  }

  /**
   * Handle signup
   * @param {string} phone - Phone number
   * @param {string} password - Password
   * @param {string} email - Email
   */
  handleSignup(phone, password, email) {
    console.log('[ChatWidget] Handling signup for phone:', phone);
    
    // Clear previous errors
    this.error = null;
    
    // Set authenticating state
    this.authManager.isAuthenticating = true;
    
    // Call auth manager
    this.authManager.handleSignup({ phone, password, email });
  }

  /**
   * Handle switch auth mode
   */
  handleSwitchAuthMode() {
    this.authManager.isLoggingIn = !this.authManager.isLoggingIn;
    this.error = null;
    
    // Keep showAuthForm as true to continue showing the auth form
    this.showAuthForm = true;
    
    // Update UI
    if (this.isOpen) {
      this.closeChat();
      setTimeout(() => this.openChat(), 300);
    }
  }

  /**
   * Handle authentication result
   * @param {Object} result - Authentication result
   */
  handleAuthenticationResult(result) {
    console.log('[ChatWidget] Authentication result:', result);
    
    // Save the error message if authentication failed
    if (!result.success && result.error) {
      this.error = result.error;
    } else {
      this.error = null;
    }
    
    // Call the auth manager to update its state
    this.authManager.handleAuthenticationResult(result);
    
    // If authentication succeeded, no longer show auth form
    if (result && result.success) {
      this.showAuthForm = false;
      
      // Show a welcome message
      const welcomeMessage = result.isNewUser 
        ? 'خوش آمدید! حساب کاربری شما با موفقیت ایجاد شد.' 
        : 'خوش آمدید! شما با موفقیت وارد شدید.';
      
      // Add as a system message if we're showing the chat
      if (!this.showAuthForm) {
        this.addSystemMessage(welcomeMessage);
      }
    }
    
    // Update UI
    if (this.isOpen) {
      // Instead of rebuilding the entire chat UI, just update the auth form if still showing
      if (this.showAuthForm) {
        // Get the current form element
        const currentForm = this.containerEl.querySelector('.mirza-chat-auth-form');
        if (currentForm) {
          // Replace it with a new auth form
          const newForm = this.createAuthForm();
          currentForm.parentNode.replaceChild(newForm, currentForm);
        }
      } else {
        // Rebuild the entire chat if we're transitioning from auth to chat
        this.closeChat();
        setTimeout(() => this.openChat(), 300);
      }
    }
  }

  /**
   * Handle logout
   */
  handleLogout() {
    // Call the auth manager to handle the logout
    this.authManager.handleLogout();
    
    // Force immediate UI update to show auth form
    this.showAuthForm = true;
    
    // Force immediate state update in case socket connection fails
    this.authManager.isAuthenticated = false;
    this.authManager.isLoggingIn = true;
    this.authManager.loginRequired = true;
    
    // Clear localStorage directly as a fallback
    try {
      const authTokenKey = `mirza_auth_token_${this.options.websiteId}`;
      const userIdKey = `mirza_user_id_${this.options.websiteId}`;
      localStorage.removeItem(authTokenKey);
      localStorage.removeItem(userIdKey);
    } catch (error) {
      console.error('[ChatWidget] Error clearing localStorage during logout:', error);
    }
    
    // Update UI immediately
    if (this.isOpen) {
      this.closeChat();
      setTimeout(() => this.openChat(), 300);
    }
  }

  /**
   * Handle logout success
   * @param {Object} response - Logout response
   */
  handleLogoutSuccess(response) {
    this.authManager.handleLogoutSuccess(response);
    
    // Show auth form after logout
    this.showAuthForm = true;
    
    // Update UI
    if (this.isOpen) {
      this.closeChat();
      setTimeout(() => this.openChat(), 300);
    }
  }
  
  /**
   * Check if auth form should be shown
   * @returns {boolean} Whether to show the auth form
   */
  shouldShowAuthForm() {
    // If user is already authenticated, don't show auth form
    if (this.authManager.isAuthenticated) {
      return false;
    }
    
    // If login is not required, don't show auth form
    if (!this.authManager.loginRequired) {
      return false;
    }
    
    // For unauthenticated users who require login, default to showing the auth form
    // Only respect the current showAuthForm state if it's explicitly set to false
    return this.showAuthForm !== false;
  }
} 