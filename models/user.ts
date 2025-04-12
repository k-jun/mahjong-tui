export class User {
  id: string;
  constructor(id: string = "") {
    this.id = id;
  }
}

export class CPU extends User {
  constructor(id: string = "") {
    super(id);
  }
}