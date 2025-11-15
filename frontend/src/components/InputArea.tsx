import React from 'react';
import { Send } from 'lucide-react';
import '../styles/InputArea.css';

interface InputAreaProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

function InputArea({
  inputValue,
  onInputChange,
  onSubmit,
  loading,
}: InputAreaProps) {
  return (
    <div className="input-area">
      <form onSubmit={onSubmit} className="input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Ask Something"
          disabled={loading}
          className="input-field"
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="send-button"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

export default InputArea;
