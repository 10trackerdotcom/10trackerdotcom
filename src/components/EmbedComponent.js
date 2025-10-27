import React, { useState, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { X, ExternalLink, Play, MessageCircle, Heart } from 'lucide-react';
import ReactPlayer from 'react-player';
import { TwitterTweetEmbed } from 'react-twitter-embed';

const EmbedComponent = ({ node, deleteNode }) => {
  const { url, type } = node.attrs;
  const [isLoading, setIsLoading] = useState(true);
  const [embedError, setEmbedError] = useState(false);

  useEffect(() => {
    // Simulate loading time for embeds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getEmbedId = (url, type) => {
    if (!url) return null;
    
    // Clean the URL
    const cleanUrl = url.trim();
    
    switch (type) {
      case 'youtube':
        // Handle various YouTube URL formats
        const youtubePatterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
          /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
          /youtu\.be\/([^&\n?#]+)/
        ];
        
        for (const pattern of youtubePatterns) {
          const match = cleanUrl.match(pattern);
          if (match) return match[1];
        }
        return null;
      
      case 'twitter':
        // Handle Twitter/X URLs
        const twitterPatterns = [
          /twitter\.com\/\w+\/status\/(\d+)/,
          /x\.com\/\w+\/status\/(\d+)/,
          /twitter\.com\/i\/web\/status\/(\d+)/
        ];
        
        for (const pattern of twitterPatterns) {
          const match = cleanUrl.match(pattern);
          if (match) return match[1];
        }
        return null;
      
      case 'instagram':
        // Handle Instagram URLs
        const instagramPatterns = [
          /instagram\.com\/p\/([^\/\?]+)/,
          /instagram\.com\/reel\/([^\/\?]+)/,
          /instagram\.com\/tv\/([^\/\?]+)/
        ];
        
        for (const pattern of instagramPatterns) {
          const match = cleanUrl.match(pattern);
          if (match) return match[1];
        }
        return null;
      
      default:
        return null;
    }
  };

  const embedId = getEmbedId(url, type);

  const renderEmbed = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64 bg-neutral-100 rounded-lg">
          <div className="flex items-center gap-2 text-neutral-600">
            <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
            Loading embed...
          </div>
        </div>
      );
    }

    // Debug information
    console.log('Embed Debug:', { url, type, embedId, embedError });

    if (embedError || !embedId) {
      return (
        <div className="flex items-center justify-center h-64 bg-neutral-100 rounded-lg border-2 border-dashed border-neutral-300">
          <div className="text-center">
            <ExternalLink className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-neutral-600 mb-2">Unable to load embed</p>
            <p className="text-xs text-neutral-500 mb-2">
              URL: {url}<br/>
              Type: {type}<br/>
              ID: {embedId || 'Not found'}
            </p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Open in new tab
            </a>
          </div>
        </div>
      );
    }

    switch (type) {
      case 'youtube':
        return (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <ReactPlayer
              className="absolute top-0 left-0"
              url={url}
              width="100%"
              height="100%"
              controls={true}
              onReady={() => {
                console.log('YouTube video ready');
                setIsLoading(false);
              }}
              onError={(error) => {
                console.log('YouTube player error:', error);
                setEmbedError(true);
              }}
            />
          </div>
        );

      case 'twitter':
        return (
          <div className="flex justify-center">
            <TwitterTweetEmbed
              tweetId={embedId}
              onLoad={() => {
                console.log('Twitter embed loaded');
                setIsLoading(false);
              }}
              onError={(error) => {
                console.log('Twitter embed error:', error);
                setEmbedError(true);
              }}
              options={{
                theme: 'light',
                width: 400,
                align: 'center'
              }}
            />
          </div>
        );

      case 'instagram':
        return (
          <div className="flex justify-center">
            <div className="bg-white border border-neutral-200 rounded-lg p-4 max-w-sm mx-auto">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">IG</span>
                </div>
                <div>
                  <div className="font-semibold text-sm">Instagram</div>
                  <div className="text-xs text-neutral-500">@instagram</div>
                </div>
              </div>
              <div className="aspect-square bg-neutral-100 rounded-lg mb-3 flex items-center justify-center">
                <Play className="w-8 h-8 text-neutral-400" />
              </div>
              <div className="text-sm text-neutral-700 mb-3">
                Instagram embed preview. Click below to view the full post.
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  View on Instagram
                </a>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-32 bg-neutral-100 rounded-lg">
            <p className="text-neutral-600">Unsupported embed type</p>
          </div>
        );
    }
  };

  return (
    <NodeViewWrapper className="my-4">
      <div className="relative group">
        {/* Delete button */}
        <button
          onClick={deleteNode}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10"
          title="Remove embed"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Embed content */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          {renderEmbed()}
        </div>

        {/* Embed info */}
        <div className="mt-2 text-xs text-neutral-500 text-center">
          {type.charAt(0).toUpperCase() + type.slice(1)} Embed
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default EmbedComponent;
