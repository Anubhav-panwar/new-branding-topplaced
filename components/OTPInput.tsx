"use client";

import { useState, useRef, useEffect } from "react";

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  value?: string;
  onChange?: (otp: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export default function OTPInput({
  length = 6,
  onComplete,
  value = "",
  onChange,
  disabled = false,
  error = false,
  autoFocus = false,
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && !disabled) {
      const firstEmptyIndex = otp.findIndex((d) => !d);
      const targetIndex = firstEmptyIndex !== -1 ? firstEmptyIndex : 0;
      inputRefs.current[targetIndex]?.focus();
    }
  }, [autoFocus, disabled]);

  useEffect(() => {
    if (value) {
      const otpArray = value.split("").slice(0, length);
      while (otpArray.length < length) {
        otpArray.push("");
      }
      setOtp(otpArray);
    }
  }, [value, length]);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;

    // Only allow digits
    if (digit && !/^\d$/.test(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    const otpString = newOtp.join("");
    onChange?.(otpString);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete when all digits are filled
    if (otpString.length === length && !otpString.includes("")) {
      onComplete(otpString);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // If current input is empty, focus previous input
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
        onChange?.(newOtp.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const digits = pastedData.replace(/\D/g, "").slice(0, length);

    if (digits) {
      const newOtp = Array(length).fill("");
      for (let i = 0; i < digits.length; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      onChange?.(newOtp.join(""));

      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
      inputRefs.current[focusIndex]?.focus();

      // Call onComplete if all digits are filled
      if (digits.length === length) {
        onComplete(digits);
      }
    }
  };

  return (
    <div className="flex justify-center space-x-2 sm:space-x-3">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`
            w-10 h-11 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-bold
            bg-white border rounded-xl shadow-xs
            text-[#111827] placeholder-[#64748B]
            focus:outline-none focus:ring-2 focus:border-transparent
            transition-all duration-200
            ${
              error
                ? "border-rose-400 focus:ring-rose-500/20"
                : "border-[#F1D2B8] hover:border-[#F1D2B8] focus:border-[#F26A0A] focus:ring-[#F26A0A]/20"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          placeholder=""
        />
      ))}
    </div>
  );
}
