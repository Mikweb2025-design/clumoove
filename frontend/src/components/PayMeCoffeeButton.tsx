import React, { useState } from 'react';
import { Coffee, CreditCard, Loader2 } from 'lucide-react';

interface PayMeCoffeeButtonProps {
  userId?: string;
  currentStorageGB: number;
  onPaymentSuccess?: () => void;
}

const formatError = (err: Error) => err.message;

export const PayMeCoffeeButton: React.FC<PayMeCoffeeButtonProps> = ({
  currentStorageGB,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const maxTransferLimit = 100; // GB
  const amount = "2.00";

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paypalEmail) {
      alert("Please enter your PayPal email");
      return;
    }

    setIsProcessing(true);
    try {
      // Call the correct PayPal API endpoint
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ 
          paypal_email: paypalEmail,
          amount: amount
        })
      });
      
      if (response.ok) {
        await response.json();
        alert("Payment successful! Storage increased by 100GB");
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
        setShowModal(false);
        setPaypalEmail('');
      } else {
        throw new Error(formatError(new Error(`${response.status} ${response.statusText}`)));
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(formatError(error as Error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setPaypalEmail('');
  };

  return (
    <div className="flex flex-col space-y-2">
      <button
        onClick={handleOpenModal}
        disabled={currentStorageGB >= 200}
        className="flex items-center justify-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-yellow-900 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={currentStorageGB >= 200 ? "You have already paid for 200GB+ storage" : "Pay 2 EUR for 100GB bonus (limit: 100GB)"}
      >
        <Coffee className="w-4 h-4" />
        <span className="font-medium">Pay Me Coffee €{amount} - +{maxTransferLimit}GB</span>
      </button>

      {/* Modal for PayPal payment */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Coffee className="w-6 h-6 mr-2" />
              Pay Me Coffee
            </h3>
            
            {currentStorageGB >= 200 ? (
              <div className="text-green-600 font-bold">
                ✅ You already have 200GB storage! Thank you! ❤️
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  <p>Pay €{amount} via PayPal to get:</p>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Extra 100GB storage (total: {currentStorageGB + 100}GB)</li>
                    <li>High data transfer limit: {maxTransferLimit}GB transfer limit</li>
                  </ul>
                </div>
              </>
            )}
            
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your PayPal Email
                </label>
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="your@email.com"
                  disabled={isProcessing}
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-500">
                  Secure PayPal payment - {amount} EUR
                </span>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isProcessing || !paypalEmail}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>Pay €{amount} via PayPal</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isProcessing}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayMeCoffeeButton;
