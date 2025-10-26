import { CarFactory, NotificationFactory } from "./factory";


export const methodFactoryRender = (factory: CarFactory) => {
  const car = factory.createCar();
  car.drive();
  car.color();
};

export const notificationFactoryRender = (factory: NotificationFactory) => {
  const notification = factory.createNotification();
  notification.notify();
}