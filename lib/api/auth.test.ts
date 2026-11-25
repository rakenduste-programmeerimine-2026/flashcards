import { describe, expect, it } from "vitest";
import { signInHref } from "./auth";
import { ApiError } from "./client";
import { apiErrorKey } from "./errors";

describe("sign-in helpers", () => {
  it("builds the sign-in link with the page to come back to", () => {
    expect(signInHref("/paste")).toBe("/sign-in?next=%2Fpaste");
    expect(signInHref("/decks?saved=1")).toBe(
      "/sign-in?next=%2Fdecks%3Fsaved%3D1",
    );
  });

  it("translates a wrong password into its own message", () => {
    expect(apiErrorKey(new ApiError("invalid_credentials", 401))).toBe(
      "apiError.invalidCredentials",
    );
    expect(apiErrorKey(new ApiError("unauthorized", 401))).toBe(
      "apiError.unauthorized",
    );
  });
});
