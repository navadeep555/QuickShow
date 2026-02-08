import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dummyShowsData, dummyDateTimeData } from "../assets/assets";
import BlurCircle from "../components/BlurCircle";
import { ClockIcon, ArrowRightIcon } from "lucide-react";
import isoTimeFormat from "../lib/isoTimeFormat";
import { toast } from "react-hot-toast";
import Loading from "../components/Loading";

const SeatLayout = () => {
  const { id, date } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  /* ================= FETCH SHOW ================= */
  useEffect(() => {
    const foundShow = dummyShowsData.find((s) => s._id === id);
    if (foundShow) {
      setShow({
        movie: foundShow,
        dateTime: dummyDateTimeData,
      });
    }
  }, [id]);

  /* ================= SEAT CLICK ================= */
  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast.error("Please select time first");
    }

    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
      return toast.error("You can select only 5 seats");
    }

    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : [...prev, seatId]
    );
  };

  /* ================= A & B CENTER ROW ================= */
  const renderCenterBlock = (rows) => (
    <div className="grid grid-cols-9 gap-3">
      {rows.flatMap((row) =>
        Array.from({ length: 9 }, (_, i) => {
          const seatId = `${row}${i + 1}`;
          const isSelected = selectedSeats.includes(seatId);

          return (
            <button
              key={seatId}
              onClick={() => handleSeatClick(seatId)}
              className={`h-9 w-9 rounded border text-xs transition
                ${
                  isSelected
                    ? "bg-primary text-white"
                    : "border-primary/60 hover:bg-primary/20"
                }`}
            >
              {seatId}
            </button>
          );
        })
      )}
    </div>
  );

  /* ================= SPLIT ROWS ================= */
  const renderSplitRow = (row) => (
    <div key={row} className="flex items-center gap-8 mt-3">
      {/* LEFT 1–5 */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => {
          const seatId = `${row}${i + 1}`;
          const isSelected = selectedSeats.includes(seatId);

          return (
            <button
              key={seatId}
              onClick={() => handleSeatClick(seatId)}
              className={`h-8 w-8 rounded border text-xs transition
                ${
                  isSelected
                    ? "bg-primary text-white"
                    : "border-primary/60 hover:bg-primary/20"
                }`}
            >
              {seatId}
            </button>
          );
        })}
      </div>

      {/* AISLE */}
      <div className="w-10" />

      {/* RIGHT 6–9 */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => {
          const seatId = `${row}${i + 6}`;
          const isSelected = selectedSeats.includes(seatId);

          return (
            <button
              key={seatId}
              onClick={() => handleSeatClick(seatId)}
              className={`h-8 w-8 rounded border text-xs transition
                ${
                  isSelected
                    ? "bg-primary text-white"
                    : "border-primary/60 hover:bg-primary/20"
                }`}
            >
              {seatId}
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ================= UI ================= */
  return show ? (
    <div className="px-6 md:px-16 lg:px-40 py-28">
      <div className="flex flex-col md:flex-row gap-12">

        {/* ===== TIME SELECTION ===== */}
        <div className="w-full md:w-60 bg-primary/10 border border-primary/20 rounded-lg py-6">
          <p className="text-lg font-semibold px-6">Available Timings</p>

          <div className="mt-4 space-y-2 px-4">
            {show.dateTime?.[date]?.map((item) => (
              <div
                key={item.time}
                onClick={() => setSelectedTime(item)}
                className={`flex items-center gap-2 px-4 py-2 rounded cursor-pointer transition
                  ${
                    selectedTime?.time === item.time
                      ? "bg-primary text-white"
                      : "hover:bg-primary/20"
                  }`}
              >
                <ClockIcon className="w-4 h-4" />
                <span className="text-sm">
                  {isoTimeFormat(item.time)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== SEAT LAYOUT ===== */}
        <div className="relative flex-1 flex flex-col items-center">
          <BlurCircle top="-120px" left="-120px" />
          <BlurCircle bottom="0" right="0" />

          <h1 className="text-2xl font-semibold mb-4">
            Select your seat
          </h1>

          {/* SCREEN */}
          <div className="w-full max-w-xl mb-6">
            <div className="h-2 bg-primary/50 rounded-full mb-2" />
            <p className="text-center text-gray-400 text-sm">
              SCREEN SIDE
            </p>
          </div>

          {/* A & B */}
          <div className="mb-16">
            {renderCenterBlock(["A", "B"])}
          </div>

          {/* C–J */}
          {["C","D","E","F","G","H","I","J"].map((row, i) => (
            <React.Fragment key={row}>
              {renderSplitRow(row)}
              {i % 2 === 1 && <div className="mt-12" />}
            </React.Fragment>
          ))}

          {/* ===== PROCEED BUTTON ===== */}
          <button
  onClick={() => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }
    navigate("/my-bookings");
  }}
  disabled={selectedSeats.length === 0}
  className={`flex items-center gap-1 mt-20 px-10 py-3 text-sm
    rounded-full font-medium transition
    ${
      selectedSeats.length === 0
        ? "bg-primary/40 cursor-not-allowed"
        : "bg-primary hover:bg-primary-dull cursor-pointer active:scale-95"
    }`}
>
  Proceed to Checkout
  <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
</button>

        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default SeatLayout;
