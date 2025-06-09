# Installation Guide

[中文安装指南](INSTALL_zh.md) | English

## Developer Mode Installation (Recommended for Testing)

### Step 1: Enable Developer Mode

1. Open Chrome browser
2. Navigate to `chrome://extensions/` in the address bar
3. Find the "Developer mode" toggle in the top right corner
4. Click the toggle to enable Developer mode

### Step 2: Load the Extension

1. Click the "Load unpacked" button
2. Browse and select the `chrome-url-redirector` folder
3. Click "Select Folder" to confirm

### Step 3: Verify Installation

1. Confirm the extension appears in the extensions list
2. Ensure the extension status shows "Enabled"
3. The extension icon should appear in the browser toolbar

## Package Installation (For Distribution)

### Creating a .crx File

1. Go to the `chrome://extensions/` page
2. Click "Pack extension"
3. Select the `chrome-url-redirector` folder as "Extension root directory"
4. Leave "Private key file" empty for first-time packaging
5. Click "Pack Extension"
6. The system will generate a `.crx` file and a `.pem` private key file

### Installing .crx File

1. Drag and drop the generated `.crx` file to the `chrome://extensions/` page
2. Click "Add extension" to confirm installation

## Chrome Web Store Installation (Coming Soon)

The extension will be available on the Chrome Web Store for easy installation:

1. Visit the Chrome Web Store listing
2. Click "Add to Chrome"
3. Confirm the installation in the popup dialog

## Required Permissions

The extension requires the following permissions:

- **activeTab**: Access current tab information
- **tabs**: Manage browser tabs
- **storage**: Save user settings and rules
- **webNavigation**: Monitor page navigation events
- **declarativeNetRequest**: Handle URL redirections
- **host_permissions**: Access all websites to perform redirects

## Permission Explanations

### Why does the extension need access to all websites?
The extension needs to monitor navigation events on all websites to perform URL matching and redirection. This permission is essential for the core functionality.

### Does the extension collect browsing data?
No. The extension only processes URL redirections locally and does not send any data to external servers. All rules and settings are stored locally in Chrome's sync storage.

## Troubleshooting

### Extension Icon Not Visible

1. Click the puzzle piece icon (Extensions menu) in the browser toolbar
2. Find "URL Prefix Redirector" in the list
3. Click the pin icon to pin it to the toolbar

### Extension Not Working

1. **Check if enabled**: Ensure the extension is enabled in `chrome://extensions/`
2. **Verify rules**: Check if redirect rules are configured correctly
3. **Console errors**: Open Developer Tools (F12) and check for errors
4. **Reload extension**: Try reloading the extension in developer mode
5. **Clear cooldown**: Use the "Clear Cooldown Records" button in settings

### Redirect Not Happening

1. **URL format**: Ensure source URL prefix is correctly formatted
2. **Rule order**: Rules are processed in order, first match wins
3. **Query parameters**: Remember that prefix matching excludes query parameters
4. **Cooldown period**: Check if the rule is in cooldown period

### Parameters Not Preserved

1. **Settings check**: Ensure "Preserve Query Parameters" is enabled
2. **URL encoding**: Check for special characters in parameters
3. **Parameter conflicts**: Verify additional parameters don't conflict

## Uninstalling the Extension

### From Chrome Extensions Page

1. Navigate to `chrome://extensions/`
2. Find "URL Prefix Redirector"
3. Click the "Remove" button
4. Confirm uninstallation

### From Browser Toolbar

1. Right-click the extension icon
2. Select "Remove from Chrome"
3. Confirm in the dialog

## Updating the Extension

### Developer Mode Update

1. Go to `chrome://extensions/`
2. Find the extension card
3. Click the refresh icon
4. Or reload the extension folder

### Chrome Web Store Update

Extensions installed from the Chrome Web Store update automatically. You can also:

1. Check for updates manually in `chrome://extensions/`
2. Enable "Developer mode" and click "Update" button

### Manual Update

1. Download the new version
2. Replace the old files with new ones
3. Reload the extension in developer mode

## Browser Compatibility

### Supported Browsers

- ✅ Google Chrome (Recommended)
- ✅ Microsoft Edge (Chromium-based)
- ✅ Brave Browser
- ✅ Opera
- ❌ Firefox (Different extension system)
- ❌ Safari (Different extension system)

### Minimum Version Requirements

- Chrome 88+ (for Manifest V3 support)
- Modern Chromium-based browsers

## Performance Considerations

### Resource Usage

- **Memory**: Minimal memory footprint (~2-5MB)
- **CPU**: Only active during navigation events
- **Network**: No external network requests
- **Battery**: Negligible impact on battery life

### Best Practices

1. **Limit rules**: Keep the number of rules reasonable (recommended <50)
2. **Specific prefixes**: Use specific URL prefixes to avoid unwanted matches
3. **Regular cleanup**: Remove unused rules periodically
4. **Monitor performance**: Check extension impact in Chrome Task Manager

## Data and Privacy

### Data Storage

- All rules and settings stored locally
- Uses Chrome's sync storage for cross-device synchronization
- No data transmitted to external servers

### Privacy Protection

- Extension operates entirely offline
- No tracking or analytics
- Source code available for inspection
- No third-party dependencies for core functionality

## Technical Support

For installation or usage issues, please check:

1. **Documentation**: [README.md](./README.md) - Detailed usage instructions
2. **Console logs**: Developer Tools > Console for error messages
3. **Extension logs**: Background page console in `chrome://extensions/`
4. **GitHub Issues**: Report bugs or request features
5. **Chrome Extension Documentation**: https://developer.chrome.com/docs/extensions/

## Advanced Installation Options

### For Enterprise Deployment

1. **Group Policy**: Deploy via Chrome Enterprise policies
2. **Force Install**: Use enterprise policy to force install
3. **Preconfigure Rules**: Deploy with predefined redirect rules
4. **Centralized Management**: Manage rules via enterprise policies

### For Developers

1. **Source Code**: Clone from GitHub repository
2. **Build Process**: No build process required, ready to use
3. **Development Mode**: Enable for debugging and testing
4. **Hot Reload**: Use extensions reloader for development

---

Need help? Check our [GitHub repository](https://github.com/nickdu2009/chrome-url-redirector-extension) for more information and support. 