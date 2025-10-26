export interface IObserver {
  update(temperature: number): void;
};

export interface ISubject {
  attach(observer: IObserver): void;
  detach(observer: IObserver): void;
  notify(): void;
};

export interface ISubjectTemp {
  attach(observer: IObserverWithSubject): void;
  detach(observer: IObserverWithSubject): void;
  notify(): void;
};

export interface IObserverWithSubject {
  update(subject: ISubjectTemp): void;
};