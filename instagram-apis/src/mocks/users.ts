export const USER_PAYLOAD = {
  username: 'user',
  email: 'user@gmail.com',
  password: 'Abc@12345',
  isAdmin: false
};

export const USER_PAYLOAD_LOGIN = {
  email: 'usera@gmail.com',
  password: 'Abc@12345'
};

export const LIST_USERS = [
  {
    "userId": 11,
    "email": "user@gm.com",
    "username": "user",
    "isAdmin": false,
    "updatedAt": "2025-08-06T08:19:59.636Z",
    "createdAt": "2025-08-06T08:19:59.636Z"
  } 
];

export const MOCK_USERS_RESPONSE = {
  data: {
    data: LIST_USERS,
    meta: {
      pagination: {
        limit: 10,
        offset: 0,
        total: 1,
      }
    }
  }
};
