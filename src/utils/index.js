/**
 * Generates a UUID (v4)
 * @returns {string} A UUID string
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Gets the localStorage key for storing support mode
 * @param {string} websiteId - The website ID
 * @returns {string} The localStorage key
 */
export function getSupportModeKey(websiteId) {
  return `mirza_support_mode_${websiteId}`;
}

/**
 * Gets the localStorage key for storing auth token
 * @param {string} websiteId - The website ID
 * @returns {string} The localStorage key
 */
export function getAuthTokenKey(websiteId) {
  return `mirza_auth_token_${websiteId}`;
}

/**
 * Gets the localStorage key for storing user ID
 * @param {string} websiteId - The website ID
 * @returns {string} The localStorage key
 */
export function getUserIdKey(websiteId) {
  return `mirza_user_id_${websiteId}`;
}

/**
 * Creates an HTML element with attributes and children
 * @param {string} tag - The HTML tag name
 * @param {Object} attributes - The attributes to set on the element
 * @param {Array|Node|string} children - The children to append to the element
 * @returns {HTMLElement} The created element
 */
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.entries(value).forEach(([styleKey, styleValue]) => {
        element.style[styleKey] = styleValue;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Append children
  if (Array.isArray(children)) {
    children.forEach(child => {
      if (child) {
        appendChild(element, child);
      }
    });
  } else if (children) {
    appendChild(element, children);
  }
  
  return element;
}

/**
 * Appends a child to an element
 * @param {HTMLElement} parent - The parent element
 * @param {Node|string} child - The child to append
 */
function appendChild(parent, child) {
  if (typeof child === 'string') {
    parent.appendChild(document.createTextNode(child));
  } else {
    parent.appendChild(child);
  }
}

/**
 * Creates a throttled function that only invokes the provided function at most once per specified interval
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} The throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Formats a date to a readable string
 * @param {string|Date} date - The date to format
 * @returns {string} The formatted date string
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Safely parses JSON
 * @param {string} str - The string to parse
 * @param {*} fallback - The fallback value if parsing fails
 * @returns {*} The parsed object or fallback
 */
export function safeJSONParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

/**
 * Checks if the browser supports localStorage
 * @returns {boolean} Whether localStorage is supported
 */
export function isLocalStorageSupported() {
  try {
    const testKey = 'test';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Safely stores a value in localStorage
 * @param {string} key - The key to store under
 * @param {*} value - The value to store
 * @returns {boolean} Whether the operation was successful
 */
export function safeLocalStorageSet(key, value) {
  if (!isLocalStorageSupported()) {
    return false;
  }
  
  try {
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value);
    }
    return true;
  } catch (e) {
    console.error('Error storing in localStorage:', e);
    return false;
  }
}

/**
 * Safely retrieves a value from localStorage
 * @param {string} key - The key to retrieve
 * @param {*} defaultValue - The default value if not found
 * @param {boolean} parseJSON - Whether to parse the value as JSON
 * @returns {*} The retrieved value or default
 */
export function safeLocalStorageGet(key, defaultValue = null, parseJSON = false) {
  if (!isLocalStorageSupported()) {
    return defaultValue;
  }
  
  try {
    const value = localStorage.getItem(key);
    if (value === null) {
      return defaultValue;
    }
    
    return parseJSON ? safeJSONParse(value, defaultValue) : value;
  } catch (e) {
    console.error('Error retrieving from localStorage:', e);
    return defaultValue;
  }
}

/**
 * Safely removes a value from localStorage
 * @param {string} key - The key to remove
 * @returns {boolean} Whether the operation was successful
 */
export function safeLocalStorageRemove(key) {
  if (!isLocalStorageSupported()) {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Error removing from localStorage:', e);
    return false;
  }
} 