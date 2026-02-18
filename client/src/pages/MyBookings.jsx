import React, { useState, useEffect } from "react";
import { dummyBookingData } from "../assets/assets";
import BlurCircle from "../components/BlurCircle";
import Loading from "../components/Loading";
import { dateFormat } from "../lib/dateFormat";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { Link, useLocation } from "react-router-dom";

const MyBookings = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get("session_id");
  const currency = import.meta.env.VITE_CURRENCY;
  const { axios, getToken, user, image_base_url, selectedCity } = useContext(AppContext);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getMyBookings = async () => {
    try {
      const { data } = await axios.get("/api/bookings/my-bookings", {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });

      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPaymentStatus = async () => {
    try {
      await axios.post("/api/bookings/verify", { sessionId }, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });
    } catch (error) {
      console.log(error);
    } finally {
      getMyBookings();
    }
  };

  useEffect(() => {
    if (user) {
      if (sessionId) {
        verifyPaymentStatus();
      } else {
        getMyBookings();
      }
    }
  }, [user, sessionId]);

  return !isLoading ? (
    <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />

      <div>
        <BlurCircle bottom="0px" left="600px" />
      </div>

      <h1 className="text-lg font-semibold mb-4">My Bookings</h1>

      {/* FILTERED BOOKINGS */}
      {(() => {
        const filteredBookings = selectedCity
          ? bookings.filter(b => b.show?.theatre?.city?.toLowerCase() === selectedCity.toLowerCase())
          : bookings;

        return (
          <>
            <p className="text-gray-400 text-sm mb-6">
              {selectedCity
                ? `Showing bookings in ${selectedCity}`
                : "Showing all bookings"}
            </p>

            {filteredBookings.length === 0 ? (
              <p className="text-gray-500 mt-4">No bookings found in {selectedCity}.</p>
            ) : (
              filteredBookings.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row justify-between
                             bg-primary/8 border border-primary/20
                             rounded-lg mt-4 p-2 max-w-3xl"
                >
                  {/* LEFT SIDE */}
                  <div className="flex flex-col md:flex-row">
                    <img
                      src={image_base_url + item.show.movie.poster_path}
                      alt=""
                      className="md:max-w-45 aspect-video h-auto
                                 object-cover object-bottom rounded"
                    />

                    <div className="flex flex-col p-4">
                      <p className="text-lg font-semibold">
                        {item.show.movie.title}
                      </p>

                      <p className="text-gray-400 text-sm">
                        {item.show.movie.runtime}
                      </p>

                      <p className="text-gray-400 text-sm mt-2">
                        {dateFormat(item.show.showDateTime)}
                      </p>

                      {item.show.theatre && (
                        <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                          <span>📍</span>
                          {item.show.theatre.name}, {item.show.theatre.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDE */}
                  <div className="flex flex-col md:items-end md:text-right justify-between p-4">
                    <div className="flex items-center gap-4">
                      <p className="text-2xl font-semibold mb-3">
                        {currency}{item.amount}
                      </p>

                      {!item.isPaid ? (
                        <Link to={item.paymentLink}
                          className="bg-primary px-4 py-1.5 mb-3
                                     text-sm rounded-full font-medium
                                     cursor-pointer">
                          Pay Now
                        </Link>
                      ) : (
                        <p className="bg-green-500/10 text-green-500 border border-green-500/20 
                                     px-4 py-1 mb-3 text-xs rounded-full font-semibold uppercase tracking-wider">
                          Paid
                        </p>
                      )}
                    </div>

                    <div className="text-sm">
                      <p>
                        <span className="text-gray-400">
                          Total Tickets:
                        </span>{" "}
                        {item.bookedSeats.length}
                      </p>

                      <p>
                        <span className="text-gray-400">
                          Seat Number:
                        </span>{" "}
                        {item.bookedSeats.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        );
      })()}
    </div>
  ) : (
    <Loading />
  );
};

export default MyBookings;
