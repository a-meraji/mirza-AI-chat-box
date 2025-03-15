import { createElement } from '../../utils';
import * as icons from '../../utils/icons';

/**
 * UI-related methods for ChatWidget
 */
export class ChatWidgetUI {
  /**
   * Create DOM elements
   */
  createDomElements() {
    // Create container
    this.containerEl = createElement('div', {
      className: `mirza-chat-container ${this.options.position}`
    });
    
    // Create toggle button
    this.toggleButtonEl = createElement('button', {
      className: 'mirza-chat-toggle-button',
      style: { backgroundColor: this.options.primaryColor },
      onClick: this.handleToggleChat
    });
    
    // Use innerHTML for SVG icons instead of textContent
    this.toggleButtonEl.innerHTML = icons.chatIcon();
    
    // Append toggle button to container
    this.containerEl.appendChild(this.toggleButtonEl);
    
    // Append container to body
    document.body.appendChild(this.containerEl);
  }

  /**
   * Create chat modal
   */
  createChatModal() {
    // Create modal
    this.modalEl = createElement('div', {
      className: 'mirza-chat-modal'
    });
    
    // Create header
    const headerEl = this.createChatHeader();
    
    // Double-check authentication state before deciding to show auth form
    // Default to showing auth form for unauthenticated users
    if (this.authManager.isAuthenticated) {
      this.showAuthForm = false;
    } else {
      // If not authenticated, always show auth form
      this.showAuthForm = true;
    }
    
    // Check if we need to show login form or chat content
    // Use shouldShowAuthForm method if available, otherwise fall back to showAuthForm property
    const shouldShowAuth = typeof this.shouldShowAuthForm === 'function' 
      ? this.shouldShowAuthForm() 
      : this.showAuthForm;
    
    if (shouldShowAuth) {
      // Create auth form
      const authFormEl = this.createAuthForm();
      this.modalEl.appendChild(headerEl);
      this.modalEl.appendChild(authFormEl);
    } else {
      // Create chat content
      const messageListEl = this.createMessageList();
      const humanSupportIndicatorEl = this.createHumanSupportIndicator();
      const inputContainerEl = this.createChatInput();
      
      this.modalEl.appendChild(headerEl);
      this.modalEl.appendChild(messageListEl);
      this.modalEl.appendChild(humanSupportIndicatorEl);
      this.modalEl.appendChild(inputContainerEl);
      
      // Show initial message
      if (this.messages.length === 0 && this.options.initialMessage) {
        this.addInitialMessage();
      }
    }
    
    // Add animation class
    this.modalEl.classList.add('show');
    
    // Append modal to container
    this.containerEl.appendChild(this.modalEl);
  }

  /**
   * Create chat header
   * @returns {HTMLElement} Header element
   */
  createChatHeader() {
    const headerEl = createElement('div', {
      className: 'mirza-chat-header',
      style: { backgroundColor: this.options.primaryColor }
    });
    
    const titleEl = createElement('div', {
      className: 'mirza-chat-header-title'
    }, this.options.companyName);
    
    const actionsEl = createElement('div', {
      className: 'mirza-chat-header-actions'
    });
    
    // Add logout button if authenticated
    if (this.authManager.isAuthenticated && !this.authManager.isLoggingOut) {
      const logoutButtonEl = createElement('button', {
        className: 'mirza-chat-header-button',
        onClick: this.handleLogout,
        title: 'خروج از حساب کاربری'
      });
      
      logoutButtonEl.innerHTML = icons.logoutIcon();
      actionsEl.appendChild(logoutButtonEl);
    }
    
    // Add close button
    const closeButtonEl = createElement('button', {
      className: 'mirza-chat-header-button',
      onClick: this.handleCloseChat,
      title: 'بستن'
    });
    
    closeButtonEl.innerHTML = icons.closeIcon();
    actionsEl.appendChild(closeButtonEl);
    headerEl.appendChild(titleEl);
    headerEl.appendChild(actionsEl);
    
    return headerEl;
  }

