import { CarBuilder } from "./builder";

export function implementCar() {
  const sportCar = new CarBuilder()
    .setColor("Red")
    .setEngine("V8")
    .setWheels(4)
    .build();

  sportCar.specs();

  const familyCar = new CarBuilder()
    .setColor("Blue")
    .setEngine("V6")
    .setWheels(4)
    .build();

  familyCar.specs();
};