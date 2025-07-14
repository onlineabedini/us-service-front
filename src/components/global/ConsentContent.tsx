import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

// --- Helper: Get markdown file path by language (Vite static import) ---
function getMarkdownUrl(lang: string) {
  if (lang === 'sv') {
    return new URL('@/assets/terms-conditions/Sv.md', import.meta.url).href;
  }
  return new URL('@/assets/terms-conditions/En.md', import.meta.url).href;
}

// --- Main ConsentContent component ---
const ConsentContent: React.FC = () => {
  // Get current language
  const { i18n } = useTranslation();
  // State for markdown content
  const [content, setContent] = useState<string>('');
  // State for loading
  const [loading, setLoading] = useState<boolean>(true);
  // State for error
  const [error, setError] = useState<string | null>(null);

  // Effect: Load markdown file when language changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = getMarkdownUrl(i18n.language);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load terms.');
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load terms.');
        setLoading(false);
      });
  }, [i18n.language]);

  // --- Render loading, error, or markdown ---
  if (loading) {
    return <div className="text-gray-500 text-sm">Loading terms...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default ConsentContent;
