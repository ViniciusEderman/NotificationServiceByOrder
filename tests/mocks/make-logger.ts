import { vi } from "vitest";
import { Logger } from "@/domain/interfaces/logger";

export function makeLogger(): Logger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}
