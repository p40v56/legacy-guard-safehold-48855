
import React from 'react';
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
          backgroundColor: 'rgb(51 65 85)', // slate-700
          borderRadius: '0.375rem',
          border: '1px solid rgb(71 85 105)', // slate-600
        }}
      />
      <style jsx>{`
        .rich-text-editor .ql-toolbar {
          background-color: rgb(51 65 85);
          border-color: rgb(71 85 105);
          border-bottom: 1px solid rgb(71 85 105);
        }
        .rich-text-editor .ql-container {
          background-color: rgb(51 65 85);
          border-color: rgb(71 85 105);
          color: white;
        }
        .rich-text-editor .ql-editor {
          color: white;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: rgb(148 163 184);
        }
        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: rgb(148 163 184);
        }
        .rich-text-editor .ql-toolbar .ql-fill {
          fill: rgb(148 163 184);
        }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke {
          stroke: white;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-fill {
          fill: white;
        }
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: rgb(52 211 153);
        }
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: rgb(52 211 153);
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
