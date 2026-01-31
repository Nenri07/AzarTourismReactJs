// src/components/SessionWarningModal.jsx
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function SessionWarningModal({ 
  countdown, 
  onStayLoggedIn, 
  onLogout,
  isOpen 
}) {
  const [timeLeft, setTimeLeft] = useState(countdown);

  useEffect(() => {
    setTimeLeft(countdown);
  }, [countdown]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-slideIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2"></div>
        
        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-10 h-10 text-yellow-600" strokeWidth={2} />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
            Still There?
          </h2>
          
          {/* Description */}
          <p className="text-gray-600 text-center mb-6">
            You've been inactive for a while. Your session will expire in:
          </p>

          {/* Countdown Timer */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6 mb-6 border-2 border-red-200">
            <div className="text-center">
              <div className="text-5xl font-bold text-red-600 tracking-tight">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-600 mt-2 font-medium">
                {timeLeft === 1 ? 'second' : 'seconds'} remaining
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">💾 Don't worry!</span> Any unsaved work has been auto-saved as a draft.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onStayLoggedIn}
              className="flex-1 bg-[#003d7a] hover:bg-[#002e5c] text-white font-semibold py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Stay Logged In
            </button>
            
            <button
              onClick={onLogout}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-lg transition-all active:scale-95"
            >
              Logout Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

