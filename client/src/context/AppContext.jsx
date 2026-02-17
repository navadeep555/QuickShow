import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true); // 🔥 Add loading state
  const [shows, setShows] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ===============================
  // Fetch Admin Status
  // ===============================
  const fetchIsAdmin = async () => {
    try {
      const token = await getToken();

      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const { data } = await axios.get("/api/admin/is-admin", {
        headers: {
          Authorization: `Bearer ${token}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      setIsAdmin(data.isAdmin);

      if (!data.isAdmin && location.pathname.startsWith("/admin")) {
        navigate("/");
        toast.error("You are not authorized to access admin dashboard");
      }

    } catch (error) {
      console.error("Admin check error:", error);
      // If error is 401/403, user is not admin
      // If error is network/timeout, assume not admin for safety
      setIsAdmin(false);

      if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
        console.error("Backend connection timeout - check VITE_BASE_URL");
        toast.error("Unable to connect to server. Please try again later.");
      }
    } finally {
      setAdminLoading(false);
    }
  };

  // ===============================
  // Fetch Shows  ✅ FIXED ROUTE
  // ===============================
  const fetchShows = async () => {
    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const { data } = await axios.get("/api/shows/all", {
        signal: controller.signal
      }); // ✅ FIXED

      clearTimeout(timeoutId);

      if (data.success) {
        setShows(data.shows);
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      console.error("Fetch shows error:", error);

      if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
        console.error("Backend connection timeout - check VITE_BASE_URL");
        toast.error("Unable to load shows. Please check your connection.");
      }
    }
  };

  // ===============================
  // Fetch Favorite Movies  ❗ REMOVE if route not created
  // ===============================
  const fetchFavoriteMovies = async () => {
    try {
      const token = await getToken();

      const { data } = await axios.get("/api/user/favorites", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (data.success) {
        setFavoriteMovies(data.movies);
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      console.error(error);
    }
  };

  // ===============================
  // Effects
  // ===============================
  useEffect(() => {
    fetchShows();
  }, []);

  useEffect(() => {
    if (user) {
      fetchIsAdmin();
      fetchFavoriteMovies();
    }
  }, [user]);

  const value = {
    axios,
    fetchIsAdmin,
    user,
    getToken,
    navigate,
    isAdmin,
    shows,
    favoriteMovies,
    fetchFavoriteMovies,
    adminLoading,
    image_base_url,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
