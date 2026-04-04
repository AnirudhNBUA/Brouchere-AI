import { useState, useRef } from 'react';
import Header from './components/Header.jsx';
import GeneratorForm from './components/GeneratorForm.jsx';
import StepsProgress from './components/StepsProgress.jsx';
import BrochureOutput from './components/BrochureOutput.jsx';
import FeatureCards from './components/FeatureCards.jsx';

export default function App() {
  const [status, setStatus] = useState('idle'); // idle | generating | done | error
  const [currentStep, setCurrentStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [brochureContent, setBrochureContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastCompanyName, setLastCompanyName] = useState('');
  const progressRef = useRef(null);

  const handleGenerate = async ({ companyName, url, tone }) => {
    setStatus('generating');
    setCurrentStep(1);
    setCurrentMessage('');
    setBrochureContent('');
    setErrorMessage('');
    setLastCompanyName(companyName);

    // Scroll to progress section immediately on submit
    setTimeout(() => {
      progressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    try {
      const response = await fetch('/api/generate-brochure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, url, tone }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          let event;
          try {
            event = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          if (event.type === 'step') {
            setCurrentStep(event.step);
            setCurrentMessage(event.message);
          } else if (event.type === 'chunk') {
            chunkBuffer += event.content;
            setBrochureContent((prev) => prev + event.content);
          } else if (event.type === 'done') {
            setStatus('done');
            setCurrentStep(5);
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        }
      }

      if (status !== 'done') setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setCurrentStep(0);
    setCurrentMessage('');
    setBrochureContent('');
    setErrorMessage('');
    setLastCompanyName('');
  };

  const isGenerating = status === 'generating';
  const isStreaming = isGenerating && brochureContent.length > 0;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background orbs */}
      <div
        className="orb w-[600px] h-[600px] opacity-[0.07]"
        style={{
          background: 'radial-gradient(circle, #7c3aed, transparent 70%)',
          top: '-200px',
          left: '-100px',
          animationDelay: '0s',
        }}
      />
      <div
        className="orb w-[500px] h-[500px] opacity-[0.05]"
        style={{
          background: 'radial-gradient(circle, #3b82f6, transparent 70%)',
          top: '300px',
          right: '-150px',
          animationDelay: '3s',
        }}
      />
      <div
        className="orb w-[400px] h-[400px] opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, #6366f1, transparent 70%)',
          bottom: '100px',
          left: '20%',
          animationDelay: '5s',
        }}
      />

      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        {/* Hero section */}
        <section className="text-center py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 step-badge mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Powered by GPT-4.1
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-100 mb-5 leading-[1.1]">
            Generate stunning{' '}
            <span className="gradient-text">company brochures</span>
            <br />
            in seconds
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Enter any company URL and our AI will read the website, identify key pages,
            and craft a polished brochure—ready for clients, investors, and recruits.
          </p>

          {/* Main card */}
          <div className="max-w-lg mx-auto">
            <div className="glass gradient-border p-7 sm:p-8 text-left shadow-2xl shadow-black/40">
              <GeneratorForm onGenerate={handleGenerate} isGenerating={isGenerating} />
            </div>
          </div>

          {/* Feature cards */}
          <FeatureCards />
        </section>

        {/* Progress + Output section */}
        {(status !== 'idle') && (
          <section className="max-w-3xl mx-auto space-y-6" ref={progressRef}>
            {/* Progress */}
            {(isGenerating || status === 'done') && (
              <div className="glass p-6">
                <StepsProgress
                  currentStep={currentStep}
                  currentMessage={status === 'done' ? 'Brochure complete!' : currentMessage}
                />
              </div>
            )}

            {/* Error state */}
            {status === 'error' && (
              <div className="glass border-red-500/20 bg-red-500/5 p-6 rounded-2xl animate-fade-in-up">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-300 mb-1">Generation failed</p>
                    <p className="text-sm text-red-400/80">{errorMessage}</p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="mt-4 w-full rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/20 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Brochure output */}
            {brochureContent && (
              <BrochureOutput
                content={brochureContent}
                isStreaming={isStreaming}
                companyName={lastCompanyName}
              />
            )}

            {/* Generate another button */}
            {status === 'done' && (
              <div className="text-center animate-fade-in-up">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-6 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.08] hover:text-slate-100 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Generate Another
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.05] py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-slate-600">
          Built with GPT-4.1 · Deployed on Netlify · Streams in real-time
        </div>
      </footer>
    </div>
  );
}
