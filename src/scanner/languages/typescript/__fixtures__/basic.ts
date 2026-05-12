import DefaultThing, { helper as importedHelper } from './dep';

@service
export class Worker {
  run() {
    importedHelper();
  }
}

export function doWork() {
  innerCall();
  return importedHelper();
}

const localHelper = function () {
  return doWork();
};

export { localHelper };
