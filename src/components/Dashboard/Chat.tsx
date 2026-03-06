'use client';

import { Send, MessageCircle, X, Loader2, User, Bot, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';

const SUGGESTIONS = [
  'Which store has the most outstanding amount?',
  'Who are the late payers (90+ days overdue)?',
  'Which store should I deploy most TSOs at?',
  'How were sales last week?',
];

function getMessageText(m: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!m.parts) return '';
  return m.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('');
}

export default function Chat() {
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, setMessages } = useChat();

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput('');
    sendMessage({ text });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-chocolate-700 hover:bg-chocolate-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-105"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-4rem)] bg-surface-card border border-surface-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-chocolate-700 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold text-sm">Ask about your data</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="hover:bg-white/20 p-1 rounded"
              aria-label="Clear chat"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => setOpen(false)} className="hover:bg-white/20 p-1 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Try asking:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                className="block w-full text-left text-sm px-3 py-2 rounded-lg bg-surface-card-hover hover:bg-brand-gold/10 text-gray-700 dark:text-gray-300 hover:text-brand-gold transition-colors border border-surface-border-light"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m) => {
          const text = getMessageText(m);
          if (!text && m.role === 'assistant') return null;
          return (
            <div key={m.id} className={`flex items-start gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-gold/20 flex items-center justify-center mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-brand-gold" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-chocolate-700 text-white rounded-br-md'
                    : 'bg-surface-card-hover text-gray-800 dark:text-gray-200 rounded-bl-md border border-surface-border-light'
                }`}
              >
                {text}
              </div>
              {m.role === 'user' && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-chocolate-700/20 flex items-center justify-center mt-0.5">
                  <User className="h-3.5 w-3.5 text-chocolate-700" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2 justify-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-gold/20 flex items-center justify-center mt-0.5">
              <Bot className="h-3.5 w-3.5 text-brand-gold" />
            </div>
            <div className="bg-surface-card-hover rounded-2xl rounded-bl-md px-3 py-2 border border-surface-border-light">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-surface-border px-3 py-2 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(input);
            }
          }}
          placeholder="Ask a question..."
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none max-h-24 py-2"
        />
        <button
          onClick={() => submit(input)}
          disabled={isLoading || !input.trim()}
          className="p-2 rounded-lg bg-chocolate-700 hover:bg-chocolate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
