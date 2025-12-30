// Hardcoded exam data with question counts and active status
export const examData = [
  {
    slug: 'gate-cse',
    name: 'GATE CSE',
    image: 'https://www.spinoneducation.com/wp-content/uploads/2022/02/Gate.webp',
    icon: '💻',
    color: 'from-gray-500 to-cyan-500',
    description: 'Graduate Aptitude Test in Engineering - Computer Science',
    category: 'Engineering',
    count: 2500, // Hardcoded question count
    active: true, // Active exam
  },
  {
    slug: 'gate-ec',
    name: 'GATE EC',
    image: 'https://www.spinoneducation.com/wp-content/uploads/2022/02/Gate.webp',
    icon: '💻',
    color: 'from-gray-500 to-cyan-500',
    description: 'Graduate Aptitude Test in Engineering - Computer Science',
    category: 'Engineering',
    count: 2550, // Hardcoded question count
    active: true, // Active exam
  },
  {
    slug: 'gate-me',
    name: 'GATE ME',
    image: 'https://www.spinoneducation.com/wp-content/uploads/2022/02/Gate.webp',
    icon: '💻',
    color: 'from-gray-500 to-cyan-500',
    description: 'Graduate Aptitude Test in Engineering - Computer Science',
    category: 'Engineering',
    count: 2500, // Hardcoded question count
    active: true, // Active exam
  },
  {
    slug: 'gate-da',
    name: 'GATE DA',
    image: 'https://www.spinoneducation.com/wp-content/uploads/2022/02/Gate.webp',
    icon: '💻',
    color: 'from-gray-500 to-cyan-500',
    description: 'Graduate Aptitude Test in Engineering - Computer Science',
    category: 'Engineering',
    count: 2200, // Hardcoded question count
    active: true, // Active exam
  },
  {
    slug: 'gate-ee',
    name: 'GATE EE',
    image: 'https://www.spinoneducation.com/wp-content/uploads/2022/02/Gate.webp',
    icon: '💻',
    color: 'from-gray-500 to-cyan-500',
    description: 'Graduate Aptitude Test in Engineering - Computer Science',
    category: 'Engineering',
    count: 2800, // Hardcoded question count
    active: true, // Active exam
  },
  {
    slug: 'gate-ce',
    name: 'GATE CE',
    image: 'https://www.spinoneducation.com/wp-content/uploads/2022/02/Gate.webp',
    icon: '💻',
    color: 'from-gray-500 to-cyan-500',
    description: 'Graduate Aptitude Test in Engineering - Computer Science',
    category: 'Engineering',
    count: 2400, // Hardcoded question count
    active: true, // Active exam
  },
  {
    slug: 'jee-main',
    name: 'JEE Mains',
    image: 'https://img.studydekho.com/uploads/c/2022/3/17509-c-whatsapp-image-2022-03-19-at-53432-pm-2.jpeg',
    icon: '⚛️',
    color: 'from-green-500 to-emerald-500',
    description: 'Joint Entrance Examination for Engineering',
    category: 'Engineering',
    count: 3200, // Hardcoded question count
    active: true, // Active exam
  },
  {
    slug: 'mht-cet',
    name: 'MHT-CET',
    image: 'https://images.careerindia.com/img/2022/04/mht-1611563405-1650630681.jpg',
    icon: '🎓',
    color: 'from-teal-500 to-cyan-500',
    description: 'Maharashtra Common Entrance Test',
    category: 'State Level',
    count: 2240, // Hardcoded question count
    active: true, // Active exam
  },
  {
    slug: 'upsc-prelims',
    name: 'UPSC Prelims',
    image: 'https://dhurina.net/en/wp-content/uploads/2024/07/desktop-wallpaper-upsc-logo-upsc.jpg',
    icon: '📚',
    bg: 'bg-gray-200',
    color: 'from-orange-500 to-red-500',
    description: 'Union Public Service Commission - Civil Services Prelims Exam',
    category: 'Civil Services',
    count: 2100, // Hardcoded question count
    active: true, // Inactive exam - will be grayed out
  },
  {
    slug: 'bitsat',
    name: 'BITSAT',
    image: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/BITS_Pilani-Logo.svg/330px-BITS_Pilani-Logo.svg.png',
    bg: 'bg-gray-200',
    icon: '🧬',
    color: 'from-indigo-500 to-blue-500',
    description: 'Birla Institute of Technology and Science, Pilani',
    category: 'Engineering',
    count: 1500, // Hardcoded question count
    active: true, // Inactive exam - will be grayed out
  },
  {
    slug: 'cat',
    name: 'CAT',
    image: 'https://static.toiimg.com/thumb/msid-95111352,width-1280,height-720,resizemode-4/95111352.jpg',
    icon: '📊',
    bg: 'bg-gray-200',
    color: 'from-purple-500 to-pink-500',
    description: 'Common Admission Test for MBA programs',
    category: 'Management',
    count: 1500, // Hardcoded question count
    active: false, // Inactive exam - will be grayed out
  },
  {
    slug: 'neet-ug',
    name: 'NEET UG',
    image: 'https://e7.pngegg.com/pngimages/612/865/png-clipart-central-board-of-secondary-education-ugc-net-cbse-exam-class-10-neet-jee-main-school-label-logo-thumbnail.png',
    bg: 'bg-gray-200',
    icon: '🧬',
    color: 'from-indigo-500 to-blue-500',
    description: 'National Eligibility cum Entrance Test for Medical',
    category: 'Medical',
    count: 2800, // Hardcoded question count
    active: true, // Inactive exam - will be grayed out
  },
  {
    slug: 'ssc',
    name: 'SSC',
    image: '/exams/ssc.png',
    bg: 'bg-gray-200',
    icon: '📋',
    color: 'from-yellow-500 to-orange-500',
    description: 'Staff Selection Commission - Government Jobs',
    category: 'Government Jobs',
    count: 1900, // Hardcoded question count
    active: false, // Inactive exam - will be grayed out
  },
  {
    slug: 'aptitude',
    name: 'Aptitude',
    bg: 'bg-gray-200',
    image: '/exams/aptitude.png',
    icon: '🧮',
    color: 'from-violet-500 to-purple-500',
    description: 'General Aptitude and Reasoning Practice',
    category: 'General',
    count: 1200, // Hardcoded question count
    active: false, // Inactive exam - will be grayed out
  },
];

// Helper function to merge API data with static exam data (kept for backward compatibility)
export const mergeExamData = (apiExams, staticData = examData) => {
  // Now we just return the static data since everything is hardcoded
  return staticData;
};

