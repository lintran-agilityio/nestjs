import { setSeederFactory } from 'typeorm-extension';
import { hash } from 'bcryptjs';
import { faker } from '@faker-js/faker';

import { User } from '@app/apis/users/entities';
import { UserRole, UserStatus } from '@app/shared/types';

export const UserFactory = setSeederFactory<User>(
  User,
  async (): Promise<User> => {
    const user = new User();

    const firstName: string = faker.person.firstName();
    const lastName: string = faker.person.lastName();

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = faker.internet.email({ firstName, lastName }).toLowerCase();

    user.password = await hash('Password@123', 8);
    user.role = UserRole.USER;
    user.status = UserStatus.ACTIVE;

    return user;
  },
);

// export default setSeederFactory<User, Record<string, never>>(
//   User,
//   async (): Promise<User> => {
//     const user = new User();

//     const firstName: string = faker.person.firstName();
//     const lastName: string = faker.person.lastName();
//     user.firstName = firstName;
//     user.lastName = lastName;

//     const email: string = faker.internet
//       .email({ firstName, lastName })
//       .toLowerCase();
//     user.email = email;

//     const passwordHash: string = await hash('Password123!', 8);
//     user.password = passwordHash;

//     user.role = UserRole.USER;
//     user.status = UserStatus.ACTIVE;
//     return user;
//   },
// );
