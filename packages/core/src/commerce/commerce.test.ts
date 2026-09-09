import { describe, expect, it } from "vitest";
import { canTransition, flowFor } from "./index.js";

describe("fulfilment status", () => {
  it("flows", () => {
    expect(flowFor("PICKUP")).toEqual(["ORDERED", "PACKED", "READY_FOR_PICKUP", "PICKED_UP"]);
  });
  it("transitions", () => {
    expect(canTransition("COURIER", "ORDERED", "PACKED")).toBe(true);
    expect(canTransition("COURIER", "ORDERED", "SHIPPED")).toBe(false);
    expect(canTransition("PICKUP", "PACKED", "READY_FOR_PICKUP")).toBe(true);
    expect(canTransition("PICKUP", "PACKED", "CANCELLED")).toBe(true);
    expect(canTransition("PICKUP", "CANCELLED", "REFUNDED")).toBe(false);
  });
});
