import { getAuthTokenKey, getUserIdKey, safeLocalStorageSet, safeLocalStorageRemove, safeLocalStorageGet } from '../utils';

/**
 * Authentication manager
 */
export class AuthManager {
  /**
   * Create a new AuthManager
   * @param {Object} config - Configuration object
   * @param {string} config.websiteId - Website ID
   * @param {Object} socketManager - Socket manager instance
   * @param {Function} onError - Error handler
   */
  constructor(config, socketManager, onError) {
    this.websiteId = config.websiteId;
    this.socketManager = socketManager;
    this.onError = onError;
    this.token = null;
    this.userId = null;
    this.isAuthenticated = false;
    this.isAuthenticating = false;
    this.isLoggingIn = true;
    this.isLoggingOut = false;
    this.isNewlyRegistered = false;
    this.loginRequired = true;
    
    // Check for existing token on initialization
    this.checkExistingAuth();
  }

  /**
   * Check for existing authentication in localStorage
   */
  checkExistingAuth() {
    try {
      // Check if user has explicitly logged out in this session
      const hasLoggedOut = safeLocalStorageGet(`mirza_logged_out_${this.websiteId}`, false);
      
      if (hasLoggedOut) {
        console.log('[AuthManager] User has explicitly logged out, not restoring auth state');
        // Clear any remaining auth data to be safe
        safeLocalStorageRemove(getAuthTokenKey(this.websiteId));
        safeLocalStorageRemove(getUserIdKey(this.websiteId));
        return;
      }
      
      const token = safeLocalStorageGet(getAuthTokenKey(this.websiteId));
      const userId = safeLocalStorageGet(getUserIdKey(this.websiteId));
      
      if (token && userId) {
        // Validate token format (simple check)
        if (typeof token !== 'string' || token.length < 10) {
          console.log('[AuthManager] Invalid token format, clearing auth data');
          safeLocalStorageRemove(getAuthTokenKey(this.websiteId));
          safeLocalStorageRemove(getUserIdKey(this.websiteId));
          return;
        }
        
        this.token = token;
        this.userId = userId;
        this.isAuthenticated = true;
        this.isLoggingIn = false;
        this.loginRequired = false;
        console.log('[AuthManager] Found existing authentication, userId:', userId);
      }
    } catch (error) {
      console.error('[AuthManager] Error checking existing auth:', error);
      // Clear auth data on error to be safe
      safeLocalStorageRemove(getAuthTokenKey(this.websiteId));
      safeLocalStorageRemove(getUserIdKey(this.websiteId));
    }
  }

  /**
   * Handle login
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.phone - Phone number
   * @param {string} credentials.password - Password
   */
  handleLogin(credentials) {
    // Validate input
    if (!credentials.phone || !credentials.password) {
      this.onError('لطفاً شماره موبایل و رمز عبور را وارد کنید.');
      this.isAuthenticating = false;
      return;
    }
    
    // Set authenticating state
    this.isAuthenticating = true;
    
    // Log for debugging
    console.log('[AuthManager] Attempting login with phone:', credentials.phone);
    
    // Send login request
    this.socketManager.login(credentials);
  }

  /**
   * Handle signup
   * @param {Object} credentials - Signup credentials
   * @param {string} credentials.phone - Phone number
   * @param {string} credentials.password - Password
   * @param {string} [credentials.email] - Email (optional)
   */
  handleSignup(credentials) {
    // Validate input
    if (!credentials.phone || !credentials.password) {
      this.onError('لطفاً شماره موبایل و رمز عبور را وارد کنید.');
      this.isAuthenticating = false;
      return;
    }
    
    // Set authenticating state
    this.isAuthenticating = true;
    
    // Log for debugging
    console.log('[AuthManager] Attempting signup with phone:', credentials.phone);
    
    // Send signup request
    this.socketManager.signup(credentials);
  }

