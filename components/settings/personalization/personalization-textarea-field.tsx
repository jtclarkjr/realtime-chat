import { Textarea } from '@/components/ui/textarea'

interface PersonalizationTextareaFieldProps {
  label: string
  value: string
  placeholder: string
  characterCount: number
  maxCharacterCount: number
  isInvalid: boolean
  onChange: (value: string) => void
}

export function PersonalizationTextareaField({
  label,
  value,
  placeholder,
  characterCount,
  maxCharacterCount,
  isInvalid,
  onChange
}: PersonalizationTextareaFieldProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
      />
      <p
        className={`text-xs ${
          isInvalid ? 'text-destructive' : 'text-muted-foreground'
        }`}
      >
        {characterCount}/{maxCharacterCount} characters
      </p>
    </div>
  )
}
