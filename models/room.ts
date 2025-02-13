import { User } from "./user.ts";

const defaultRoomSize = 4;

export class Room {
    name: string;
    users: User[];

    constructor(name: string) {
        this.name = name;
        this.users = [];
    }

    isOpen(): boolean {
        return this.users.length < defaultRoomSize;
    }

    join(id: string) {
        this.users.push(new User(id));
    }

    leave(id: string) {
        this.users = this.users.filter((user) => user.id !== id);
    }
}
