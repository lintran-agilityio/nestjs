import { getUsers } from "./services/userServices";
import { Director, clientCode } from "./pattern/builder/produce";
import { implementCar } from "./pattern/builder/car";

import {
  abstractRender,
  WindowsFactory,
  MacFactory
} from "./pattern/abstract-factory";
import { methodFactoryRender, notificationFactoryRender } from "./pattern/factory-method";
import {
  // Car
  SedanFactory,
  SUVFactory,

  // Notification
  EmailNotifyFactory,
  SMSNotifyFactory,
  PushNotifyFactory
} from "./pattern/factory-method/factory";

// Decorator Pattern
import { MilkDecorator, SugarDecorator, SimpleCoffee } from "./pattern/decorator/decorator";

// Observer Pattern
import {
  weatherStation,
  tvDisplay,
  phoneDisplay
} from "./pattern/observer/observer";
import {
  ConcreteObserverA,
  ConcreteObserverB,
  ConcreteSubject
} from "./pattern/observer/concreteSubject";

// Import Strategy
import {
  CreditCardPayment,
  PayPalPayment,
  CryptoPayment,
  PaymentContext
} from "./pattern/strategy/strategy";


// Builder Pattern Demo
const director = new Director();
clientCode(director);

// Builder car demo
implementCar();

// Abstract Factory Pattern Demo
console.log("======= Abstract Factory: ======= ");
abstractRender(new MacFactory());
abstractRender(new WindowsFactory());

console.log("======= Factory methodFactoryRender :======= ");
methodFactoryRender(new SedanFactory());
methodFactoryRender(new SUVFactory());

notificationFactoryRender(new EmailNotifyFactory());
notificationFactoryRender(new SMSNotifyFactory());
notificationFactoryRender(new PushNotifyFactory());

// Decorator Pattern Demo
console.log("======= Decorator :======= ");
let myCoffee = new SimpleCoffee();
console.log(`${myCoffee.description()} $${myCoffee.cost()}`);
console.log(`Ingredients: ${myCoffee.ingredients()}`);

console.log('--- Adding Milk ---');
let milkCoffee = new MilkDecorator(myCoffee);
console.log(`${milkCoffee.description()} $${milkCoffee.cost()}`);
console.log(`Ingredients: ${milkCoffee.ingredients()}`);

console.log('--- Adding Sugar ---');
let sugarMilkCoffee = new SugarDecorator(milkCoffee);
console.log(`${sugarMilkCoffee.description()} $${sugarMilkCoffee.cost()}`);
console.log(`Ingredients: ${sugarMilkCoffee.ingredients()}`);

console.log("======= observers :======= ");
weatherStation.attach(phoneDisplay);
weatherStation.attach(tvDisplay);

weatherStation.setTemperature(25);
weatherStation.setTemperature(30);

weatherStation.detach(tvDisplay);

weatherStation.setTemperature(28);

console.log("======= Converter Observer :======= ");
const subject = new ConcreteSubject();
const observer1 = new ConcreteObserverA();
subject.attach(observer1);
const observer2 = new ConcreteObserverB();
subject.attach(observer2);

subject.someBusinessLogic();
subject.someBusinessLogic();

subject.detach(observer2);

subject.someBusinessLogic();

console.log("======= Strategy :======= ");
const payment = new PaymentContext(new CreditCardPayment());
payment.checkout(100);

payment.setStrategy(new PayPalPayment());
payment.checkout(200);

payment.setStrategy(new CryptoPayment());
payment.checkout(300);




console.log("======= Singleton :======= ");
// Singleton Pattern Demo
const main = async() => {
  try {
    const users = await getUsers();
    console.log("get User from DB:", users);
  } catch (error) {
    console.log("Error:", error);
  }
}

main();