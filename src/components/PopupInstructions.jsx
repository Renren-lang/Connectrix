import React, { useState } from 'react';

const PopupInstructions = ({ onClose }) => {
  const [showInstructions, setShowInstructions] = useState(true);

  if (!showInstructions) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Enable Popups for Google Sign-In</h3>
          <button
            onClick={() => {
              setShowInstructions(false);
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Google Sign-In requires popups to work properly. Please follow these steps:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">1</span>
              <p className="text-sm text-gray-700">
                Look for the popup blocker icon in your browser's address bar
              </p>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">2</span>
              <p className="text-sm text-gray-700">
                Click on the popup blocker icon and select "Always allow popups from this site"
              </p>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">3</span>
              <p className="text-sm text-gray-700">
                Refresh the page and try Google Sign-In again
              </p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800">
              <strong>Alternative:</strong> If popups are still blocked, the app will automatically use redirect authentication instead.
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowInstructions(false);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupInstructions;
