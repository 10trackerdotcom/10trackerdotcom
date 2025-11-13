export const metadata = {
  title: 'Contact Us - 10tracker',
  description: 'Get in touch with 10tracker. We\'re here to help with your exam preparation questions, feedback, and support requests.',
  keywords: ['contact 10tracker', 'support', 'help', 'customer service', 'exam preparation help'],
  openGraph: {
    title: 'Contact Us - 10tracker',
    description: 'Get in touch with 10tracker. We\'re here to help with your exam preparation questions, feedback, and support requests.',
    type: 'website',
  },
};

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Contact Us
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Have a question or feedback? We'd love to hear from you. Reach out to us through any of the channels below.
          </p>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
              Email Support
            </h2>
            <p className="text-neutral-600 mb-4">
              For general inquiries, support, or feedback, please email us at:
            </p>
            <a 
              href="mailto:jain10gunjan@gmail.com" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              jain10gunjan@gmail.com
            </a>
          </div>

          <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
              Response Time
            </h2>
            <p className="text-neutral-600 mb-4">
              We typically respond to all inquiries within 24-48 hours during business days.
            </p>
            <p className="text-sm text-neutral-500">
              Monday - Friday: 9:00 AM - 6:00 PM IST
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-neutral-50 rounded-lg p-8 border border-neutral-200">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            What Can We Help You With?
          </h2>
          <ul className="space-y-3 text-neutral-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Technical support and troubleshooting</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Account and subscription inquiries</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Content suggestions and feedback</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Partnership and collaboration opportunities</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>General questions about our platform</span>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div className="mt-12 text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Follow Us
          </h2>
          <p className="text-neutral-600 mb-6">
            Stay connected with us on social media for the latest updates and exam preparation tips.
          </p>
        </div>
      </div>
    </div>
  );
}

