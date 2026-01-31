function Button({
  children,
  className = "",
  backgroundColor = "bg-[#003d7a]",
  textColor = "text-white",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`px-6 py-2 rounded-lg duration-200 font-medium ${textColor} ${backgroundColor} hover:opacity-90 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
