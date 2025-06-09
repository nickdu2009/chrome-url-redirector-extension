# Chrome URL Redirector Extension

A powerful Chrome extension that automatically redirects URLs based on prefix matching while supporting query parameter preservation and addition.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/nickdu2009/chrome-url-redirector-extension)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[中文文档](README_zh.md) | English

## Features

- **🔗 URL Prefix Matching** - Redirects URLs based on protocol, domain, port, and path (excluding query parameters and hash)
- **🔍 Advanced Query Parameter Matching** - Supports exact, contains, starts with, ends with, exists, and not exists conditions
- **📋 Parameter Preservation** - Optionally preserve original query parameters and paths
- **➕ Parameter Addition** - Add custom query parameters to redirect targets
- **🗂️ Rule Management** - Add, edit, delete, and toggle redirect rules
- **❄️ Cooldown Mechanism** - Prevent redirect loops with configurable cooldown periods
- **🗙 Auto Tab Closing** - Automatically close tabs after reaching specified URLs
- **🎨 Modern UI** - Beautiful and intuitive popup interface with responsive design

## Installation

### Method 1: Load Unpacked Extension (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `chrome-url-redirector` folder
5. The extension icon will appear in your browser toolbar

### Method 2: Install from ZIP

1. Download the extension as a ZIP file
2. Extract to a folder
3. Follow steps 2-5 from Method 1

For detailed installation instructions, see [INSTALL.md](INSTALL.md).

## Usage

### Adding Redirect Rules

1. Click the extension icon in your browser toolbar
2. Click the "Add Rule" button
3. Fill in the following information:
   - **Rule Name**: A descriptive name for easy identification
   - **Source URL Prefix**: The URL prefix to match (e.g., `https://github.com`)
   - **Target URL**: The destination URL (e.g., `https://gitee.com`)
   - **Preserve Query Parameters**: Keep original URL query parameters
   - **Preserve Original Path**: Keep original URL path
   - **Query Parameter Matching**: Specify required query parameter conditions
   - **Additional Query Parameters**: Add custom parameters to target URL
   - **Auto Close Tab**: Automatically close tab after reaching specified URL
   - **Enable Rule**: Activate the rule immediately

### Query Parameter Match Types

- **Exact**: Parameter value must exactly match
- **Contains**: Parameter value contains specified text
- **Starts With**: Parameter value starts with specified text
- **Ends With**: Parameter value ends with specified text
- **Exists**: Parameter exists regardless of value
- **Not Exists**: Parameter must not exist

### Configuration Settings

Click the "⚙️ Settings" button to configure:
- **Cooldown Period**: Time in seconds before same rule can trigger again (1-300 seconds)
- **Clear Cooldown Records**: Reset all cooldown states immediately

## Examples

### Example 1: GitHub to Gitee Redirect
- **Rule Name**: GitHub to Gitee
- **Source URL Prefix**: `https://github.com`
- **Target URL**: `https://gitee.com`
- **Preserve Query Parameters**: ✓
- **Preserve Original Path**: ✓

Visiting `https://github.com/user/repo?tab=readme` 
redirects to `https://gitee.com/user/repo?tab=readme`

**Note**: Prefix matching only applies to `https://github.com/user/repo`, query parameters like `?tab=readme` are not part of matching criteria.

### Example 2: Adding Tracking Parameters
- **Rule Name**: Internal Link Tracking
- **Source URL Prefix**: `https://example.com`
- **Target URL**: `https://example.com`
- **Preserve Query Parameters**: ✓
- **Additional Parameters**:
  - `source` = `chrome_extension`
  - `utm_medium` = `redirect`

Visiting `https://example.com/page?id=123`
redirects to `https://example.com/page?id=123&source=chrome_extension&utm_medium=redirect`

### Example 3: Conditional Redirect (Query Parameter Based)
- **Rule Name**: Special Page Redirect
- **Source URL Prefix**: `https://example.com`
- **Target URL**: `https://newsite.com`
- **Query Parameter Conditions**:
  - `type` exactly matches `special`
  - `version` starts with `v2`
- **Preserve Query Parameters**: ✓

Visiting `https://example.com/page?type=special&version=v2.1&other=value`
redirects to `https://newsite.com/page?type=special&version=v2.1&other=value`

