import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-canvas">
      <EmptyState
        icon={<Compass size={22} />}
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={
          <Link to="/chat">
            <Button size="sm">Back to chats</Button>
          </Link>
        }
      />
    </div>
  );
}
