import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { action, examCategory, testConfig, questionIds, selectedYear, selectedCategory, selectedSubject } = await request.json();

    if (action === 'create-yearwise-test') {
      try {
        // Import Supabase client
        const { createClient } = require('@supabase/supabase-js');
        
        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return NextResponse.json({ 
            success: false, 
            error: 'Supabase configuration missing. Please check your environment variables.' 
          });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Generate unique test ID
        const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Create test configuration
        const testData = {
          _id: testId,
          examCategory: examCategory,
          testName: testConfig.testName,
          testType: 'yearwise',
          duration: testConfig.duration,
          totalMarks: testConfig.totalMarks,
          passingMarks: testConfig.passingMarks,
          instructions: testConfig.instructions,
          questionCount: questionIds.length,
          selectedYear: selectedYear,
          selectedCategory: selectedCategory,
          selectedSubject: selectedSubject,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Insert test into mock_tests table
        const { data: insertData, error: insertError } = await supabase
          .from('mock_tests')
          .insert([{
            name: testData.testName,
            description: `Year-wise test for ${selectedYear || 'all years'}`,
            duration: testData.duration,
            total_questions: testData.questionCount,
            difficulty: 'mixed',
            is_active: true,
            created_by: 'admin', // Add the required created_by field
            category: examCategory.toUpperCase() // Add category from examCategory params in uppercase
          }])
          .select();

        if (insertError) {
          console.error('Test insert error:', insertError);
          console.error('Test data being inserted:', {
            name: testData.testName,
            description: `Year-wise test for ${selectedYear || 'all years'}`,
            duration: testData.duration,
            total_questions: testData.questionCount,
            difficulty: 'mixed',
            is_active: true,
            created_by: 'admin',
            category: examCategory.toUpperCase()
          });
          return NextResponse.json({ 
            success: false, 
            error: `Test creation failed: ${insertError.message || insertError.details || 'Unknown database error'}` 
          });
        }

        // Get the inserted test ID
        const insertedTestId = insertData[0].id;

        // Create test questions mapping
        const testQuestions = questionIds.map((questionId, index) => ({
          test_id: insertedTestId,
          question_id: questionId,
          question_order: index + 1,
          subject: selectedSubject || 'general',
          topic: selectedCategory || 'general',
          difficulty: 'medium'
        }));

        // Insert test questions into mock_test_questions table
        const { data: questionsData, error: questionsError } = await supabase
          .from('mock_test_questions')
          .insert(testQuestions)
          .select();

        if (questionsError) {
          console.error('Test questions insert error:', questionsError);
          console.error('First test question being inserted:', testQuestions[0]);
          // Try to delete the test if questions insertion fails
          await supabase.from('mock_tests').delete().eq('id', insertedTestId);
          return NextResponse.json({ 
            success: false, 
            error: `Test questions creation failed: ${questionsError.message || questionsError.details || 'Unknown database error'}` 
          });
        }

        console.log(`Successfully created test "${testConfig.testName}" with ${questionIds.length} questions`);
        
        return NextResponse.json({
          success: true,
          testId: insertedTestId,
          testName: testConfig.testName,
          questionCount: questionIds.length,
          message: `Test "${testConfig.testName}" created successfully with ${questionIds.length} questions`
        });

      } catch (dbError) {
        console.error('Database operation error:', dbError);
        return NextResponse.json({ 
          success: false, 
          error: `Database operation failed: ${dbError.message}` 
        });
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    });

  } catch (error) {
    console.error('Create test API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
