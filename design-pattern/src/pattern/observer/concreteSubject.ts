import { ISubjectTemp, IObserverWithSubject } from "./interface";


export class ConcreteSubject implements ISubjectTemp {
  public state: number = 0;
  private observers: IObserverWithSubject[] = [];

  public attach(observer: IObserverWithSubject): void {
    const isExist = this.observers.includes(observer);
    if (isExist) {
      return console.log("Subject: Observer has been attached already.");
    };

    console.log("Subject: Attached an observer.");
    this.observers.push(observer);
  };

  public detach(observer: IObserverWithSubject): void {
    const observerIndex = this.observers.indexOf(observer);
    if (observerIndex === -1) {
      return console.log("Subject: Nonexistent observer.");
    };

    this.observers.splice(observerIndex, 1);
    console.log("Subject: Detached an observer.");
  };

  public notify(): void {
    console.log("Subject: Notifying observers...");

    for (const observer of this.observers) {
      observer.update(this);
    };
  };

  public someBusinessLogic(): void {
    console.log("\nSubject: I'm doing something important.");
    this.state = Math.floor(Math.random() * (10 + 1));

    console.log(`Subject: My state has just changed to: ${this.state}`);
    this.notify();
  };
};

export class ConcreteObserverA implements IObserverWithSubject {
  public update(subject: ISubjectTemp): void {
    if (subject instanceof ConcreteSubject && subject.state < 3) {
      console.log("ConcreteObserverA: Reacted to the event.");
    };
  };
};

export class ConcreteObserverB implements IObserverWithSubject {
  public update(subject: ISubjectTemp): void {
    if (subject instanceof ConcreteSubject && (subject.state === 0 || subject.state >= 2)) {
      console.log("ConcreteObserverB: Reacted to the event.");
    };
  };
};