"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Plus, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const QuestionSelector = ({ 
  selectedQuestions, 
  onQuestionToggle, 
  onClose, 
  maxQuestions = 65 
}) => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    subject: 'all',
    topic: 'all',
    difficulty: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Memoized filter function for better performance
  const applyFilters = useCallback((questionsList, currentFilters) => {
    return questionsList.filter(question => {
      const matchesSubject = currentFilters.subject === 'all' || question.subject === currentFilters.subject;
      const matchesTopic = currentFilters.topic === 'all' || question.topic === currentFilters.topic;
      const matchesDifficulty = currentFilters.difficulty === 'all' || question.difficulty === currentFilters.difficulty;
      const matchesSearch = !currentFilters.search || 
        question.question.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        question.topic.toLowerCase().includes(currentFilters.search.toLowerCase());
      
      return matchesSubject && matchesTopic && matchesDifficulty && matchesSearch;
    });
  }, []);

  // Fetch available subjects and topics
  useEffect(() => {
    const fetchTopicsAndSubjects = async () => {
      try {
        const response = await fetch('/api/gate-cse/mock-test/admin/topics');
        const data = await response.json();
        
        if (data.success) {
          setAvailableSubjects(['all', ...data.subjects]);
          setAvailableTopics(['all', ...data.topics]);
        }
      } catch (error) {
        console.error(`Error fetching topics and subjects:`, error);
      }
    };

    fetchTopicsAndSubjects();
  }, []);

  // Fetch questions with current filters
  const fetchQuestions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
        excludeIds: selectedQuestions.map(q => q._id).join(',')
      });

      const response = await fetch(`/api/gate-cse/mock-test/admin/questions?${params}`);
      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions);
        setFilteredQuestions(data.questions);
        setPagination(prev => ({
          ...prev,
          page: data.pagination.page,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      } else {
        toast.error(data.error || 'Failed to fetch questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, selectedQuestions]);

  // Fetch questions when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchQuestions(1);
  }, [filters, fetchQuestions]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle question selection
  const handleQuestionToggle = (question) => {
    if (selectedQuestions.find(q => q._id === question._id)) {
      onQuestionToggle(question, 'remove');
    } else if (selectedQuestions.length < maxQuestions) {
      onQuestionToggle(question, 'add');
    } else {
      toast.error(`Maximum ${maxQuestions} questions allowed`);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchQuestions(newPage);
    }
  };

  // Memoized question cards for better performance
  const questionCards = useMemo(() => {
    return filteredQuestions.map(question => {
      const isSelected = selectedQuestions.find(q => q._id === question._id);
      const isDisabled = !isSelected && selectedQuestions.length >= maxQuestions;
      
      return (
        <div
          key={question._id}
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            isSelected 
              ? 'border-blue-500 bg-blue-50' 
              : isDisabled 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
          }`}
          onClick={() => !isDisabled && handleQuestionToggle(question)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {question.difficulty}
              </span>
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                {question.subject}
              </span>
            </div>
            {isSelected && (
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-700 line-clamp-3 mb-2">
            {question.question}
          </p>
          
          <div className="text-xs text-gray-500">
            <span className="font-medium">Topic:</span> {question.topic}
          </div>
        </div>
      );
    });
  }, [filteredQuestions, selectedQuestions, maxQuestions, handleQuestionToggle]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Select Questions</h2>
            <p className="text-sm text-gray-600">
              {selectedQuestions.length} of {maxQuestions} questions selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {showFilters ? <ChevronLeft className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={filters.subject}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableSubjects.map(subject => (
                    <option key={subject} value={subject}>
                      {subject === 'all' ? 'All Subjects' : subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <select
                  value={filters.topic}
                  onChange={(e) => handleFilterChange('topic', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableTopics.map(topic => (
                    <option key={topic} value={topic}>
                      {topic === 'all' ? 'All Topics' : topic}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Questions Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No questions found with current filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionCards}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-700">
              Showing page {pagination.page} of {pagination.totalPages} 
              ({pagination.total} total questions)
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                {pagination.page}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedQuestions.length} questions selected
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionSelector;
