  "use client";
import { Monitor, MonitorOff } from "lucide-react";
import { useState } from "react";
interface ScreenShareToggleProps {
  onStart: (stream: MediaStream) => void;
  onStop: () => void;
}
export default function ScreenShareToggle({ onStart, onStop }: ScreenShareToggleProps) {
  const [isSharing, setIsSharing] = useState(false);
  const toggleScreenShare = async () => {
    if (isSharing) {
      onStop();
      setIsSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        onStart(stream);
        setIsSharing(true);
      } catch (err) {
        console.error("Screen share failed:", err);
      }
    }
  };
  return (
    <button
      onClick={toggleScreenShare}
      className="p-4 rounded-full bg-[#1A1A1A] hover:bg-[#F26A0A]/10 border border-[#333] text-[#F26A0A]"
    >
      {isSharing ? (
        <MonitorOff className="h-5 w-5" />
      ) : (
        <Monitor className="h-5 w-5" />
      )}
    </button>
  );
}