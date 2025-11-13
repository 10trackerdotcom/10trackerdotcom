export const metadata = {
  title: 'About Us - 10tracker',
  description: 'Learn about 10tracker - your comprehensive exam preparation platform for CAT, GATE, UPSC, JEE, NEET and other competitive exams.',
  keywords: ['about 10tracker', 'exam preparation platform', 'competitive exams', 'study materials', 'mock tests'],
  openGraph: {
    title: 'About Us - 10tracker',
    description: 'Learn about 10tracker - your comprehensive exam preparation platform for CAT, GATE, UPSC, JEE, NEET and other competitive exams.',
    type: 'website',
  },
};

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            About Us
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Empowering students to excel in their competitive exam journey.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Our Mission
          </h2>
          <p className="text-neutral-700 leading-relaxed mb-4">
            At 10tracker, we are dedicated to providing comprehensive exam preparation resources for students aspiring to excel in competitive exams. Our platform offers a wide range of study materials, practice questions, mock tests, and expert insights to help you achieve your academic and career goals.
          </p>
          <p className="text-neutral-700 leading-relaxed">
            We believe that every student deserves access to quality educational resources, and we strive to make exam preparation more accessible, efficient, and effective.
          </p>
        </div>

        {/* What We Offer */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            What We Offer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Practice Questions</h3>
              <p className="text-neutral-600">
                Extensive collection of practice questions across multiple subjects and difficulty levels to help you master every topic.
              </p>
            </div>
            <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Mock Tests</h3>
              <p className="text-neutral-600">
                Realistic mock tests that simulate actual exam conditions to help you prepare effectively and build confidence.
              </p>
            </div>
            <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Study Materials</h3>
              <p className="text-neutral-600">
                Curated study materials, notes, and resources to support your learning journey and help you understand complex concepts.
              </p>
            </div>
            <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Latest Updates</h3>
              <p className="text-neutral-600">
                Stay informed with the latest exam notifications, results, answer keys, admit cards, and important announcements.
              </p>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Our Values
          </h2>
          <ul className="space-y-4 text-neutral-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-3 font-bold">✓</span>
              <div>
                <strong className="text-neutral-900">Quality First:</strong> We maintain high standards in all our content and resources to ensure the best learning experience.
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-3 font-bold">✓</span>
              <div>
                <strong className="text-neutral-900">Student-Centric:</strong> Your success is our priority. We continuously improve based on student feedback and needs.
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-3 font-bold">✓</span>
              <div>
                <strong className="text-neutral-900">Accessibility:</strong> We believe quality education should be accessible to everyone, regardless of their background.
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-3 font-bold">✓</span>
              <div>
                <strong className="text-neutral-900">Innovation:</strong> We leverage technology to create innovative solutions that enhance your learning experience.
              </div>
            </li>
          </ul>
        </div>

        {/* Call to Action */}
        <div className="bg-blue-50 rounded-lg p-8 border border-blue-200 text-center">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Join Thousands of Successful Students
          </h2>
          <p className="text-neutral-700 mb-6">
            Start your exam preparation journey with us today and take a step closer to achieving your dreams.
          </p>
        </div>
      </div>
    </div>
  );
}

