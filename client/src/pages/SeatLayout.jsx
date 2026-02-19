import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dummyShowsData, dummyDateTimeData } from "../assets/assets";
import BlurCircle from "../components/BlurCircle";
import { ClockIcon, ArrowRightIcon } from "lucide-react";
import isoTimeFormat from "../lib/isoTimeFormat";
import { toast } from "react-hot-toast";
import Loading from "../components/Loading";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
const SeatLayout = () => {
  const { id, date } = useParams();
  const navigate = useNavigate();
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [show, setShow] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [theatreInfo, setTheatreInfo] = useState(null);
  const { axios, getToken, user } = useContext(AppContext);
  /* ================= FETCH SHOW ================= */
  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/shows/${id}`);

      if (data.success) {
        // Find the theatre that has shows on the selected date
        let matchedTheatre = null;
        let matchedDateTime = null;

        if (data.theatres) {
          for (const theatre of data.theatres) {
            if (theatre.dateTime && theatre.dateTime[date]) {
              matchedTheatre = theatre;
              matchedDateTime = theatre.dateTime;
              break;
            }
          }
        }

        setShow({
          movie: data.movie,
          dateTime: matchedDateTime || {},
        });
        setTheatreInfo(matchedTheatre);
      } else {
        toast.error(data.message);
        navigate("/movies");
      }

    } catch (error) {
      console.error(error);
    }
  };
  const getOccupiedSeats = async () => {
    try {
      const { data } = await axios.get(`/api/bookings/seats/${selectedTime.showId}`);
      if (data.success) {
        setOccupiedSeats(data.occupiedSeats);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const bookTickets = async () => {
    try {
      if (!user) return toast.error("Please login to book tickets");

      if (!selectedTime || selectedSeats.length === 0) return toast.error("Please select time and seats");

      const { data } = await axios.post("/api/bookings/create", { showId: selectedTime.showId, seats: selectedSeats }, { headers: { Authorization: `Bearer ${await getToken()}` } });

      if (data.success) {
        window.location.href = data.url;
      }
      else { toast.error(data.message); }
    }
    catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };


  useEffect(() => {
    getShow();
    window.scrollTo(0, 0);
  }, [id]);
  useEffect(() => {
    if (selectedTime) {
      getOccupiedSeats();
    }
  }, [selectedTime]);

  /* ================= SEAT CLICK ================= */
  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast.error("Please select time first");
    }


    if (occupiedSeats.includes(seatId)) {
      return toast.error("Seat is already booked");
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

  /* ================= SEAT RENDER HELPER ================= */
  const renderSeat = (seatId) => {
    const isSelected = selectedSeats.includes(seatId);
    const isOccupied = occupiedSeats.includes(seatId);

    return (
      <button
        key={seatId}
        onClick={() => {
          if (isOccupied) {
            toast.error("Seat is already booked");
            return;
          }
          handleSeatClick(seatId);
        }}
        disabled={isOccupied}
        className={`h-9 w-9 rounded border text-xs transition flex items-center justify-center
          ${isSelected
            ? "bg-primary text-white"
            : isOccupied
              ? "bg-primary/20 text-white/30 cursor-not-allowed border-primary/20 line-through"
              : "border-primary/60 hover:bg-primary/20 cursor-pointer"
          }`}
      >
        {seatId}
      </button>
    );
  };

  /* ================= A & B CENTER ROW ================= */
  const renderCenterBlock = (rows) => (
    <div className="flex flex-col gap-3 items-center">
      {rows.map((row) => (
        <div key={row} className="flex gap-2 justify-center">
          {Array.from({ length: 9 }, (_, i) => renderSeat(`${row}${i + 1}`))}
        </div>
      ))}
    </div>
  );

  /* ================= SPLIT ROWS ================= */
  const renderSplitRow = (row) => (
    <div key={row} className="flex items-center gap-8 mt-3 justify-center">
      {/* LEFT 1-5 */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => renderSeat(`${row}${i + 1}`))}
      </div>

      {/* AISLE */}
      <div className="w-8 shrink-0" />

      {/* RIGHT 6-9 */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => renderSeat(`${row}${i + 6}`))}
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
                  ${selectedTime?.time === item.time
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
            {/* Theatre Info */}
            {theatreInfo && (
              <div className="text-center mb-4">
                <p className="text-white font-semibold text-base">{theatreInfo.name}</p>
                <p className="text-gray-400 text-sm flex items-center justify-center gap-1">
                  <span>📍</span> {theatreInfo.city}
                </p>
              </div>
            )}
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
          {["C", "D", "E", "F", "G", "H", "I", "J"].map((row, i) => (
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
              bookTickets();
            }}
            disabled={selectedSeats.length === 0}
            className={`flex items-center gap-1 mt-20 px-10 py-3 text-sm
    rounded-full font-medium transition
    ${selectedSeats.length === 0
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
