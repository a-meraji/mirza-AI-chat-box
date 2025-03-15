import { getSupportModeKey, safeLocalStorageGet, safeLocalStorageSet } from '../utils';

/**
 * Support mode manager
 */
export class SupportModeManager {
  /**
   * Create a new SupportModeManager
   * @param {Object} config - Configuration object
   * @param {string} config.websiteId - Website ID
   * @param {Object} socketManager - Socket manager instance
   * @param {Function} onError - Error handler
   * @param {Function} addSystemMessage - Function to add system messages
   */
  constructor(config, socketManager, onError, addSystemMessage) {
    this.websiteId = config.websiteId;
    this.socketManager = socketManager;
    this.onError = onError;
    this.addSystemMessage = addSystemMessage;
    this.supportMode = 'normal';
    this.isHumanSupportRequested = false;
    
    // Initialize support mode from localStorage
    this.initSupportMode();
  }

  /**
   * Initialize support mode from localStorage
   */
  initSupportMode() {
    const storageKey = getSupportModeKey(this.websiteId);
    const storedMode = safeLocalStorageGet(storageKey);
    
    if (storedMode) {
      console.log(`[SupportModeManager] Found support mode in localStorage: ${storedMode}`);
      
      // If the mode is 'resolved', treat it as 'normal' mode
      const effectiveMode = storedMode === 'resolved' ? 'normal' : storedMode;
      
      this.supportMode = effectiveMode;
      this.isHumanSupportRequested = effectiveMode === 'human_support';
    } else {
      console.log('[SupportModeManager] No support mode found in localStorage, using default: normal');
      this.supportMode = 'normal';
      this.isHumanSupportRequested = false;
    }
  }

  /**
   * Sync support mode with localStorage
   * @param {'normal'|'human_support'|'resolved'} mode - Support mode
   */
  syncSupportModeWithStorage(mode) {
    const effectiveMode = mode === 'resolved' ? 'normal' : mode;
    
    this.supportMode = effectiveMode;
    this.isHumanSupportRequested = effectiveMode === 'human_support';
    
    // Update localStorage
    const storageKey = getSupportModeKey(this.websiteId);
    safeLocalStorageSet(storageKey, effectiveMode);
    
    console.log(`[SupportModeManager] Synced support mode with localStorage: ${effectiveMode}`);
  }

  /**
   * Request human support
   */
  requestHumanSupport() {
    console.log('[SupportModeManager] Requesting human support');
    
    // Update local state
    this.supportMode = 'human_support';
    this.isHumanSupportRequested = true;
    
    // Update localStorage
    const storageKey = getSupportModeKey(this.websiteId);
    safeLocalStorageSet(storageKey, 'human_support');
    
    // Add system message
    this.addSystemMessage('درخواست شما برای صحبت با پشتیبان انسانی ثبت شد، لطفا منتظر بمانید...');
    
    // Send request to server
    this.socketManager.requestHumanSupport();
  }

  /**
   * Cancel human support
   */
  cancelHumanSupport() {
    console.log('[SupportModeManager] Canceling human support');
    
    // Update local state
    this.supportMode = 'normal';
    this.isHumanSupportRequested = false;
    
    // Update localStorage
    const storageKey = getSupportModeKey(this.websiteId);
    safeLocalStorageSet(storageKey, 'normal');
    
    // Add system message based on current support mode
    if (this.supportMode === 'resolved') {
      // If already resolved, just confirm return to AI chat
      this.addSystemMessage('شما به حالت گفتگو با هوش مصنوعی بازگشتید.');
    } else {
      // Otherwise show the standard cancellation message
      this.addSystemMessage('حالت پشتیبانی انسانی غیرفعال شد.');
    }
    
    // Send request to server
    this.socketManager.cancelHumanSupport();
  }

  /**
   * Handle support mode update
   * @param {Object} data - Support mode data
   * @param {'normal'|'human_support'|'resolved'} data.mode - Support mode
   * @param {string} data.chatId - Chat ID
   * @param {boolean} [data.silent] - Whether to update silently
   */
  handleSupportModeUpdate(data) {
    console.log('[SupportModeManager] Support mode update:', data);
    
    const { mode, silent } = data;
    
    // Update local state
    this.supportMode = mode;
    this.isHumanSupportRequested = mode === 'human_support';
    
    // Update localStorage
    const storageKey = getSupportModeKey(this.websiteId);
    safeLocalStorageSet(storageKey, mode);
    
    // Add system message if not silent
    if (!silent) {
      if (mode === 'human_support') {
        this.addSystemMessage('درخواست پشتیبانی انسانی شما پذیرفته شد. یکی از پشتیبان‌های ما به زودی به شما پاسخ خواهد داد.');
      } else if (mode === 'normal') {
        this.addSystemMessage('شما به حالت گفتگو با هوش مصنوعی بازگشتید.');
      } else if (mode === 'resolved') {
        this.addSystemMessage('گفتگوی شما با پشتیبان به پایان رسید. برای بازگشت به حالت گفتگو با هوش مصنوعی، دکمه «بازگشت به چت با هوش مصنوعی» را بزنید.');
      }
    }
  }
} 