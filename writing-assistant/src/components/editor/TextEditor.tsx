'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  BoldIcon, 
  ItalicIcon, 
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
  PhotoIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { TextEditorProps } from '@/types';

export function TextEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing...", 
  autoFocus = false 
}: TextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  // Update word and character counts
  const updateCounts = useCallback((text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    setCharacterCount(text.length);
  }, []);

  // Handle content changes
  const handleInput = useCallback((e: Event) => {
    if (!editorRef.current) return;

    const text = editorRef.current.innerText || '';
    console.log('Text editor input:', text.length, 'characters');
    updateCounts(text);
    onChange(text);
  }, [onChange, updateCounts]);

  // Handle paste events
  const handlePaste = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl+S for save (handled by parent)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      return;
    }

    // Ctrl+B for bold
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      document.execCommand('bold');
      return;
    }

    // Ctrl+I for italic
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      document.execCommand('italic');
      return;
    }

    // Ctrl+U for underline
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      document.execCommand('underline');
      return;
    }

    // Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '    ');
      return;
    }
  }, []);

  // Handle selection changes for toolbar
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      setIsToolbarVisible(!range.collapsed);
    } else {
      setIsToolbarVisible(false);
    }
  }, []);

  // Format text commands
  const formatText = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  // Initialize editor
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerText) {
      console.log('Updating editor content:', content.length, 'characters');
      editorRef.current.innerText = content;
      // Update counts inline to avoid dependency issues
      const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
      setWordCount(words);
      setCharacterCount(content.length);
    }
  }, [content]); // Only run when content prop changes

  // Setup event listeners
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    console.log('Setting up text editor event listeners');
    
    // Add event listeners
    editor.addEventListener('input', handleInput);
    editor.addEventListener('paste', handlePaste);
    
    return () => {
      console.log('Cleaning up text editor event listeners');
      editor.removeEventListener('input', handleInput);
      editor.removeEventListener('paste', handlePaste);
    };
  }, []); // Empty dependency array to prevent re-setup

  // Auto-focus
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      console.log('Auto-focusing text editor');
      editorRef.current.focus();
      
      // Position cursor at end of content
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [autoFocus]);

  // Toolbar buttons configuration
  const toolbarButtons = [
    {
      icon: BoldIcon,
      command: 'bold',
      tooltip: 'Bold (Ctrl+B)',
      shortcut: 'Ctrl+B'
    },
    {
      icon: ItalicIcon,
      command: 'italic',
      tooltip: 'Italic (Ctrl+I)',
      shortcut: 'Ctrl+I'
    },
    {
      icon: UnderlineIcon,
      command: 'underline',
      tooltip: 'Underline (Ctrl+U)',
      shortcut: 'Ctrl+U'
    },
    {
      icon: ListBulletIcon,
      command: 'insertUnorderedList',
      tooltip: 'Bullet List'
    },
    {
      icon: NumberedListIcon,
      command: 'insertOrderedList',
      tooltip: 'Numbered List'
    },
    {
      icon: LinkIcon,
      command: 'createLink',
      tooltip: 'Insert Link',
      requiresInput: true
    },
    {
      icon: CodeBracketIcon,
      command: 'formatBlock',
      value: 'pre',
      tooltip: 'Code Block'
    }
  ];

  const handleToolbarClick = (button: typeof toolbarButtons[0]) => {
    if (button.requiresInput) {
      const url = prompt('Enter URL:');
      if (url) {
        formatText(button.command, url);
      }
    } else {
      formatText(button.command, button.value);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Fixed Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2">
        <div className="flex items-center space-x-1">
          {toolbarButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <button
                key={index}
                onClick={() => handleToolbarClick(button)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                title={button.tooltip}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <div
          ref={editorRef}
          contentEditable
          className="h-full p-6 text-gray-900 dark:text-white text-lg leading-relaxed outline-none"
          style={{ minHeight: '100%', cursor: 'text' }}
          onKeyDown={handleKeyDown}
          onMouseUp={handleMouseUp}
          onFocus={() => console.log('Text editor focused')}
          onBlur={() => console.log('Text editor blurred')}
          onClick={() => {
            console.log('Text editor clicked');
            editorRef.current?.focus();
          }}
          suppressContentEditableWarning
          data-placeholder={placeholder}
        />
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>{wordCount} words</span>
            <span>{characterCount} characters</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs">
              Auto-save enabled
            </span>
          </div>
        </div>
      </div>

      {/* Custom styles for placeholder and formatting */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          cursor: text;
        }
        
        [contenteditable] {
          word-wrap: break-word;
          white-space: pre-wrap;
        }
        
        [contenteditable] h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 1rem 0;
        }
        
        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0.75rem 0;
        }
        
        [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.5rem 0;
        }
        
        [contenteditable] p {
          margin: 0.5rem 0;
        }
        
        [contenteditable] ul {
          list-style-type: disc;
          margin-left: 1.5rem;
        }
        
        [contenteditable] ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
        }
        
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        
        [contenteditable] pre {
          background-color: #f3f4f6;
          border-radius: 0.375rem;
          padding: 1rem;
          margin: 1rem 0;
          overflow-x: auto;
          font-family: monospace;
        }
        
        .dark [contenteditable] pre {
          background-color: #374151;
        }
        
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .dark [contenteditable] a {
          color: #60a5fa;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
        }
        
        .dark [contenteditable] blockquote {
          border-left-color: #4b5563;
        }
      `}</style>
    </div>
  );
}