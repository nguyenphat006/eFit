"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: React.ReactNode
  itemName?: string
  isLoading?: boolean
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "primary" | "orange"
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận hành động?",
  description,
  itemName,
  isLoading = false,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "destructive",
}: ConfirmDialogProps) {
  
  const getButtonClass = () => {
    switch (variant) {
      case "primary": return "bg-[#54B7F0] hover:bg-[#3FA3DC] text-white";
      case "orange": return "bg-[#EF9035] hover:bg-[#D97D2A] text-white";
      default: return "bg-red-500 hover:bg-red-600 text-white";
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-2xl max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description || (
              <>
                Bạn có chắc muốn thực hiện hành động này {itemName ? <>với <b>{itemName}</b></> : ""} không? 
                Thao tác này không thể hoàn tác.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-slate-200" disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            className={cn(getButtonClass())}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
