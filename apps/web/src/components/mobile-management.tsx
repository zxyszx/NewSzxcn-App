import * as React from "react"
import { ArrowLeft, ChevronRight, Inbox, Search, X } from "lucide-react"
import { useNavigate, useNavigationType } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DialogClose, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export const ManagementDialogContent = React.forwardRef<React.ElementRef<typeof DialogContent>, React.ComponentPropsWithoutRef<typeof DialogContent>>(
  ({ children, className, ...props }, ref) => {
    const isMobile = useIsMobile()
    if (!isMobile) return <DialogContent ref={ref} className={className} {...props}>{children}</DialogContent>
    const parts = React.Children.toArray(children)
    const header = parts.find((child) => React.isValidElement(child) && child.type === DialogHeader)
    return <DialogContent ref={ref} className={cn(className, "mobile-management-editor")} {...props}>
      <div className="management-editor-header">
        <DialogClose asChild><Button type="button" size="icon" variant="ghost" aria-label="返回上一级" title="返回上一级"><ArrowLeft /></Button></DialogClose>
        {header}
      </div>
      <div className="management-editor-body">{parts.filter((child) => child !== header)}</div>
    </DialogContent>
  }
)
ManagementDialogContent.displayName = "ManagementDialogContent"

export function useManagementBack(enabled: boolean, parent: string) {
  const navigate = useNavigate()
  const goBack = React.useCallback(() => navigate(parent, { replace: true }), [navigate, parent])
  React.useEffect(() => {
    if (!enabled) return
    const onBack = (event: Event) => {
      if (event.defaultPrevented) return
      event.preventDefault()
      goBack()
    }
    window.addEventListener("newszxcn:native-back", onBack)
    return () => window.removeEventListener("newszxcn:native-back", onBack)
  }, [enabled, goBack])
  return goBack
}

export function MobileManagement({ title, onBack, children, action, pageKey }: {
  title: string; onBack: () => void; children: React.ReactNode; action?: React.ReactNode; pageKey: string
}) {
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const scroll = React.useRef<HTMLElement>(null)
  const heading = React.useRef<HTMLHeadingElement>(null)
  const positions = React.useRef(new Map<string, number>())
  React.useLayoutEffect(() => {
    const element = scroll.current
    if (!element) return
    element.scrollTop = positions.current.get(pageKey) || 0
    heading.current?.focus({ preventScroll: true })
  }, [pageKey])
  return <section key={pageKey} className="mobile-management" data-direction={navigationType === "REPLACE" || navigationType === "POP" ? "back" : "forward"}>
    <header className="mobile-management-header">
      <Button type="button" size="icon" variant="ghost" aria-label="返回上一级" title="返回上一级" onClick={onBack}><ArrowLeft /></Button>
      <h1 ref={heading} tabIndex={-1}>{title}</h1>
      {action}
      <Button type="button" size="icon" variant="ghost" aria-label="返回邮箱" title="返回邮箱" onClick={() => navigate("/mail", { replace: true })}><Inbox /></Button>
    </header>
    <main ref={scroll} className="mobile-management-body" onScroll={(event) => positions.current.set(pageKey, event.currentTarget.scrollTop)}>{children}</main>
  </section>
}

export function MobileManagementRow({ icon, label, detail, onClick }: {
  icon: React.ReactNode; label: string; detail?: string; onClick: () => void
}) {
  return <Button type="button" variant="ghost" className="mobile-management-row h-auto justify-start whitespace-normal" onClick={onClick}>
    <span className="mobile-management-row-icon">{icon}</span>
    <span className="min-w-0 flex-1 text-left"><span className="block font-medium">{label}</span>{detail && <span className="mt-1 block text-xs leading-5 text-muted-foreground">{detail}</span>}</span>
    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
  </Button>
}

export function MobileSettingsSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const input = React.useRef<HTMLInputElement>(null)
  return <div className="mobile-management-search">
    <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    <Input ref={input} type="search" aria-label="搜索设置项" placeholder="搜索设置项" value={value} onChange={(event) => onChange(event.target.value)} />
    {value && <Button type="button" variant="ghost" size="icon" aria-label="清空搜索" title="清空搜索" onClick={() => { onChange(""); input.current?.focus() }}><X aria-hidden="true" /></Button>}
  </div>
}
