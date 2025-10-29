export const mockingPostUuid = '22222222-2222-2222-2222-222222222222';

export const mockingPostInfo = {
  id: mockingPostUuid,
  slug: 'my-first-blog-post',
  title: 'My first blog post',
  contents: 'This is the content of my first post.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockingPostPayload = {
  slug: mockingPostInfo.slug,
  title: mockingPostInfo.title,
  contents: mockingPostInfo.contents,
};
