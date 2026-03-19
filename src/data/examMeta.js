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
};

