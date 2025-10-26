import { Car } from "./Car";

export class CarBuilder {
  private car: Car;

  constructor() {
    this.car = new Car();
  }

  setWheels(wheels: number): CarBuilder {
    this.car.wheels = wheels;
    return this;
  }

  setColor(color: string): CarBuilder {
    this.car.color = color;
    return this;
  }

  setEngine(engine: string): CarBuilder {
    this.car.engine = engine;
    return this;
  }

  build(): Car {
    return this.car;
  }
};