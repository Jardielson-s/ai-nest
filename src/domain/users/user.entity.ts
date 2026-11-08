export class UserEntity {
  _id: string;
  name: string;
  email: string;

  constructor(input: Partial<UserEntity>) {
    Object.assign(this, input);
  }
}
