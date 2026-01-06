'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  Search,
  Filter,
  Calendar,
  Tag,
  User,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';
import RichTextEditor from '@/components/RichTextEditor';
import { useArticleCategories, clearCategoriesCache } from '@/lib/hooks/useArticleCategories';
import EmbedManager from '@/components/EmbedManager';

const AdminArticlesPage = () => {
  const { user, isLoaded } = useUser();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Use shared hook for categories
  const { categories, refetch: refetchCategories } = useArticleCategories({ enabled: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    featured_image_url: '',
    is_featured: false,
    social_media_embeds: []
  });
  
  // Article generation state
  const [headline, setHeadline] = useState('');
  const [generatedArticle, setGeneratedArticle] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [copied, setCopied] = useState({});

  // Check if user is admin
  const isAdmin = user?.emailAddresses?.[0]?.emailAddress === 'jain10gunjan@gmail.com';

  // Fetch articles
  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?limit=50');
      const result = await response.json();
      if (result.success) {
        setArticles(result.data);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    // Temporarily removed admin check for testing
    // if (!isAdmin) {
    //   toast.error('Admin access required');
    //   return;
    // }

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          social_media_embeds: formData.social_media_embeds || []
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Article created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchArticles();
      } else {
        toast.error(result.error || 'Failed to create article');
      }
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error('Failed to create article');
    }
  };

  const handleUpdateArticle = async (e) => {
    e.preventDefault();
    // Temporarily removed admin check for testing
    // if (!isAdmin) {
    //   toast.error('Admin access required');
    //   return;
    // }

    try {
      const response = await fetch(`/api/articles/${editingArticle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          social_media_embeds: formData.social_media_embeds || []
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Article updated successfully');
        setEditingArticle(null);
        resetForm();
        fetchArticles();
      } else {
        toast.error(result.error || 'Failed to update article');
      }
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error('Failed to update article');
    }
  };

  const handleDeleteArticle = async (id) => {
    // Temporarily removed admin check for testing
    // if (!isAdmin) {
    //   toast.error('Admin access required');
    //   return;
    // }

    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Article deleted successfully');
        fetchArticles();
      } else {
        toast.error(result.error || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      tags: '',
      featured_image_url: '',
      is_featured: false,
      social_media_embeds: []
    });
  };

  const resetGenerateForm = () => {
    setHeadline('');
    setGeneratedArticle(null);
    setGenerateError(null);
    setCopied({});
  };

  const handleGenerateArticle = async () => {
    if (!headline.trim()) {
      setGenerateError('Please enter a headline');
      return;
    }

    setGenerating(true);
    setGenerateError(null);
    setGeneratedArticle(null);

    try {
      const response = await fetch('/api/generate-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ headline }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate article');
      }

      if (data.success) {
        setGeneratedArticle(data);
      } else {
        throw new Error(data.error || 'Failed to generate article');
      }
    } catch (err) {
      setGenerateError(err.message || 'An error occurred while generating the article');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseGeneratedArticle = () => {
    if (!generatedArticle?.data) return;

    // Populate form with generated content
    setFormData({
      title: generatedArticle.data.title,
      content: generatedArticle.data.articleHtml || generatedArticle.data.article,
      excerpt: generatedArticle.data.description,
      category: formData.category || '',
      tags: formData.tags || '',
      featured_image_url: formData.featured_image_url || '',
      is_featured: formData.is_featured || false,
      social_media_embeds: formData.social_media_embeds || []
    });

    // Close generate modal and open create modal
    setShowGenerateModal(false);
    setShowCreateModal(true);
    resetGenerateForm();
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => {
      setCopied({ ...copied, [key]: false });
    }, 2000);
  };

  const openEditModal = (article) => {
    setEditingArticle(article);
    
    // Handle social_media_embeds - ensure it's always an array
    let embeds = article.social_media_embeds;
    if (typeof embeds === 'string') {
      try {
        embeds = JSON.parse(embeds);
      } catch (e) {
        console.error('Failed to parse social_media_embeds:', e);
        embeds = [];
      }
    }
    if (!Array.isArray(embeds)) {
      embeds = [];
    }
    
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      category: article.category,
      tags: article.tags?.join(', ') || '',
      featured_image_url: article.featured_image_url || '',
      is_featured: article.is_featured || false,
      social_media_embeds: embeds
    });
    
    console.log('📝 Loading article for edit:', {
      id: article.id,
      title: article.title,
      embeds: embeds,
      embedsCount: embeds.length
    });
    
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingArticle(null);
    resetForm();
  };

  const closeGenerateModal = () => {
    setShowGenerateModal(false);
    resetGenerateForm();
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Authentication Required</h1>
          <p className="text-neutral-600 mb-6">Please sign in to access the admin panel.</p>
          <Link
            href="/sign-in"
            className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Access Denied</h1>
          <p className="text-neutral-600 mb-6">You don&apos;t have permission to access the admin panel.</p>
          <Link
            href="/"
            className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2">Article Management</h1>
          <p className="text-neutral-600">Manage your articles and content</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
              />
            </div>

            {/* Category Filter */}
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
              >
                <option value="">All Categories</option>
                {categories && Array.isArray(categories) && categories.map(category => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Generate Article
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Article
              </button>
            </div>
          </div>
        </div>

        {/* Category Management */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Manage Categories</h2>
          </div>

          {/* Add Category */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = form.name.value.trim();
              const slug = form.slug.value.trim();
              const color = form.color.value.trim() || '#3B82F6';
              if (!name) return;
              try {
                const res = await fetch('/api/articles/categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, slug, color })
                });
                const result = await res.json();
                if (result.success) {
                  clearCategoriesCache();
                  await refetchCategories();
                  form.reset();
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6"
          >
            <input name="name" placeholder="Category name" className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 md:col-span-2" />
            <input name="slug" placeholder="slug (optional)" className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800" />
            <input name="color" placeholder="#3B82F6" className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800" />
            <button type="submit" className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700">Add</button>
          </form>

          {/* List Categories */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Slug</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Color</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {categories && Array.isArray(categories) && categories.map((cat) => (
                  <tr key={cat.slug}>
                    <td className="px-4 py-2 text-sm text-neutral-800">{cat.name}</td>
                    <td className="px-4 py-2 text-sm text-neutral-500">{cat.slug}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                        <span className="text-neutral-600">{cat.color}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete category "${cat.name}"?`)) return;
                          try {
                            const res = await fetch(`/api/articles/categories?slug=${encodeURIComponent(cat.slug)}`, { method: 'DELETE' });
                            const result = await res.json();
                            if (result.success) {
                              clearCategoriesCache();
                            await refetchCategories();
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="px-3 py-1 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Articles Table */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                            {article.title}
                            {article.is_featured && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-neutral-500 line-clamp-1">
                            {article.excerpt || article.content.substring(0, 100)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {article.category_name || article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {article.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {article.view_count || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {formatDate(article.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`/articles/${article.slug}`, '_blank')}
                          className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                          title="View Article"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(article)}
                          className="p-2 text-neutral-400 hover:text-blue-600 transition-colors"
                          title="Edit Article"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                          title="Delete Article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No articles found</h3>
            <p className="text-neutral-500 mb-6">
              {searchTerm || selectedCategory 
                ? 'Try adjusting your search or filters'
                : 'Create your first article to get started'
              }
            </p>
            {!searchTerm && !selectedCategory && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200"
              >
                Create Article
              </button>
            )}
          </div>
        )}
      </div>

      {/* Generate Article Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Generate Article with AI
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowGenerateModal(false);
                    resetGenerateForm();
                  }}
                  className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Enter Headline
                    </label>
                    <textarea
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Enter a news headline, e.g., 'India's GDP Growth Rate Reaches 7.8% in Q3 2024'"
                      className="w-full h-32 p-4 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleGenerateArticle}
                    disabled={generating || !headline.trim()}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Article...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Article
                      </>
                    )}
                  </button>
                  {generateError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {generateError}
                    </div>
                  )}
                </div>

                {/* Output Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Generated Article</h3>
                  {generatedArticle ? (
                    <div className="space-y-4">
                      {/* Meta Information */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-blue-900">Article Stats</span>
                          <span className="text-xs text-blue-700">
                            {generatedArticle.meta?.wordCount || 0} words
                          </span>
                        </div>
                        <div className="text-xs text-blue-700">
                          Expansions: {generatedArticle.meta?.expansionsUsed || 0} | 
                          Cost: {generatedArticle.cost?.realistic_range_inr || 'N/A'}
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-neutral-700">Title</label>
                          <button
                            onClick={() => handleCopy(generatedArticle.data.title, 'title')}
                            className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
                          >
                            {copied.title ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-semibold">
                          {generatedArticle.data.title}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-neutral-700">Description</label>
                          <button
                            onClick={() => handleCopy(generatedArticle.data.description, 'description')}
                            className="flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
                          >
                            {copied.description ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 text-sm">
                          {generatedArticle.data.description}
                        </div>
                      </div>

                      {/* Use Article Button */}
                      <button
                        onClick={handleUseGeneratedArticle}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Use This Article
                      </button>
                    </div>
                  ) : (
                    <div className="border border-neutral-300 rounded-lg p-8 text-center text-neutral-400">
                      Generated article will appear here
                    </div>
                  )}
                </div>
              </div>

              {/* Article Preview */}
              {generatedArticle && (
                <div className="mt-6 border-t border-neutral-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900">Article Preview</h3>
                    <button
                      onClick={() => handleCopy(generatedArticle.data.articleHtml || generatedArticle.data.article, 'articleHtml')}
                      className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 font-medium"
                    >
                      {copied.articleHtml ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied HTML!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy HTML
                        </>
                      )}
                    </button>
                  </div>
                  <div className="border border-neutral-300 rounded-lg p-6 bg-white">
                    <style dangerouslySetInnerHTML={{__html: `
                      .article-body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        line-height: 1.8;
                        color: #1f2937;
                      }
                      .article-body p {
                        margin-bottom: 1.5rem;
                        color: #374151;
                        font-size: 1rem;
                        line-height: 1.8;
                      }
                      .article-body p:last-child {
                        margin-bottom: 0;
                      }
                      .article-body h1, .article-body h2, .article-body h3 {
                        font-weight: 700;
                        margin-top: 2rem;
                        margin-bottom: 1rem;
                        color: #111827;
                      }
                      .article-body h1 {
                        font-size: 2rem;
                      }
                      .article-body h2 {
                        font-size: 1.75rem;
                      }
                      .article-body h3 {
                        font-size: 1.5rem;
                      }
                      .article-body ul, .article-body ol {
                        margin: 1.5rem 0;
                        padding-left: 1.75rem;
                      }
                      .article-body li {
                        margin-bottom: 0.75rem;
                        color: #374151;
                        line-height: 1.7;
                      }
                      .article-body strong {
                        font-weight: 700;
                        color: #111827;
                      }
                    `}} />
                    <div className="prose prose-lg max-w-none">
                      <h1 className="text-3xl font-bold mb-4 text-neutral-900">{generatedArticle.data.title}</h1>
                      <p className="text-lg text-neutral-600 mb-6 italic">{generatedArticle.data.description}</p>
                      <div 
                        className="article-content"
                        dangerouslySetInnerHTML={{ __html: generatedArticle.data.articleHtml || generatedArticle.data.article }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900">
                  {editingArticle ? 'Edit Article' : 'Create New Article'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={editingArticle ? handleUpdateArticle : handleCreateArticle} className="p-6">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                    placeholder="Enter article title"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                  >
                    <option value="">Select Category</option>
                    {categories && Array.isArray(categories) && categories.map(category => (
                      <option key={category.slug} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                    placeholder="Brief description of the article"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Content *
                  </label>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    placeholder="Write your article content here..."
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                    placeholder="Enter tags separated by commas"
                  />
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.featured_image_url}
                    onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Social Media Embeds */}
                <div>
                  <EmbedManager
                    embeds={formData.social_media_embeds || []}
                    onChange={(embeds) => setFormData({ ...formData, social_media_embeds: embeds })}
                  />
                </div>

                {/* Featured Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-4 w-4 text-neutral-800 focus:ring-neutral-800 border-neutral-300 rounded"
                  />
                  <label htmlFor="is_featured" className="ml-2 text-sm font-medium text-neutral-700">
                    Mark as Featured Article
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingArticle ? 'Update Article' : 'Create Article'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminArticlesPage;
