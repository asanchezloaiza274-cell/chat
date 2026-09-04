import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageStatusIcon } from "./MessageStatusIcon";

describe("MessageStatusIcon", () => {
  it("renders a distinct icon per status", () => {
    const { rerender } = render(<MessageStatusIcon status="sending" />);
    expect(screen.getByLabelText("Sending")).toBeInTheDocument();

    rerender(<MessageStatusIcon status="sent" />);
    expect(screen.getByLabelText("Sent")).toBeInTheDocument();

    rerender(<MessageStatusIcon status="delivered" />);
    expect(screen.getByLabelText("Delivered")).toBeInTheDocument();

    rerender(<MessageStatusIcon status="read" />);
    expect(screen.getByLabelText("Read")).toBeInTheDocument();

    rerender(<MessageStatusIcon status="failed" />);
    expect(screen.getByLabelText("Failed to send")).toBeInTheDocument();
  });
});
