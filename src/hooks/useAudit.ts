import { useAuditContext } from "../contexts/AuditContext"

export function useAudit() {
  return useAuditContext()
}
