/**
 * @typedef {Object} ChatMessage
 * @property {string} id - Unique identifier for the message
 * @property {string} content - Message content
 * @property {'user'|'admin'|'system'} sender - Message sender
 * @property {string} createdAt - ISO date string when the message was created
 * @property {Date} timestamp - Timestamp when the message was created
 * @property {'NONE'|'LIKE'|'DISLIKE'} [rating] - Optional message rating
 * @property {boolean} [isFirstMessageAfterRegistration] - Whether this is the first message after registration
 */

/**
 * @typedef {Object} ChatWidgetOptions
 * @property {string} apiUrl - API endpoint for the chat service
 * @property {string} websiteId - Unique identifier for the website
 * @property {string} [primaryColor='#0066FF'] - Primary color for the chat widget
 * @property {string} [secondaryColor='#E8F1FF'] - Secondary color for the chat widget
 * @property {string} [companyName='پشتیبان میرزا'] - Company name displayed in the chat header
 * @property {'bottom-right'|'bottom-left'} [position='bottom-right'] - Position of the chat widget
 * @property {string} [initialMessage='سلام 😊 من میرزا چت هستم. چطور میتونم کمکتون کنم؟ 🤖'] - Initial message shown when chat is opened
 * @property {boolean} [debug=false] - Whether to show debug information
 */

/**
 * @typedef {Object} AuthData
 * @property {string} [token] - Authentication token
 * @property {string} [userId] - User ID
 * @property {boolean} [isAuthenticated] - Whether the user is authenticated
 */

/**
 * @typedef {Object} LoginCredentials
 * @property {string} phone - Phone number
 * @property {string} password - Password
 */

/**
 * @typedef {Object} SignupCredentials
 * @property {string} phone - Phone number
 * @property {string} password - Password
 * @property {string} [email] - Optional email
 */

/**
 * @typedef {'normal'|'human_support'|'resolved'} SupportMode
 */

/**
 * @typedef {Object} SocketHandlers
 * @property {Function} onAuthenticationResult - Handler for authentication result
 * @property {Function} onMessageReceived - Handler for message received
 * @property {Function} onChatHistoryReceived - Handler for chat history received
 * @property {Function} onTypingStatusChanged - Handler for typing status changed
 * @property {Function} onMessageRated - Handler for message rated
 * @property {Function} onHumanSupportRequested - Handler for human support requested
 * @property {Function} onLogoutSuccess - Handler for logout success
 * @property {Function} onSupportModeUpdate - Handler for support mode update
 * @property {Function} onError - Handler for errors
 */ 