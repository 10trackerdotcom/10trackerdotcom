'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { 
  Send, 
  Users, 
  Hash, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Bell,
  Image as ImageIcon,
  Link as LinkIcon,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminNotificationsPage = () => {
  const { user, isLoaded } = useUser();
  const [sending, setSending] = useState(false);
  const [sendMode, setSendMode] = useState('token'); // 'token', 'topic', 'all'
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    image: '',
    url: '',
    token: '',
    tokens: '', // comma-separated
    topic: '',
  });
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Check if user is admin
  const isAdmin = user?.emailAddresses?.[0]?.emailAddress === 'jain10gunjan@gmail.com';

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to access admin panel.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only admin users can access this panel.</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setResult(null);
  };

  const handleSend = async () => {
    // Validation
    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error('Title and body are required');
      return;
    }

    if (sendMode === 'token' && !formData.token.trim()) {
      toast.error('Token is required');
      return;
    }

    if (sendMode === 'tokens' && !formData.tokens.trim()) {
      toast.error('At least one token is required');
      return;
    }

    if (sendMode === 'topic' && !formData.topic.trim()) {
      toast.error('Topic is required');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      // Build payload
      const payload = {
        title: formData.title.trim(),
        body: formData.body.trim(),
        ...(formData.image && { image: formData.image.trim() }),
        data: {
          ...(formData.url && { url: formData.url.trim() }),
          timestamp: new Date().toISOString(),
        },
      };

      // Add token/topic based on mode
      if (sendMode === 'token') {
        payload.token = formData.token.trim();
      } else if (sendMode === 'tokens') {
        // Split by comma and clean up
        const tokens = formData.tokens
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0);
        payload.token = tokens.length === 1 ? tokens[0] : tokens;
      } else if (sendMode === 'topic') {
        payload.topic = formData.topic.trim();
      }

      // Send notification
      const response = await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          data: data.result,
        });
        toast.success('Notification sent successfully!');
        
        // Clear form if successful
        if (sendMode !== 'all') {
          setFormData(prev => ({
            ...prev,
            token: '',
            tokens: '',
            topic: '',
          }));
        }
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to send notification',
          error: data,
        });
        toast.error(data.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setResult({
        success: false,
        message: error.message || 'An error occurred',
        error: error,
      });
      toast.error('An error occurred while sending notification');
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
              <p className="text-gray-600">Send push notifications to users</p>
            </div>
          </div>
        </motion.div>

        {/* Send Mode Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send To</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setSendMode('token');
                setResult(null);
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                sendMode === 'token'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Bell className={`w-5 h-5 ${sendMode === 'token' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`font-medium ${sendMode === 'token' ? 'text-blue-600' : 'text-gray-700'}`}>
                  Single Token
                </span>
              </div>
              <p className="text-sm text-gray-600">Send to one device</p>
            </button>

            <button
              onClick={() => {
                setSendMode('tokens');
                setResult(null);
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                sendMode === 'tokens'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className={`w-5 h-5 ${sendMode === 'tokens' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`font-medium ${sendMode === 'tokens' ? 'text-blue-600' : 'text-gray-700'}`}>
                  Multiple Tokens
                </span>
              </div>
              <p className="text-sm text-gray-600">Send to multiple devices</p>
            </button>

            <button
              onClick={() => {
                setSendMode('topic');
                setResult(null);
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                sendMode === 'topic'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Hash className={`w-5 h-5 ${sendMode === 'topic' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`font-medium ${sendMode === 'topic' ? 'text-blue-600' : 'text-gray-700'}`}>
                  Topic
                </span>
              </div>
              <p className="text-sm text-gray-600">Send to a topic</p>
            </button>
          </div>
        </motion.div>

        {/* Notification Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Details</h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter notification title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</p>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                placeholder="Enter notification message"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.body.length}/500 characters</p>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ImageIcon className="w-4 h-4 inline mr-1" />
                Image URL (Optional)
              </label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LinkIcon className="w-4 h-4 inline mr-1" />
                Link URL (Optional)
              </label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="/articles/article-slug or https://example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Opens when user clicks the notification</p>
            </div>

            {/* Token/Topic Input */}
            {sendMode === 'token' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  FCM Token <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="token"
                  value={formData.token}
                  onChange={handleInputChange}
                  placeholder="Enter FCM token"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
            )}

            {sendMode === 'tokens' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  FCM Tokens <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="tokens"
                  value={formData.tokens}
                  onChange={handleInputChange}
                  placeholder="Enter FCM tokens (one per line or comma-separated)"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple tokens with commas or new lines</p>
              </div>
            )}

            {sendMode === 'topic' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="e.g., new-articles, job-updates"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Users subscribed to this topic will receive the notification</p>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sending || !formData.title.trim() || !formData.body.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send Notification</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
              result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? 'Notification Sent Successfully!' : 'Failed to Send Notification'}
                </h3>
                <p className={`text-sm mb-3 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>
                {result.data && (
                  <div className="mt-4">
                    <details className="bg-white rounded-lg p-3 border border-gray-200">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                        Response Details
                      </summary>
                      <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2))}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied!' : 'Copy JSON'}
                      </button>
                    </details>
                  </div>
                )}
                {result.error && (
                  <div className="mt-4">
                    <details className="bg-white rounded-lg p-3 border border-red-200">
                      <summary className="cursor-pointer text-sm font-medium text-red-700 mb-2">
                        Error Details
                      </summary>
                      <pre className="text-xs text-red-600 mt-2 overflow-auto">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <h4 className="font-semibold mb-2">Tips:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Keep titles under 50 characters for best display</li>
                <li>Keep messages concise and actionable</li>
                <li>Use topics for broadcasting to multiple users</li>
                <li>Image URLs should be publicly accessible</li>
                <li>URL can be relative (e.g., /articles/slug) or absolute</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
