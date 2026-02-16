
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, Share2, Users, Clock, Bold, Italic, Underline, List, ListOrdered, Type, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Document } from '../types/document';
import CollaborationPanel from './CollaborationPanel';

interface DocumentEditorProps {
  document: Document;
  onSave: (doc: Document) => void;
  onBack: () => void;
}

const DocumentEditor = ({ document, onSave, onBack }: DocumentEditorProps) => {
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [collaborators] = useState([
    { id: '1', name: 'Alice Johnson', color: '#3B82F6', isTyping: false, cursor: 120 },
    { id: '2', name: 'Bob Smith', color: '#10B981', isTyping: true, cursor: 250 },
    { id: '3', name: 'Charlie Brown', color: '#F59E0B', isTyping: false, cursor: 180 }
  ]);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save functionality
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      setIsAutoSaving(true);
      onSave({ ...document, title, content });
      setTimeout(() => setIsAutoSaving(false), 1000);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, document, onSave]);

  const formatText = (command: string, value?: string) => {
    try {
      // Use proper typing for document.execCommand
      (document as any).execCommand(command, false, value);
      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
      }
    } catch (error) {
      console.log('Format command not supported:', command);
      // Fallback: focus the editor to maintain cursor position
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="flex-1 max-w-md">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0"
                  placeholder="Untitled Document"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAutoSaving && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Saving...
                </div>
              )}
              
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                {formatDate(document.updated_at)}
              </div>

              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText('undo')}
              className="p-2"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText('redo')}
              className="p-2"
            >
              <Redo className="w-4 h-4" />
            </Button>
            
            <Separator orientation="vertical" className="mx-2 h-6" />
            
            <select 
              className="text-sm border border-gray-300 rounded px-2 py-1"
              onChange={(e) => formatText('formatBlock', e.target.value)}
            >
              <option value="div">Normal</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>
            
            <Separator orientation="vertical" className="mx-2 h-6" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText('bold')}
              className="p-2"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText('italic')}
              className="p-2"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText('underline')}
              className="p-2"
            >
              <Underline className="w-4 h-4" />
            </Button>
            
            <Separator orientation="vertical" className="mx-2 h-6" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText('insertUnorderedList')}
              className="p-2"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText('insertOrderedList')}
              className="p-2"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 px-6 py-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorChange}
              dangerouslySetInnerHTML={{ __html: content }}
              className="min-h-96 outline-none prose prose-lg max-w-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 rounded-lg p-4 transition-all"
              style={{ 
                lineHeight: '1.6',
                fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
              }}
            />
            
            {/* Typing indicators */}
            {collaborators.filter(c => c.isTyping).map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center gap-2 mt-4 text-sm text-gray-600"
                style={{ color: collaborator.color }}
              >
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-100"></div>
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-200"></div>
                </div>
                <span>{collaborator.name} is typing...</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Collaboration Sidebar */}
      <CollaborationPanel collaborators={collaborators} document={document} />
    </div>
  );
};

export default DocumentEditor;
