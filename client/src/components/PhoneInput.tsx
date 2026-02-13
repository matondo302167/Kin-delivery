import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";

const COUNTRIES = [
  { code: "+243", flag: "🇨🇩", name: "RDC", maxLen: 9 },
  { code: "+242", flag: "🇨🇬", name: "Congo", maxLen: 9 },
  { code: "+244", flag: "🇦🇴", name: "Angola", maxLen: 9 },
  { code: "+250", flag: "🇷🇼", name: "Rwanda", maxLen: 9 },
  { code: "+256", flag: "🇺🇬", name: "Ouganda", maxLen: 10 },
  { code: "+254", flag: "🇰🇪", name: "Kenya", maxLen: 10 },
  { code: "+255", flag: "🇹🇿", name: "Tanzanie", maxLen: 9 },
  { code: "+257", flag: "🇧🇮", name: "Burundi", maxLen: 8 },
  { code: "+33", flag: "🇫🇷", name: "France", maxLen: 9 },
  { code: "+32", flag: "🇧🇪", name: "Belgique", maxLen: 9 },
  { code: "+1", flag: "🇺🇸", name: "USA", maxLen: 10 },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  "data-testid"?: string;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = "812345678",
  className = "",
  disabled = false,
  autoFocus = false,
  "data-testid": testId = "input-phone",
}: PhoneInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const parseValue = (val: string) => {
    for (const c of COUNTRIES) {
      if (val.startsWith(c.code)) {
        return { country: c, local: val.slice(c.code.length) };
      }
    }
    if (val.startsWith("0")) {
      return { country: COUNTRIES[0], local: val.slice(1) };
    }
    return { country: COUNTRIES[0], local: val.replace(/^\+/, "") };
  };

  const parsed = parseValue(value);
  const [selectedCountry, setSelectedCountry] = useState(parsed.country);
  const [localNumber, setLocalNumber] = useState(parsed.local);

  useEffect(() => {
    const p = parseValue(value);
    setSelectedCountry(p.country);
    setLocalNumber(p.local);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocalChange = (digits: string) => {
    const cleaned = digits.replace(/\D/g, "").slice(0, selectedCountry.maxLen);
    setLocalNumber(cleaned);
    onChange(selectedCountry.code + cleaned);
  };

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    setShowDropdown(false);
    onChange(country.code + localNumber);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setShowDropdown(!showDropdown)}
          className="flex items-center gap-1 h-full px-3 py-3 bg-gray-100 rounded-l-xl border border-r-0 border-gray-200 hover:bg-gray-200 transition-colors text-sm font-medium min-w-[90px] justify-center"
          disabled={disabled}
          data-testid={`${testId}-country`}
        >
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-xs font-bold text-gray-600">{selectedCountry.code}</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
        {showDropdown && (
          <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto min-w-[200px]" data-testid={`${testId}-dropdown`}>
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCountrySelect(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                  selectedCountry.code === c.code ? 'bg-primary/5' : ''
                }`}
                data-testid={`${testId}-option-${c.code.replace('+', '')}`}
              >
                <span className="text-lg">{c.flag}</span>
                <span className="text-sm font-medium text-gray-700">{c.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{c.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <Input
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        value={localNumber}
        onChange={(e) => handleLocalChange(e.target.value)}
        className="rounded-l-none border-l-0 h-12 text-base font-medium"
        disabled={disabled}
        autoFocus={autoFocus}
        data-testid={testId}
      />
    </div>
  );
}
