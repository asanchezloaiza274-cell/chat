import { useNavigate } from "react-router-dom";
import { Mail, Calendar, Pencil } from "lucide-react";
import { format } from "date-fns";
import { PageLayout } from "../../layouts/PageLayout";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { useChat } from "../../context/ChatContext";

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser } = useChat();

  return (
    <PageLayout title="Profile" backTo="/chat">
      <div className="mx-auto max-w-lg px-6 py-8">
        <div className="flex flex-col items-center border border-border bg-panel px-6 py-8 text-center">
          <Avatar
            name={currentUser.name}
            size="xl"
            status={currentUser.status}
            showStatus
            imageUrl={currentUser.avatarUrl}
          />
          <h2 className="mt-4 text-lg font-semibold text-ink">{currentUser.name}</h2>
          <p className="text-sm text-ink-muted">@{currentUser.username}</p>
          {currentUser.bio && <p className="mt-3 max-w-sm text-sm text-ink">{currentUser.bio}</p>}

          <Button
            variant="secondary"
            size="sm"
            className="mt-5"
            leftIcon={<Pencil size={14} />}
            onClick={() => navigate("/profile/edit")}
          >
            Edit profile
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-1 border border-border bg-panel p-2">
          <div className="flex items-center gap-3 px-3 py-3">
            <Mail size={16} className="shrink-0 text-ink-faint" />
            <div className="min-w-0">
              <p className="text-xs text-ink-faint">Email</p>
              <p className="truncate text-sm text-ink">{currentUser.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-3">
            <Calendar size={16} className="shrink-0 text-ink-faint" />
            <div className="min-w-0">
              <p className="text-xs text-ink-faint">Joined</p>
              <p className="truncate text-sm text-ink">
                {currentUser.joinedAt ? format(new Date(currentUser.joinedAt), "MMMM yyyy") : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
