import { generateUUID } from '../../utils';

/**
 * Message-related methods for ChatWidget
 */
export class ChatWidgetMessages {
  /**
   * Add message to the chat
   * @param {Object} message - Message object
   */
  addMessage(message) {
    // Add message to state
    this.messages.push(message);
    
    // Update UI
    if (this.messageListEl) {
      const messageEl = this.createMessageElement(message);
      this.messageListEl.appendChild(messageEl);
      
      // Scroll to bottom
      this.scrollToBottom();
    }
  }

  /**
   * Add system message
   * @param {string} content - Message content
   */
  addSystemMessage(content) {
    const message = {
      id: generateUUID(),
      content,
      sender: 'system',
      createdAt: new Date().toISOString(),
      timestamp: new Date()
    };
    
    this.addMessage(message);
  }

  /**
   * Add initial message
   */
  addInitialMessage() {
    const message = {
      id: generateUUID(),
      content: this.options.initialMessage,
      sender: 'admin',
      createdAt: new Date().toISOString(),
      timestamp: new Date()
    };
    
    this.addMessage(message);
  }

  /**
   * Handle message received
   * @param {Object} message - Message object
   */
  handleMessageReceived(message) {
    // Make sure showAuthForm is set to false if user is authenticated
    if (this.authManager.isAuthenticated) {
      console.log('[ChatWidget] User is authenticated, ensuring auth form is hidden on message received');
      this.showAuthForm = false;
    } else if (typeof this.shouldShowAuthForm === 'function') {
      // Use the shouldShowAuthForm method if available
      this.showAuthForm = this.shouldShowAuthForm();
      console.log('[ChatWidget] Using shouldShowAuthForm method, result:', this.showAuthForm);
    }
    
    const processedMessage = {
      ...message,
      content: typeof message.content === 'object' 
        ? JSON.stringify(message.content) 
        : String(message.content)
    };
    
    // Check if message already exists
    const messageExists = this.messages.some(m => m.id === message.id);
    if (messageExists) {
      console.log('[ChatWidget] Ignoring duplicate message:', message.id);
      return;
    }
    
    // Hide typing indicator when a message is received
    console.log('[ChatWidget] Hiding typing indicator after receiving message');
    this.handleTypingStatusChanged(false);
    
    this.addMessage(processedMessage);
  }

  /**
   * Handle chat history received
   * @param {Array} history - Chat history
   * @param {Object} chatInfo - Chat info
   */
  handleChatHistoryReceived(history, chatInfo) {
    // If we received support mode info, update it
    if (chatInfo && chatInfo.supportMode) {
      const effectiveMode = chatInfo.supportMode === 'resolved' ? 'normal' : chatInfo.supportMode;
      this.supportModeManager.syncSupportModeWithStorage(effectiveMode);
    }
    
    // Make sure showAuthForm is set to false if user is authenticated
    if (this.authManager.isAuthenticated) {
      console.log('[ChatWidget] User is authenticated, ensuring auth form is hidden');
      this.showAuthForm = false;
    }
    
    // Only update messages if we received non-empty history
    if (history.length > 0) {
      console.log('[ChatWidget] Processing chat history:', history);
      
      // Process history and normalize sender field
      const processedHistory = history.map(msg => {
        // Normalize sender field to ensure consistent styling
        let normalizedSender = msg.sender;
        
        // Convert sender to lowercase for comparison
        const senderLower = (msg.sender || '').toLowerCase();
        
        // Map to expected sender values
        if (senderLower === 'user') {
          normalizedSender = 'user';
        } else if (senderLower === 'admin' || senderLower === 'bot' || senderLower === 'assistant') {
          normalizedSender = 'admin';
        } else if (senderLower === 'system') {
          normalizedSender = 'system';
        }
        
        // Debug log
        console.log(`[ChatWidget] Normalizing message sender from "${msg.sender}" to "${normalizedSender}"`);
        
        return {
          ...msg,
          sender: normalizedSender,
          content: typeof msg.content === 'object' 
            ? JSON.stringify(msg.content) 
            : String(msg.content)
        };
      });
      
      console.log('[ChatWidget] Processed history:', processedHistory);
      
      this.messages = processedHistory;
      
      // Update UI if message list exists
      if (this.messageListEl) {
        // Clear message list
        this.messageListEl.innerHTML = '';
        
        // Add messages
        processedHistory.forEach(message => {
          console.log(`[ChatWidget] Creating message element for history message:`, message);
          const messageEl = this.createMessageElement(message);
          this.messageListEl.appendChild(messageEl);
        });
        
        // Scroll to bottom
        this.scrollToBottom();
      }
    } else if (this.messages.length === 0 && this.options.initialMessage) {
      // If no messages and we have an initial message, show it
      this.addInitialMessage();
    }
  }

  /**
   * Handle message rating
   * @param {string} messageId - Message ID
   * @param {'NONE'|'LIKE'|'DISLIKE'} rating - Rating
   */
  handleRateMessage(messageId, rating) {
    // Update message in UI
    this.isRatingUpdate = true;
    
    // Update local state
    this.messages = this.messages.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    );
    
