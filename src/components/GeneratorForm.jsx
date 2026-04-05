import { useState } from 'react';

const TONES = [
  { value: 'professional', label: 'Professional', icon: '💼', desc: 'Formal & authoritative' },
  { value: 'friendly', label: 'Friendly', icon: '😊', desc: 'Warm & approachable' },
  { value: 'witty', label: 'Witty', icon: '✨', desc: 'Fun & entertaining' },
];

export default function GeneratorForm({ onGenerate, isGenerating }) {
  const [companyName, setCompanyName] = useState('');
  const [url, setUrl] = useState('');
  const [tone, setTone] = useState('professional');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!companyName.trim() || !url.trim()) return;

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    onGenerate({ companyName: companyName.trim(), url: normalizedUrl, tone });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Company Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Corporation"
            className="input-field pl-10"
            required
            disabled={isGenerating}
          />
        </div>
      </div>

      {/* Website URL */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Website URL
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://company.com"
            className="input-field pl-10"
            required
            disabled={isGenerating}
          />
        </div>
      </div>

      {/* Tone Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Brochure Tone
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTone(t.value)}
              disabled={isGenerating}
              className={`
                relative flex flex-col items-center gap-1 sm:gap-1.5 rounded-xl border p-2.5 sm:p-3 text-center
                transition-all duration-200 cursor-pointer
                ${tone === t.value
                  ? 'border-violet-500/50 bg-violet-500/10 shadow-sm shadow-violet-500/20'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.05]'
                }
              `}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span className={`text-xs font-semibold ${tone === t.value ? 'text-violet-300' : 'text-slate-300'}`}>
                {t.label}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight hidden sm:block">{t.desc}</span>

              {tone === t.value && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isGenerating || !companyName.trim() || !url.trim()}
        className="btn-primary w-full text-base"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2.5">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Brochure
          </span>
        )}
      </button>
    </form>
  );
}
