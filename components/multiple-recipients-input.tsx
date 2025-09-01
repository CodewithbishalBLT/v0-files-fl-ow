"use client"

import type React from "react"
import { useState, useRef, type KeyboardEvent, type FocusEvent } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Mail, X, Users, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MultipleRecipientsInputProps {
  recipients: string[]
  onRecipientsChange: (recipients: string[]) => void
  required?: boolean
  className?: string
}

export function MultipleRecipientsInput({
  recipients,
  onRecipientsChange,
  required = false,
  className = "",
}: MultipleRecipientsInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [validationState, setValidationState] = useState<"idle" | "valid" | "invalid">("idle")
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const addRecipient = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) return

    if (!validateEmail(trimmedEmail)) {
      setValidationState("invalid")
      toast({
        title: "Invalid email format",
        description: `"${trimmedEmail}" is not a valid email address.`,
        variant: "destructive",
      })
      return
    }

    if (recipients.includes(trimmedEmail)) {
      toast({
        title: "Duplicate email",
        description: `"${trimmedEmail}" is already in the recipients list.`,
        variant: "destructive",
      })
      return
    }

    onRecipientsChange([...recipients, trimmedEmail])
    setInputValue("")
    setValidationState("idle")
  }

  const removeRecipient = (emailToRemove: string) => {
    onRecipientsChange(recipients.filter((email) => email !== emailToRemove))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    if (value.trim()) {
      if (validateEmail(value.trim())) {
        setValidationState("valid")
      } else {
        setValidationState("invalid")
      }
    } else {
      setValidationState("idle")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault()
      addRecipient(inputValue)
    } else if (e.key === "Backspace" && !inputValue && recipients.length > 0) {
      // Remove last recipient when backspace is pressed on empty input
      removeRecipient(recipients[recipients.length - 1])
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData("text")
    const emails = pastedText.split(/[,;\s\n]+/).filter((email) => email.trim())

    emails.forEach((email) => {
      if (email.trim()) {
        addRecipient(email.trim())
      }
    })
  }

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsInputFocused(true)
  }

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsInputFocused(false)
    // Add email on blur if valid
    if (inputValue.trim() && validateEmail(inputValue.trim())) {
      addRecipient(inputValue)
    }
  }

  const handleContainerClick = () => {
    inputRef.current?.focus()
  }

  const getValidationIcon = () => {
    if (validationState === "valid") return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (validationState === "invalid") return <AlertCircle className="h-4 w-4 text-red-500" />
    return null
  }

  const getInputBorderClass = () => {
    if (validationState === "valid") return "border-green-500 focus:border-green-500"
    if (validationState === "invalid") return "border-red-500 focus:border-red-500"
    return "border-border focus:border-primary"
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="flex items-center gap-2 text-sm font-medium">
        <Users className="h-4 w-4 text-primary" />
        Email Recipients {required && <span className="text-destructive">*</span>}
        {recipients.length > 0 && (
          <Badge variant="secondary" className="ml-2">
            {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </Label>

      <div
        onClick={handleContainerClick}
        className={`
          min-h-[48px] p-3 bg-background border rounded-lg cursor-text transition-all duration-200
          ${isInputFocused ? "ring-2 ring-primary/20" : ""}
          ${getInputBorderClass()}
        `}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Email Tags */}
          {recipients.map((email, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors animate-in fade-in-0 slide-in-from-left-2"
            >
              <Mail className="h-3 w-3" />
              <span className="text-sm font-medium">{email}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeRecipient(email)
                }}
                className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20 hover:text-destructive rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {/* Input Field */}
          <div className="flex-1 min-w-[200px] relative">
            <Input
              ref={inputRef}
              type="email"
              placeholder={recipients.length === 0 ? "Enter email addresses..." : "Add another email..."}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="border-0 shadow-none p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            />
            {getValidationIcon() && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">{getValidationIcon()}</div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Type email addresses and press Enter or comma to add them. You can also paste multiple emails.
        </p>
        {validationState === "invalid" && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Please enter a valid email address
          </p>
        )}
        {validationState === "valid" && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Press Enter to add this email
          </p>
        )}
      </div>
    </div>
  )
}
