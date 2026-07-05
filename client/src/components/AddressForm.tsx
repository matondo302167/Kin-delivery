import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressFormProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

interface AddressData {
  number?: string;
  avenue: string;
  quarter: string;
  commune: string;
  city: string;
}

const COMMUNES = ["Gombe", "Limete", "Ngaliema"];
const CITIES = ["Kinshasa"];

export default function AddressForm({
  value = "",
  onChange,
  placeholder = "Sélectionner une adresse",
  label = "Adresse",
  disabled = false,
}: AddressFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  // Parse the address string into components
  // Supported formats (backwards-compatible):
  // - new canonical (4 parts): "avenue [N°<number>]|quarter|commune|city"
  // - older variant (5 parts): "number|avenue|quarter|commune|city"
  // - legacy (4 parts without number): "avenue|quarter|commune|city"
  const parseAddress = (addr: string): AddressData => {
    if (!addr) {
      return { number: "", avenue: "", quarter: "", commune: "", city: "Kinshasa" };
    }
    const parts = addr.split("|").map((p) => p.trim());

    // Older 5-part format where the first part is the raw number
    if (parts.length === 5) {
      const maybeNumber = parts[0] || "";
      if (/^\d+$/.test(maybeNumber) || /^N°\s*\d+/i.test(maybeNumber)) {
        // number|avenue|quarter|commune|city
        return {
          number: maybeNumber.replace(/^N°\s*/i, "") || "",
          avenue: parts[1] || "",
          quarter: parts[2] || "",
          commune: parts[3] || "",
          city: parts[4] || "Kinshasa",
        };
      }
      // otherwise fallthrough: treat as 4-part with extra piece
    }

    // 4-part formats: parts[0] is avenue (may include "N°<num>" at end)
    const avenuePart = parts[0] || "";
    let number = "";
    let avenue = avenuePart;

    // detect trailing "N°" annotation in avenue (e.g. "Avenue de la Paix N°12")
    const m = avenuePart.match(/(.*)\bN°\s*(\d+)$/i);
    if (m) {
      avenue = m[1].trim();
      number = m[2];
    }

    return {
      number,
      avenue,
      quarter: parts[1] || "",
      commune: parts[2] || "",
      city: parts[3] || "Kinshasa",
    };
  };

  // Format address components into a string
  // Canonical storage: avenue (with trailing " N°<number>" if present) | quarter | commune | city
  const formatAddress = (data: AddressData): string => {
    const avenueWithNumber = `${data.avenue}${data.number ? ` N°${data.number}` : ""}`.trim();
    return `${avenueWithNumber}|${data.quarter}|${data.commune}|${data.city}`;
  };

  const handleSave = (data: AddressData) => {
    const formatted = formatAddress(data);
    onChange(formatted);

    // Display user-friendly format, put number at the end of the avenue
    const avenueDisplay = `${data.avenue}${data.number ? ` N°${data.number}` : ""}`.trim();
    const display = `${avenueDisplay}, ${data.quarter}, ${data.commune}, ${data.city}`;
    setDisplayValue(display);
    setIsOpen(false);
  };

  const currentAddress = parseAddress(displayValue || value);

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 text-left border border-gray-300 rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-primary",
          "hover:border-gray-400 transition-colors",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className={cn(
            displayValue || value ? "text-gray-900" : "text-gray-500"
          )}>
            {displayValue || value || placeholder}
          </span>
        </div>
      </button>

      <AddressFormDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={handleSave}
        initialData={currentAddress}
      />
    </div>
  );
}

interface AddressFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddressData) => void;
  initialData: AddressData;
}

function AddressFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AddressFormDialogProps) {
  const [formData, setFormData] = useState<AddressData>(initialData);

  const handleChange = (field: keyof AddressData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (!formData.avenue || !formData.quarter || !formData.commune) {
      return;
    }
    onSave(formData);
  };

  const isComplete =
    formData.avenue.trim() && formData.quarter.trim() && formData.commune;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Détails de l'Adresse</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Avenue */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Avenue/Rue</label>
            <Input
              placeholder="Ex: Avenue de la Paix"
              value={formData.avenue}
              onChange={(e) => handleChange("avenue", e.target.value)}
              autoFocus
              data-testid="input-avenue"
            />
          </div>

          {/* Number (N°1) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">N°1</label>
            <Input
              placeholder="Ex: 12"
              value={formData.number || ""}
              onChange={(e) => handleChange("number", e.target.value)}
              data-testid="input-number"
            />
            <p className="text-xs text-gray-500">Entrez le numéro (sera préfixé par "N°")</p>
          </div>

          {/* Quartier */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quartier</label>
            <Input
              placeholder="Ex: Kasavubu"
              value={formData.quarter}
              onChange={(e) => handleChange("quarter", e.target.value)}
              data-testid="input-quarter"
            />
          </div>

          {/* Commune */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Commune *</label>
            <select
              value={formData.commune}
              onChange={(e) => handleChange("commune", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="select-commune"
            >
              <option value="">Sélectionner une commune</option>
              {COMMUNES.map((commune) => (
                <option key={commune} value={commune}>
                  {commune}
                </option>
              ))}
            </select>
          </div>

          {/* Ville */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ville</label>
            <select
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              data-testid="select-city"
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">Kinshasa (pour le moment)</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="btn-cancel-address"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isComplete}
            data-testid="btn-save-address"
          >
            Confirmer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

