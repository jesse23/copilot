// solution that using indexedDB and chatgpt
import { INDICATOR_SAMPLES } from "./indicator-samples";
import { VectorStorage } from "vector-storage";

const VSTORE_NAME = "VectorStorageDatabase";

const _ctx = {
  vStore: null as VectorStorage<{ category: string }>,
};

function checkIfIndexedDBExists(dbName) {
  return new Promise((resolve, reject) => {
    let dbExists = true;

    const request = indexedDB.open(dbName);

    request.onupgradeneeded = function (event) {
      // This event is only triggered if the database didn't exist and is being created
      console.log("Database being created. It didn't exist before.");
      dbExists = false;
    };

    request.onsuccess = function (event) {
      if (!dbExists) {
        console.log("Database created for the first time.");
      } else {
        console.log("Database already exists.");
      }

      // Don't forget to close the database connection
      (event.target as any).result.close();

      if (!dbExists) {
        // Now, delete the database
        var deleteRequest = indexedDB.deleteDatabase(dbName);

        deleteRequest.onsuccess = function (event) {
          console.log("Database deleted successfully");
          resolve(dbExists);
        };

        deleteRequest.onerror = function (event) {
          console.log("Error deleting database");
          reject();
        };

        deleteRequest.onblocked = function (event) {
          // This event is triggered if the database is blocked
          console.log("Database delete operation blocked");
          reject();
        };
      } else {
        resolve(dbExists);
      }
    };

    request.onerror = function (event) {
      console.error("Error opening database:", (event.target as any).error);
      reject();
    };
  });
}

export const queryVectorStore = async (query) => {
  return _ctx.vStore.similaritySearch({
    query,
  });
};

// Example usage
export const initVectorStore = async (apiKey) => {
  const dbExists = await checkIfIndexedDBExists(VSTORE_NAME);

  if (apiKey) {
    // Create an instance of VectorStorage
    _ctx.vStore = new VectorStorage<{ category: string }>({
      openAIApiKey: apiKey,
    });
    if (!dbExists) {
      // simply use line to split jsonl
      for (let text of INDICATOR_SAMPLES.split("\n")) {
        await _ctx.vStore.addText(text, {
          category: "example",
        });
      }
    }
  }
};