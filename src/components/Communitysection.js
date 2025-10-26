import React from "react";
import { Instagram, MessageCircle } from "lucide-react";

export default function Communitysection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 to-indigo-900 rounded-xl shadow-xl">
      <div className="absolute opacity-10 top-0 right-0 w-64 h-64 bg-white rounded-full -mr-16 -mt-16"></div>
      <div className="absolute opacity-10 bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full -ml-32 -mb-32"></div>

      <div className="relative md:flex items-center p-8 md:p-12">
        <div className="md:w-3/5 py-6 md:py-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Join Our Community
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-lg leading-relaxed">
            Connect with thousands of students, share tips, and stay updated on
            exam preparation through our vibrant communities.
          </p>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/examtrackerdotin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-4 bg-white bg-opacity-95 text-indigo-700 font-medium rounded-lg shadow-lg hover:bg-opacity-100 transition-all duration-300 group"
            >
              <Instagram className="h-5 w-5 text-pink-600 group-hover:scale-110 transition-transform" />
              <span>@examtrackerdotin</span>
            </a>

            {/* Reddit */}
            <a
              href="https://www.reddit.com/r/examtracker/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-4 bg-white bg-opacity-95 text-indigo-700 font-medium rounded-lg shadow-lg hover:bg-opacity-100 transition-all duration-300 group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
              </svg>
              <span>r/examtracker</span>
            </a>
          </div>

          <div className="mt-8 text-blue-200 text-sm">
            Join thousands of students preparing for exams together!
          </div>
        </div>

        <div className="hidden md:block md:w-2/5">
          <div className="bg-blue-600 bg-opacity-30 p-6 rounded-lg backdrop-blur-sm border border-white border-opacity-20">
            <div className="text-center mb-4">
              <MessageCircle className="h-10 w-10 text-blue-200 mx-auto" />
              <h3 className="text-xl text-white font-medium mt-2">
                Community Benefits
              </h3>
            </div>
            <ul className="space-y-3">
              {[
                "Study groups",
                "Tips & tricks",
                "Mock test discussions",
                "Quick answers",
              ].map((item, i) => (
                <li key={i} className="flex items-center text-blue-100">
                  <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-300"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
