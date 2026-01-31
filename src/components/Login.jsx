// "use client";

// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { login } from "../store/authSlice";
// import { authService } from "../Api/auth.api";
// import { Eye, EyeOff, ArrowLeft } from "lucide-react";
// import logo from "../assets/logo.png";

// export default function Login() {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm();

//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const [showPassword, setShowPassword] = useState(false);
//   const [loginError, setLoginError] = useState(null);

//   const onSubmit = async (data) => {
//     setLoginError(null);
//     try {
//       console.log("🔐 Attempting login...");
      
//       // Call login API
//       const response = await authService.login({
//         email: data.email,
//         password: data.password,
//       });

//       console.log("✅ Login response:", response);

//       // FIXED: Handle both possible response structures
//       // Case 1: { access_token, user: {...} }
//       // Case 2: { id, email, fullname, picture, role } (flat)
      
//       const accessToken = response.access_token || localStorage.getItem("accessToken");
      
//       // Check if user data is nested or flat
//       const userObject = response.user || response; // If no 'user' key, response itself is user data
      
//       const userData = {
//         msg: "Welcome",
//         user: userObject
//       };

//       console.log("📦 Dispatching to Redux:", { 
//         userData, 
//         accessToken,
//         userObject 
//       });

//       // Save to Redux
//       dispatch(login({
//         userData: userData,
//         accessToken: accessToken
//       }));

//       console.log("✅ Redux updated, redirecting to dashboard");

//       // Redirect to dashboard
//       navigate("/", { replace: true });
//     } catch (error) {
//       const errMsg = error?.detail || error?.message || "Invalid email or password";
//       setLoginError(errMsg);
//       console.error("❌ Login error:", error);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] font-sans">
//       <div className="w-full max-w-[400px] bg-white rounded-lg shadow-xl overflow-hidden relative mx-4">
//         <div className="h-1.5 w-full bg-[#f39c12]"></div>

//         <div className="p-8 pt-10">
//           <div className="text-center mb-8">
//             <div className="inline-flex justify-center mb-4">
//               <img src={logo} alt="Azar Travel" className="h-12 object-contain" />
//             </div>
//             <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
//             <p className="text-slate-500 text-sm mt-1">Sign in to the Employee Portal</p>
//           </div>

//           {/* Error Message */}
//           {loginError && (
//             <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm text-center">
//               {loginError}
//             </div>
//           )}

//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
//             {/* Email */}
//             <div className="space-y-1.5">
//               <label className="block text-sm font-semibold text-slate-700">Email Address</label>
//               <input
//                 type="email"
//                 placeholder="name@azartravel.com"
//                 className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a] transition-all ${errors.email ? "border-red-500" : ""}`}
//                 {...register("email", {
//                   required: "Email is required",
//                   pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
//                 })}
//               />
//               {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
//             </div>

//             {/* Password */}
//             <div className="space-y-1.5">
//               <label className="block text-sm font-semibold text-slate-700">Password</label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   placeholder="••••••••"
//                   className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a] transition-all ${errors.password ? "border-red-500" : ""}`}
//                   {...register("password", { required: "Password is required" })}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
//                 >
//                   {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//                 </button>
//               </div>
//               {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
//             </div>

//             {/* Remember & Forgot */}
//             <div className="flex items-center justify-between pt-1">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   className="w-4 h-4 rounded border-slate-300 text-[#003d7a] focus:ring-[#003d7a]"
//                   {...register("rememberMe")}
//                 />
//                 <span className="text-sm text-slate-600">Remember me</span>
//               </label>
//               <a href="#" className="text-sm font-medium text-[#003d7a] hover:underline">
//                 Forgot Password?
//               </a>
//             </div>

//             {/* Submit */}
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="w-full bg-[#003d7a] hover:bg-[#002e5c] text-white font-semibold py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
//             >
//               {isSubmitting ? (
//                 <span className="loading loading-spinner loading-xs"></span>
//               ) : (
//                 "Log In"
//               )}
//             </button>
//           </form>

//           <div className="mt-8 text-center border-t border-slate-100 pt-6">
//             <button
//               onClick={() => navigate("/")}
//               className="text-slate-500 hover:text-[#003d7a] text-sm flex items-center justify-center gap-2 transition-colors mx-auto"
//             >
//               <ArrowLeft size={16} />
//               Back to Home
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



// src/components/Login.jsx
// "use client";

// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { login } from "../store/authSlice";
// import { authService } from "../Api/auth.api";
// import { Eye, EyeOff, ArrowLeft } from "lucide-react";
// import logo from "../assets/logo.png";

// export default function Login() {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm();

//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const [showPassword, setShowPassword] = useState(false);
//   const [loginError, setLoginError] = useState(null);

//   const onSubmit = async (data) => {
//     setLoginError(null);
//     try {
//       console.log("🔐 Attempting login...");
      
//       // Call login API (already handles localStorage)
//       const response = await authService.login({
//         email: data.email,
//         password: data.password,
//       });

//       console.log("✅ Login response:", response);

