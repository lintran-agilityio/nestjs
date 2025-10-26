import { postSchema, createPostSchema, updatePostSchema } from "@/validation";
import { MESSAGES_VALIDATION, REQUIRED_MESSAGE } from "@/constants";
import { MOCKS_POSTS } from "@/mocks";

describe("Post validation", () => {
  const validPost = MOCKS_POSTS[0];

  it("should pass when all fields are valid", () => {
    const result = postSchema.safeParse(validPost);
    expect(result.success).toBe(true);
  });

  it("should fail when authorId is not a number", () => {
    const result = postSchema.safeParse({ ...validPost, authorId: "abc" });
    const { success, error } = result;
    expect(success).toBe(false);
    expect(error?.issues[0]?.message).toBe(MESSAGES_VALIDATION.INVALID_ID_NUMBER);
  });

  it("should fail when content is empty", () => {
    const result = postSchema.safeParse({ ...validPost, title: "", slug: "", content: "" });
    const { success, error } = result;

    expect(success).toBe(false);
    expect(error?.issues[0].message).toBe(REQUIRED_MESSAGE("title"));
    expect(error?.issues[1].message).toBe(REQUIRED_MESSAGE("slug"));
    expect(error?.issues[2].message).toBe(REQUIRED_MESSAGE("content"));
  });

  it("should fail when status is not one of allowed values", () => {
    const result = postSchema.safeParse({ ...validPost, status: "invalid" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("Invalid option: expected one of \"draft\"|\"published\"|\"stored\"");
  });
});

describe("createPostSchema validation", () => {
  const validCreate = {
    title: "My New Post",
    slug: "my-new-post",
    content: "This is content.",
    authorId: 1,
    status: "published" as const,
  };

  it("should pass without createdAt/updatedAt/publishedAt", () => {
    const result = createPostSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
  });

  it("should fail when authorId is invalid", () => {
    const result = createPostSchema.safeParse({ ...validCreate, authorId: "xyz" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(MESSAGES_VALIDATION.INVALID_ID_NUMBER);
  });
});

describe("updatePostSchema validation", () => {
  const validUpdate = {
    id: 1,
    title: "Updated Title"
  };

  it("should pass with only partial fields", () => {
    const result = updatePostSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it("should fail when id is invalid", () => {
    const result = updatePostSchema.safeParse({ id: "abc" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(MESSAGES_VALIDATION.INVALID_ID_NUMBER);
  });
});