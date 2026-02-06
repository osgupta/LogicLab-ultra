
import React, { useState } from 'react';
import { X, ArrowRight, Play, Layout, Cpu, Activity, MousePointer2 } from 'lucide-react';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    title: "Welcome to LogicLab Ultra",
    description: "Design and simulate professional-grade digital circuits right in your browser. Let's take a quick tour of the features.",
    icon: <Cpu className="text-cyan-500" size={48} />,
    color: "bg-cyan-500/10"
  },
  {
    title: "Component Library",
    description: "Use the sidebar on the left to browse and select logic gates, inputs (switches, clocks), and output displays.",
    icon: <Layout className="text-amber-500" size={48} />,
    color: "bg-amber-500/10"
  },
  {
    title: "Placing & Connecting",
    description: "Click anywhere on the canvas to place your selected component. Drag between ports to create wires. Use the 'Junction' tool to split signals.",
    icon: <MousePointer2 className="text-purple-500" size={48} />,
    color: "bg-purple-500/10"
  },
  {
    title: "Real-time Simulation",
    description: "Hit the Play button in the header to start the simulation. Switch to 'Interact' mode to toggle switches and buttons on the fly.",
    icon: <Play className="text-green-500" size={48} />,
    color: "bg-green-500/10"
  },
  {
    title: "Validation & Properties",
    description: "The 'Shield' icon checks for floating inputs. Select any component and click the Info (i) icon to edit labels, colors, and timing delays.",
    icon: <Activity className="text-blue-500" size={48} />,
    color: "bg-blue-500/10"
  }
];

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" />
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 rounded-3xl shadow-3xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
        <div className={`h-40 flex items-center justify-center transition-colors duration-500 ${step.color}`}>
          <div className="animate-bounce">
            {step.icon}
          </div>
        </div>

        <div className="p-8 space-y-4">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              {step.title}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {step.description}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 py-4">
            {STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-cyan-500' : 'w-2 bg-zinc-200 dark:bg-zinc-800'}`} 
              />
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 py-4 text-zinc-500 font-bold hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Previous
              </button>
            )}
            <button 
              onClick={handleNext}
              className="flex-[2] py-4 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-black rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              {currentStep === STEPS.length - 1 ? "Start Designing" : "Continue"}
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};
