import React from 'react';

const SuccessModal = ({ 
  isEdit = false, 
  onClose 
}) => {
  return (
    <dialog id="success_modal" className="modal modal-bottom sm:modal-middle">
      <div className="modal-box relative bg-white max-w-md text-center p-8">
        
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <svg 
              className="w-12 h-12 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth={3}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-2xl text-slate-800 mb-3">
          {isEdit ? "Invoice Updated!" : "Invoice Created!"}
        </h3>

        {/* Subtitle */}
        <p className="text-slate-600 mb-8">
          Your invoice has been {isEdit ? "updated" : "created"} successfully
        </p>

        {/* Action Button */}
        <form method="dialog" className="w-full">
          <button 
            onClick={onClose}
            className="btn w-full bg-green-500 hover:bg-green-600 text-white border-none font-semibold h-12 text-base shadow-md"
          >
            View All Invoices
          </button>
        </form>

        {/* Close X button */}
        <form method="dialog">
          <button 
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </form>
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default SuccessModal;
