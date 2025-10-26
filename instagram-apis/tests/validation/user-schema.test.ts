import { LIST_USERS } from "@/mocks";
import { userSchema, userUpdateSchema } from "@/validation";

describe("User validation", () => {
  const user = LIST_USERS[0];

  it('should pass when id valid', () => {
    const result = userSchema.safeParse(user);
    expect(result.success).toBe(true);
  });
});
