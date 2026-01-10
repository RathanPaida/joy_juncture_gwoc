"use client";

import { useState } from "react";
import { format } from "date-fns";
import PaymentModal from "@/app/components/PaymentModal";

interface EventCardProps {
  event: {
    _id: string;
    name: string;
    description: string;
    date: string;
    price: number;
    coins: number;
    registrationLink: string;
  };
  isUpcoming: boolean;
  user: any;
  onRegisterSuccess?: () => void;
}

export default function EventCard({
  event,
  isUpcoming,
  user,
  onRegisterSuccess,
}: EventCardProps) {
  const [showPayment, setShowPayment] = useState(false);

  const handleRegister = () => {
    if (!user) {
      // Redirect to login
      alert("Please login to register");
      return;
    }

    if (isUpcoming) {
      setShowPayment(true);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-800">{event.name}</h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isUpcoming
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {isUpcoming ? "Upcoming" : "Past"}
            </span>
          </div>

          <p className="text-gray-600 mb-4">{event.description}</p>

          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">
                {format(new Date(event.date), "PPP")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="font-medium">₹{event.price}</p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-500">Coins Reward</p>
              <p className="font-medium text-yellow-600">{event.coins} coins</p>
            </div>
          </div>

          {isUpcoming ? (
            <button
              onClick={handleRegister}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-200"
            >
              Register Now - ₹{event.price}
            </button>
          ) : (
            <div className="text-center py-3 bg-gray-100 rounded-lg">
              <p className="text-gray-600">Event Completed</p>
            </div>
          )}
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          event={event}
          user={user}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            onRegisterSuccess?.();
          }}
        />
      )}
    </>
  );
}