    // Update UI
    const ratingButtons = document.querySelectorAll(`#message-${messageId} .mirza-chat-message-rating-button`);
    if (ratingButtons.length) {
      // Like button
      ratingButtons[0].classList.toggle('active', rating === 'LIKE');
      
      // Dislike button
      ratingButtons[1].classList.toggle('active', rating === 'DISLIKE');
    }
    
    // Send rating to server
    this.socketManager.rateMessage(messageId, rating);
  }

  /**
   * Handle message rated
   * @param {Object} response - Rating response
   */
  handleMessageRated(response) {
    if (response.success && response.rating !== undefined) {
      // Update rating in UI - don't scroll
      this.isRatingUpdate = true;
      
      // Update local state
      this.messages = this.messages.map(msg => 
        msg.id === response.messageId ? { ...msg, rating: response.rating } : msg
      );
      
      // Update UI
      const ratingButtons = document.querySelectorAll(`#message-${response.messageId} .mirza-chat-message-rating-button`);
      if (ratingButtons.length) {
        // Like button
        ratingButtons[0].classList.toggle('active', response.rating === 'LIKE');
        
        // Dislike button
        ratingButtons[1].classList.toggle('active', response.rating === 'DISLIKE');
      }
    } else if (!response.success && response.error) {
      this.handleError(`خطا در ثبت امتیاز: ${response.error}`);
    }
  }

  /**
   * Handle typing status changed
   * @param {boolean} isTyping - Whether the other party is typing
   */
  handleTypingStatusChanged(isTyping) {
    // Convert to boolean to ensure consistent behavior
    isTyping = Boolean(isTyping);
    
    console.log(`[ChatWidget] Setting typing indicator to: ${isTyping}`);
    this.isTyping = isTyping;
    
    // Update UI
    if (this.messageListEl) {
      // Remove existing typing indicator
      const existingIndicator = this.messageListEl.querySelector('.mirza-chat-typing-indicator');
      if (existingIndicator) {
        console.log('[ChatWidget] Removing existing typing indicator');
        existingIndicator.parentNode.removeChild(existingIndicator);
      }
      
      // Add typing indicator if typing
      if (isTyping) {
        console.log('[ChatWidget] Adding typing indicator');
        const typingIndicatorEl = this.createTypingIndicator();
        this.messageListEl.appendChild(typingIndicatorEl);
        
        // Scroll to bottom
        this.scrollToBottom();
      }
    } else {
      console.warn('[ChatWidget] Message list element not found, cannot update typing indicator');
    }
  }

  /**
   * Send typing status
   * @param {boolean} isTyping - Whether the user is typing
   */
  sendTypingStatus(isTyping) {
    // Only send typing status to the server, don't update UI here
    this.socketManager.sendTypingStatus(isTyping);
  }

  /**
   * Handle send message
   * @param {string} messageText - Message text
   */
  handleSendMessage(messageText) {
    const text = messageText.trim();
    if (!text) return;
    
    // Get textarea element
    const textareaEl = document.querySelector('.mirza-chat-input');
    if (textareaEl) {
      // Clear textarea
      textareaEl.value = '';
      textareaEl.style.height = 'auto';
      
      // Stop sending typing status to server
      this.sendTypingStatus(false);
    }
    
    // Create message object
    const message = {
      id: generateUUID(),
      content: text,
      sender: 'user',
      createdAt: new Date().toISOString(),
      timestamp: new Date(),
      isFirstMessageAfterRegistration: this.authManager.isNewlyRegistered
    };
    
    // Add message to local state
    this.addMessage(message);
    
    // Check if we're in human support mode and ensure authentication state is preserved
    const isHumanSupportMode = this.supportModeManager && 
                              this.supportModeManager.supportMode === 'human_support';
    
    if (this.authManager && this.authManager.isAuthenticated) {
      console.log('[ChatWidgetMessages] User is authenticated, ensuring auth form is hidden');
      // Explicitly set showAuthForm to false to ensure the auth form doesn't appear
      this.showAuthForm = false;
    } else if (typeof this.shouldShowAuthForm === 'function') {
      // Use the shouldShowAuthForm method if available
      this.showAuthForm = this.shouldShowAuthForm();
      console.log('[ChatWidgetMessages] Using shouldShowAuthForm method, result:', this.showAuthForm);
    }
    
    // Send message to server
    this.socketManager.sendMessage(message);
    
    // Show typing indicator after sending a message
    console.log('[ChatWidgetMessages] Showing typing indicator after sending message');
    this.handleTypingStatusChanged(true);
    
    // Reset newly registered flag
    if (this.authManager.isNewlyRegistered) {
      this.authManager.isNewlyRegistered = false;
    }
  }

  /**
   * Scroll message list to bottom
   */
  scrollToBottom() {
    if (this.messageListEl && !this.isRatingUpdate) {
      this.messageListEl.scrollTop = this.messageListEl.scrollHeight;
    }
    
    // Reset isRatingUpdate flag
    this.isRatingUpdate = false;
  }
} 