import React, { useEffect, useState } from "react";
import Title from "../../components/admin/Title";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import Loading from "../../components/Loading";
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const ListTheatres = () => {
    const { axios, getToken } = useAppContext();
    const [theatres, setTheatres] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTheatres = async () => {
        try {
            const { data } = await axios.get("/api/theatres/admin/all", {
                headers: { Authorization: `Bearer ${await getToken()}` },
            });
            if (data.success) {
                setTheatres(data.theatres);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this theatre?")) return;
        try {
            const { data } = await axios.delete(`/api/theatres/${id}`, {
                headers: { Authorization: `Bearer ${await getToken()}` },
            });
            if (data.success) {
                toast.success(data.message);
                setTheatres((prev) => prev.filter((t) => t._id !== id));
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to delete theatre");
        }
    };

    const handleToggle = async (id) => {
        try {
            const { data } = await axios.patch(`/api/theatres/${id}/toggle`, {}, {
                headers: { Authorization: `Bearer ${await getToken()}` },
            });
            if (data.success) {
                toast.success(data.message);
                setTheatres((prev) =>
                    prev.map((t) => (t._id === id ? { ...t, isActive: data.theatre.isActive } : t))
                );
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to update theatre status");
        }
    };

    useEffect(() => {
        fetchTheatres();
    }, []);

    if (loading) return <Loading />;

    return (
        <>
            <Title text1="List" text2="Theatres" />

            <div className="max-w-4xl mt-6 overflow-x-auto">
                {theatres.length === 0 ? (
                    <p className="text-gray-400 mt-4">No theatres added yet.</p>
                ) : (
                    <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap text-sm">
                        <thead>
                            <tr className="bg-primary/20 text-left text-white">
                                <th className="p-2 font-medium pl-5">Name</th>
                                <th className="p-2 font-medium">City</th>
                                <th className="p-2 font-medium">Address</th>
                                <th className="p-2 font-medium">Seats</th>
                                <th className="p-2 font-medium">Status</th>
                                <th className="p-2 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="font-light">
                            {theatres.map((theatre, index) => (
                                <tr
                                    key={theatre._id}
                                    className="border-b border-primary/10 bg-primary/5 even:bg-primary/10"
                                >
                                    <td className="p-2 pl-5 font-medium">{theatre.name}</td>
                                    <td className="p-2">{theatre.city}</td>
                                    <td className="p-2 max-w-xs truncate">{theatre.address}</td>
                                    <td className="p-2">{theatre.totalSeats}</td>
                                    <td className="p-2">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${theatre.isActive
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-red-500/20 text-red-400"
                                                }`}
                                        >
                                            {theatre.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="p-2 flex items-center gap-3">
                                        <button
                                            onClick={() => handleToggle(theatre._id)}
                                            title={theatre.isActive ? "Deactivate" : "Activate"}
                                            className="text-gray-400 hover:text-primary transition"
                                        >
                                            {theatre.isActive ? (
                                                <ToggleRight className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <ToggleLeft className="w-5 h-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(theatre._id)}
                                            title="Delete"
                                            className="text-red-400 hover:text-red-600 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
};

export default ListTheatres;
