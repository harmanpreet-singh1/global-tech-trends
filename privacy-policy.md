# Privacy Policy for Global Tech Trends

**Last Updated: February 23, 2026**

Global Tech Trends ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains our practices regarding the information handled by the Global Tech Trends Chrome Extension.

## 1. Information Collection and Use

**Global Tech Trends does NOT collect, store, or transmit any personally identifiable information (PII).**

*   **No Personal Data:** We do not collect names, email addresses, physical addresses, phone numbers, or any other identifying information.
*   **No Account Required:** You do not need to create an account or provide any login credentials to use the extension.
*   **No Behavioral Tracking:** We do not track your browsing history, clicks, mouse movements, scrolling behavior, or keystrokes.

## 2. Local Storage Usage

The extension uses the `chrome.storage` API to store data locally on your device. This data never leaves your browser except as described in the "Third-Party Services" section below.

*   **User Preferences:** We store your selected news categories (e.g., "AI," "Web Development") to personalize your feed.
*   **Read State:** We store a local list of recently viewed article titles ("seen articles") to help identify new updates and manage badge notifications.

## 3. Third-Party Services (Data Fetching)

To provide you with real-time news, the extension fetches content from our dedicated backend proxy hosted on Cloudflare Workers.

*   **Anonymized Requests:** When the extension fetches news, it sends only your selected categories to our proxy. These requests are anonymous and are not linked to any user ID, IP address, or tracking token.
*   **No Data Retention:** Our backend proxy is stateless. It performs the news aggregation in real-time and does not store or log your requested categories or any identifying metadata.

## 4. Permissions Justification

The extension requests minimal permissions to fulfill its single purpose:
*   **`storage`**: Used to save your interests and read history locally on your device.
*   **Host Permission (`fastest-tech-pulse-proxy...`)**: Used to communicate with our news aggregation service to retrieve the latest tech updates.

## 5. Security

Since no personal data is collected or transmitted to a central database, the risk of data breaches is naturally minimized. All preference storage happens within the secure sandbox provided by the Chrome browser.

## 6. Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be reflected in a new version of the extension and an updated "Last Updated" date at the top of this document.

## 7. Contact Us

If you have any questions about this Privacy Policy or the practices of this extension, please contact us at **Email:** [sharmanpreet1122@gmail.com].
