import { PaymentStrategy } from "./interface";

export class CreditCardPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log(`Paid ${amount} using Credit Card.`);
  };
};

export class PayPalPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log(`Paid ${amount} using PayPal.`);
  };
};

export class CryptoPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log(`Paid ${amount} using Cryptocurrency.`);
  };
};

export class PaymentContext {
  private strategy: PaymentStrategy;

  constructor(strategy: PaymentStrategy) {
    this.strategy = strategy;
  };

  setStrategy(strategy: PaymentStrategy) {
    this.strategy = strategy;
  };

  checkout(amount: number) {
    this.strategy.pay(amount);
  };
};
