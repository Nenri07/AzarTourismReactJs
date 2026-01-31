import logo from "../assets/logo.png";
export default function ComingSoon() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white px-4 overflow-hidden">
      {/* Center container */}
      <div className="flex flex-col items-center justify-center gap-8 text-center max-w-md">
        {/* Logo */}
        <img src={logo} alt="Azar Tourism Logo" />

        {/* Coming Soon Text */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-600">
            Coming Soon
          </h1>
          <div className="h-1 w-16 bg-yellow-400 mx-auto rounded-full" />
        </div>

        {/* Tagline text below coming soon */}
        <p className="text-gray-600 text-sm md:text-base">
          Our devs are working hard to make it possible......
        </p>
      </div>
    </div>
  );
}
