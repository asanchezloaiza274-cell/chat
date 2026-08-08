import { MessagesSquare } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState";

export default function ChatIndex() {
  return (
    <div className="flex h-full w-full flex-col bg-canvas">
      <EmptyState
        icon={<MessagesSquare size={22} />}
        title="Select a conversation"
        description="Choose a conversation from the list or start a new one."
      />
    </div>
  );
}
