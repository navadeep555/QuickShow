import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { dateFormat } from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";

const ListBookings = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAllBookings = async () => {
    try {
      const { data } = await axios.get("/api/admin/all-bookings", {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      if (data.success) {
        setBookings(data.bookings);
      } else {
        console.error("Failed to fetch bookings:", data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getAllBookings();
    }
  }, [user]);

  return !isLoading ? (
    <>
      <Title text1="List" text2="Bookings" />

      <div className="max-w-5xl mt-6 overflow-x-auto">
        {bookings.length === 0 ? (
          <p className="text-gray-400 text-sm mt-4">No bookings found.</p>
        ) : (
          <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
            <thead>
              <tr className="bg-primary/20 text-left text-white">
                <th className="p-2 font-medium pl-5">User ID</th>
                <th className="p-2 font-medium">Movie</th>
                <th className="p-2 font-medium">Theatre</th>
                <th className="p-2 font-medium">Show Time</th>
                <th className="p-2 font-medium">Seats</th>
                <th className="p-2 font-medium">Amount</th>
                <th className="p-2 font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="text-sm font-light">
              {bookings.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-primary/20 bg-primary/5 even:bg-primary/10"
                >
                  {/* User — Clerk stores userId as string, not a populated object */}
                  <td className="p-2 pl-5 text-gray-300 text-xs">
                    {typeof item.user === "string"
                      ? item.user.slice(0, 14) + "…"
                      : item.user?.name || item.user?.id || "—"}
                  </td>

                  <td className="p-2">
                    {item.show?.movie?.title || "—"}
                  </td>

                  <td className="p-2 text-gray-300">
                    {item.show?.theatre?.name
                      ? `${item.show.theatre.name}, ${item.show.theatre.city}`
                      : "—"}
                  </td>

                  <td className="p-2">
                    {item.show?.showDateTime ? dateFormat(item.show.showDateTime) : "—"}
                  </td>

                  <td className="p-2">
                    {Array.isArray(item.bookedSeats)
                      ? item.bookedSeats.join(", ")
                      : Object.values(item.bookedSeats || {}).join(", ")}
                  </td>

                  <td className="p-2">
                    {currency} {item.amount}
                  </td>

                  <td className="p-2">
                    {item.isPaid ? (
                      <span className="text-green-400 font-medium">Paid</span>
                    ) : (
                      <span className="text-yellow-400 font-medium">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  ) : (
    <Loading />
  );
};

export default ListBookings;
