export default function Loading() {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 z-[9999]">
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        className="max-w-[600px] w-4/5 h-auto shadow-2xl rounded-lg"
      >
        <source src="/Video_Animation_Loading_Page_Creation.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      <div className="mt-8 text-blue-700 tracking-[3px] text-base font-semibold uppercase animate-pulse">
        Loading...
      </div>
    </div>
  );
}
