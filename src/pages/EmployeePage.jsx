import { useState, useEffect } from "react";
import { UserPlus, Users, Search, Filter } from "lucide-react";
import { EmployeeCard, EmployeeSlideOver } from "../components";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../Api/auth.api";

const EmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { user } = useAuth();
  const isSuperAdmin = user?.user.role === "super_admin";
  console.log("is Super",isSuperAdmin, "and val", user);
  

  useEffect(() => {
    if (isSuperAdmin) {
      fetchEmployees();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    let filtered = employees;

    if (searchQuery) {
      filtered = filtered.filter(
        (emp) =>
          emp.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((emp) => emp.role === roleFilter);
    }

    setFilteredEmployees(filtered);
  }, [searchQuery, roleFilter, employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/users");
      setEmployees(response.data.users || []);
      setFilteredEmployees(response.data.users || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsSlideOverOpen(true);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsSlideOverOpen(true);
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;

    try {
      await api.delete(`/auth/users/${employeeId}`);
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  const handleSaveEmployee = async (formData, avatarFile, employeeId) => {
    try {
      if (employeeId) {
        const updateData = {
          email: formData.email,
          full_name: formData.full_name,
          is_active: formData.is_active,
        };

        await api.put(`/auth/users/${employeeId}`, updateData);

        if (avatarFile) {
          const avatarFormData = new FormData();
          avatarFormData.append("avatar", avatarFile);
          await api.post(`/auth/users/${employeeId}/avatar`, avatarFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        await authService.signup({
          email: formData.email,
          password: formData.password,
          role: formData.role || "employee",
          full_name: formData.full_name,
          avatar: avatarFile,
        });
      }

      fetchEmployees();
      setIsSlideOverOpen(false);
    } catch (error) {
      console.error("Error saving employee:", error);
      throw new Error(
        error.response?.data?.detail || "Failed to save employee"
      );
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Users size={64} className="text-slate-300 mb-6" />
        <h2 className="text-2xl font-bold mb-3 text-slate-900">Access Restricted</h2>
        <p className="text-slate-500 max-w-md">
          Only Super Admins can manage employees.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="text-[#003d7a]" size={32} />
            Employee Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your team members and their access
          </p>
        </div>

        <button
          onClick={handleAddEmployee}
          className="bg-[#003d7a] hover:bg-[#004e9a] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold text-sm transition-all shadow-md"
        >
          <UserPlus size={20} />
          Add Employee
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {/* Total Employees */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-lg bg-blue-50 text-[#003d7a]">
              <Users size={24} />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">
              Total Employees
            </p>
            <h3 className="text-2xl font-bold text-[#003d7a]">
              {employees.length}
            </h3>
          </div>
        </div>

        {/* Active */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Active</p>
            <h3 className="text-2xl font-bold text-green-600">
              {employees.filter((e) => e.is_active).length}
            </h3>
          </div>
        </div>

        {/* Admins */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-lg bg-amber-50 text-[#f39c12]">
              <Users size={24} />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Admins</p>
            <h3 className="text-2xl font-bold text-[#f39c12]">
              {employees.filter((e) => e.role === "super_admin").length}
            </h3>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or username..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#003d7a] focus:ring-2 focus:ring-[#003d7a]/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="w-full sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-slate-400" />
              </div>
              <select
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:border-[#003d7a] focus:ring-2 focus:ring-[#003d7a]/20 transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="employee">Employees</option>
                <option value="super_admin">Admins</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg text-[#003d7a]"></span>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-xl p-16 shadow-sm border border-slate-100 text-center">
          <Users size={64} className="text-slate-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No employees found
          </h3>
          <p className="text-slate-500">
            {searchQuery || roleFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Add your first employee to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={handleEditEmployee}
              onDelete={handleDeleteEmployee}
            />
          ))}
        </div>
      )}

      {/* SlideOver */}
      <EmployeeSlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        employee={selectedEmployee}
        onSave={handleSaveEmployee}
      />
    </div>
  );
};

export default EmployeePage;