import React, { useState } from "react";
import Title from "../../components/admin/Title";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const AddTheatre = () => {
    const { axios, getToken } = useAppContext();
    const [form, setForm] = useState({ name: "", city: "", address: "", totalSeats: 90 });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.city || !form.address) {
            return toast.error("Please fill all required fields");
        }
        try {
            setLoading(true);
            const { data } = await axios.post(
                "/api/theatres/add",
                { ...form, totalSeats: Number(form.totalSeats) },
                { headers: { Authorization: `Bearer ${await getToken()}` } }
            );
            if (data.success) {
                toast.success(data.message);
                setForm({ name: "", city: "", address: "", totalSeats: 90 });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add theatre");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Title text1="Add" text2="Theatre" />

            <form onSubmit={handleSubmit} className="mt-10 max-w-lg space-y-5">

                <div>
                    <label className="block text-sm mb-1">Theatre Name <span className="text-red-400">*</span></label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. PVR Cinemas"
                        className="w-full border border-gray-600 bg-transparent rounded-md px-4 py-2 outline-none focus:border-primary transition"
                    />
                </div>

                <div>
                    <label className="block text-sm mb-1">City <span className="text-red-400">*</span></label>
                    <input
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="e.g. Hyderabad"
                        className="w-full border border-gray-600 bg-transparent rounded-md px-4 py-2 outline-none focus:border-primary transition"
                    />
                </div>

                <div>
                    <label className="block text-sm mb-1">Address <span className="text-red-400">*</span></label>
                    <input
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="e.g. Banjara Hills, Road No. 12"
                        className="w-full border border-gray-600 bg-transparent rounded-md px-4 py-2 outline-none focus:border-primary transition"
                    />
                </div>

                <div>
                    <label className="block text-sm mb-1">Total Seats</label>
                    <input
                        name="totalSeats"
                        type="number"
                        min={1}
                        value={form.totalSeats}
                        onChange={handleChange}
                        className="w-40 border border-gray-600 bg-transparent rounded-md px-4 py-2 outline-none focus:border-primary transition"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary text-white px-8 py-2 rounded-lg hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-60"
                >
                    {loading ? "Adding..." : "Add Theatre"}
                </button>
            </form>
        </>
    );
};

export default AddTheatre;
