const Input = ({ type = "text", className = "", ...props }) => {
  const handleKeyDown = (e) => {
    if (type === "number") {
      if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
        e.preventDefault();
      }
    }
  };

  const handlePaste = (e) => {
    if (type === "number") {
      const pastedText = e.clipboardData.getData("text");
      if (
        pastedText.includes("-") ||
        pastedText.includes("+") ||
        pastedText.includes("e")
      ) {
        e.preventDefault();
      }
    }
  };

  const handleWheel = (e) => {
    if (type === "number") {
      e.target.blur();
    }
  };

  const numberStyles =
    type === "number"
      ? {
          MozAppearance: "textfield",
          appearance: "textfield",
        }
      : {};

  return (
    <input
      type={type}
      className={`w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#003d7a] bg-white h-[42px] ${className}`}
      style={numberStyles}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      {...props}
    />
  );
};

export default Input;