  /**
   * Create auth form
   * @returns {HTMLElement} Auth form element
   */
  createAuthForm() {
    const isLogin = this.authManager.isLoggingIn;
    const isAuthenticating = this.authManager.isAuthenticating;
    
    // Use an actual form element instead of a div
    const formEl = createElement('form', {
      className: 'mirza-chat-auth-form',
      onSubmit: (e) => {
        e.preventDefault(); // Prevent form submission
        
        // Get form values
        const phoneValue = e.target.querySelector('input[type="tel"]').value;
        const passwordValue = e.target.querySelector('input[type="password"]').value;
        const emailInput = e.target.querySelector('input[type="email"]');
        
        // Validate form
        if (!phoneValue || !passwordValue) {
          this.error = 'لطفاً شماره موبایل و رمز عبور را وارد کنید.';
          
          // Update error display without closing the chat
          const existingError = formEl.querySelector('.mirza-chat-error');
          if (existingError) {
            formEl.removeChild(existingError);
          }
          
          const errorEl = createElement('div', {
            className: 'mirza-chat-error'
          }, this.error);
          
          // Insert error before the submit button
          formEl.insertBefore(errorEl, formEl.querySelector('.mirza-chat-auth-form-button'));
          return;
        }
        
        // Clear previous errors
        this.error = null;
        
        // Update UI to show loading state
        const submitButton = formEl.querySelector('.mirza-chat-auth-form-button');
        submitButton.disabled = true;
        submitButton.textContent = 'در حال پردازش...';
        
        // Disable inputs
        formEl.querySelectorAll('input').forEach(input => {
          input.disabled = true;
        });
        
        // Handle login/signup
        if (isLogin) {
          this.handleLogin(phoneValue, passwordValue);
        } else {
          this.handleSignup(
            phoneValue,
            passwordValue,
            emailInput ? emailInput.value : ''
          );
        }
      }
    });
    
    // Form title
    const titleEl = createElement('div', {
      className: 'mirza-chat-auth-form-title'
    }, isLogin ? 'ورود به حساب کاربری' : 'ثبت نام');
    
    // Phone input - only set disabled if actually authenticating
    const phoneInputEl = createElement('input', {
      className: 'mirza-chat-auth-form-input',
      type: 'tel',
      placeholder: 'شماره موبایل',
      required: true,
      ...(isAuthenticating ? { disabled: true } : {})
    });
    
    // Password input - only set disabled if actually authenticating
    const passwordInputEl = createElement('input', {
      className: 'mirza-chat-auth-form-input',
      type: 'password',
      placeholder: 'رمز عبور',
      required: true,
      ...(isAuthenticating ? { disabled: true } : {})
    });
    
    // Email input (only for signup)
    let emailInputEl = null;
    if (!isLogin) {
      emailInputEl = createElement('input', {
        className: 'mirza-chat-auth-form-input',
        type: 'email',
        placeholder: 'ایمیل (اختیاری)',
        ...(isAuthenticating ? { disabled: true } : {})
      });
    }
    
    // Error message
    let errorEl = null;
    if (this.error) {
      errorEl = createElement('div', {
        className: 'mirza-chat-error'
      }, this.error);
    }
    
    // Submit button
    const submitButtonEl = createElement('button', {
      className: 'mirza-chat-auth-form-button',
      style: { backgroundColor: this.options.primaryColor },
      type: 'submit',
      ...(isAuthenticating ? { disabled: true } : {})
    }, isAuthenticating ? 'در حال پردازش...' : (isLogin ? 'ورود' : 'ثبت نام'));
    
    // Switch mode
    const switchEl = createElement('div', {
      className: 'mirza-chat-auth-form-switch'
    }, [
      isLogin ? 'حساب کاربری ندارید؟ ' : 'قبلاً ثبت نام کرده‌اید؟ ',
      createElement('button', {
        className: 'mirza-chat-auth-form-switch-button',
        onClick: (e) => {
          e.preventDefault(); // Prevent form submission
          this.handleSwitchAuthMode();
        },
        type: 'button' // Ensure it doesn't submit the form
      }, isLogin ? 'ثبت نام کنید' : 'وارد شوید')
    ]);
    
    // Append all elements to form
    formEl.appendChild(titleEl);
    formEl.appendChild(phoneInputEl);
    formEl.appendChild(passwordInputEl);
    if (emailInputEl) {
      formEl.appendChild(emailInputEl);
    }
    if (errorEl) {
      formEl.appendChild(errorEl);
    }
    formEl.appendChild(submitButtonEl);
    formEl.appendChild(switchEl);
    
    return formEl;
  }

