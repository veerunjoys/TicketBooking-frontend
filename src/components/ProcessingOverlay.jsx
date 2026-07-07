import React from 'react';
import { CheckCircle2, CreditCard, ShieldCheck, TicketCheck } from 'lucide-react';
import ActionLoader from './ActionLoader';

const fallbackSteps = ['Securing request', 'Processing safely', 'Finishing up'];

const ProcessingOverlay = ({
  open,
  title = 'Processing',
  message = 'Please wait...',
  steps = fallbackSteps,
  activeStep = 0,
  done = false,
}) => {
  if (!open) return null;

  const icons = [ShieldCheck, CreditCard, TicketCheck];

  return (
    <div className="processing-overlay" role="status" aria-live="polite">
      <div className="processing-panel">
        <div className={done ? 'processing-core processing-core-done' : 'processing-core'}>
          {done ? <CheckCircle2 size={42} /> : <ActionLoader label="" />}
        </div>

        <h2>{title}</h2>
        <p>{message}</p>

        <div className="processing-steps">
          {steps.map((step, index) => {
            const StepIcon = icons[index % icons.length];
            const stateClass = index < activeStep || done
              ? 'complete'
              : index === activeStep
                ? 'active'
                : '';

            return (
              <div className={`processing-step ${stateClass}`} key={step}>
                <span className="processing-step-icon">
                  {index < activeStep || done ? <CheckCircle2 size={16} /> : <StepIcon size={16} />}
                </span>
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProcessingOverlay;
