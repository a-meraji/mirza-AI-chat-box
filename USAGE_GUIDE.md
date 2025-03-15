# Mirza Chat Box - Usage Guide

This guide will help you integrate the Mirza Chat Box into your website using jsDelivr CDN.

## Quick Start

Add the following code to your HTML file:

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

Replace `your-api-url.com` with your actual API URL and `your-website-id` with your actual website ID.

## Configuration Options

The chat box can be configured with the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| apiUrl | string | - | API endpoint for the chat service |
| websiteId | string | - | Unique identifier for your website |
| primaryColor | string | '#0066FF' | Primary color for the chat widget |
| secondaryColor | string | '#E8F1FF' | Secondary color for the chat widget |
| companyName | string | 'پشتیبان میرزا' | Company name displayed in the chat header |
| position | string | 'bottom-right' | Position of the chat widget ('bottom-right' or 'bottom-left') |
| initialMessage | string | 'سلام 😊 من میرزا چت هستم. چطور میتونم کمکتون کنم؟ 🤖' | Initial message shown when chat is opened |
| debug | boolean | false | Enable debug mode for development |

## Alternative Integration Methods

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

## Troubleshooting

If you encounter any issues with the chat widget, try the following:

1. Make sure you have provided the correct `apiUrl` and `websiteId`.
2. Check the browser console for any error messages.
3. Enable debug mode by setting `debug: true` in the configuration.
4. Make sure your website has access to the API endpoint (CORS settings).

## Support

If you need help with the chat widget, please contact us at support@example.com.

## Version History

- 1.0.0: Initial release 