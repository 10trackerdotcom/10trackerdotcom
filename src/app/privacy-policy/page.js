export const metadata = {
  title: 'Privacy Policy - 10tracker',
  description: 'Read 10tracker\'s privacy policy to understand how we collect, use, and protect your personal information.',
  keywords: ['privacy policy', 'data protection', 'personal information', 'user privacy', 'data security'],
  openGraph: {
    title: 'Privacy Policy - 10tracker',
    description: 'Read 10tracker\'s privacy policy to understand how we collect, use, and protect your personal information.',
    type: 'website',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Privacy Policy
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
                Introduction
              </h2>
              <p className="leading-relaxed mb-4">
                At 10tracker (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform. Please read this policy carefully to understand our practices regarding your personal data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Information We Collect
              </h2>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">Personal Information</h3>
              <p className="leading-relaxed mb-4">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Register for an account</li>
                <li>Subscribe to our services</li>
                <li>Contact us for support</li>
                <li>Participate in surveys or promotions</li>
                <li>Use our Platform features</li>
              </ul>
              <p className="leading-relaxed mt-4">
                This information may include your name, email address, phone number, and other contact details.
              </p>

              <h3 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">Usage Data</h3>
              <p className="leading-relaxed mb-4">
                We automatically collect certain information when you use our Platform, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage patterns and interactions with the Platform</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referral sources and search terms</li>
                <li>Performance data and error logs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                How We Use Your Information
              </h2>
              <p className="leading-relaxed mb-4">
                We use the information we collect for various purposes, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To provide, maintain, and improve our services</li>
                <li>To process transactions and manage your account</li>
                <li>To send you updates, newsletters, and promotional materials (with your consent)</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To analyze usage patterns and improve user experience</li>
                <li>To detect, prevent, and address technical issues and security threats</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Information Sharing and Disclosure
              </h2>
              <p className="leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our Platform</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you have given us explicit permission to share your information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Data Security
              </h2>
              <p className="leading-relaxed mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Cookies and Tracking Technologies
              </h2>
              <p className="leading-relaxed mb-4">
                We use cookies and similar tracking technologies to track activity on our Platform and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Your Rights
              </h2>
              <p className="leading-relaxed mb-4">
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The right to access your personal information</li>
                <li>The right to correct inaccurate information</li>
                <li>The right to delete your personal information</li>
                <li>The right to restrict or object to processing</li>
                <li>The right to data portability</li>
                <li>The right to withdraw consent</li>
              </ul>
              <p className="leading-relaxed mt-4">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:jain10gunjan@gmail.com" className="text-blue-600 hover:text-blue-700">
                  jain10gunjan@gmail.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Children&apos;s Privacy
              </h2>
              <p className="leading-relaxed">
                Our Platform is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Changes to This Privacy Policy
              </h2>
              <p className="leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Contact Us
              </h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at{' '}
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

