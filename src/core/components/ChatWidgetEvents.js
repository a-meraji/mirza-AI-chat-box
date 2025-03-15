import { createElement } from '../../utils';

/**
 * Event-related methods for ChatWidget
 */
export class ChatWidgetEvents {
  /**
   * Handle toggle chat
   */
  handleToggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      // Double-check authentication state
      if (this.authManager.isAuthenticated) {
        console.log('[ChatWidget] User is authenticated, ensuring auth form is hidden in handleToggleChat');
        this.showAuthForm = false;
      } else {
        // Use shouldShowAuthForm method if available, otherwise fall back to default logic
        if (typeof this.shouldShowAuthForm === 'function') {
          this.showAuthForm = this.shouldShowAuthForm();
        } else {
          // Check if authentication is required and user is not authenticated
          this.showAuthForm = this.authManager.loginRequired && !this.authManager.isAuthenticated;
        }
        console.log(`[ChatWidget] Setting showAuthForm to ${this.showAuthForm} in handleToggleChat`);
      }
      
      this.openChat();
    }
  }

  /**
   * Open chat
   */
  openChat() {
    this.isOpen = true;
    this.createChatModal();
    
    // Add a small delay to ensure the modal is fully rendered before scrolling
    setTimeout(() => {
      // Scroll to bottom if we have messages
      if (this.messageListEl && this.messages.length > 0) {
        console.log('[ChatWidget] Scrolling to bottom after opening chat');
        this.scrollToBottom();
      }
    }, 100);
  }

  /**
   * Close chat
   */
  closeChat() {
    if (!this.modalEl) return;
    
    this.isOpen = false;
    
    // Add hide animation
    this.modalEl.classList.remove('show');
    this.modalEl.classList.add('hide');
    
    // Remove modal after animation
    setTimeout(() => {
      if (this.modalEl && this.modalEl.parentNode) {
        this.modalEl.parentNode.removeChild(this.modalEl);
        this.modalEl = null;
      }
    }, 300);
  }

  /**
   * Handle close chat
   */
  handleCloseChat() {
    this.closeChat();
  }

  /**
   * Handle input key press
   * @param {Event} e - Keyboard event
   */
  handleInputKeyPress(e) {
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSendMessage(e.target.value);
    }
  }

  /**
   * Handle reconnect
   */
  handleReconnect() {
    this.socketManager.reconnect();
  }

  /**
   * Handle error
   * @param {string} error - Error message
   */
  handleError(error) {
    this.error = error;
    
    // Hide typing indicator when an error occurs
    this.handleTypingStatusChanged(false);
    
    // Show error in UI
    if (this.messageListEl) {
      // Remove existing error
      const existingError = this.messageListEl.querySelector('.mirza-chat-error');
      if (existingError) {
        existingError.parentNode.removeChild(existingError);
      }
      
      // Add error
      if (error) {
        const errorEl = createElement('div', {
          className: 'mirza-chat-error'
        }, error);
        this.messageListEl.appendChild(errorEl);
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
          if (this.error === error) {
            this.error = null;
            if (errorEl.parentNode) {
              errorEl.parentNode.removeChild(errorEl);
            }
          }
        }, 5000);
      }
    }
  }
} 