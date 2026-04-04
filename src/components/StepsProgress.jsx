const STEPS = [
  { id: 1, label: 'Fetching links' },
  { id: 2, label: 'Analyzing pages' },
  { id: 3, label: 'Reading content' },
  { id: 4, label: 'Generating' },
];

export default function StepsProgress({ currentStep, currentMessage }) {
  return (
    <div className="space-y-4">
      {/* Step dots */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                  transition-all duration-500
                  ${done
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/40'
                    : active
                    ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/40 ring-4 ring-violet-500/20'
                    : 'bg-white/[0.05] text-slate-500 border border-white/[0.08]'
                  }
                `}>
                  {done ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : active ? (
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${
                  active ? 'text-violet-300' : done ? 'text-emerald-400' : 'text-slate-600'
                }`}>
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-2 mb-4 rounded-full bg-white/[0.06] relative overflow-hidden">
                  <div className={`
                    absolute inset-0 rounded-full transition-all duration-700
                    ${done ? 'bg-emerald-500/50' : 'bg-transparent'}
                  `} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current message */}
      {currentMessage && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          {currentMessage}
        </div>
      )}
    </div>
  );
}
