# GATE CSE Mock Test System - Setup Guide

## 🚀 Complete Setup Instructions

### 1. Database Setup (Supabase)

1. **Go to your Supabase Dashboard**
   - Navigate to your project
   - Go to SQL Editor

2. **Run the Database Setup Script**
   - Copy the contents of `supabase_setup.sql`
   - Paste and execute in the SQL Editor
   - This will create all necessary tables and policies

3. **Verify Tables Created**
   - Check that `gate_cse_tests` and `gate_cse_test_instances` tables exist
   - Verify RLS policies are in place

### 2. Environment Variables

Make sure your `.env.local` file has these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. GATE CSE Questions Setup

The system uses your existing `examtracker` table. Make sure you have GATE CSE questions:

1. **Check Existing Questions**
   ```sql
   SELECT * FROM examtracker WHERE category = 'GATE_CSE' LIMIT 5;
   ```

2. **If No GATE CSE Questions Exist**
   - Add questions to the `examtracker` table
   - Use category = 'GATE_CSE'
   - Include fields: question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty

### 4. Test the System

#### Admin Access (jain10gunjan@gmail.com)
1. **Visit Admin Dashboard**: `/gate-cse/mock-test/admin`
2. **Create a Test**: Click "Create New Test"
3. **Configure Test**: Set name, questions, duration, etc.
4. **Save Test**: Click "Create Test"

#### Student Access
1. **Visit Student Dashboard**: `/gate-cse/mock-test`
2. **View Available Tests**: See tests created by admin
3. **Take a Test**: Click "Start Test" on any available test
4. **View Results**: After completion, see detailed analytics

## 📁 File Structure

```
src/app/gate-cse/mock-test/
├── page.js (Student Dashboard)
├── admin/
│   ├── page.js (Admin Dashboard)
│   └── create/page.js (Test Creation)
├── attempt/[testId]/page.js (Test Taking)
└── results/[instanceId]/page.js (Results)

src/app/api/gate-cse/mock-test/
├── available/route.js (Available Tests)
├── [testId]/route.js (Test Details)
├── [testId]/questions/route.js (Test Questions)
├── submit/route.js (Submit Test)
├── results/[instanceId]/route.js (View Results)
└── admin/
    ├── create/route.js (Create Test)
    ├── tests/route.js (Admin Tests)
    └── questions/route.js (Question Management)

src/app/lib/
└── gateTestUtils.js (Utility Functions)

supabase_setup.sql (Database Setup)
```

## 🔧 Key Features

### Admin Features
- ✅ Create custom GATE CSE mock tests
- ✅ Configure subject weightage
- ✅ Set difficulty levels
- ✅ Manage test duration and questions
- ✅ View test analytics

### Student Features
- ✅ Browse available tests
- ✅ Take full-length mock tests
- ✅ Real-time timer and progress tracking
- ✅ Question navigation
- ✅ Detailed results and analytics
- ✅ Subject-wise performance breakdown
- ✅ Rank estimation

### Technical Features
- ✅ Supabase integration
- ✅ Real-time data persistence
- ✅ Row Level Security (RLS)
- ✅ Responsive UI with Tailwind CSS
- ✅ MathJax support for mathematical expressions
- ✅ Comprehensive error handling

## 🎯 Usage Flow

### Admin Workflow
1. **Login** as `jain10gunjan@gmail.com`
2. **Create Test** with custom configuration
3. **Configure** subject weightage and difficulty
4. **Publish** test for students

### Student Workflow
1. **Browse** available tests
2. **Start** a test
3. **Answer** questions with timer
4. **Submit** test
5. **View** detailed results and analytics

## 🛠️ Troubleshooting

### Common Issues

1. **"No questions found" Error**
   - Ensure `examtracker` table has GATE_CSE questions
   - Check category field is exactly 'GATE_CSE'

2. **"Test not found" Error**
   - Verify test exists in `gate_cse_tests` table
   - Check `is_active` field is true

3. **Authentication Issues**
   - Ensure user is logged in
   - Check admin email is exactly `jain10gunjan@gmail.com`

4. **Database Connection Issues**
   - Verify Supabase URL and keys in `.env.local`
   - Check RLS policies are properly set

### Database Queries for Debugging

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'gate_cse%';

-- Check test data
SELECT * FROM gate_cse_tests;

-- Check test instances
SELECT * FROM gate_cse_test_instances;

-- Check GATE CSE questions
SELECT COUNT(*) FROM examtracker WHERE category = 'GATE_CSE';
```

## 🚀 Production Deployment

1. **Update Environment Variables**
   - Set production Supabase URL and keys
   - Update `NEXT_PUBLIC_BASE_URL`

2. **Run Database Setup**
   - Execute `supabase_setup.sql` on production database

3. **Deploy Application**
   - Deploy to your hosting platform (Vercel, Netlify, etc.)

4. **Test End-to-End**
   - Create a test as admin
   - Take test as student
   - Verify results and analytics

## 📊 Analytics & Insights

The system provides:
- **Overall Performance**: Score, accuracy, time
- **Subject-wise Analysis**: Performance by GATE CSE subjects
- **Difficulty Breakdown**: Questions by difficulty level
- **Rank Estimation**: Percentile-based ranking
- **Time Analytics**: Average time per question

## 🔐 Security Features

- **Row Level Security (RLS)** enabled
- **Admin-only test creation**
- **User-specific result access**
- **Input validation** on all forms
- **Error handling** throughout the system

## 🎉 Ready to Use!

Your GATE CSE Mock Test system is now fully functional with:
- ✅ Complete admin interface
- ✅ Student test-taking platform
- ✅ Real-time analytics
- ✅ Supabase integration
- ✅ Production-ready code

Start creating tests and helping students prepare for GATE CSE!
