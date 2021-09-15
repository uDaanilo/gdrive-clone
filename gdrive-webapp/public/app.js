import AppController from "./src/appController.js";
import ConnectionManager from "./src/connectionManager.js";
import DragNDropManager from "./src/dragNDropManager.js";
import ViewManager from "./src/viewManager.js";

const API_URL = "https://192.168.100.11:3000"

const appController = new AppController({
  viewManager: new ViewManager(),
  dragAndDropManager: new DragNDropManager(),
  connectionManager: new ConnectionManager({
    apiUrl: API_URL,
  })
})

try {
  await appController.initialize()
} catch (err) {
  console.error('error on initialize ', err)
}