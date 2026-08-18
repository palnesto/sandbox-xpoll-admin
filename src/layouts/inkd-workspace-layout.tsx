import { ReactNode, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ConfigureAgentFoundationModal } from "@/components/modals/configure-agent-foundation-modal";
import { InkdWorkspaceSidebar } from "@/components/inkd/inkd-workspace-sidebar";
 
const AGENT_DETAILS_PATH = "/inkd/inkd-internal-agents/details/";

type Props = {
  children: ReactNode;
};

export function InkdWorkspaceLayout({ children }: Props) {
  const navigate = useNavigate();
  const { pathname, state } = useLocation() as { pathname: string; state?: { agentName?: string } };
  const inkdInternalAgentId = useMemo(() => {
    if (!pathname.startsWith(AGENT_DETAILS_PATH)) return null;
    const rest = pathname.slice(AGENT_DETAILS_PATH.length);
    const segment = rest.split("/")[0];
    return segment && segment.length > 0 ? segment : null;
  }, [pathname]);
  const [configureModalOpen, setConfigureModalOpen] = useState(false);

  const agentName =
    (state && typeof state.agentName === "string" && state.agentName.trim()) || "Signal AI";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f3f3f5]">
      <InkdWorkspaceSidebar
        inkdInternalAgentId={inkdInternalAgentId}
        agentName={agentName}
        onBack={() => navigate("/inkd")}
        onConfigure={() => inkdInternalAgentId && setConfigureModalOpen(true)}
        canConfigure={!!inkdInternalAgentId}
      />

      {/* Right content area */}
      <main className="min-w-0 flex-1 overflow-y-auto p-4">
        {children}
      </main>

      <ConfigureAgentFoundationModal
        agentId={inkdInternalAgentId ?? null}
        open={configureModalOpen}
        onOpenChange={setConfigureModalOpen}
      />
    </div>
  );
}