But visiting `https://example.com/page?type=normal&version=v2.1` won't trigger redirect (type doesn't match).

### Example 4: Auto Tab Closing
- **Rule Name**: Payment Flow
- **Source URL Prefix**: `https://payment.example.com`
- **Target URL**: `https://secure-payment.com`
- **Auto Close Tab**: ✓
- **Close Trigger URL**: `https://secure-payment.com/success`

After payment completion and reaching the success page, the tab will automatically close.

## How It Works

### Architecture

The extension uses a hybrid approach combining two Chrome APIs:

1. **Simple Redirects**: Uses `declarativeNetRequest` API for fast, request-level interception
2. **Complex Redirects**: Uses `webNavigation` + `tabs` API for advanced features (parameter preservation, path preservation, auto-close)

### File Structure

```
chrome-url-redirector/
├── manifest.json          # Extension configuration
├── background.js           # Background service worker
├── popup.html             # Popup interface
├── popup.css              # Popup styles
├── popup.js               # Popup logic
├── icons/                 # Extension icons
│   └── icon.svg
├── README.md              # English documentation
├── README_zh.md           # Chinese documentation
├── INSTALL.md             # Installation guide
└── .gitignore             # Git ignore file
```

### Technical Details

- **Manifest V3**: Uses latest Chrome extension standard
- **Service Worker**: Background script for handling redirects
- **Storage Sync**: Rules synchronized across devices
- **Cooldown System**: Prevents infinite redirect loops
- **Event-Driven**: Responds to navigation events efficiently

## Rule Management

- **Edit Rules**: Click the "Edit" button on any rule card
- **Toggle Rules**: Use "Enable"/"Disable" buttons to activate/deactivate rules
- **Delete Rules**: Click "Delete" button (requires confirmation)
- **Rule Priority**: Rules are matched in order of creation, first match wins

## Important Notes

1. **Permissions**: Extension requires access to all websites to monitor navigation
2. **Rule Matching**: Rules are processed in order, only the first matching rule applies
3. **Prefix Scope**: Matching includes protocol, hostname, port, and pathname only
4. **URL Format**: Ensure URLs include protocol (http/https)
5. **Performance**: Minimal browser performance impact, only active during navigation

## Troubleshooting

### Common Issues

**Extension Not Working**
- Verify rules are enabled
- Check URL prefix format
- Ensure extension has proper permissions

**Redirect Failing**
- Validate target URL accessibility
- Check network connectivity
- Review browser console for errors

**Parameters Missing**
- Confirm "Preserve Query Parameters" is checked
- Verify parameter names and values
- Check for URL encoding issues

**Auto-Close Not Working**
- Ensure close trigger URL is exact match
- Check if tab was manually navigated away
- Verify cooldown period hasn't prevented action

### Debug Mode

Enable debug mode by:
1. Opening extension popup
2. Debug messages will appear in the interface
3. Check browser console for detailed logs
4. Use "Clear Cooldown Records" to reset state

## Development

### Local Development

1. Clone the repository
2. Make changes to the source files
3. Reload the extension in `chrome://extensions/`
4. Test your changes

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Changelog

### v1.0.1 (Latest)
- 📖 Added comprehensive English documentation
- 📖 Added Chinese documentation (README_zh.md)
- 📋 Added detailed installation guide (INSTALL.md)
- 📄 Added MIT license
- 🌐 Added language navigation links

### v1.0.0 (Initial Release)
- ✨ URL prefix matching with query parameter preservation
- ✨ Advanced query parameter matching conditions
- ✨ Parameter addition and path preservation
- ✨ Auto tab closing after redirect completion
- ✨ Cooldown mechanism to prevent redirect loops
- ✨ Modern UI with settings management
- ✨ Support for complex URL transformations

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Report Issues](https://github.com/nickdu2009/chrome-url-redirector-extension/issues)
- 💡 [Feature Requests](https://github.com/nickdu2009/chrome-url-redirector-extension/issues)
- 📖 [Documentation](https://github.com/nickdu2009/chrome-url-redirector-extension)

## Security

This extension:
- 🔒 Only redirects URLs according to your configured rules
- 🔒 Stores all data locally in Chrome's sync storage
- 🔒 Does not transmit any data to external servers
- 🔒 Source code is fully open for inspection

---

Made with ❤️ for Chrome users who need smarter URL redirection. 