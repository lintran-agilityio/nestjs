import { commentSchema, createCommentSchema, updateCommentSchema } from "@/validation";
import { MESSAGES_VALIDATION, REQUIRED_MESSAGE } from "@/constants";

describe("commentSchema validation", () => {
  const validComment = {
    postId: 1,
    authorId: 2,
    content: "This is a comment",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should pass when all fields are valid", () => {
    const result = commentSchema.safeParse(validComment);
    expect(result.success).toBe(true);
  });

  it("should fail when postId is not a number", () => {
    const result = commentSchema.safeParse({ ...validComment, postId: "abc" });
    const { success, error } = result;
    expect(success).toBe(false);
    expect(error?.issues[0]?.message).toBe(MESSAGES_VALIDATION.INVALID_ID_NUMBER);
  });

  it("should fail when authorId is NaN", () => {
    const result = commentSchema.safeParse({ ...validComment, authorId: "xyz" });
    const { success, error } = result;
    expect(success).toBe(false);
    expect(error?.issues[0].message).toBe(MESSAGES_VALIDATION.INVALID_AUTHOR_ID);
  });

  it("should fail when content is empty", () => {
    const result = commentSchema.safeParse({ ...validComment, content: "" });
    const { success, error } = result;
    expect(success).toBe(false);
    expect(error?.issues[0].message).toBe(REQUIRED_MESSAGE("content"));
  });
});

describe("createCommentSchema validation", () => {
  const validCreate = {
    postId: 1,
    authorId: 2,
    content: "Nice post!"
  };

  it("should pass without createdAt/updatedAt", () => {
    const result = createCommentSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
  });
});

describe("updateCommentSchema validation", () => {
  const validUpdate = {
    id: 1,
    content: "Updated content"
  };

  it("should pass with partial fields", () => {
    const result = updateCommentSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it("should fail if id is not a number", () => {
    const result = updateCommentSchema.safeParse({ id: "abc" });
    const { success, error } = result;
    expect(success).toBe(false);
    expect(error?.issues[0].message).toBe(MESSAGES_VALIDATION.INVALID_ID_NUMBER);
  });
});
