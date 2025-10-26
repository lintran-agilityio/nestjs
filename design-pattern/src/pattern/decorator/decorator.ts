import { Coffee } from './interface';

export class SimpleCoffee implements Coffee {
  cost(): number {
    return 5;
  };

  ingredients(): string {
    return 'Coffee';
  };

  description(): string {
    return 'Simple coffee';
  };
};

export class DecoratorCoffee implements Coffee {
  protected decoratedCoffee: Coffee;

  constructor(coffee: Coffee) {
    this.decoratedCoffee = coffee;
  };
  
  cost(): number {
    return this.decoratedCoffee.cost();
  };

  ingredients(): string {
    return this.decoratedCoffee.ingredients();
  };

  description(): string {
    return this.decoratedCoffee.description();
  };
};

export class MilkDecorator extends DecoratorCoffee {
  constructor(coffee: Coffee) {
    super(coffee);
  };

  cost(): number {
    return super.cost() + 2;
  };

  ingredients(): string {
    return super.ingredients() + ', Milk';
  };

  description(): string {
    return super.description() + ' with milk';
  };
};

export class SugarDecorator extends DecoratorCoffee {
  constructor(coffee: Coffee) {
    super(coffee);
  };

  cost(): number {
    return super.cost() + 1;
  };

  ingredients(): string {
    return super.ingredients() + ', Sugar';
  };

  description(): string {
    return super.description() + ' with sugar';
  };
};