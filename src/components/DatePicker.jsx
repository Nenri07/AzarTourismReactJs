import { useRef, useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const DatePicker = ({ value, onChange, name, placeholder = "Select date" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const displayDate = (date) => {
    if (!date) return placeholder;
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDateSelect = (day) => {
    const selected = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    onChange({ target: { name, value: formatDate(selected) } });
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    ).getDate();
    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    ).getDay();
    const selectedDate = value ? new Date(value) : null;

    for (let i = 0; i < firstDay; i++)
      days.push(<div key={`empty-${i}`} className="p-2"></div>);

    for (let day = 1; day <= totalDays; day++) {
      const isSelected =
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear();
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(day)}
          className={`p-2 text-sm rounded hover:bg-blue-100 ${isSelected ? "bg-[#003d7a] text-white" : ""}`}
        >
          {day}
        </button>,
      );
    }
    return days;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        readOnly
        value={displayDate(value)}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] h-[42px] cursor-pointer bg-white text-slate-700 truncate"
        placeholder={placeholder}
      />
      <Calendar
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        size={18}
      />

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-slate-300 rounded-lg shadow-xl p-4 w-[min(20rem,calc(100vw-2rem))] left-0">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1,
                  ),
                )
              }
              className="p-1 hover:bg-slate-100 rounded"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="font-semibold text-xs sm:text-sm">
              {currentMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </div>
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1,
                  ),
                )
              }
              className="p-1 hover:bg-slate-100 rounded"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold text-slate-600 p-1 sm:p-2"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
        </div>
      )}
    </div>
  );
};

// const DatePicker = ({ name, value, onChange, ...props }) => (
//   <input
//     type="date"
//     name={name}
//     value={value}
//     onChange={onChange}
//     className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white h-[42px]"
//     {...props}
//   />
// );
export default DatePicker;