  /**
   * Create message list
   * @returns {HTMLElement} Message list element
   */
  createMessageList() {
    const listEl = createElement('div', {
      className: 'mirza-chat-message-list'
    });
    
    // Store reference to message list
    this.messageListEl = listEl;
    
    // Add existing messages
    this.messages.forEach(message => {
      const messageEl = this.createMessageElement(message);
      listEl.appendChild(messageEl);
    });
    
    // Add typing indicator if needed
    if (this.isTyping) {
      const typingIndicatorEl = this.createTypingIndicator();
      listEl.appendChild(typingIndicatorEl);
    }
    
    // Add error message if needed
    if (this.error) {
      const errorEl = createElement('div', {
        className: 'mirza-chat-error'
      }, this.error);
      listEl.appendChild(errorEl);
    }
    
    // Add connecting message if needed
    if (this.socketManager.isConnecting) {
      const connectingEl = createElement('div', {
        className: 'mirza-chat-message system'
      }, 'در حال اتصال به سرور...');
      listEl.appendChild(connectingEl);
    }
    
    return listEl;
  }

  /**
   * Create a message element
   * @param {Object} message - Message object
   * @returns {HTMLElement} Message element
   */
  createMessageElement(message) {
    // Create wrapper div with inline styles
    const messageWrapper = createElement('div', {
      className: `mirza-chat-message-wrapper ${message.sender}`,
      style: {
        marginBottom: '12px',
        display: 'flex',
        width: '100%',
        justifyContent: message.sender === 'user' ? 'flex-end' : 
                        message.sender === 'admin' ? 'flex-start' : 'center',
        flexDirection: message.sender === 'admin' ? 'column' : 'row',
        alignItems: message.sender === 'admin' ? 'flex-start' : 'center'
      }
    });

    // Create message element with inline styles
    const messageEl = createElement('div', {
      className: `mirza-chat-message ${message.sender}`,
      id: `message-${message.id}`,
      style: {
        maxWidth: '80%',
        padding: '10px 14px',
        borderRadius: '12px',
        position: 'relative',
        wordWrap: 'break-word',
        fontSize: '0.95rem',
        lineHeight: '1.4',
        backgroundColor: message.sender === 'user' ? '#0066FF' : 
                         message.sender === 'admin' ? '#E8F1FF' : '#f8f9fa',
        color: message.sender === 'user' ? 'white' : 
               message.sender === 'admin' ? '#333' : '#6c757d',
        borderBottomRightRadius: message.sender === 'user' ? '4px' : '12px',
        borderBottomLeftRadius: message.sender === 'admin' ? '4px' : '12px',
        border: message.sender === 'system' ? '1px dashed #dee2e6' : 'none',
        fontStyle: message.sender === 'system' ? 'italic' : 'normal',
        alignSelf: message.sender === 'user' ? 'flex-end' : 
                   message.sender === 'admin' ? 'flex-start' : 'center'
      }
    });
    
    // Add message content
    const contentEl = createElement('div', {
      className: 'mirza-chat-message-content',
      style: {
        wordBreak: 'break-word',
        display: 'inline-block',
        width: '100%'
      }
    }, message.content);
    
    messageEl.appendChild(contentEl);
    messageWrapper.appendChild(messageEl);
    
    // Add rating buttons for admin messages
    if (message.sender === 'admin') {
      const messageControls = createElement('div', {
        className: 'mirza-chat-message-controls',
        style: {
          display: 'flex',
          gap: '8px',
          marginTop: '4px',
          alignItems: 'center',
          width: '100%',
          justifyContent: 'space-between'
        }
      });
      
      const ratingEl = createElement('div', {
        className: 'mirza-chat-message-rating',
        style: {
          display: 'flex',
          gap: '8px',
          marginTop: '4px',
          justifyContent: 'flex-start',
          direction: 'ltr',
          width: '100%',
          paddingLeft: '12px',
          position: 'relative',
          alignItems: 'center'
        }
      });
      
      // Like button
      const likeButtonEl = createElement('button', {
        className: `mirza-chat-message-rating-button ${message.rating === 'LIKE' ? 'active' : ''}`,
        onClick: () => this.handleRateMessage(message.id, message.rating === 'LIKE' ? 'NONE' : 'LIKE'),
        title: 'پاسخ مفید بود',
        style: {
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          opacity: message.rating === 'LIKE' ? '1' : '0.7',
          transition: 'opacity 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      });
      
      likeButtonEl.innerHTML = icons.likeIcon();
      
      // Dislike button
      const dislikeButtonEl = createElement('button', {
        className: `mirza-chat-message-rating-button ${message.rating === 'DISLIKE' ? 'active' : ''}`,
        onClick: () => this.handleRateMessage(message.id, message.rating === 'DISLIKE' ? 'NONE' : 'DISLIKE'),
        title: 'پاسخ مفید نبود',
        style: {
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          opacity: message.rating === 'DISLIKE' ? '1' : '0.7',
          transition: 'opacity 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      });
      
      dislikeButtonEl.innerHTML = icons.dislikeIcon();
      
      ratingEl.appendChild(likeButtonEl);
      ratingEl.appendChild(dislikeButtonEl);
      messageControls.appendChild(ratingEl);
      
      // Add human support request button only if this is the last admin message
      // Check if this message is the last admin message in the messages array
      const isLastAdminMessage = this.messages
        .filter(msg => msg.sender === 'admin')
        .slice(-1)[0]?.id === message.id;
      
      if (this.supportModeManager.supportMode === 'normal' && 
          !this.supportModeManager.isHumanSupportRequested && 
          isLastAdminMessage) {
        
        const supportButtonEl = createElement('button', {
          className: 'mirza-chat-small-support-button',
          onClick: this.handleRequestHumanSupport,
          title: 'درخواست پشتیبان انسانی',
          style: {
            position: 'relative',
            right: 'auto',
            top: 'auto',
            display: 'flex',
            whiteSpace: 'nowrap',
            alignItems: 'center',
            justifyContent: 'center',
            height: '28px',
            backgroundColor: 'rgb(103, 183, 247)',
            borderRadius: '14px',
            color: 'rgb(255, 255, 255)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '400',
            padding: '0 10px',
            marginLeft: '8px',
            transition: 'transform 0.2s, box-shadow 0.2s',
            zIndex: '5',
            border: 'none'
          }
        });
        
        supportButtonEl.innerHTML = `<span style="margin-right: 5px;">درخواست پشتیبان انسانی</span> ${icons.userIcon()}`;
        messageControls.appendChild(supportButtonEl);
      }
      
      messageWrapper.appendChild(messageControls);
    }
    
    return messageWrapper;
  }

  /**
   * Create typing indicator
   * @returns {HTMLElement} Typing indicator element
   */
  createTypingIndicator() {
    const indicatorWrapper = createElement('div', {
      className: 'mirza-chat-typing-indicator',
      style: {
        display: 'flex',
        gap: '4px',
        padding: '12px',
        marginBottom: '12px',
        alignSelf: 'flex-start',
        backgroundColor: '#f0f0f0',
        borderRadius: '12px',
        position: 'relative',
        zIndex: '5'
      }
    });
    
    // Create three dots
    for (let i = 0; i < 3; i++) {
      const dot = createElement('div', {
        className: 'mirza-chat-typing-dot',
        style: {
          width: '10px',
          height: '10px',
          backgroundColor: '#999',
          borderRadius: '50%',
          animation: 'bounce 1.4s infinite ease-in-out',
          animationDelay: i === 0 ? '-0.32s' : i === 1 ? '-0.16s' : '0s',
          opacity: '0.8'
        }
      });
      
      indicatorWrapper.appendChild(dot);
    }
    
    return indicatorWrapper;
  }

  /**
   * Create human support indicator
   * @returns {HTMLElement} Human support indicator element
   */
  createHumanSupportIndicator() {
    const supportMode = this.supportModeManager.supportMode;
    const isHumanSupportRequested = this.supportModeManager.isHumanSupportRequested;
    
    if (supportMode === 'normal' && !isHumanSupportRequested) {
      // Return empty div if not in human support mode
      return createElement('div', { style: { display: 'none' } });
    }
    
    // Create class for clickable indicator based on mode
    const indicatorClass = supportMode === 'resolved' ? 
      'mirza-chat-human-support-indicator clickableIndicator' : 
      'mirza-chat-human-support-indicator';
    
    const indicatorEl = createElement('div', {
      className: indicatorClass
    });
    
    // Text based on mode
    let text = '';
    if (supportMode === 'human_support') {
      text = 'در حال گفتگو با پشتیبان';
    } else if (supportMode === 'resolved') {
      text = 'گفتگو با پشتیبان به پایان رسیده است';
    } else if (isHumanSupportRequested) {
      text = 'درخواست پشتیبان انسانی ثبت شد';
    }
    
    const textEl = createElement('div', {
      className: 'mirza-chat-human-support-indicator-text'
    }, text);
    
    // Button
    let buttonText = '';
    if (supportMode === 'human_support') {
      buttonText = 'لغو پشتیبانی انسانی';
    } else if (supportMode === 'resolved') {
      buttonText = 'بازگشت به چت با هوش مصنوعی';
    } else if (isHumanSupportRequested) {
      buttonText = 'لغو درخواست';
    }
    
    const buttonEl = createElement('button', {
      className: 'mirza-chat-human-support-indicator-button',
      onClick: this.handleCancelHumanSupport
    }, buttonText);
    
    indicatorEl.appendChild(textEl);
    indicatorEl.appendChild(buttonEl);
    
    return indicatorEl;
  }

  /**
   * Create chat input
   * @returns {HTMLElement} Chat input element
   */
  createChatInput() {
    const inputContainerEl = createElement('div', {
      className: 'mirza-chat-input-container'
    });
    
    // Textarea for input
    const textareaEl = createElement('textarea', {
      className: 'mirza-chat-input',
      placeholder: 'پیام خود را بنویسید...',
      rows: 1,
      onInput: (e) => {
        // Auto-resize textarea
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
        
        // We no longer update typing status on input
        // The typing indicator will be shown after sending a message
      },
      onKeyDown: this.handleInputKeyPress
    });
    
    // Send button
    const sendButtonEl = createElement('button', {
      className: 'mirza-chat-send-button',
      style: { backgroundColor: this.options.primaryColor },
      onClick: () => this.handleSendMessage(textareaEl.value)
    });
    
    sendButtonEl.innerHTML = icons.sendIcon();
    
    // Add human support button if not already in human support mode
    let humanSupportButtonEl = null;
    if (this.supportModeManager.supportMode === 'normal' && !this.supportModeManager.isHumanSupportRequested) {
      humanSupportButtonEl = createElement('button', {
        className: 'mirza-chat-human-support-button',
        title: 'درخواست پشتیبان انسانی',
        onClick: this.handleRequestHumanSupport
      });
      
      humanSupportButtonEl.innerHTML = icons.userIcon();
    }
    
    // Append elements to container
    inputContainerEl.appendChild(textareaEl);
    if (humanSupportButtonEl) {
      inputContainerEl.appendChild(humanSupportButtonEl);
    }
    inputContainerEl.appendChild(sendButtonEl);
    
    return inputContainerEl;
  }
} 