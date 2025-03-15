/**
 * Support-related methods for ChatWidget
 */
export class ChatWidgetSupport {
  /**
   * Handle request human support
   */
  handleRequestHumanSupport() {
    this.supportModeManager.requestHumanSupport();
    
    // Update UI
    if (this.isOpen) {
      // Store authentication state before closing
      const isAuthenticated = this.authManager && this.authManager.isAuthenticated;
      console.log('[ChatWidgetSupport] Storing auth state before reopening chat:', isAuthenticated);
      
      this.closeChat();
      setTimeout(() => {
        // Ensure showAuthForm is set correctly based on authentication state
        if (isAuthenticated) {
          this.showAuthForm = false;
          console.log('[ChatWidgetSupport] User is authenticated, hiding auth form');
        } else if (typeof this.shouldShowAuthForm === 'function') {
          // Use the shouldShowAuthForm method if available
          this.showAuthForm = this.shouldShowAuthForm();
          console.log('[ChatWidgetSupport] Using shouldShowAuthForm method, result:', this.showAuthForm);
        }
        this.openChat();
      }, 300);
    }
  }

  /**
   * Handle cancel human support
   */
  handleCancelHumanSupport() {
    this.supportModeManager.cancelHumanSupport();
    
    // Update UI
    if (this.isOpen) {
      // Store authentication state before closing
      const isAuthenticated = this.authManager && this.authManager.isAuthenticated;
      console.log('[ChatWidgetSupport] Storing auth state before reopening chat:', isAuthenticated);
      
      this.closeChat();
      setTimeout(() => {
        // Ensure showAuthForm is set correctly based on authentication state
        if (isAuthenticated) {
          this.showAuthForm = false;
          console.log('[ChatWidgetSupport] User is authenticated, hiding auth form');
        } else if (typeof this.shouldShowAuthForm === 'function') {
          // Use the shouldShowAuthForm method if available
          this.showAuthForm = this.shouldShowAuthForm();
          console.log('[ChatWidgetSupport] Using shouldShowAuthForm method, result:', this.showAuthForm);
        }
        this.openChat();
      }, 300);
    }
  }

  /**
   * Handle human support requested
   * @param {Object} data - Human support data
   */
  handleHumanSupportRequested(data) {
    this.supportModeManager.handleHumanSupportRequested(data);
    
    // Update UI
    if (this.isOpen) {
      // Store authentication state before closing
      const isAuthenticated = this.authManager && this.authManager.isAuthenticated;
      console.log('[ChatWidgetSupport] Storing auth state before reopening chat:', isAuthenticated);
      
      this.closeChat();
      setTimeout(() => {
        // Ensure showAuthForm is set correctly based on authentication state
        if (isAuthenticated) {
          this.showAuthForm = false;
          console.log('[ChatWidgetSupport] User is authenticated, hiding auth form');
        } else if (typeof this.shouldShowAuthForm === 'function') {
          // Use the shouldShowAuthForm method if available
          this.showAuthForm = this.shouldShowAuthForm();
          console.log('[ChatWidgetSupport] Using shouldShowAuthForm method, result:', this.showAuthForm);
        }
        this.openChat();
      }, 300);
    }
  }

  /**
   * Handle support mode update
   * @param {Object} data - Support mode data
   */
  handleSupportModeUpdate(data) {
    this.supportModeManager.handleSupportModeUpdate(data);
    
    // Update UI
    if (this.isOpen) {
      // Store authentication state before closing
      const isAuthenticated = this.authManager && this.authManager.isAuthenticated;
      console.log('[ChatWidgetSupport] Storing auth state before reopening chat:', isAuthenticated);
      
      this.closeChat();
      setTimeout(() => {
        // Ensure showAuthForm is set correctly based on authentication state
        if (isAuthenticated) {
          this.showAuthForm = false;
          console.log('[ChatWidgetSupport] User is authenticated, hiding auth form');
        } else if (typeof this.shouldShowAuthForm === 'function') {
          // Use the shouldShowAuthForm method if available
          this.showAuthForm = this.shouldShowAuthForm();
          console.log('[ChatWidgetSupport] Using shouldShowAuthForm method, result:', this.showAuthForm);
        }
        this.openChat();
      }, 300);
    }
  }
} 