import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { clearNativeNotifications, hasNativeNotifications } from "@/lib/native-notifications"

export function useLogout() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useToast()
  return useCallback(async () => {
    try {
      await api.logout()
    } catch {
      toast({ title: "退出失败", description: "无法确认服务器已退出，请检查网络后重试。" })
      return
    }
    qc.clear()
    if (hasNativeNotifications()) await clearNativeNotifications().catch(() => undefined)
    navigate("/login", { replace: true })
  }, [qc, navigate, toast])
}