  /**
   * Handle logout
   */
  handleLogout() {
    this.isLoggingOut = true;
    
    // Set flag to indicate user has explicitly logged out
    try {
      safeLocalStorageSet(`mirza_logged_out_${this.websiteId}`, true);
      console.log('[AuthManager] Set logged out flag');
    } catch (error) {
      console.error('[AuthManager] Error setting logged out flag:', error);
    }
    
    // Immediately clear local storage as a fallback
    try {
      const authTokenKey = getAuthTokenKey(this.websiteId);
      const userIdKey = getUserIdKey(this.websiteId);
      safeLocalStorageRemove(authTokenKey);
      safeLocalStorageRemove(userIdKey);
      console.log('[AuthManager] Cleared local storage during logout');
    } catch (error) {
      console.error('[AuthManager] Error clearing local storage during logout:', error);
    }
    
    // Call socket manager to handle the logout
    this.socketManager.logout();
  }

  /**
   * Handle authentication result
   * @param {Object} result - Authentication result
   * @param {boolean} result.success - Whether authentication was successful
   * @param {string} [result.userId] - User ID (if successful)
   * @param {string} [result.token] - Authentication token (if successful)
   * @param {string} [result.error] - Error message (if unsuccessful)
   * @param {boolean} [result.isNewUser] - Whether this is a new user
   */
  handleAuthenticationResult(result) {
    console.log('[AuthManager] Authentication result:', result);
    
    // Always reset authenticating state
    this.isAuthenticating = false;
    
    if (result.success) {
      this.token = result.token;
      this.userId = result.userId;
      this.isAuthenticated = true;
      this.isLoggingIn = false;
      this.isNewlyRegistered = !!result.isNewUser;
      this.loginRequired = false;
      
      // Store token and userId in localStorage
      safeLocalStorageSet(getAuthTokenKey(this.websiteId), result.token);
      safeLocalStorageSet(getUserIdKey(this.websiteId), result.userId);
      
      // Clear the logged out flag since user is now logged in
      try {
        safeLocalStorageRemove(`mirza_logged_out_${this.websiteId}`);
        console.log('[AuthManager] Cleared logged out flag after successful login');
      } catch (error) {
        console.error('[AuthManager] Error clearing logged out flag:', error);
      }
      
      console.log('[AuthManager] Authentication successful, userId:', result.userId);
    } else {
      this.token = null;
      this.userId = null;
      this.isAuthenticated = false;
      this.loginRequired = true;
      
      if (result.error) {
        this.onError(result.error);
        console.log('[AuthManager] Authentication failed with error:', result.error);
      } else {
        this.onError('خطا در احراز هویت. لطفاً دوباره تلاش کنید.');
        console.log('[AuthManager] Authentication failed with unknown error');
      }
    }
  }

  /**
   * Handle logout success
   * @param {Object} response - Logout response
   * @param {boolean} response.success - Whether logout was successful
   */
  handleLogoutSuccess(response) {
    this.isLoggingOut = false;
    
    if (response.success) {
      this.token = null;
      this.userId = null;
      this.isAuthenticated = false;
      this.isLoggingIn = true;
      this.loginRequired = true;
      
      // Remove token and userId from localStorage
      safeLocalStorageRemove(getAuthTokenKey(this.websiteId));
      safeLocalStorageRemove(getUserIdKey(this.websiteId));
      
      // Ensure the logged out flag is set
      try {
        safeLocalStorageSet(`mirza_logged_out_${this.websiteId}`, true);
        console.log('[AuthManager] Set logged out flag in handleLogoutSuccess');
      } catch (error) {
        console.error('[AuthManager] Error setting logged out flag in handleLogoutSuccess:', error);
      }
      
      console.log('[AuthManager] Logout successful');
    } else {
      this.onError('خطا در خروج از حساب کاربری. لطفاً دوباره تلاش کنید.');
      console.log('[AuthManager] Logout failed');
    }
  }
} 