//       // Dispatch to Redux
//       dispatch(login({
//         userData: response.user,
//         accessToken: response.access_token
//       }));

//       console.log("✅ Redux updated, redirecting to dashboard");

//       // Redirect to dashboard
//       navigate("/", { replace: true });
//     } catch (error) {
//       const errMsg = error?.detail || error?.message || "Invalid email or password";
//       setLoginError(errMsg);
//       console.error("❌ Login error:", error);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] font-sans">
//       <div className="w-full max-w-[400px] bg-white rounded-lg shadow-xl overflow-hidden relative mx-4">
//         <div className="h-1.5 w-full bg-[#f39c12]"></div>

//         <div className="p-8 pt-10">
//           <div className="text-center mb-8">
//             <div className="inline-flex justify-center mb-4">
//               <img src={logo} alt="Azar Travel" className="h-12 object-contain" />
//             </div>
//             <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
//             <p className="text-slate-500 text-sm mt-1">Sign in to the Employee Portal</p>
//           </div>

//           {loginError && (
//             <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm text-center">
//               {loginError}
//             </div>
//           )}

//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
//             <div className="space-y-1.5">
//               <label className="block text-sm font-semibold text-slate-700">Email Address</label>
//               <input
//                 type="email"
//                 placeholder="name@azartravel.com"
//                 className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a] transition-all ${errors.email ? "border-red-500" : ""}`}
//                 {...register("email", {
//                   required: "Email is required",
//                   pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
//                 })}
//               />
//               {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
//             </div>

//             <div className="space-y-1.5">
//               <label className="block text-sm font-semibold text-slate-700">Password</label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   placeholder="••••••••"
//                   className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a] transition-all ${errors.password ? "border-red-500" : ""}`}
//                   {...register("password", { required: "Password is required" })}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
//                 >
//                   {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//                 </button>
//               </div>
//               {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
//             </div>

//             <div className="flex items-center justify-between pt-1">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   className="w-4 h-4 rounded border-slate-300 text-[#003d7a] focus:ring-[#003d7a]"
//                   {...register("rememberMe")}
//                 />
//                 <span className="text-sm text-slate-600">Remember me</span>
//               </label>
//               <a href="#" className="text-sm font-medium text-[#003d7a] hover:underline">
//                 Forgot Password?
//               </a>
//             </div>

//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="w-full bg-[#003d7a] hover:bg-[#002e5c] text-white font-semibold py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
//             >
//               {isSubmitting ? (
//                 <span className="loading loading-spinner loading-xs"></span>
//               ) : (
//                 "Log In"
//               )}
//             </button>
//           </form>

//           <div className="mt-8 text-center border-t border-slate-100 pt-6">
//             <button
//               onClick={() => navigate("/")}
//               className="text-slate-500 hover:text-[#003d7a] text-sm flex items-center justify-center gap-2 transition-colors mx-auto"
//             >
//               <ArrowLeft size={16} />
//               Back to Home
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }




"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../store/authSlice";
import { authService } from "../Api/auth.api";
import { Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import logo from "../assets/logo.png";

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  
  // Get session message from navigation state
  const sessionMessage = location.state?.message;

  const onSubmit = async (data) => {
    setLoginError(null);
    try {
      console.log("🔐 Attempting login...");
      
      // Call login API
      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      console.log("✅ Login response:", response);

      // Dispatch to Redux
      dispatch(login({
        userData: response.user,
        accessToken: response.access_token
      }));

      console.log("✅ Redux updated, redirecting to dashboard");

      // Redirect to dashboard
      navigate("/", { replace: true });
    } catch (error) {
      const errMsg = error?.detail || error?.message || "Invalid email or password";
      setLoginError(errMsg);
      console.error("❌ Login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] font-sans">
      <div className="w-full max-w-[400px] bg-white rounded-lg shadow-xl overflow-hidden relative mx-4">
        <div className="h-1.5 w-full bg-[#f39c12]"></div>

        <div className="p-8 pt-10">
          <div className="text-center mb-8">
            <div className="inline-flex justify-center mb-4">
              <img src={logo} alt="Azar Travel" className="h-12 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to the Employee Portal</p>
          </div>

          {/* Session Expired Message */}
          {sessionMessage && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-800 text-sm font-medium">
                    {sessionMessage}
                  </p>
                  <p className="text-yellow-700 text-xs mt-1">
                    Please log in again to continue
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Login Error Message */}
          {loginError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                placeholder="name@azartravel.com"
                className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a] transition-all ${errors.email ? "border-red-500" : ""}`}
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
                })}
              />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a] transition-all ${errors.password ? "border-red-500" : ""}`}
                  {...register("password", { required: "Password is required" })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-[#003d7a] focus:ring-[#003d7a]"
                  {...register("rememberMe")}
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-[#003d7a] hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#003d7a] hover:bg-[#002e5c] text-white font-semibold py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <button
              onClick={() => navigate("/")}
              className="text-slate-500 hover:text-[#003d7a] text-sm flex items-center justify-center gap-2 transition-colors mx-auto"
            >
              <ArrowLeft size={16} />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}