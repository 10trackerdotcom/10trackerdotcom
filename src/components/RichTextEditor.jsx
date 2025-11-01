'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import EmbedExtension from './EmbedExtension';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Palette,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table as TableIcon,
  CheckSquare,
  Minus,
  Plus,
  Type,
  X,
  Video,
  MessageCircle,
  Instagram,
  Split,
  Eye,
  FileCode
} from 'lucide-react';

const RichTextEditor = ({ content, onChange, placeholder = "Start writing..." }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'wysiwyg', 'html', 'split'
  const [htmlContent, setHtmlContent] = useState(content || '');

  useEffect(() => {
    setIsMounted(true);
    setHtmlContent(content || '');
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Underline,
      Color.configure({ types: ['textStyle'] }),
      TextStyle,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-neutral-300',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      EmbedExtension,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlContent(html);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none prose-neutral prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-a:text-neutral-800 prose-strong:text-neutral-900 focus:outline-none min-h-[400px] p-4',
      },
    },
    immediatelyRender: false,
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
      setHtmlContent(content || '');
    }
  }, [content, editor]);

  // Handle HTML code editor changes
  const handleHtmlChange = useCallback((newHtml) => {
    setHtmlContent(newHtml);
    if (editor) {
      try {
        editor.commands.setContent(newHtml);
        onChange(newHtml);
      } catch (error) {
        console.error('Error updating editor from HTML:', error);
      }
    }
  }, [editor, onChange]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('Enter Image URL:', '');
    if (url && url.trim()) {
      const imageUrl = url.trim();
      editor.chain().focus().setImage({ 
        src: imageUrl,
        alt: 'Article image',
        class: 'max-w-full h-auto rounded-lg my-4'
      }).run();
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addRow = useCallback(() => {
    editor.chain().focus().addRowAfter().run();
  }, [editor]);

  const addColumn = useCallback(() => {
    editor.chain().focus().addColumnAfter().run();
  }, [editor]);

  const deleteRow = useCallback(() => {
    editor.chain().focus().deleteRow().run();
  }, [editor]);

  const deleteColumn = useCallback(() => {
    editor.chain().focus().deleteColumn().run();
  }, [editor]);

  const deleteTable = useCallback(() => {
    editor.chain().focus().deleteTable().run();
  }, [editor]);

  const setColor = useCallback((color) => {
    editor.chain().focus().setColor(color).run();
    setShowColorPicker(false);
  }, [editor]);

  const setHighlight = useCallback((color) => {
    editor.chain().focus().setHighlight({ color }).run();
    setShowHighlightPicker(false);
  }, [editor]);

  const addEmbed = useCallback((type) => {
    const url = window.prompt(`Enter ${type.charAt(0).toUpperCase() + type.slice(1)} URL:`, '');
    if (url && url.trim()) {
      // Basic URL validation
      const cleanUrl = url.trim();
      let isValid = false;
      
      switch (type) {
        case 'youtube':
          isValid = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
          break;
        case 'twitter':
          isValid = cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com');
          break;
        case 'instagram':
          isValid = cleanUrl.includes('instagram.com');
          break;
      }
      
      if (isValid) {
        editor.chain().focus().setEmbed({ url: cleanUrl, type }).run();
      } else {
        alert(`Please enter a valid ${type} URL (e.g., ${type === 'youtube' ? 'https://www.youtube.com/watch?v=...' : type === 'twitter' ? 'https://twitter.com/...' : 'https://www.instagram.com/p/...'})`);
      }
    }
  }, [editor]);

  if (!isMounted || !editor) {
    return (
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="bg-neutral-50 border-b border-neutral-200 p-2">
          <div className="h-8 bg-neutral-200 rounded animate-pulse"></div>
        </div>
        <div className="bg-white p-4">
          <div className="h-[300px] bg-neutral-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const ToolbarButton = ({ onClick, isActive, children, title }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-md transition-colors duration-200 ${
        isActive 
          ? 'bg-neutral-800 text-white' 
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      }`}
      title={title}
    >
      {children}
    </button>
  );

  const colors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6', '#FFFFFF',
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
    '#D946EF', '#EC4899', '#F43F5E'
  ];

  return (
    <>
      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 400px;
          padding: 1rem;
          line-height: 1.75;
        }
        .ProseMirror [style*="text-align: left"] {
          text-align: left !important;
        }
        .ProseMirror [style*="text-align: center"] {
          text-align: center !important;
        }
        .ProseMirror [style*="text-align: right"] {
          text-align: right !important;
        }
        .ProseMirror [style*="text-align: justify"] {
          text-align: justify !important;
        }
        .ProseMirror p {
          margin: 1rem 0;
          color: #374151;
        }
        .ProseMirror h1 {
          font-size: 2.25rem;
          font-weight: 700;
          color: #111827;
          margin: 2rem 0 1rem 0;
          line-height: 1.2;
        }
        .ProseMirror h2 {
          font-size: 1.875rem;
          font-weight: 600;
          color: #111827;
          margin: 1.5rem 0 0.75rem 0;
          line-height: 1.3;
        }
        .ProseMirror h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin: 1.25rem 0 0.5rem 0;
          line-height: 1.4;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
          color: #374151;
        }
        .ProseMirror ul li {
          list-style-type: disc;
          margin: 0.5rem 0;
        }
        .ProseMirror ol li {
          list-style-type: decimal;
          margin: 0.5rem 0;
        }
        .ProseMirror ul li::marker, .ProseMirror ol li::marker {
          color: #6B7280;
        }
        .ProseMirror table {
          border-collapse: collapse;
          margin: 1.5rem 0;
          width: 100%;
          border: 1px solid #d1d5db;
        }
        .ProseMirror table td, .ProseMirror table th {
          border: 1px solid #d1d5db;
          padding: 0.75rem;
          text-align: left;
        }
        .ProseMirror table th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #111827;
        }
        .ProseMirror table td {
          color: #374151;
        }
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          margin: 0.5rem 0;
        }
        .ProseMirror ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          margin-right: 0.5rem;
          user-select: none;
        }
        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
          color: #374151;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #6B7280;
          background-color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
        }
        .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          color: #111827;
          font-size: 0.875rem;
        }
        .ProseMirror pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .ProseMirror pre code {
          background: none;
          padding: 0;
          color: #111827;
        }
        .ProseMirror a {
          color: #1f2937;
          text-decoration: underline;
        }
        .ProseMirror a:hover {
          color: #111827;
        }
        .ProseMirror strong {
          color: #111827;
          font-weight: 600;
        }
        .ProseMirror em {
          font-style: italic;
        }
        .ProseMirror u {
          text-decoration: underline;
        }
        .ProseMirror s {
          text-decoration: line-through;
        }
        .ProseMirror mark {
          background-color: #fef3c7;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
        }
        .ProseMirror p[style*="text-align"] {
          text-align: inherit !important;
        }
        .ProseMirror h1[style*="text-align"], 
        .ProseMirror h2[style*="text-align"], 
        .ProseMirror h3[style*="text-align"], 
        .ProseMirror h4[style*="text-align"] {
          text-align: inherit !important;
        }
        .ProseMirror [data-type="embed"] {
          margin: 1.5rem 0;
          text-align: center;
        }
      `}</style>
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-neutral-50 border-b border-neutral-200 p-3 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-neutral-300 pr-3 mr-3">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Code"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            isActive={editor.isActive('subscript')}
            title="Subscript"
          >
            <SubscriptIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            isActive={editor.isActive('superscript')}
            title="Superscript"
          >
            <SuperscriptIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Text Color & Highlight */}
        <div className="flex gap-1 border-r border-neutral-300 pr-3 mr-3 relative">
          <div className="relative">
            <ToolbarButton
              onClick={() => setShowColorPicker(!showColorPicker)}
              isActive={editor.isActive('textStyle')}
              title="Text Color"
            >
              <Type className="w-4 h-4" />
            </ToolbarButton>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-neutral-300 rounded-lg shadow-lg z-50">
                <div className="grid grid-cols-7 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setColor(color)}
                      className="w-6 h-6 rounded border border-neutral-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <ToolbarButton
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              isActive={editor.isActive('highlight')}
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
            </ToolbarButton>
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-neutral-300 rounded-lg shadow-lg z-50">
                <div className="grid grid-cols-7 gap-1">
                  {colors.slice(7, 14).map((color) => (
                    <button
                      key={color}
                      onClick={() => setHighlight(color)}
                      className="w-6 h-6 rounded border border-neutral-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r border-neutral-300 pr-3 mr-3">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Lists & Tasks */}
        <div className="flex gap-1 border-r border-neutral-300 pr-3 mr-3">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
            title="Task List"
          >
            <CheckSquare className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r border-neutral-300 pr-3 mr-3">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Table Controls */}
        <div className="flex gap-1 border-r border-neutral-300 pr-3 mr-3">
          <ToolbarButton
            onClick={insertTable}
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </ToolbarButton>
          {editor.isActive('table') && (
            <>
              <ToolbarButton
                onClick={addRow}
                title="Add Row"
              >
                <Plus className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={addColumn}
                title="Add Column"
              >
                <Plus className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={deleteRow}
                title="Delete Row"
              >
                <Minus className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={deleteColumn}
                title="Delete Column"
              >
                <Minus className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={deleteTable}
                title="Delete Table"
              >
                <X className="w-4 h-4" />
              </ToolbarButton>
            </>
          )}
        </div>

        {/* Media & Links */}
        <div className="flex gap-1 border-r border-neutral-300 pr-3 mr-3">
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={addImage}
            title="Add Image"
          >
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Embeds */}
        <div className="flex gap-1 border-r border-neutral-300 pr-3 mr-3">
          <ToolbarButton
            onClick={() => addEmbed('youtube')}
            title="Add YouTube Video"
          >
            <Video className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => addEmbed('twitter')}
            title="Add Twitter Post"
          >
            <MessageCircle className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => addEmbed('instagram')}
            title="Add Instagram Post"
          >
            <Instagram className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 border-r border-neutral-300 pr-3 mr-3">
          <ToolbarButton
            onClick={() => setViewMode('split')}
            isActive={viewMode === 'split'}
            title="Split View (WYSIWYG + HTML)"
          >
            <Split className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setViewMode('wysiwyg')}
            isActive={viewMode === 'wysiwyg'}
            title="WYSIWYG View Only"
          >
            <Eye className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setViewMode('html')}
            isActive={viewMode === 'html'}
            title="HTML Code View Only"
          >
            <FileCode className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* History */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      {viewMode === 'split' && (
        <div className="bg-white grid grid-cols-2 divide-x divide-neutral-200 min-h-[500px]">
          {/* WYSIWYG Editor - Left */}
          <div className="flex flex-col border-r border-neutral-200 overflow-hidden">
            <div className="px-3 py-2 bg-neutral-50 border-b border-neutral-200 text-xs font-medium text-neutral-600 flex-shrink-0">
              WYSIWYG Preview
            </div>
            <div className="flex-1 overflow-y-auto">
              <EditorContent 
                editor={editor} 
                placeholder={placeholder}
              />
            </div>
          </div>
          {/* HTML Editor - Right */}
          <div className="flex flex-col overflow-hidden">
            <div className="px-3 py-2 bg-neutral-50 border-b border-neutral-200 text-xs font-medium text-neutral-600 flex-shrink-0">
              HTML Code
            </div>
            <textarea
              value={htmlContent}
              onChange={(e) => handleHtmlChange(e.target.value)}
              className="flex-1 w-full px-4 py-3 font-mono text-sm border-none outline-none resize-none bg-neutral-50 focus:bg-white overflow-y-auto leading-relaxed"
              placeholder="Edit HTML code directly..."
              spellCheck={false}
              style={{ tabSize: 2 }}
            />
          </div>
        </div>
      )}

      {viewMode === 'wysiwyg' && (
        <div className="bg-white">
          <EditorContent 
            editor={editor} 
            placeholder={placeholder}
          />
        </div>
      )}

      {viewMode === 'html' && (
        <div className="bg-white flex flex-col min-h-[500px]">
          <div className="px-3 py-2 bg-neutral-50 border-b border-neutral-200 text-xs font-medium text-neutral-600 flex-shrink-0">
            HTML Code Editor
          </div>
          <textarea
            value={htmlContent}
            onChange={(e) => handleHtmlChange(e.target.value)}
            className="flex-1 w-full px-4 py-3 font-mono text-sm border-none outline-none resize-none overflow-y-auto leading-relaxed"
            placeholder="Edit HTML code directly..."
            spellCheck={false}
            style={{ tabSize: 2 }}
          />
        </div>
      )}
    </div>
    </>
  );
};

export default RichTextEditor;
