export function DeleteAccount() {
  return (
    <div dir="ltr" style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7, color: '#333' }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Delete Your Account</h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>Listyyy Account &amp; Data Deletion</p>

      <p>
        If you'd like to delete your Listyyy account and all associated data, you can request deletion by emailing us.
      </p>

      <h2>How to request deletion</h2>
      <p>
        Send an email to{' '}
        <a href="mailto:support@listyyy.com?subject=Account%20Deletion%20Request">support@listyyy.com</a>{' '}
        with the subject line <strong>"Account Deletion Request"</strong>.
        Please include the email address or phone number associated with your account so we can identify it.
      </p>

      <h2>What gets deleted</h2>
      <p>When we process your request, the following data will be permanently deleted:</p>
      <ul>
        <li>Your account profile (email, phone number, display name, profile picture)</li>
        <li>All lists and list items you created</li>
        <li>All workspaces you own (members will be notified)</li>
        <li>All uploaded images associated with your account</li>
        <li>Push notification tokens and session data</li>
      </ul>

      <h2>Timeline</h2>
      <p>
        We will process your deletion request within <strong>7 business days</strong> and send you a
        confirmation email once complete.
      </p>

      <h2>Questions?</h2>
      <p>
        Contact us at <a href="mailto:support@listyyy.com">support@listyyy.com</a> for any questions about your data.
      </p>
    </div>
  );
}
