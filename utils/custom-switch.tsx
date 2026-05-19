import { Label } from '@/components/ui/label'

interface CustomSwitchProps {
  label?: string
  checked: boolean
  onChange: (checked: boolean) => void
  activeText?: string
  inactiveText?: string
  disabled?: boolean
  className?: string
}

export default function CustomSwitch({
  label,
  checked,
  onChange,
  activeText = 'Active',
  inactiveText = 'Inactive',
  disabled = false,
  className = '',
}: CustomSwitchProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}

      <div className="flex items-center gap-2 h-9">
        <label
          className={`relative inline-flex items-center ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only"
          />

          {/* Track */}
          <div
            className={`w-10 h-6 rounded-full transition-colors duration-300 ${
              checked ? 'bg-blue-500' : 'bg-red-500'
            }`}
          />

          {/* Thumb */}
          <div
            className="absolute top-1 left-1 h-4 w-4 bg-white rounded-full shadow transition-transform duration-300"
            style={{
              transform: checked ? 'translateX(16px)' : 'translateX(0px)',
            }}
          />
        </label>

        {/* Text */}
        <span
          className={`text-sm font-medium transition-colors duration-300 ${
            checked ? 'text-blue-500' : 'text-red-500'
          }`}
        >
          {checked ? activeText : inactiveText}
        </span>
      </div>
    </div>
  )
}
