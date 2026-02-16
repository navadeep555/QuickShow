import React, { useState } from "react";
import BlurCircle from "./BlurCircle";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const DateSelect = ({ dateTime, id }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const onBookHandler = () => {
    if (!selected) {
      return toast.error("Please select a date");
    }
    navigate(`/movies/${id}/${selected}`);
    window.scrollTo(0, 0);
  };

  return (
    <div id="dateSelect" className="pt-30">
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-10 p-8 rounded-xl
                      bg-gradient-to-r from-[#1a0b10] to-[#2a0f17]
                      border border-red-500/20">

        {/* Blur Effects */}
        <BlurCircle top="-120px" left="-120px" />
        <BlurCircle bottom="-120px" right="-120px" />

        {/* Date Section */}
        <div>
          <p className="text-lg font-semibold mb-4 text-white">
            Choose Date
          </p>

          <div className="flex items-center gap-6">
            <ChevronLeftIcon className="text-white opacity-70" size={28} />

            <div className="grid grid-cols-4 gap-4">
              {Object.keys(dateTime).map((date) => {
                const isSelected = selected === date;

                return (
                  <button
                    key={date}
                    onClick={() => setSelected(date)}
                    className={`h-14 w-14 rounded-lg flex flex-col items-center justify-center text-sm font-medium
                      transition
                      ${
                        isSelected
                          ? "bg-primary text-white"
                          : "border border-primary/70"
                      }`}
                  >
                    <span>{new Date(date).getDate()}</span>
                    <span className="text-xs">
                      {new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </span>
                  </button>
                );
              })}
            </div>

            <ChevronRightIcon className="text-white opacity-70" size={28} />
          </div>
        </div>

        {/* Book Button */}
        <button
          onClick={onBookHandler}
           className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull rounded-md transition active:scale-95"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default DateSelect;
