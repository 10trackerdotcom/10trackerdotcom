export const metadata = {
  title: 'Terms and Services - 10tracker',
  description: 'Read 10tracker\'s terms of service to understand the rules and guidelines for using our platform.',
  keywords: ['terms of service', 'terms and conditions', 'user agreement', 'service terms', 'platform rules'],
  openGraph: {
    title: 'Terms and Services - 10tracker',
    description: 'Read 10tracker\'s terms of service to understand the rules and guidelines for using our platform.',
    type: 'website',
  },
};

export default function TermsAndServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Terms and Services
          </h1>
          <p className="text-sm text-neutral-500">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral max-w-none">
          <div className="space-y-8 text-neutral-700">
            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Acceptance of Terms
              </h2>
              <p className="leading-relaxed mb-4">
                By accessing and using 10tracker (the &quot;Platform&quot;), you accept and agree to be bound by these Terms and Services. If you do not agree to these terms, please do not use our Platform.
              </p>
              <p className="leading-relaxed">
                We reserve the right to modify these terms at any time. Your continued use of the Platform after any changes constitutes your acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Use of the Platform
              </h2>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">Eligibility</h3>
              <p className="leading-relaxed mb-4">
                You must be at least 13 years old to use our Platform. By using the Platform, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these terms.
              </p>

              <h3 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">Account Registration</h3>
              <p className="leading-relaxed mb-4">
                To access certain features, you may be required to create an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information as necessary</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                User Conduct
              </h2>
              <p className="leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the Platform for any illegal or unauthorized purpose</li>
                <li>Violate any laws, regulations, or third-party rights</li>
                <li>Interfere with or disrupt the Platform or servers</li>
                <li>Attempt to gain unauthorized access to any part of the Platform</li>
                <li>Copy, modify, distribute, or create derivative works from our content without permission</li>
                <li>Use automated systems to access the Platform without authorization</li>
                <li>Transmit viruses, malware, or any harmful code</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Impersonate any person or entity</li>
                <li>Collect or store personal data about other users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Intellectual Property
              </h2>
              <p className="leading-relaxed mb-4">
                All content on the Platform, including but not limited to text, graphics, logos, images, software, and other materials, is the property of 10tracker or its content suppliers and is protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="leading-relaxed">
                You may not reproduce, distribute, modify, create derivative works, publicly display, or otherwise use our content without our prior written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Subscription and Payments
              </h2>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">Fees</h3>
              <p className="leading-relaxed mb-4">
                Some features of the Platform may require payment. You agree to pay all fees associated with your subscription or purchase. All fees are non-refundable unless otherwise stated.
              </p>

              <h3 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">Billing</h3>
              <p className="leading-relaxed mb-4">
                Subscriptions automatically renew unless cancelled. You are responsible for maintaining accurate billing information and authorizing payment.
              </p>

              <h3 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">Cancellation</h3>
              <p className="leading-relaxed">
                You may cancel your subscription at any time. Cancellation will take effect at the end of the current billing period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Content and User Submissions
              </h2>
              <p className="leading-relaxed mb-4">
                You retain ownership of any content you submit to the Platform. However, by submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content for the purpose of operating and promoting the Platform.
              </p>
              <p className="leading-relaxed">
                You are solely responsible for your submissions and must ensure they do not violate any laws or third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Termination
              </h2>
              <p className="leading-relaxed mb-4">
                We reserve the right to suspend or terminate your access to the Platform at any time, with or without cause or notice, for any reason, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violation of these Terms and Services</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment of fees</li>
                <li>Extended periods of inactivity</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Upon termination, your right to use the Platform will immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Disclaimers and Limitation of Liability
              </h2>
              <p className="leading-relaxed mb-4">
                The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We do not guarantee that the Platform will be uninterrupted, secure, or error-free.
              </p>
              <p className="leading-relaxed">
                To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Indemnification
              </h2>
              <p className="leading-relaxed">
                You agree to indemnify and hold harmless 10tracker, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Platform, violation of these terms, or infringement of any rights of another.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Governing Law
              </h2>
              <p className="leading-relaxed">
                These Terms and Services shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in India.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Contact Information
              </h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms and Services, please contact us at{' '}
                <a href="mailto:jain10gunjan@gmail.com" className="text-blue-600 hover:text-blue-700">
                  jain10gunjan@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

