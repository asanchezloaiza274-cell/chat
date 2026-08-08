import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserX } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { UserListItem } from "../../components/conversations/UserListItem";
import { EmptyState } from "../../components/ui/EmptyState";
import { useChat } from "../../context/ChatContext";

export default function NewChat() {
  const navigate = useNavigate();
  const { users, currentUser, startDirectConversation } = useChat();
  const [query, setQuery] = useState("");

  const otherUsers = users.filter((u) => u.id !== currentUser.id);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return otherUsers;
    return otherUsers.filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function handleSelect(userId: string) {
    const id = startDirectConversation(userId);
    navigate(`/chat/${id}`);
  }

  return (
    <Modal open onClose={() => navigate(-1)} title="New chat" size="md">
      <div className="mb-3">
        <Input
          autoFocus
          placeholder="Search people"
          leftIcon={<Search size={16} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="flex max-h-96 flex-col gap-0.5 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState icon={<UserX size={20} />} title="No one found" description="Try a different search." />
        ) : (
          filtered.map((user) => <UserListItem key={user.id} user={user} onClick={() => handleSelect(user.id)} />)
        )}
      </div>
    </Modal>
  );
}
