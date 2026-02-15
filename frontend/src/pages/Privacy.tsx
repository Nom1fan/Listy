export function Privacy() {
  return (
    <div dir="ltr" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7, color: '#333' }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>Last updated: February 15, 2026</p>

      <p>
        Listyyy ("we", "us", "our") operates the Listyyy mobile application and website (listyyy.com).
        This policy explains what information we collect, how we use it, and your rights.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>Account information</h3>
      <ul>
        <li><strong>Email address</strong> – used for sign-up, login, and sending one-time passwords (OTP).</li>
        <li><strong>Phone number</strong> – optional, used for SMS-based OTP login.</li>
        <li><strong>Display name</strong> – shown to other users you share lists with.</li>
        <li><strong>Profile picture</strong> – optional, uploaded by you.</li>
        <li><strong>Password</strong> – stored only as a secure hash; we never store or see your plain-text password.</li>
      </ul>

      <h3>Content you create</h3>
      <ul>
        <li>Lists, list items, notes, quantities, and images you upload for lists, items, categories, and products.</li>
        <li>Workspaces you create or join.</li>
      </ul>

      <h3>Technical data</h3>
      <ul>
        <li><strong>Push notification token</strong> – if you enable push notifications, we store your Firebase Cloud Messaging (FCM) token to deliver notifications to your device.</li>
        <li><strong>Session tokens</strong> – a refresh token stored in a secure HTTP-only cookie and a short-lived access token stored in your browser's local storage.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To create and manage your account.</li>
        <li>To let you create, edit, and share shopping lists in real time.</li>
        <li>To send you one-time passwords for authentication.</li>
        <li>To send push notifications about list updates (if you opt in).</li>
      </ul>

      <h2>3. Third-Party Services</h2>
      <p>We use the following third-party services to operate Listyyy:</p>
      <ul>
        <li>
          <strong>Twilio</strong> – to deliver SMS one-time passwords. Your phone number and OTP code are shared with
          Twilio for this purpose.{' '}
          <a href="https://www.twilio.com/legal/privacy" target="_blank" rel="noopener noreferrer">Twilio Privacy Policy</a>
        </li>
        <li>
          <strong>Firebase Cloud Messaging (Google)</strong> – to deliver push notifications. Your FCM device token is
          shared with Google for this purpose.{' '}
          <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">Firebase Privacy Policy</a>
        </li>
        <li>
          <strong>Pixabay &amp; GIPHY</strong> – when you search for images within the app, your search query is sent to
          these services. No personal data is shared.{' '}
          <a href="https://pixabay.com/service/privacy/" target="_blank" rel="noopener noreferrer">Pixabay Privacy</a>
          {' · '}
          <a href="https://support.giphy.com/hc/en-us/articles/360032872931-GIPHY-Privacy-Policy" target="_blank" rel="noopener noreferrer">GIPHY Privacy</a>
        </li>
      </ul>

      <h2>4. Data Sharing</h2>
      <p>We do not sell, rent, or trade your personal information. Your data is only shared with:</p>
      <ul>
        <li>Other users you explicitly invite to your workspaces or lists (they see your display name and profile picture).</li>
        <li>The third-party services listed above, strictly for the described purposes.</li>
      </ul>

      <h2>5. Data Storage &amp; Security</h2>
      <p>
        Your data is stored on secure servers. Passwords are hashed. Session cookies are HTTP-only and Secure. We use
        JWT-based authentication with short-lived access tokens.
      </p>

      <h2>6. Data Retention</h2>
      <p>
        We retain your account and content data for as long as your account is active. One-time passwords and OTP logs
        are short-lived and automatically expire. If you delete your account, your personal data will be removed.
      </p>

      <h2>7. Your Rights</h2>
      <p>You can:</p>
      <ul>
        <li>Update or correct your profile information at any time within the app.</li>
        <li>Request deletion of your account and associated data by contacting us.</li>
        <li>Opt out of push notifications through your device settings.</li>
      </ul>

      <h2>8. Children's Privacy</h2>
      <p>
        Listyyy is not directed at children under 13. We do not knowingly collect personal information from children
        under 13.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. The "Last updated" date at the top will reflect any changes.
      </p>

      <h2>10. Contact Us</h2>
      <p>
        If you have any questions about this privacy policy, contact us at{' '}
        <a href="mailto:support@listyyy.com">support@listyyy.com</a>.
      </p>
    </div>
  );
}
