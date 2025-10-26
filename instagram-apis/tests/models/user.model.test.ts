import bcrypt from "bcrypt";
import { User } from "@/models";

jest.mock("bcrypt", () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

describe("User models", () => {
  it("should validate password using isValidPassword", async () => {
    const user = User.build({
      userId: 1,
      email: "test@example.com",
      password: "hashed_password",
      username: "testuser",
      isAdmin: false,
    } as any);

    const result = await user.isValidPassword("plain_password");

    expect(bcrypt.compare).toHaveBeenCalledWith("plain_password", "hashed_password");
    expect(result).toBe(true);
  })
});
