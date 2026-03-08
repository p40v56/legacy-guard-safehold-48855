
import React, { useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className
}) => {
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link'
  ];

  useEffect(() => {
    const styleId = 'quill-light-theme';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .rich-text-editor .ql-toolbar {
          background-color: hsl(var(--card)) !important;
          border-color: hsl(var(--border)) !important;
          border-bottom: 1px solid hsl(var(--border)) !important;
          border-radius: 0.75rem 0.75rem 0 0 !important;
        }
        .rich-text-editor .ql-container {
          background-color: transparent !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--card-foreground)) !important;
          border-radius: 0 0 0.75rem 0.75rem !important;
        }
        .rich-text-editor .ql-editor {
          color: hsl(var(--card-foreground)) !important;
          min-height: 200px;
          padding: 16px !important;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground)) !important;
          font-style: normal !important;
        }
        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: hsl(var(--muted-foreground)) !important;
        }
        .rich-text-editor .ql-toolbar .ql-fill {
          fill: hsl(var(--muted-foreground)) !important;
        }
        .rich-text-editor .ql-toolbar .ql-picker-label {
          color: hsl(var(--muted-foreground)) !important;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke {
          stroke: hsl(var(--foreground)) !important;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-fill {
          fill: hsl(var(--foreground)) !important;
        }
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: hsl(var(--primary)) !important;
        }
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: hsl(var(--primary)) !important;
        }
        .rich-text-editor .ql-toolbar button:hover {
          background-color: hsl(var(--muted) / 0.5) !important;
          border-radius: 0.25rem;
        }
      `;
      document.head.appendChild(style);
    }

    // Remove old dark theme style if present
    const oldStyle = document.getElementById('quill-dark-theme');
    if (oldStyle) oldStyle.remove();
  }, []);

  return (
    <div className={cn("rich-text-editor", className)}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          backgroundColor: 'hsl(var(--muted) / 0.3)',
          borderRadius: '0.75rem',
          border: '1px solid hsl(var(--border))',
        }}
      />
    </div>
  );
};

export default RichTextEditor;
