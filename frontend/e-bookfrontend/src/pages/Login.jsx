import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { GoogleLogin } from '@react-oauth/google';

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "https://bookflix-1-o3od.onrender.com/api/auth/login",
        formData
      );

      if (res.data.user.blocked === true) {
        setError(res.data.message || "Your account has been blocked.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("userId", res.data.user.id);
      localStorage.setItem("name", res.data.user.name);
      localStorage.setItem("email", res.data.user.email);

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.blocked) {
        setError(
          err.response?.data?.message ||
            "Your account has been blocked by an administrator."
        );
      } else {
        setError(err.response?.data?.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    
    try {
      const res = await axios.post("https://bookflix-1-o3od.onrender.com/api/auth/google", {
        token: credentialResponse.credential
      });

      if (res.data.user.blocked === true) {
        setError(res.data.message || "Your account has been blocked.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("userId", res.data.user.id);
      localStorage.setItem("name", res.data.user.name);
      localStorage.setItem("email", res.data.user.email);

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.blocked) {
        setError(err.response?.data?.message || "Your account has been blocked by an administrator.");
      } else {
        setError(err.response?.data?.message || "Google Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In failed or was cancelled.");
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE */}
      <div className="w-full md:w-[35%] flex items-center justify-center bg-white px-10">
        <div className="w-full max-w-sm">

          <h1 className="text-2xl font-bold text-indigo-600 mb-10">
            NovaSpace
          </h1>

          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back
          </h2>

          <p className="text-gray-500 mb-6">Sign in to your account</p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>

              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-600">
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Forgot?
                </Link>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition shadow-md disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          <div className="mt-8 flex items-center justify-between">
            <span className="border-b w-1/5 lg:w-1/4 pt-1 border-gray-200"></span>
            <span className="text-xs text-center text-gray-500 uppercase tracking-wide font-medium">Or continue with</span>
            <span className="border-b w-1/5 lg:w-1/4 pt-1 border-gray-200"></span>
          </div>

          <div className="mt-6 flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              width="100%"
            />
          </div>

          <p className="text-sm text-gray-500 mt-8 text-center">
            Don’t have an account?{" "}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline">
              Sign up
            </Link>
          </p>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="hidden md:flex md:w-[65%] items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 p-12">
        <div className="text-center max-w-lg">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Welcome to NovaSpace
          </h2>

          <p className="text-gray-600 text-lg leading-relaxed">
            Manage your workspace, collaborate with your team, and grow your
            productivity with a modern platform.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;