// import { useRef, useState, useEffect } from "react";
// import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

// const DatePicker = ({ value, onChange, name, placeholder = "Select date" }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [currentMonth, setCurrentMonth] = useState(new Date());
//   const containerRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (containerRef.current && !containerRef.current.contains(e.target))
//         setIsOpen(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const formatDate = (date) => {
//     if (!date) return "";
//     const d = new Date(date);
//     return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
//   };

//   const displayDate = (date) => {
//     if (!date) return placeholder;
//     return new Date(date).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   const handleDateSelect = (day) => {
//     const selected = new Date(
//       currentMonth.getFullYear(),
//       currentMonth.getMonth(),
//       day,
//     );
//     onChange({ target: { name, value: formatDate(selected) } });
//     setIsOpen(false);
//   };

//   const renderCalendar = () => {
//     const days = [];
//     const totalDays = new Date(
//       currentMonth.getFullYear(),
//       currentMonth.getMonth() + 1,
//       0,
//     ).getDate();
//     const firstDay = new Date(
//       currentMonth.getFullYear(),
//       currentMonth.getMonth(),
//       1,
//     ).getDay();
//     const selectedDate = value ? new Date(value) : null;

//     for (let i = 0; i < firstDay; i++)
//       days.push(<div key={`empty-${i}`} className="p-2"></div>);

//     for (let day = 1; day <= totalDays; day++) {
//       const isSelected =
//         selectedDate &&
//         selectedDate.getDate() === day &&
//         selectedDate.getMonth() === currentMonth.getMonth() &&
//         selectedDate.getFullYear() === currentMonth.getFullYear();
//       days.push(
//         <button
//           key={day}
//           type="button"
//           onClick={() => handleDateSelect(day)}
//           className={`p-2 text-sm rounded hover:bg-blue-100 ${isSelected ? "bg-[#003d7a] text-white" : ""}`}
//         >
//           {day}
//         </button>,
//       );
//     }
//     return days;
//   };

//   return (
//     <div ref={containerRef} className="relative w-full">
//       <input
//         type="text"
//         readOnly
//         value={displayDate(value)}
//         onClick={() => setIsOpen(!isOpen)}
//         className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] h-[42px] cursor-pointer bg-white text-slate-700 truncate"
//         placeholder={placeholder}
//       />
//       <Calendar
//         className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
//         size={18}
//       />

//       {isOpen && (
//         <div className="absolute z-50 mt-2 bg-white border border-slate-300 rounded-lg shadow-xl p-4 w-[min(20rem,calc(100vw-2rem))] left-0">
//           <div className="flex items-center justify-between mb-4">
//             <button
//               type="button"
//               onClick={() =>
//                 setCurrentMonth(
//                   new Date(
//                     currentMonth.getFullYear(),
//                     currentMonth.getMonth() - 1,
//                   ),
//                 )
//               }
//               className="p-1 hover:bg-slate-100 rounded"
//             >
//               <ChevronLeft size={20} />
//             </button>
//             <div className="font-semibold text-xs sm:text-sm">
//               {currentMonth.toLocaleDateString("en-US", {
//                 month: "long",
//                 year: "numeric",
//               })}
//             </div>
//             <button
//               type="button"
//               onClick={() =>
//                 setCurrentMonth(
//                   new Date(
//                     currentMonth.getFullYear(),
//                     currentMonth.getMonth() + 1,
//                   ),
//                 )
//               }
//               className="p-1 hover:bg-slate-100 rounded"
//             >
//               <ChevronRight size={20} />
//             </button>
//           </div>
//           <div className="grid grid-cols-7 gap-1 mb-2">
//             {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
//               <div
//                 key={d}
//                 className="text-center text-xs font-semibold text-slate-600 p-1 sm:p-2"
//               >
//                 {d}
//               </div>
//             ))}
//           </div>
//           <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
//         </div>
//       )}
//     </div>
//   );
// };


// export default DatePicker;

// import React from "react";
// import { Calendar } from "lucide-react";

// const DatePicker = ({
//   value,
//   onChange,
//   minDate,
//   maxDate,
//   placeholder = "Select date",
//   required = false,
//   disabled = false,
//   name,
// }) => {
//   return (
//     <div className="relative">
//       <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
//       <input
//         type="date"
//         name={name}
//         value={value || ""}
//         onChange={(e) => onChange(e.target.value)}
//         min={minDate}
//         max={maxDate}
//         required={required}
//         disabled={disabled}
//         className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white"
//         placeholder={placeholder}
//       />
//     </div>
//   );
// };

// export default DatePicker;




import { useRef, useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const DatePicker = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date",
  disabled = false,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  );
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;

  const displayDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

  const isDisabledDate = (date) => {
    const d = formatDate(date);
    if (minDate && d <= minDate) return true; // freeze before + same day
    if (maxDate && d > maxDate) return true;
    return false;
  };

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayIndex = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const selectedDate = value ? new Date(value) : null;

  const selectDate = (day) => {
    const selected = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    if (isDisabledDate(selected)) return;

    const formatted = formatDate(selected);

    // ✅ SEND LIKE A REAL INPUT EVENT
    onChange({
      target: {
        name,
        value: formatted,
      },
    });

    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        readOnly
        disabled={disabled}
        name={name}
        value={displayDate(value)}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        placeholder={placeholder}
        className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white cursor-pointer"
      />

      <Calendar
        size={18}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 bg-white border border-slate-300 rounded-lg shadow-xl p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1
                  )
                )
              }
              className="p-1 hover:bg-slate-100 rounded"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="font-semibold text-sm">
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
                    currentMonth.getMonth() + 1
                  )
                )
              }
              className="p-1 hover:bg-slate-100 rounded"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-xs font-semibold text-slate-600 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center p-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {[...Array(firstDayIndex)].map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                day
              );

              const disabledDay = isDisabledDate(dateObj);
              const isSelected =
                selectedDate &&
                dateObj.toDateString() === selectedDate.toDateString();

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => selectDate(day)}
                  className={`p-2 text-sm rounded transition
                    ${isSelected ? "bg-[#003d7a] text-white" : ""}
                    ${
                      disabledDay
                        ? "text-slate-300 cursor-not-allowed"
                        : "hover:bg-blue-100"
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
