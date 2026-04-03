const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Instant Generation',
    desc: 'Analyzes your website and generates a polished brochure in under 30 seconds.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: 'Smart Scraping',
    desc: 'AI identifies and reads the most relevant pages—about, careers, products—automatically.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    title: 'Three Tones',
    desc: 'Choose professional, friendly, or witty to match your brand voice perfectly.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    title: 'Export Ready',
    desc: 'Copy to clipboard or download as Markdown—ready to paste anywhere.',
  },
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-16">
      {FEATURES.map((f, i) => (
        <div
          key={i}
          className="glass rounded-xl p-4 space-y-2.5 hover:bg-white/[0.06] transition-colors duration-200"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center text-violet-400">
            {f.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200 mb-1">{f.title}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
