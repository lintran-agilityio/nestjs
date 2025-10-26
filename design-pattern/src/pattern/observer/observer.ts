import { IObserver, ISubject } from "./interface";

class WeatherStation implements ISubject {
  private observers: IObserver[] = [];
  private temperature: number = 0;

  attach(observer: IObserver): void {
    this.observers.push(observer);
  };

  detach(observer: IObserver): void {
    this.observers = this.observers.filter(obs => obs !== observer);
  };

  setTemperature(temp: number): void {
    console.log(`WeatherStation: New temperature measurement: ${temp}°C`);
    this.temperature = temp;
    this.notify();
  }

  notify(): void {
    for (const observer of this.observers) {
      observer.update(this.temperature);
    }
  };
};

class PhoneDisplay implements IObserver {
  update(temperature: number): void {
    console.log(`PhoneDisplay: Temperature updated to ${temperature}°C`);
  }
};

class TVDisplay implements IObserver {
  update(temperature: number): void {
    console.log(`TVDisplay: Temperature updated to ${temperature}°C`);
  }
};

// Demo
export const weatherStation = new WeatherStation();
export const phoneDisplay = new PhoneDisplay();
export const tvDisplay = new TVDisplay();