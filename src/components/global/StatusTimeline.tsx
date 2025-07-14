import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type StatusStep = {
  status: string;
  timestamp: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
  needsCompletion?: boolean;
};

interface StatusTimelineProps {
  steps: StatusStep[];
  containerClassName?: string;
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({ steps }) => {
  const { t } = useTranslation();

  const getStatusIcon = (step: StatusStep) => {
    if (step.isCompleted) {
      return <Check className="w-5 h-5 text-green-500" />;
    }
    if (step.isCurrent) {
      return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
    }
    if (step.needsCompletion) {
      return <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />;
    }
    return <AlertCircle className="w-5 h-5 text-gray-400" />;
  };

  const getStatusColor = (step: StatusStep) => {
    if (step.isCompleted) {
      return 'text-green-600';
    }
    if (step.isCurrent) {
      return 'text-blue-600';
    }
    if (step.needsCompletion) {
      return 'text-red-600';
    }
    return 'text-gray-500';
  };

  const getStatusBackground = (step: StatusStep) => {
    if (step.isCompleted) {
      return 'bg-green-100 border-2 border-green-500';
    }
    if (step.isCurrent) {
      return 'bg-blue-100 border-2 border-blue-500';
    }
    if (step.needsCompletion) {
      return 'bg-red-100 border-2 border-red-500';
    }
    return 'bg-gray-100 border-2 border-gray-300';
  };

  return (
    <div className={`relative w-full p-4 min-h-[160px]`}>
      {/* Timeline line aligned with icon centers */}
      <div className="absolute left-0 right-0 top-[32px] h-0.5 bg-gray-200 z-0" />
      <div className="relative flex justify-between flex-wrap w-full">
        {steps.map((step, index) => (
          <div
            key={index}
            className="relative flex flex-col items-center flex-1 min-w-[120px] max-w-[220px]"
          >
            {/* Status icon with background */}
            <div className={`
              relative z-10 flex items-center justify-center w-10 h-10 rounded-full
              ${getStatusBackground(step)}
              transition-all duration-300
              ${(step.isCurrent || step.needsCompletion) ? 'scale-110' : 'hover:scale-105'}
            `}>
              {getStatusIcon(step)}
            </div>
            {/* Status content */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full px-2">
              <div className="text-center">
                <h4 className={`text-sm font-semibold ${getStatusColor(step)} truncate`}>
                  {step.status}
                </h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 truncate">
                  {step.description}
                </p>
                <span className="text-xs text-gray-400 mt-1 block truncate">
                  {new Date(step.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusTimeline; 