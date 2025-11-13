export const metadata = {
  title: 'Disclaimer - 10tracker',
  description: 'Read the disclaimer for 10tracker platform. Important information about content accuracy, liability, and usage terms.',
  keywords: ['disclaimer', 'terms of use', 'liability', 'content accuracy', 'legal notice'],
  openGraph: {
    title: 'Disclaimer - 10tracker',
    description: 'Read the disclaimer for 10tracker platform. Important information about content accuracy, liability, and usage terms.',
    type: 'website',
  },
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Disclaimer
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
                General Information
              </h2>
              <p className="leading-relaxed mb-4">
                The information provided on 10tracker (the "Platform") is for general informational purposes only. While we strive to keep the information up to date and correct, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information, products, services, or related graphics contained on the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Educational Content
              </h2>
              <p className="leading-relaxed mb-4">
                All educational content, practice questions, mock tests, study materials, and other resources provided on the Platform are intended for educational and practice purposes only. While we make every effort to ensure the accuracy of our content, we do not guarantee that all information is error-free or up-to-date.
              </p>
              <p className="leading-relaxed">
                The actual exam questions, formats, and patterns may vary, and we recommend that users refer to official exam authorities and sources for the most current and accurate information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                No Warranty
              </h2>
              <p className="leading-relaxed mb-4">
                The Platform is provided "as is" without any warranties, expressed or implied. We disclaim all warranties, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Warranties of merchantability and fitness for a particular purpose</li>
                <li>Warranties regarding the accuracy, reliability, or completeness of content</li>
                <li>Warranties that the Platform will be uninterrupted, secure, or error-free</li>
                <li>Warranties regarding the results obtained from using the Platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Limitation of Liability
              </h2>
              <p className="leading-relaxed mb-4">
                In no event shall 10tracker, its owners, employees, partners, or affiliates be liable for any direct, indirect, incidental, special, consequential, or punitive damages, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Loss of data or profits</li>
                <li>Business interruption</li>
                <li>Personal injury or property damage</li>
                <li>Any other damages arising from the use or inability to use the Platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                External Links
              </h2>
              <p className="leading-relaxed">
                The Platform may contain links to external websites or resources that are not owned or controlled by 10tracker. We have no control over the nature, content, and availability of those sites. The inclusion of any links does not necessarily imply a recommendation or endorse the views expressed within them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Exam Results and Performance
              </h2>
              <p className="leading-relaxed">
                Performance on practice tests, mock exams, or any assessments provided on the Platform does not guarantee similar performance in actual examinations. Actual exam results depend on various factors including but not limited to preparation, exam conditions, and individual performance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Changes to Disclaimer
              </h2>
              <p className="leading-relaxed">
                We reserve the right to modify this disclaimer at any time without prior notice. Your continued use of the Platform after any changes constitutes your acceptance of the new disclaimer.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                Contact
              </h2>
              <p className="leading-relaxed">
                If you have any questions about this disclaimer, please contact us at{' '}
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

