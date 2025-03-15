# Mirza Chat Box

A standalone JavaScript chat widget that can be easily integrated into any website with a simple script tag.

## Features

1. Socket Connection
   - Real-time communication with WebSocket
   - Automatic reconnection
   - Event-based messaging

2. Authentication System
   - Login/signup functionality
   - Token validation and storage
   - Authentication state management

3. Support Mode Management
   - Human support request/cancel functionality
   - Support mode state management
   - Persistence in localStorage

4. Message Rating System
   - Message rating UI and functionality
   - Optimistic updates and server responses

5. Typing Indicator
   - Real-time typing status
   - Socket events for typing status

6. Error Handling
   - Comprehensive error handling
   - User-friendly error messages

7. UI Improvements
   - Message rendering with proper formatting
   - Support for system messages
   - Styling and animations

8. Localization Support
   - Support for RTL languages
   - Proper text direction

9. Debug Mode
   - Optional debug information
   - Developer tools

10. Performance Optimization
    - Efficient message rendering
    - Optimized DOM updates

## Integration with jsDelivr CDN

You can easily integrate Mirza Chat Box into your website using jsDelivr CDN:

```html
<!-- Add this to your HTML file -->
<script src="https://cdn.jsdelivr.net/npm/mirza-ai-chatbox@1.0.0/dist/mirza-chat-box.js"></script>
<script>
  // Initialize the chat widget
  window.addEventListener('DOMContentLoaded', function() {
    MirzaChat.init({
      apiUrl: 'https://your-api-url.com',
      websiteId: 'your-website-id',
      primaryColor: '#0066FF',
      companyName: 'Your Company Name'
    });
  });
</script>
```

### Using Data Attributes

You can also configure the chat widget using data attributes on the script tag:

```html
<script 
  src="https://cdn.jsdelivr.net/npm/mirza-ai-chatbox@1.0.0/dist/mirza-chat-box.js"
  data-api-url="https://your-api-url.com"
  data-website-id="your-website-id"
  data-primary-color="#0066FF"
  data-company-name="Your Company Name"
  data-position="bottom-right"
  data-initial-message="Hello! How can I help you today?"
></script>
```

### Using Global Configuration Variable

Another option is to set a global configuration variable before loading the script:

```html
<script>
  window.MIRZA_CHAT_CONFIG = {
    apiUrl: 'https://your-api-url.com',
    websiteId: 'your-website-id',
    primaryColor: '#0066FF',
    companyName: 'Your Company Name'
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/mirza-ai-chatbox@1.0.0/dist/mirza-chat-box.js"></script>
```

## Usage

```html
<script src="https://cdn.jsdelivr.net/npm/mirza-ai-chatbox@1.0.0/dist/mirza-chat-box.js"></script>
<script>
  const chatBox = new MirzaChatBox({
    apiUrl: 'https://api.example.com',
    websiteId: 'your-website-id',
    primaryColor: '#0066FF',
    companyName: 'پشتیبان میرزا'
  });
  
  chatBox.init();
</script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| apiUrl | string | - | API endpoint for the chat service |
| websiteId | string | - | Unique identifier for your website |
| primaryColor | string | '#0066FF' | Primary color for the chat widget |
| secondaryColor | string | '#E8F1FF' | Secondary color for the chat widget |
| companyName | string | 'پشتیبان میرزا' | Company name displayed in the chat header |
| position | string | 'bottom-right' | Position of the chat widget ('bottom-right' or 'bottom-left') |
| initialMessage | string | 'سلام 😊 من میرزا چت هستم. چطور میتونم کمکتون کنم؟ 🤖' | Initial message shown when chat is opened |

## API Methods

Once initialized, you can control the chat widget programmatically:

```javascript
// Open the chat widget
MirzaChat.openChat();

// Close the chat widget
MirzaChat.closeChat();

// Update configuration dynamically
MirzaChat.updateConfig({
  primaryColor: '#FF0000',
  companyName: 'New Company Name'
});
```

## Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Development with hot reload
npm run dev
```

## License

MIT 