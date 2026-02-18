import React, { useState, useEffect } from "react";
import BlurCircle from "./BlurCircle";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const DateSelect = ({ dateTime, id }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  // Reset selection when dateTime changes (different theatre selected)
  useEffect(() => {
    setSelected(null);
  }, [dateTime]);

  const dates = Object.keys(dateTime || {});

  const onBookHandler = () => {
    if (!selected) {
      return toast.error("Please select a date");
    }
    navigate(`/movies/${id}/${selected}`);
    window.scrollTo(0, 0);
  };

  if (dates.length === 0) {
    return (
      <div className="pt-10">
        <p className="text-gray-400 text-sm">No upcoming show dates for this theatre.</p>
      </div>
    );
  }

  return (
    <div className="pt-10">
      <div
        className="relative flex flex-col md:flex-row items-center justify-between gap-10 p-8 rounded-xl
                    bg-gradient-to-r from-[#1a0b10] to-[#2a0f17]
                    border border-red-500/20"
      >
        {/* Blur Effects */}
        <BlurCircle top="-120px" left="-120px" />
        <BlurCircle bottom="-120px" right="-120px" />

        {/* Date Section */}
        <div>
          <p className="text-lg font-semibold mb-4 text-white">
            Choose Date
          </p>

          <div className="flex items-center gap-4">
            <ChevronLeftIcon className="text-white opacity-40" size={24} />

            <div className="flex flex-wrap gap-3">
              {dates.map((date) => {
                const isSelected = selected === date;
                const d = new Date(date + "T00:00:00"); // force local time parse

                return (
                  <button
                    key={date}
                    onClick={() => setSelected(date)}
                    className={`h-16 w-16 rounded-xl flex flex-col items-center justify-center text-sm font-medium
                      transition-all duration-150 active:scale-95
                      ${isSelected
                        ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                        : "border border-primary/70 hover:border-primary hover:bg-primary/10 text-gray-200"
                      }`}
                  >
                    <span className="text-base font-bold">{d.getDate()}</span>
                    <span className="text-xs opacity-80">
                      {d.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </button>
                );
              })}
            </div>

            <ChevronRightIcon className="text-white opacity-40" size={24} />
          </div>

          {!selected && (
            <p className="text-xs text-gray-500 mt-3">← Tap a date to continue</p>
          )}
        </div>

        {/* Book Button */}
        <button
          onClick={onBookHandler}
          disabled={!selected}
          className={`px-10 py-3 text-sm rounded-md transition active:scale-95 font-medium
            ${selected
              ? "bg-primary hover:bg-primary-dull cursor-pointer"
              : "bg-gray-700 text-gray-400 cursor-not-allowed opacity-60"
            }`}
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default DateSelect;
