import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Search, Users } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { UserListItem } from "../../components/conversations/UserListItem";
import { useChat } from "../../context/ChatContext";
import { cn } from "../../utils/cn";

const COLORS = ["#4C7DFF", "#2FA8A0", "#D97757", "#8A7CFF", "#3FB98A", "#E0965F", "#5AA9E6", "#C7729A"];

const STEPS = ["Name", "Icon", "Members", "Review"];

export default function CreateGroup() {
  const navigate = useNavigate();
  const { users, currentUser, createGroupConversation } = useChat();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const otherUsers = users.filter((u) => u.id !== currentUser.id);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return otherUsers;
    return otherUsers.filter((u) => u.name.toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const canProceed = step === 0 ? name.trim().length > 0 : step === 2 ? selectedIds.length > 0 : true;

  function toggleUser(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  }

  async function handleCreate() {
    const id = await createGroupConversation(name.trim(), selectedIds, color);
    navigate(`/chat/${id}`);
  }

  return (
    <Modal
      open
      onClose={() => navigate(-1)}
      title="Create group"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" disabled={!canProceed} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button size="sm" onClick={handleCreate}>
              Create group
            </Button>
          )}
        </>
      }
    >
      <div className="mb-5 flex items-center gap-1.5">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-1.5">
            <div
              className={cn(
                "h-1 flex-1 rounded-full",
                i <= step ? "bg-accent" : "bg-surface-active",
              )}
            />
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <Input
            autoFocus
            label="Group name"
            placeholder="e.g. Weekend Trip"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )}

      {step === 1 && (
        <div>
          <p className="mb-3 text-sm text-ink-muted">Choose an accent color for your group icon</p>
          <div className="mb-4 flex justify-center">
            <Avatar name={name || "Group"} size="xl" colorOverride={color} />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Choose color ${c}`}
                className={cn(
                  "h-9 w-9 rounded-full ring-offset-2 ring-offset-panel transition-shadow",
                  color === c && "ring-2 ring-accent",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="mb-3">
            <Input
              autoFocus
              placeholder="Search people"
              leftIcon={<Search size={16} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <p className="mb-1.5 text-xs text-ink-muted">{selectedIds.length} selected</p>
          <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
            {filtered.map((user) => (
              <UserListItem
                key={user.id}
                user={user}
                selected={selectedIds.includes(user.id)}
                onClick={() => toggleUser(user.id)}
                rightElement={
                  selectedIds.includes(user.id) ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                      <Check size={12} />
                    </span>
                  ) : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center text-center">
          <Avatar name={name} size="xl" colorOverride={color} />
          <h3 className="mt-3 text-base font-semibold text-ink">{name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
            <Users size={14} />
            {selectedIds.length + 1} members
          </p>
          <div className="mt-4 flex w-full flex-col gap-1 text-left">
            {[currentUser.id, ...selectedIds].map((id) => {
              const u = users.find((user) => user.id === id)!;
              return (
                <div key={id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                  <Avatar name={u.name} size="sm" />
                  <span className="text-sm text-ink">
                    {u.name} {id === currentUser.id && <span className="text-ink-faint">(you)</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
