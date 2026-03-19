// Central exam metadata used by /exams/[slug] pages
// Add new exams here to scale consistently.

export const examMeta = {
  gate: {
    slug: "gate",
    name: "GATE 2026",
    shortName: "GATE",
    heroTagline:
      "National-level exam for PG admissions (IITs/NITs/IIITs) and PSU recruitment. Conducted by IIT Guwahati for 2026.",
    overview: {
      level: "Postgraduate entrance",
      conductingBody: "IIT Guwahati (GATE 2026)",
      frequency: "Annual",
      mode: "Computer-based test (CBT)",
      officialSite: "https://gate2026.iitg.ac.in",
      scoreValidity: "3 years (admissions), ~1 year (PSUs)",
    },
    about: `GATE 2026, organized by IIT Guwahati, is a national-level exam for admission to postgraduate programs in engineering, technology, and sciences at IITs, NITs, and PSUs.

It opens doors to M.Tech and PhD scholarships, and PSU jobs. GATE scores are valid for three years for admissions but often considered for about one year for PSU recruitment.`,
    highlights: [
      "Covers 30 papers; conducted annually by rotating IITs and IISc",
      "MoE scholarships: ₹12,400/month for M.Tech; up to ₹42,000 for PhD (as applicable)",
      "Two-paper option available for approved combinations (double fee applies)",
    ],
    importantDates: [
      { label: "Website launch (tentative)", value: "Aug 5, 2025" },
      { label: "Application start", value: "Aug 28, 2025" },
      { label: "Application end (no late fee)", value: "Sep 28, 2025" },
      { label: "Late application (with fee)", value: "Till Oct 9, 2025" },
      { label: "Exam dates", value: "Feb 7–8 & 14–15, 2026" },
      { label: "Result", value: "Mar 19, 2026" },
    ],
    eligibility: {
      nationality:
        "Indian candidates and eligible international candidates (as per brochure).",
      ageLimit: "No age limit.",
      attempts: "No attempt restrictions.",
      education: [
        "Bachelor’s degree in Engineering/Technology (3rd year or higher) or equivalent.",
        "Master’s degree in Science/Arts or equivalent (as applicable).",
        "Final-year students are eligible if completing by 2026–2027 (as per brochure).",
        "International candidates from non-Indian universities: similar 4-year Bachelor’s or 2-year Master’s.",
      ],
    },
    application: {
      portalName: "GOAPS",
      portalUrl: "https://gate2026.iitg.ac.in",
      steps: [
        "Register on GOAPS to generate an Enrollment ID.",
        "Fill personal and academic details; choose paper(s).",
        "Upload photo, signature, and required ID documents.",
        "Pay fee (₹1000–₹2000 regular; higher with late fee; double for two papers).",
        "Download admit card from GOAPS using login credentials (typically a week before exam).",
      ],
    },
    pattern: [
      { label: "Duration", value: "3 hours" },
      { label: "Total questions", value: "65" },
      { label: "Total marks", value: "100" },
      { label: "Question types", value: "MCQ, MSQ, NAT" },
      { label: "Negative marking", value: "MCQ only (1/3–2/3); none for MSQ/NAT" },
      { label: "Two-paper option", value: "Yes (approved combinations)" },
    ],
    patternBreakdown: [
      { section: "General Aptitude", marks: 15, questions: 10 },
      { section: "Core Subject", marks: 85, questions: 55 },
    ],
    sessions: [
      { label: "Forenoon", value: "9:30 AM – 12:30 PM" },
      { label: "Afternoon", value: "2:30 PM – 5:30 PM" },
    ],
    syllabusSummary: [
      "General Aptitude: verbal ability + numerical ability",
      "Engineering Mathematics (for most papers)",
      "Core subject topics vary by paper (e.g., CS: algorithms, databases; ME: thermodynamics)",
      "XE/XL/XH: compulsory section + optional sections",
    ],
    centers: {
      summary:
        "Over 100 cities across zones. Choose preferences during application; final allocation by IIT Guwahati.",
      notes: [
        "No international centers expected for 2026.",
        "Final center allocation depends on availability and zone mapping.",
      ],
    },
    preparationTips: [
      "Complete syllabus early and plan revision cycles.",
      "Practice PYQs (last 10 years) with timed sessions.",
      "Make short notes/handbooks for quick revision.",
      "Take mock tests regularly and analyze weak areas.",
      "Prioritize high-weightage topics based on previous years’ analysis.",
    ],
    scoreUsage: [
      "Admissions: valid for 3 years for IIT/NIT/IIIT admissions via COAP/CCMT (as applicable).",
      "PSUs: many PSUs (e.g., ONGC, NTPC) often consider scores for ~1 year (varies by PSU).",
      "Scholarships: qualifiers may be eligible for MoE scholarships (as applicable).",
    ],
    practiceLinks: {
      // Hook into your existing routes for now.
      topicWisePyqs: "/gate-cse",
      dpp: "/gate-cse/daily-practice",
      topicWiseTests: "/mock-test/gate-cse",
      mockTests: "/mock-test/gate-cse",
    },
    newsLinks: {
      // Dummy tags – you can later map RSS categories into these.
      examUpdates: "/article/news?tag=gate",
      importantNotices: "/article/news?tag=gate-notice",
    },
    jobsLinks: {
      psuJobs: "/article/latest-jobs?tag=psu",
    },
    updates: [
      {
        id: "gate-u1",
        title: "GATE 2026 website launched (sample update)",
        summary:
          "Official portal goes live with brochure and paper-wise syllabus PDFs (dummy for now).",
        date: "Aug 2025",
        type: "Portal",
      },
      {
        id: "gate-u2",
        title: "Application window opened (sample update)",
        summary:
          "GOAPS registrations start; candidates can submit applications and pay fees.",
        date: "Aug 2025",
        type: "Application",
      },
    ],
    faqs: [
      { q: "Who conducts GATE 2026?", a: "IIT Guwahati." },
      { q: "Can B.Sc. students apply?", a: "Yes, 3rd year or completed (as per brochure)." },
      { q: "Are two papers allowed?", a: "Yes, for approved combinations; double fee applies." },
      { q: "Is there negative marking?", a: "Yes for MCQs only; no negative for MSQ/NAT." },
      {
        q: "What is the score validity?",
        a: "3 years for admissions; PSU validity often ~1 year (varies by PSU).",
      },
    ],
  },

  "gate-cse": {
    slug: "gate-cse",
    name: "GATE CSE",
    shortName: "GATE CSE",
    heroTagline:
      "Graduate Aptitude Test in Engineering – Computer Science and Information Technology.",
    overview: {
      level: "Postgraduate entrance",
      conductingBody: "IISc + IITs (rotational)",
      frequency: "Annual",
      mode: "Computer-based test (CBT)",
      officialSite: "https://gate.iisc.ac.in",
    },
    about: `GATE CSE is a national-level exam for admission to M.Tech/MS/PhD programs and for PSU recruitment.

It tests core computer science fundamentals, engineering mathematics, and aptitude.`,
    eligibility: {
      nationality: "Indian and eligible foreign nationals (as per latest brochure).",
      ageLimit: "No official upper age limit for GATE.",
      education: [
        "Bachelor’s degree in Engineering/Technology (4 years after 10+2) or equivalent.",
        "Final-year students of such programs are also eligible to appear.",
      ],
      attempts: "No fixed attempt limit; you can appear as many times as you wish.",
    },
    pattern: [
      { label: "Mode", value: "Computer-based (online)" },
      { label: "Duration", value: "3 hours" },
      { label: "Questions", value: "65 (MCQ, MSQ, NAT)" },
      { label: "Marks", value: "100" },
      { label: "Frequency", value: "Once a year" },
    ],
    syllabusSummary: [
      "Engineering Mathematics",
      "Digital Logic, Computer Organization & Architecture",
      "Programming & Data Structures, Algorithms",
      "Theory of Computation & Compiler Design",
      "Operating Systems & Databases",
      "Computer Networks & aptitude (verbal + numerical)",
    ],
    practiceLinks: {
      topicWisePyqs: "/gate-cse",
      dpp: "/gate-cse/daily-practice",
      topicWiseTests: "/mock-test/gate-cse",
      mockTests: "/mock-test/gate-cse",
    },
    newsLinks: {
      examUpdates: "/article/news?tag=gate",
      importantNotices: "/article/news?tag=gate-notice",
    },
    jobsLinks: {
      psuJobs: "/article/latest-jobs?tag=psu",
    },
    faqs: [
      {
        q: "Who conducts GATE CSE?",
        a: "GATE is conducted jointly by IISc Bangalore and seven IITs on a rotational basis.",
      },
      {
        q: "Can final-year students appear for GATE CSE?",
        a: "Yes, final-year students of BE/BTech/BSc (Engg) or equivalent can appear.",
      },
    ],
    // Dummy updates and dates – later can be replaced with RSS-derived data
    updates: [
      {
        id: "g1",
        title: "GATE 2026 official notification expected in August 2025",
        summary:
          "Tentative timeline suggests brochure release in August with registrations in September.",
        date: "Jul 2025",
        type: "Advisory",
      },
      {
        id: "g2",
        title: "Previous year paper analysis suggests higher weight to Algorithms",
        summary:
          "Trend over last 3 years shows more questions from Algorithms and Data Structures.",
        date: "Jun 2025",
        type: "Analysis",
      },
    ],
    importantDates: [
      {
        label: "Notification (tentative)",
        value: "Aug 2025",
      },
      {
        label: "Registration window",
        value: "Sep–Oct 2025",
      },
      {
        label: "Exam dates (tentative)",
        value: "Feb 2026 (weekends)",
      },
      {
        label: "Result (tentative)",
        value: "Mar 2026",
      },
    ],
  },

  "upsc-prelims": {
    slug: "upsc-prelims",
    name: "UPSC Prelims Exam 2026",
    shortName: "UPSC Prelims",
    heroTagline:
      "Complete guide to pattern, syllabus, strategy, eligibility, and FAQs for the UPSC Civil Services Preliminary Examination.",
    overview: {
      level: "All-India competitive examination",
      conductingBody: "Union Public Service Commission (UPSC)",
      frequency: "Annual",
      mode: "Offline (OMR-based)",
      officialSite: "https://www.upsc.gov.in",
    },
    about: `The UPSC Civil Services Examination (CSE) is one of the most prestigious and toughest exams in India. Conducted by the Union Public Service Commission (UPSC), it selects candidates for top services like IAS, IPS, IFS, and more.

The first stage of this exam is the UPSC Prelims, which acts as a screening test for the Mains examination.

What is UPSC Prelims?
- It is the first stage of the Civil Services Examination.
- Objective-type (MCQ) exam conducted once a year.
- It consists of 2 papers.
- It is qualifying in nature; marks are not counted in final merit.
- It filters candidates for the Mains exam.

UPSC Prelims Exam Pattern
Paper 1: General Studies (GS)
- Total Questions: 100
- Marks: 200
- Duration: 2 hours
- Negative Marking: Yes (1/3rd)
- Subjects: History, Geography, Polity, Economy, Environment & Ecology, Science & Technology, Current Affairs

Paper 2: CSAT (Civil Services Aptitude Test)
- Total Questions: 80
- Marks: 200
- Duration: 2 hours
- Qualifying: 33% required (66 marks)
- Topics: Comprehension, Logical Reasoning, Analytical Ability, Decision Making, Basic Numeracy (Class 10 level)

Important rules
- GS Paper 1 marks determine qualification.
- CSAT is only qualifying.
- Both papers are conducted on the same day.
- No sectional cutoff.`,
    highlights: [
      "Two papers: GS Paper 1 (merit for prelims cutoff) + CSAT (qualifying at 33%)",
      "Negative marking in GS Paper 1: 1/3rd marks deducted for wrong answers",
      "Focus areas are increasingly analytical with rising weight of current affairs + concepts",
      "Many candidates fail due to ignoring CSAT — treat it as non-negotiable",
    ],
    eligibility: {
      nationality:
        "Citizen of India or as per categories mentioned in the official notification.",
      ageLimit: "Minimum: 21 years. Maximum: General 32, OBC 35, SC/ST 37 (as per notification).",
      education: [
        "Must have a graduation degree (any discipline) from a recognised university.",
        "Final-year students may apply provisionally, subject to proof of passing (as per notification).",
      ],
      attempts:
        "General: 6 attempts. OBC: 9 attempts. SC/ST: Unlimited (till age limit), as per latest rules.",
    },
    pattern: [
      { label: "Papers", value: "Paper 1: General Studies (GS), Paper 2: CSAT" },
      { label: "Mode", value: "Offline (OMR-based)" },
      { label: "Type", value: "Objective (MCQ)" },
      { label: "Duration", value: "2 hours each (same day)" },
      { label: "Marks", value: "200 + 200 (CSAT qualifying)" },
      { label: "Negative marking", value: "1/3rd in GS Paper 1 (wrong answers)" },
      { label: "CSAT qualifying", value: "33% (66 marks)" },
      { label: "Sectional cutoff", value: "No" },
    ],
    patternBreakdown: [
      { section: "Paper 1: General Studies (GS)", marks: 200, questions: 100 },
      { section: "Paper 2: CSAT (GS II)", marks: 200, questions: 80 },
    ],
    syllabusSummary: [
      "GS Paper 1: History (Ancient/Medieval/Modern), Freedom Struggle, important personalities",
      "GS Paper 1: Geography (Physical, Indian, World)",
      "GS Paper 1: Polity (Constitution, Governance, Parliament, Judiciary)",
      "GS Paper 1: Economy (basic concepts, Budget & Economic Survey, Banking, Inflation)",
      "GS Paper 1: Environment (Biodiversity, Climate change, Conservation)",
      "GS Paper 1: Science & Tech (Space, IT, Biotechnology, recent developments)",
      "GS Paper 1: Current Affairs (National & International events, Government schemes)",
      "CSAT: Reading comprehension, logical reasoning, analytical ability, data interpretation, basic mathematics (Class 10 level)",
    ],
    preparationTips: [
      "Build strong basics with NCERTs (Class 6–12) across subjects.",
      "Treat current affairs as daily work: newspaper + monthly compilations.",
      "Practice MCQs daily: PYQs + regular mock tests; review mistakes.",
      "Revise multiple times — revision is the key to clearing Prelims.",
      "Time management: practice 100 questions in 2 hours; focus on accuracy.",
      "Avoid common mistakes: ignoring CSAT, not revising, too many sources, skipping PYQs, poor time management.",
      "Smart tips: use elimination technique, attempt only accurate questions, stay consistent, and take full-length mocks.",
    ],
    practiceLinks: {
      topicWisePyqs: "/upsc-prelims",
      dpp: "/upsc-prelims/daily-practice",
      topicWiseTests: "/mock-test/upsc-prelims",
      mockTests: "/mock-test/upsc-prelims",
    },
    newsLinks: {
      examUpdates: "/article/news?tag=upsc",
      importantNotices: "/article/news?tag=upsc-notice",
    },
    jobsLinks: null,
    faqs: [
      {
        q: "Is UPSC Prelims tough?",
        a: "Yes, it is highly competitive due to the vast syllabus and unpredictable questions.",
      },
      {
        q: "Is CSAT paper qualifying?",
        a: "Yes, CSAT is qualifying; you must score at least 33% marks in Paper II.",
      },
      {
        q: "Can I clear Prelims in first attempt?",
        a: "Yes, with proper strategy, consistency, and sufficient practice with PYQs and mocks.",
      },
      {
        q: "How many hours should I study daily?",
        a: "Ideally 6–8 hours of focused study (quality matters more than raw hours).",
      },
      {
        q: "Are NCERTs enough for Prelims?",
        a: "They build the foundation, but you’ll typically need standard books plus current affairs for full coverage.",
      },
      {
        q: "Is coaching necessary?",
        a: "No. Many candidates clear with self-study, the right resources, and consistent mock test practice.",
      },
      {
        q: "How important are mock tests?",
        a: "Very important — they improve accuracy, speed, and exam temperament; analysis is crucial.",
      },
      {
        q: "What is negative marking?",
        a: "In GS Paper 1, 1/3rd of the marks for a question are deducted for each wrong answer.",
      },
      {
        q: "How many times can I attempt UPSC Prelims?",
        a: "General: 6 attempts, OBC: 9, SC/ST: unlimited (till age limit), subject to latest UPSC rules.",
      },
    ],
    updates: [
      {
        id: "u1",
        title: "UPSC calendar indicates prelims in late May 2026",
        summary: "Exact date will be confirmed in the official CSE notification.",
        date: "Jun 2025",
        type: "Schedule",
      },
      {
        id: "u2",
        title: "Revised pattern rumors dismissed by UPSC",
        summary:
          "No official announcement on pattern change; rely only on UPSC notifications.",
        date: "May 2025",
        type: "Clarification",
      },
    ],
    importantDates: [
      {
        label: "Notification",
        value: "February 2026 (expected)",
      },
      {
        label: "Application form",
        value: "Feb–March 2026 (expected)",
      },
      {
        label: "Exam date",
        value: "May/June 2026 (expected)",
      },
      {
        label: "Result",
        value: "June/July 2026 (expected)",
      },
    ],
  },

  bitsat: {
    slug: "bitsat",
    name: "BITSAT 2026: Complete Guide",
    shortName: "BITSAT",
    heroTagline:
      "Complete guide to BITSAT 2026 exam pattern, eligibility, syllabus, fees, preparation strategy, and FAQs.",
    overview: {
      level: "National-level entrance examination",
      conductingBody: "BITS Pilani",
      frequency: "Annual",
      mode: "Online (Computer Based Test - CBT)",
      officialSite: "https://www.bitsadmission.com",
    },
    about: `The Birla Institute of Technology and Science Admission Test (BITSAT) is one of India's most competitive private engineering entrance exams.

It is conducted by BITS Pilani for admission to B.E., B.Pharm, and Integrated M.Sc. programs at BITS Pilani, Goa, and Hyderabad campuses.

BITSAT is a speed-based and accuracy-driven exam. Candidates must balance conceptual clarity with fast problem solving to score well.`,
    highlights: [
      "Admission gateway to BITS Pilani, Goa, and Hyderabad campuses",
      "Fully online exam with 140 questions across PCM/PCB + English + Logical Reasoning",
      "Marking: +3 for correct, -1 for incorrect",
      "Bonus 12 questions unlocked after attempting all 140 questions",
      "No reservation policy; merit-based admissions",
    ],
    importantDates: [
      { label: "Application start", value: "January 2026 (expected)" },
      { label: "Last date to apply", value: "April 2026 (expected)" },
      { label: "Slot booking", value: "April-May 2026 (expected)" },
      { label: "Admit card release", value: "May 2026 (expected)" },
      { label: "Exam dates", value: "May-June 2026 (expected)" },
      { label: "Result", value: "June 2026 (expected)" },
    ],
    eligibility: {
      nationality:
        "Indian and eligible international applicants, as per the latest BITS admission brochure.",
      ageLimit:
        "No separate age limit is generally specified; candidates must satisfy passing-year criteria in official notification.",
      education: [
        "Must have passed Class 12 (10+2) from a recognized board.",
        "For B.E.: Physics, Chemistry, and Mathematics required in Class 12.",
        "For B.Pharm: Physics, Chemistry, and Biology required in Class 12.",
        "Minimum marks: 75% aggregate in PCM/PCB and at least 60% individually in each subject.",
        "Students who passed Class 12 earlier than the previous year are generally not eligible (as per notification).",
      ],
      attempts: "One attempt per year.",
    },
    application: {
      portalName: "BITS Admissions Portal",
      portalUrl: "https://www.bitsadmission.com",
      steps: [
        "Visit the official BITS admissions website and register with email/mobile.",
        "Fill personal, academic, and program preferences in the application form.",
        "Upload required documents such as photograph and signature.",
        "Pay application fee based on category/session choices.",
        "Submit and download confirmation page for reference.",
      ],
    },
    pattern: [
      { label: "Mode", value: "Online (CBT)" },
      { label: "Duration", value: "3 hours" },
      { label: "Total questions", value: "140" },
      { label: "Question type", value: "Objective (MCQ)" },
      { label: "Marking scheme", value: "+3 correct, -1 wrong" },
      { label: "Bonus questions", value: "12 extra after attempting all 140" },
    ],
    patternBreakdown: [
      { section: "Physics", marks: 90, questions: 30 },
      { section: "Chemistry", marks: 90, questions: 30 },
      { section: "English Proficiency + Logical Reasoning", marks: 120, questions: 40 },
      { section: "Mathematics/Biology", marks: 120, questions: 40 },
    ],
    syllabusSummary: [
      "Physics: Mechanics, Thermodynamics, Electromagnetism, Optics, Modern Physics",
      "Chemistry: Physical Chemistry, Organic Chemistry, Inorganic Chemistry",
      "Mathematics: Algebra, Trigonometry, Calculus, Coordinate Geometry",
      "English Proficiency: Grammar, Vocabulary, Reading comprehension",
      "Logical Reasoning: Analytical reasoning, verbal and non-verbal logic, puzzles",
      "Syllabus is largely based on NCERT Class 11 and 12 with application-oriented questions",
    ],
    fees: [
      { label: "Male candidates", value: "INR 3400-INR 5400 (expected, session-dependent)" },
      { label: "Female candidates", value: "INR 2900-INR 4400 (expected, session-dependent)" },
      { label: "Both sessions", value: "Higher combined fee (as per official notification)" },
    ],
    campuses: [
      {
        name: "BITS Pilani (Rajasthan)",
        notes: ["Oldest and most prestigious campus", "Strong placements and alumni network"],
      },
      {
        name: "BITS Goa",
        notes: ["Strong tech culture", "Vibrant campus and student life"],
      },
      {
        name: "BITS Hyderabad",
        notes: ["Modern infrastructure", "Growing placements and research ecosystem"],
      },
    ],
    courses: {
      bePrograms: [
        "Computer Science",
        "Electronics and Communication",
        "Mechanical Engineering",
        "Civil Engineering",
        "Chemical Engineering",
      ],
      mscPrograms: ["Physics", "Chemistry", "Mathematics", "Economics", "Biology"],
      bpharmPrograms: ["B.Pharm"],
    },
    cutoffTrends: [
      { course: "Computer Science", range: "320-390" },
      { course: "Electronics", range: "290-330" },
      { course: "Mechanical", range: "250-300" },
      { course: "Civil", range: "220-260" },
    ],
    preparationTips: [
      "Master NCERT fundamentals first, especially for Chemistry and core concepts.",
      "Practice for speed and accuracy through regular timed mocks.",
      "Attempt full-length tests and analyze errors after every mock.",
      "Continuously revise weak areas and build short revision notes.",
      "Use quality resources: standard BITSAT guides, PYQs, and reliable mock platforms.",
    ],
    comparison: [
      { feature: "Mode", bitsat: "Online", jee: "Offline + Online" },
      { feature: "Speed requirement", bitsat: "Very high", jee: "Moderate" },
      { feature: "Difficulty", bitsat: "Moderate", jee: "High" },
      { feature: "English + LR", bitsat: "Yes", jee: "No" },
      { feature: "Bonus questions", bitsat: "Yes", jee: "No" },
    ],
    advantages: [
      "No reservation-based seat allocation (merit-focused admissions)",
      "Flexible academic structure across BITS campuses",
      "Practice School (PS) internships integrated in curriculum",
      "Excellent placements and industry exposure",
      "Strong alumni network with global opportunities",
    ],
    practiceLinks: {
      topicWisePyqs: "/bitsat",
      dpp: "/bitsat/daily-practice",
      topicWiseTests: "/mock-test/bitsat",
      mockTests: "/mock-test/bitsat",
    },
    newsLinks: {
      examUpdates: "/article/news?tag=bitsat",
      importantNotices: "/article/news?tag=bitsat-notice",
    },
    jobsLinks: null,
    updates: [
      {
        id: "bitsat-u1",
        title: "BITSAT 2026 admission bulletin expected in early 2026",
        summary:
          "Candidates should track official portal for session dates, fee details, and updated eligibility clauses.",
        date: "Jan 2026",
        type: "Notification",
      },
      {
        id: "bitsat-u2",
        title: "Slot booking window likely to open in April-May",
        summary:
          "Slots are allotted on first-come-first-serve basis, so early booking is recommended.",
        date: "Apr 2026",
        type: "Admit Card/Slot",
      },
    ],
    faqs: [
      {
        q: "Is BITSAT easier than JEE?",
        a: "Generally yes in conceptual depth, but BITSAT is highly speed-driven and accuracy-dependent.",
      },
      {
        q: "Can I appear for both JEE and BITSAT?",
        a: "Yes, many candidates take both exams.",
      },
      {
        q: "How many attempts are allowed for BITSAT?",
        a: "One attempt per year.",
      },
      {
        q: "Is calculator allowed in BITSAT exam?",
        a: "No, physical and virtual calculators are not allowed.",
      },
      {
        q: "What is considered a good BITSAT score?",
        a: "300+ is good, 330+ is very good, and 350+ is considered excellent (varies by year and branch).",
      },
    ],
  },

  "jee-main": {
    slug: "jee-main",
    name: "JEE Main 2026: Complete Guide",
    shortName: "JEE Main",
    heroTagline:
      "Complete guide to JEE Main 2026 exam pattern, eligibility, syllabus, dates, preparation strategy, and FAQs.",
    overview: {
      level: "National-level undergraduate entrance examination",
      conductingBody: "National Testing Agency (NTA)",
      frequency: "Twice a year (Session 1 and Session 2)",
      mode: "Computer Based Test (CBT)",
      officialSite: "https://jeemain.nta.nic.in",
    },
    about: `JEE Main is India's most popular and competitive engineering entrance exam.

It is conducted by NTA for admission to NITs, IIITs, and GFTIs, and also serves as the qualifying exam for JEE Advanced.

JEE Main evaluates conceptual understanding, speed, and accuracy across Physics, Chemistry, and Mathematics.`,
    highlights: [
      "Gateway to NITs, IIITs, and GFTIs",
      "Qualifying exam for JEE Advanced",
      "Two sessions every year; best score is considered for rank",
      "Percentile-based normalization across shifts",
      "Paper 1 (B.E./B.Tech) includes MCQ + numerical questions",
    ],
    importantDates: [
      { label: "Session 1 application start", value: "November 2025 (expected)" },
      { label: "Session 1 last date", value: "December 2025 (expected)" },
      { label: "Session 1 admit card", value: "January 2026 (expected)" },
      { label: "Session 1 exam dates", value: "January 2026 (expected)" },
      { label: "Session 1 result", value: "February 2026 (expected)" },
      { label: "Session 2 application start", value: "February 2026 (expected)" },
      { label: "Session 2 last date", value: "March 2026 (expected)" },
      { label: "Session 2 admit card", value: "April 2026 (expected)" },
      { label: "Session 2 exam dates", value: "April 2026 (expected)" },
      { label: "Session 2 result", value: "April 2026 (expected)" },
    ],
    eligibility: {
      nationality:
        "Indian and eligible foreign candidates as per NTA information bulletin.",
      ageLimit: "No age limit (as per latest rules).",
      education: [
        "Must have passed or be appearing in Class 12 (10+2).",
        "Physics and Mathematics are mandatory subjects.",
        "One of Chemistry/Biology/Technical Vocational Subject is required.",
      ],
      attempts:
        "Maximum 3 consecutive years with 2 sessions per year (up to 6 attempts).",
    },
    application: {
      portalName: "NTA JEE Main Portal",
      portalUrl: "https://jeemain.nta.nic.in",
      steps: [
        "Visit official NTA JEE Main website and register with email/mobile.",
        "Fill personal, academic, and exam city preferences.",
        "Upload photograph, signature, and required documents.",
        "Pay application fee as per category and session choices.",
        "Submit and download confirmation page for future use.",
      ],
    },
    pattern: [
      { label: "Papers", value: "Paper 1 (B.E./B.Tech), Paper 2A (B.Arch), Paper 2B (B.Planning)" },
      { label: "Mode", value: "Computer Based Test (CBT)" },
      { label: "Sessions", value: "2 sessions per year" },
      { label: "Paper 1 questions", value: "75 (Physics 25, Chemistry 25, Mathematics 25)" },
      { label: "Paper 1 total marks", value: "300" },
      { label: "Question types", value: "MCQ + Numerical value questions" },
      { label: "Marking scheme", value: "+4 correct, -1 incorrect (MCQ); no negative in some numerical questions" },
    ],
    patternBreakdown: [
      { section: "Physics", marks: 100, questions: 25 },
      { section: "Chemistry", marks: 100, questions: 25 },
      { section: "Mathematics", marks: 100, questions: 25 },
    ],
    syllabusSummary: [
      "Physics: Mechanics, Thermodynamics, Electrodynamics, Optics, Modern Physics",
      "Chemistry: Physical Chemistry, Organic Chemistry, Inorganic Chemistry",
      "Mathematics: Algebra, Calculus, Coordinate Geometry, Trigonometry, Vectors and 3D Geometry",
      "Syllabus is aligned with NCERT Class 11 and 12, with deeper problem-solving level than boards",
    ],
    normalization: [
      "JEE Main is conducted in multiple shifts and sessions.",
      "NTA converts raw scores to percentile scores through normalization.",
      "Final rank uses best percentile across sessions.",
      "AIR is typically generated after Session 2 results.",
    ],
    fees: [
      { label: "General category", value: "INR 1000-INR 2000 (expected, session-dependent)" },
      { label: "Reserved categories", value: "Lower fee as per NTA notification" },
      { label: "Both sessions", value: "Higher combined fee" },
    ],
    resultInfo: [
      "Result is released in percentile format.",
      "Top approximately 2.5 lakh candidates qualify for JEE Advanced (as per yearly criteria).",
      "Counselling for NIT/IIIT/GFTI admissions is done through JoSAA/CSAB process.",
    ],
    cutoffTrends: [
      { category: "General", percentile: "88-92" },
      { category: "OBC", percentile: "70-75" },
      { category: "SC", percentile: "45-50" },
      { category: "ST", percentile: "35-40" },
    ],
    colleges: [
      {
        name: "NITs (National Institutes of Technology)",
        notes: ["Highly reputed government institutes", "Excellent placements and alumni network"],
      },
      {
        name: "IIITs (Indian Institutes of Information Technology)",
        notes: ["Strong IT and CS focus", "Industry-oriented curriculum"],
      },
      {
        name: "GFTIs (Government Funded Technical Institutes)",
        notes: ["Affordable education", "Good infrastructure and opportunities"],
      },
    ],
    comparison: [
      { feature: "Level", main: "Moderate to Difficult", advanced: "Very Difficult" },
      { feature: "Purpose", main: "NITs/IIITs/GFTIs", advanced: "IIT admissions" },
      { feature: "Attempts", main: "Up to 6", advanced: "2" },
      { feature: "Conducting body", main: "NTA", advanced: "IITs (rotational)" },
    ],
    preparationTips: [
      "Build strong fundamentals first; NCERT should be your base.",
      "Practice previous year questions and topic-wise tests daily.",
      "Take full-length mocks regularly and analyze mistakes deeply.",
      "Use strict time management while solving mixed-subject papers.",
      "Keep short notes and revise formulas/concepts daily.",
    ],
    recommendedBooks: [
      "NCERT (Physics, Chemistry, Mathematics)",
      "H.C. Verma - Physics",
      "O.P. Tandon - Chemistry",
      "Cengage / Arihant series - Mathematics",
    ],
    commonMistakes: [
      "Ignoring NCERT fundamentals",
      "Skipping regular mock tests",
      "Poor time management during tests",
      "Inconsistent revision",
      "Over-reliance on coaching without self-practice",
    ],
    practiceLinks: {
      topicWisePyqs: "/jee-main",
      dpp: "/jee-main/daily-practice",
      topicWiseTests: "/mock-test/jee-main",
      mockTests: "/mock-test/jee-main",
    },
    newsLinks: {
      examUpdates: "/article/news?tag=jee-main",
      importantNotices: "/article/news?tag=jee-main-notice",
    },
    jobsLinks: null,
    updates: [
      {
        id: "jee-main-u1",
        title: "Session 1 notification expected in late 2025",
        summary:
          "NTA is expected to release detailed bulletin with schedule, fees, and syllabus references.",
        date: "Nov 2025",
        type: "Notification",
      },
      {
        id: "jee-main-u2",
        title: "Session 2 expected in April 2026",
        summary:
          "Candidates can improve score in second session; best percentile is considered for rank.",
        date: "Apr 2026",
        type: "Session Update",
      },
    ],
    faqs: [
      {
        q: "Is JEE Main very difficult?",
        a: "It is moderately difficult, but high competition makes it challenging.",
      },
      {
        q: "Can I crack JEE Main without coaching?",
        a: "Yes, with strong strategy, consistency, PYQ practice, and disciplined revision.",
      },
      {
        q: "Which session is better for JEE Main?",
        a: "Both sessions are equally valid; best score is considered.",
      },
      {
        q: "What is considered a good score in JEE Main?",
        a: "150+ good, 200+ very good, and 250+ excellent (varies year to year).",
      },
      {
        q: "Is NCERT enough for JEE Main?",
        a: "NCERT is essential, especially for Chemistry; Physics and Mathematics need extra problem practice.",
      },
    ],
  },
};

