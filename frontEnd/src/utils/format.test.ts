import { describe, expect, it } from "vitest";
import { formatDuration, formatFileSize, formatLastSeen, formatMessageTime } from "./format";

describe("formatMessageTime", () => {
  it("formats an ISO timestamp as a 12-hour clock time", () => {
    expect(formatMessageTime("2026-01-15T14:05:00Z")).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
  });
});

describe("formatFileSize", () => {
  it("formats bytes under 1KB as B", () => {
    expect(formatFileSize(512)).toBe("512 B");
  });

  it("formats bytes under 1MB as KB", () => {
    expect(formatFileSize(2048)).toBe("2 KB");
  });

  it("formats bytes at or above 1MB as MB", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("formatDuration", () => {
  it("formats seconds as m:ss", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  it("pads seconds under 10", () => {
    expect(formatDuration(9)).toBe("0:09");
  });

  it("handles durations over an hour in total minutes", () => {
    expect(formatDuration(3661)).toBe("61:01");
  });
});

describe("formatLastSeen", () => {
  it("returns Offline when no timestamp is given", () => {
    expect(formatLastSeen(undefined)).toBe("Offline");
  });
});
