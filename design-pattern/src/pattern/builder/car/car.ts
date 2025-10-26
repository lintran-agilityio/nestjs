export class Car {
  wheels: number;
  color: string;
  engine: string;

  constructor() {
    this.wheels = 0;
    this.color = "";
    this.engine = "";
  }

  specs(): void {
    console.log(`Car specs: ${this.wheels} wheels, color: ${this.color}, engine: ${this.engine}`);
  }
};