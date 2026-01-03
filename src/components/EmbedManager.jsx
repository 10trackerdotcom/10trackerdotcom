'use client';

import React, { useState } from 'react';
import { Plus, X, Instagram, Youtube, Video, Image as ImageIcon, Trash2, Twitter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmbedManager = ({ embeds = [], onChange }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'instagram',
    url: '',
    embed_code: '',
    caption: ''
  });

  const embedTypes = [
    { value: 'instagram', label: 'Instagram Post', icon: Instagram },
    { value: 'reel', label: 'Instagram Reel', icon: Instagram },
    { value: 'twitter', label: 'Twitter/X Post', icon: Twitter },
    { value: 'youtube', label: 'YouTube Video', icon: Youtube },
    { value: 'video', label: 'Other Video', icon: Video },
    { value: 'image', label: 'Image', icon: ImageIcon }
  ];

  const handleAdd = () => {
    if (!formData.url && !formData.embed_code) {
      alert('Please provide either a URL or embed code');
      return;
    }

    const newEmbed = {
      type: formData.type,
      url: formData.url || '',
      embed_code: formData.embed_code || '',
      caption: formData.caption || ''
    };

    onChange([...embeds, newEmbed]);
    setFormData({ type: 'instagram', url: '', embed_code: '', caption: '' });
    setShowAddForm(false);
  };

  const handleRemove = (index) => {
    const updated = embeds.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdate = (index, field, value) => {
    const updated = [...embeds];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-neutral-700">
          Social Media Embeds
        </label>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Embed
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3"
          >
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800"
              >
                {embedTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                URL (Instagram, YouTube, etc.)
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://instagram.com/p/... or https://twitter.com/..."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Or Embed Code (HTML)
              </label>
              <textarea
                value={formData.embed_code}
                onChange={(e) => setFormData({ ...formData, embed_code: e.target.value })}
                placeholder="<iframe>...</iframe>"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Caption (Optional)
              </label>
              <input
                type="text"
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="Optional caption for the embed"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-neutral-800 text-white text-sm rounded-lg hover:bg-neutral-700 transition-colors"
              >
                Add Embed
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ type: 'instagram', url: '', embed_code: '', caption: '' });
                }}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 text-sm rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <AnimatePresence>
          {embeds.map((embed, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-neutral-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {embedTypes.find(t => t.value === embed.type)?.icon && (
                    React.createElement(embedTypes.find(t => t.value === embed.type).icon, { className: "w-4 h-4 text-neutral-600" })
                  )}
                  <span className="text-sm font-medium text-neutral-700">
                    {embedTypes.find(t => t.value === embed.type)?.label || embed.type}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Remove embed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {embed.url && (
                <div className="mb-2">
                  <p className="text-xs text-neutral-500 mb-1">URL:</p>
                  <p className="text-sm text-neutral-700 break-all">{embed.url}</p>
                </div>
              )}

              {embed.caption && (
                <div className="mb-2">
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Caption:
                  </label>
                  <input
                    type="text"
                    value={embed.caption}
                    onChange={(e) => handleUpdate(index, 'caption', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-neutral-800"
                  />
                </div>
              )}

              {embed.embed_code && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Embed Code:</p>
                  <p className="text-xs text-neutral-400 font-mono bg-neutral-50 p-2 rounded break-all line-clamp-2">
                    {embed.embed_code.substring(0, 100)}...
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {embeds.length === 0 && !showAddForm && (
          <p className="text-sm text-neutral-500 text-center py-4">
            No embeds added. Click &quot;Add Embed&quot; to add social media content.
          </p>
        )}
      </div>
    </div>
  );
};

export default EmbedManager;

