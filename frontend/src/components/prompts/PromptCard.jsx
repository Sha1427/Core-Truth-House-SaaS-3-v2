import React from 'react';
import { Star, Copy, Trash2, Check } from 'lucide-react';

const categoryColors = {
  'generator-scene': '#e04e35',
  'generator-dna': '#763b5b',
  'generator-god-prompt': '#AF0024',
  'generator-launch': '#33033c',
  'custom': '#4a3550',
};

export function PromptCard({ prompt, onCopy, onFavorite, onDelete, copied }) {
  return (
    <div className="p-4 rounded-xl bg-[#2b1040] border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-medium truncate">{prompt.title}</h4>
            <span 
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ 
                background: `${categoryColors[prompt.category] || categoryColors.custom}20`,
                color: categoryColors[prompt.category] || categoryColors.custom
              }}
            >
              {prompt.category?.replace('generator-', '')}
            </span>
          </div>
          <p className="text-sm text-gray-400 line-clamp-2">{prompt.content}</p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onFavorite(prompt.id)}
            className={`p-2 rounded-lg transition-colors ${
              prompt.is_favorite ? 'text-[#e04e35]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Star className={`w-4 h-4 ${prompt.is_favorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => onCopy(prompt.content, prompt.id)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(prompt.id)}
            className="p-2 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
