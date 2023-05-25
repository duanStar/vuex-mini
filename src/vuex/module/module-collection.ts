import { Module as ModuleOptions } from "../store";
import { foreachValue } from "../util";
import { Module } from "./module";

export class ModuleCollection<R extends Record<string, any>> {
  root!: Module<R, R>;
  constructor(rawRootModule: ModuleOptions<any, R>) {
    this.register([], rawRootModule);
  }

  getNameSpace(path: string[]) {
    let module = this.root;
    return path.reduce((namespace, key) => {
      module = module.getChild(key);
      return namespace + (module.namespaced ? key + "/" : "");
    }, "");
  }

  get(path: string[]) {
    return path.reduce((module, key) => {
      return module.getChild(key);
    }, this.root);
  }

  register(path: string[], rawRootModule: ModuleOptions<any, R>) {
    const newModule = new Module(rawRootModule);
    if (path.length === 0) {
      this.root = newModule;
    } else {
      const parent = this.get(path.slice(0, -1));
      parent.addChild(path[path.length - 1], newModule);
    }

    if (rawRootModule.modules) {
      foreachValue(
        rawRootModule.modules,
        (rawModule: ModuleOptions<any, R>, key) => {
          this.register(path.concat(key), rawModule);
        }
      );
    }
  }

  unregister(path: string[]) {
    const parent = this.get(path.slice(0, -1));
    const key = path[path.length - 1];
    const child = parent.getChild(key);
    if (!child) {
      return;
    }
    parent.removeChild(key);
  }
}
