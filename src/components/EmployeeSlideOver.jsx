import { useState, useEffect } from "react";
import { X, Upload, User, Mail, Lock, UserCircle } from "lucide-react";

const EmployeeSlideOver = ({ isOpen, onClose, employee, onSave }) => {
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    is_active: true,
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        username: employee.username || "",
        full_name: employee.full_name || "",
        email: employee.email || "",
        password: "",
        is_active: employee.is_active ?? true,
      });
      setAvatarPreview(employee.avatar || null);
    } else {
      setFormData({
        username: "",
        full_name: "",
        email: "",
        password: "",
        is_active: true,
      });
      setAvatarPreview(null);
    }
    setAvatarFile(null);
  }, [employee, isOpen]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData, avatarFile, employee?.id);
    } catch (error) {
      console.error("Error saving employee:", error);
      alert(error.message || "Failed to save employee");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Slide Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="px-6 py-5 bg-[#003d7a] border-b border-blue-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {employee ? "Edit Employee" : "Add New Employee"}
                </h2>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-6 space-y-5">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-3 pb-5 border-b border-slate-100">
                  <div className="relative">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-4 border-slate-100"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-slate-50">
                        <UserCircle size={48} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 text-[#003d7a] hover:text-[#004e9a] text-sm font-semibold transition-colors">
                      <Upload size={16} />
                      Upload Photo
                    </span>
                  </label>
                </div>


                {/* Full Name */}
                <div>
                  <label className="flex items-center gap-2 text-slate-700 text-sm font-medium mb-2">
                    <UserCircle size={16} className="text-slate-500" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:border-[#003d7a] focus:ring-2 focus:ring-[#003d7a]/20 transition-all"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-slate-700 text-sm font-medium mb-2">
                    <Mail size={16} className="text-slate-500" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:border-[#003d7a] focus:ring-2 focus:ring-[#003d7a]/20 transition-all"
                    placeholder="Enter email"
                    required
                  />
                </div>

                {/* Password - Only for new employee */}
                {!employee && (
                  <div>
                    <label className="flex items-center gap-2 text-slate-700 text-sm font-medium mb-2">
                      <Lock size={16} className="text-slate-500" />
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:border-[#003d7a] focus:ring-2 focus:ring-[#003d7a]/20 transition-all"
                      placeholder="Enter password"
                      required
                      minLength={8}
                    />
                    <p className="text-slate-500 text-xs mt-1.5">
                      Min 8 characters, 1 uppercase, 1 digit
                    </p>
                  </div>
                )}

                
              </div>

              {/* Footer Buttons */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#003d7a] hover:bg-[#004e9a] text-white px-4 py-2.5 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </span>
                  ) : employee ? (
                    "Update Employee"
                  ) : (
                    "Add Employee"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSlideOver;