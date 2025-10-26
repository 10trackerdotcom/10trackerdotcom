"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from "@supabase/supabase-js";
import { 
  Save, 
  Settings, 
  BookOpen, 
  Clock, 
  BarChart3,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Plus,
  Zap,
  Users,
  Target
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import QuestionSelector from '@/components/QuestionSelector';
import SelectedQuestions from '@/components/SelectedQuestions';
import QuestionEditor from '@/components/QuestionEditor';

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CreateTestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [testConfig, setTestConfig] = useState({
    name: '',
    description: '',
    totalQuestions: 65,
    duration: 180,
    difficulty: 'mixed',
    includeGeneralAptitude: true,
    includeEngineeringMath: true,
    customWeightage: false,
    weightageConfig: [],
    category: 'GATE-CSE',
    creationMode: 'manual' // 'manual' or 'auto'
  });

  // Check if user is admin
  const isAdmin = user?.email === 'jain10gunjan@gmail.com';

  // Fetch subjects and topics from API
  useEffect(() => {
    const fetchTopicsAndSubjects = async () => {
      try {
        const response = await fetch('/api/gate-cse/mock-test/admin/topics');
        const data = await response.json();
        
        if (data.success) {
          setAvailableSubjects(data.subjects);
          setAvailableTopics(data.topics);
          setSubjects(data.subjects);
          
          // Calculate even weightage
          const defaultWeightage = data.subjects.map(subject => ({
            subject: subject,
            percent: Math.round((100 / data.subjects.length) * 10) / 10
          }));

          setTestConfig(prev => ({
            ...prev,
            weightageConfig: defaultWeightage
          }));
        }
      } catch (error) {
        console.error('Error fetching topics and subjects:', error);
        toast.error('Failed to load subjects and topics');
      }
    };

    if (user && isAdmin) {
      fetchTopicsAndSubjects();
    }
  }, [user, isAdmin]);

  // Calculate question distribution for auto mode
  const calculateQuestionDistribution = useCallback(() => {
    if (!testConfig.customWeightage || testConfig.creationMode === 'manual') {
      return [];
    }
    
    const totalWeight = testConfig.weightageConfig.reduce((sum, item) => sum + item.percent, 0);
    
    if (totalWeight === 0) return [];
    
    const normalizedConfig = testConfig.weightageConfig.map(item => ({
      subject: item.subject,
      percent: (item.percent / totalWeight) * 100
    }));

    return normalizedConfig.map(subject => ({
      subject: subject.subject,
      count: Math.round((subject.percent / 100) * testConfig.totalQuestions)
    }));
  }, [testConfig.weightageConfig, testConfig.customWeightage, testConfig.creationMode]);

  // Handle question selection toggle
  const handleQuestionToggle = useCallback((question, action) => {
    if (action === 'add') {
      setSelectedQuestions(prev => [...prev, question]);
    } else {
      setSelectedQuestions(prev => prev.filter(q => q._id !== question._id));
    }
  }, []);

  // Handle question removal
  const handleQuestionRemove = useCallback((question, index) => {
    setSelectedQuestions(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handle question reordering
  const handleQuestionReorder = useCallback((fromIndex, toIndex) => {
    setSelectedQuestions(prev => {
      const newQuestions = [...prev];
      const [movedQuestion] = newQuestions.splice(fromIndex, 1);
      newQuestions.splice(toIndex, 0, movedQuestion);
      return newQuestions;
    });
  }, []);

  // Handle question editing
  const handleQuestionEdit = useCallback((question, index) => {
    setEditingQuestion({ ...question, index });
  }, []);

  // Handle question save
  const handleQuestionSave = useCallback((editedQuestion) => {
    setSelectedQuestions(prev => {
      const newQuestions = [...prev];
      newQuestions[editingQuestion.index] = editedQuestion;
      return newQuestions;
    });
    setEditingQuestion(null);
    toast.success('Question updated successfully');
  }, [editingQuestion]);

  // Fetch random questions for auto mode
  const fetchRandomQuestions = useCallback(async () => {
    try {
      const questionDistribution = calculateQuestionDistribution();
      let allQuestions = [];

      for (const dist of questionDistribution) {
        if (dist.count === 0) continue;
        
        const { data: allSubjectQuestions, error } = await supabase
          .from("examtracker")
          .select("_id, question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty, subject")
          .eq("category", 'GATE-CSE')
          .eq("subject", dist.subject);

        if (error) {
          console.error(`Error fetching ${dist.subject} questions:`, error);
          toast.error(`Error fetching ${dist.subject} questions`);
          continue;
        }

        if (!allSubjectQuestions || allSubjectQuestions.length === 0) {
          console.log(`No questions available for ${dist.subject}`);
          toast.error(`No questions available for ${dist.subject}`);
          continue;
        }

        const shuffled = allSubjectQuestions.sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, dist.count);
        allQuestions = [...allQuestions, ...selectedQuestions];
      }

      const finalQuestions = allQuestions.sort(() => Math.random() - 0.5);
      return finalQuestions;
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to fetch questions');
      return [];
    }
  }, [calculateQuestionDistribution]);

  // Handle test creation
  const handleCreateTest = async () => {
    if (!testConfig.name.trim()) {
      toast.error('Please enter a test name');
      return;
    }

    if (testConfig.creationMode === 'manual' && selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    if (testConfig.creationMode === 'auto') {
      const totalWeight = testConfig.weightageConfig.reduce((sum, item) => sum + item.percent, 0);
      if (testConfig.customWeightage && Math.abs(totalWeight - 100) > 0.1) {
        toast.error('Total weightage must equal 100%');
        return;
      }
    }

    setIsLoading(true);
    try {
      let questions = [];
      
      if (testConfig.creationMode === 'manual') {
        questions = selectedQuestions;
      } else {
        questions = await fetchRandomQuestions();
        if (!questions.length) {
          throw new Error('No questions available for auto mode');
        }
      }

      // Save test to database
      const testData = {
        name: testConfig.name,
        description: testConfig.description || '',
        duration: testConfig.duration,
        total_questions: questions.length,
        difficulty: testConfig.difficulty,
        category: testConfig.category,
        include_general_aptitude: testConfig.includeGeneralAptitude,
        include_engineering_math: testConfig.includeEngineeringMath,
        custom_weightage: testConfig.customWeightage,
        creation_mode: testConfig.creationMode,
        created_by: user.email,
        question_distribution: testConfig.creationMode === 'auto' ? calculateQuestionDistribution() : [],
        weightage_config: testConfig.weightageConfig,
        is_active: true
      };

      const { data: savedTest, error: testError } = await supabase
        .from('mock_tests')
        .insert(testData)
        .select()
        .single();

      if (testError) {
        console.error('Error saving test:', testError);
        throw new Error(`Failed to save test: ${testError.message}`);
      }

      // Save questions to database
      const testQuestions = questions.map((q, index) => ({
        test_id: savedTest.id,
        question_id: q._id,
        question_order: index + 1,
        subject: q.subject || 'Unknown',
        topic: q.topic || '',
        difficulty: q.difficulty || 'medium'
      }));

      const { error: questionsError } = await supabase
        .from('mock_test_questions')
        .insert(testQuestions);

      if (questionsError) {
        console.error('Error saving questions:', questionsError);
        await supabase.from('mock_tests').delete().eq('id', savedTest.id);
        throw new Error(`Failed to save questions: ${questionsError.message}`);
      }

      toast.success(`Test "${testConfig.name}" created successfully with ${questions.length} questions!`);
      
      // Reset form
      setTestConfig(prev => ({
        ...prev,
        name: '',
        description: '',
        weightageConfig: prev.weightageConfig.map(item => ({...item, percent: Math.round((100 / prev.weightageConfig.length) * 10) / 10}))
      }));
      setSelectedQuestions([]);
      
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error(error.message || 'Failed to create test');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setTestConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWeightageChange = (subject, newPercent) => {
    setTestConfig(prev => ({
      ...prev,
      weightageConfig: prev.weightageConfig.map(item =>
        item.subject === subject ? { ...item, percent: parseFloat(newPercent) || 0 } : item
      )
    }));
  };

  // Memoized values for better performance
  const questionDistribution = useMemo(() => calculateQuestionDistribution(), [calculateQuestionDistribution]);
  const canCreateTest = useMemo(() => {
    if (!testConfig.name.trim()) return false;
    if (testConfig.creationMode === 'manual') {
      return selectedQuestions.length > 0;
    }
    return true;
  }, [testConfig.name, testConfig.creationMode, selectedQuestions.length]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to access admin panel.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only admin users can access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Panel
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New GATE CSE Mock Test</h1>
          <p className="text-gray-600">Configure and create a new mock test with manual or automatic question selection</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Test Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Test Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                Basic Test Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    value={testConfig.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., GATE CSE Mock Test 2026 - Set 1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={testConfig.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the test..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Test Configuration */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-green-600" />
                Test Configuration
              </h3>
              <div className="space-y-4">
                {/* Creation Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Selection Mode
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleInputChange('creationMode', 'manual')}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        testConfig.creationMode === 'manual'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Manual Selection</div>
                      <div className="text-sm text-gray-600">Choose questions individually</div>
                    </button>
                    
                    <button
                      onClick={() => handleInputChange('creationMode', 'auto')}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        testConfig.creationMode === 'auto'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Zap className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Auto Generation</div>
                      <div className="text-sm text-gray-600">Generate based on weightage</div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Questions
                    </label>
                    <input
                      type="number"
                      value={testConfig.totalQuestions}
                      onChange={(e) => handleInputChange('totalQuestions', parseInt(e.target.value))}
                      min="10"
                      max="100"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={testConfig.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                      min="30"
                      max="300"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={testConfig.difficulty}
                      onChange={(e) => handleInputChange('difficulty', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="mixed">Mixed (Easy, Medium, Hard)</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Include Sections
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={testConfig.includeGeneralAptitude}
                          onChange={(e) => handleInputChange('includeGeneralAptitude', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">General Aptitude</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={testConfig.includeEngineeringMath}
                          onChange={(e) => handleInputChange('includeEngineeringMath', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Engineering Mathematics</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Weightage Configuration - Only show for auto mode */}
            {testConfig.creationMode === 'auto' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Subject Weightage Configuration
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Custom Weightage</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={testConfig.customWeightage}
                        onChange={(e) => handleInputChange('customWeightage', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  {testConfig.customWeightage && (
                    <div className="space-y-3">
                      {testConfig.weightageConfig.map((subject) => (
                        <div key={subject.subject} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={subject.percent}
                              onChange={(e) => handleWeightageChange(subject.subject, e.target.value)}
                              min="0"
                              max="100"
                              step="0.1"
                              className="w-20 p-2 border border-gray-300 rounded text-sm"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Manual Question Selection - Only show for manual mode */}
            {testConfig.creationMode === 'manual' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-orange-600" />
                    Question Selection
                  </h3>
                  <button
                    onClick={() => setShowQuestionSelector(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Questions</span>
                  </button>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  {selectedQuestions.length} of {testConfig.totalQuestions} questions selected
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((selectedQuestions.length / testConfig.totalQuestions) * 100, 100)}%` }}
                  ></div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{selectedQuestions.length}</div>
                    <div className="text-xs text-blue-600">Selected</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {testConfig.totalQuestions - selectedQuestions.length}
                    </div>
                    <div className="text-xs text-green-600">Remaining</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((selectedQuestions.length / testConfig.totalQuestions) * 100)}%
                    </div>
                    <div className="text-xs text-purple-600">Complete</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Preview and Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Test Preview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Test Preview
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Test Name</p>
                  <p className="font-medium">{testConfig.name || 'Untitled Test'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">{testConfig.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Questions</p>
                  <p className="font-medium">{testConfig.totalQuestions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Difficulty</p>
                  <p className="font-medium capitalize">{testConfig.difficulty}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Creation Mode</p>
                  <p className="font-medium capitalize">{testConfig.creationMode}</p>
                </div>
              </div>
            </div>

            {/* Question Distribution - Only show for auto mode */}
            {testConfig.creationMode === 'auto' && questionDistribution.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Question Distribution
                </h3>
                <div className="space-y-2">
                  {questionDistribution.map((item) => (
                    <div key={item.subject} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 truncate">{item.subject}</span>
                      <span className="text-sm font-medium text-gray-900">{item.count}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total</span>
                      <span>{questionDistribution.reduce((sum, item) => sum + item.count, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Questions Preview - Only show for manual mode */}
            {testConfig.creationMode === 'manual' && selectedQuestions.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Questions Preview</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedQuestions.slice(0, 5).map((question, index) => (
                    <div key={question._id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          {question.subject}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{question.question}</p>
                    </div>
                  ))}
                  {selectedQuestions.length > 5 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      +{selectedQuestions.length - 5} more questions
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Create Test Button */}
            <div className="bg-white rounded-lg shadow p-6">
              <button
                onClick={handleCreateTest}
                disabled={isLoading || !canCreateTest}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Test...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Test
                  </>
                )}
              </button>
              
              {!canCreateTest && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {!testConfig.name.trim() ? 'Please enter a test name' :
                   testConfig.creationMode === 'manual' && selectedQuestions.length === 0 ? 'Please select at least one question' :
                   'Please complete the test configuration'}
                </p>
              )}
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                {testConfig.creationMode === 'manual' 
                  ? 'This will create a test with your manually selected questions'
                  : 'This will create a test with auto-generated questions based on weightage'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Manual Mode: Selected Questions Management */}
        {testConfig.creationMode === 'manual' && (
          <div className="mt-8">
            <SelectedQuestions
              selectedQuestions={selectedQuestions}
              onQuestionRemove={handleQuestionRemove}
              onQuestionReorder={handleQuestionReorder}
              onQuestionEdit={handleQuestionEdit}
              maxQuestions={testConfig.totalQuestions}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showQuestionSelector && (
        <QuestionSelector
          selectedQuestions={selectedQuestions}
          onQuestionToggle={handleQuestionToggle}
          onClose={() => setShowQuestionSelector(false)}
          maxQuestions={testConfig.totalQuestions}
        />
      )}

      {editingQuestion && (
        <QuestionEditor
          question={editingQuestion}
          onSave={handleQuestionSave}
          onCancel={() => setEditingQuestion(null)}
          availableSubjects={availableSubjects}
          availableTopics={availableTopics}
        />
      )}

      <Toaster position="bottom-right" />
    </div>
  );
}