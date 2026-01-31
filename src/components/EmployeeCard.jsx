import { Mail, Calendar, MoreVertical, Edit, Trash2 } from "lucide-react";

const EmployeeCard = ({ employee, onEdit, onDelete }) => {
  const API_URL = "http://localhost:8000"; // Your backend URL

  return (
    <div className="card bg-white shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
      <div className="card-body p-5">
        {/* Avatar and Actions */}
        <div className="flex justify-between items-start mb-4">
          <div className="avatar">
            <div className="w-16 h-16 rounded-full ring ring-[#003d7a] ring-offset-2">
              {employee.avatar_url ? (
                <img
                  src={`${API_URL}${employee.avatar_url}`}
                  alt={employee.username}
                  className="object-cover"
                />
              ) : (
                <div className="bg-gradient-to-br from-[#003d7a] to-[#004e9a] flex items-center justify-center text-white text-xl font-bold">
                  {employee.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Dropdown Actions */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
              <MoreVertical size={18} className="text-slate-400" />
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow-lg bg-white rounded-lg w-40 border border-slate-100"
            >
              <li>
                <button
                  onClick={() => onEdit(employee)}
                  className="text-[#003d7a] hover:bg-blue-50"
                >
                  <Edit size={16} />
                  Edit
                </button>
              </li>
              <li>
                <button
                  onClick={() => onDelete(employee.id)}
                  className="text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Employee Info */}
        <div className="space-y-3">
          <div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">
              {employee.full_name || employee.username}
            </h3>
            <div className="badge badge-sm bg-blue-50 text-[#003d7a] border-0 font-medium">
              {employee.role}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail size={14} className="text-[#003d7a]" />
              <span className="truncate">{employee.email}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Calendar size={14} className="text-[#003d7a]" />
              <span>
                {new Date(employee.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="pt-3 border-t border-slate-100">
            {employee.is_active ? (
              <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Active
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                Inactive
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCard;
