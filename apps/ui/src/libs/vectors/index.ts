import { VectorStorage } from "vector-storage";

const VSTORE_NAME = "VectorStorageDatabase";

const _ctx = {
    vStore: null as VectorStorage<{category: string}>
}

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
      })
};

// Example usage
export const initVectorStore = async (apiKey) => {
  const dbExists = await checkIfIndexedDBExists(VSTORE_NAME);

  if (apiKey) {
    // Create an instance of VectorStorage
    _ctx.vStore = new VectorStorage<{category: string}>({
      openAIApiKey: apiKey,
    });
    if (!dbExists) {
      // Add a text document to the store
      for (let text of `
{"id":"fx_release_status_list_approved","iconName":"ReleasedApproved","tooltip":{"showPropDisplayName":false,"propNames":["object_name","date_released"]},"prop":{"names":["release_status_list"],"type":{"names":["ReleaseStatus"],"prop":{"names":["object_name"],"conditions":{"object_name":{"$eq":"Approved"}}}}},"modelTypes":["WorkspaceObject"]}
{"id":"fx_release_status_list_pending","iconName":"ReleasedPending","tooltip":{"showPropDisplayName":false,"propNames":["object_name","date_released"]},"prop":{"names":["release_status_list"],"type":{"names":["ReleaseStatus"],"prop":{"names":["object_name"],"conditions":{"object_name":{"$eq":"Pending"}}}}},"modelTypes":["WorkspaceObject"]}
{"id":"fx_release_status_list_approval_pending","iconName":"ReleasedPending","tooltip":{"showPropDisplayName":false,"propNames":["object_name","date_released"]},"prop":{"names":["release_status_list"],"type":{"names":["ReleaseStatus"],"prop":{"names":["object_name"],"conditions":{"object_name":{"$eq":"Approval Pending"}}}}},"modelTypes":["WorkspaceObject"]}
{"id":"fx_release_status_list_created","iconName":"FlagWhite","tooltip":{"showPropDisplayName":false,"propNames":["object_name","date_released"]},"prop":{"names":["release_status_list"],"type":{"names":["ReleaseStatus"],"prop":{"names":["object_name"],"conditions":{"object_name":{"$eq":"Created"}}}}},"modelTypes":["WorkspaceObject"]}
{"id":"Psi0PrgDelRevision_Indicator_Closed","iconName":"Closed","tooltip":{"showPropDisplayName":true,"propNames":["psi0State"]},"conditions":{"psi0State":{"$eq":"Closed"}},"modelTypes":["Psi0PrgDelRevision"]}
{"id":"Prg0AbsCriteria_Indicator_New","iconName":"FlagWhite","tooltip":{"showPropDisplayName":true,"propNames":["fnd0State"]},"conditions":{"fnd0State":{"$eq":"New"}},"modelTypes":["Prg0AbsCriteria"]}
{"id":"Prg0AbsCriteria_Indicator_Open","iconName":"FlagBlue","tooltip":{"showPropDisplayName":true,"propNames":["fnd0State"]},"conditions":{"fnd0State":{"$eq":"Open"}},"modelTypes":["Prg0AbsCriteria"]}
{"id":"Prg0AbsCriteria_Indicator_Ready","iconName":"FlagGreen","tooltip":{"showPropDisplayName":true,"propNames":["fnd0State"]},"conditions":{"fnd0State":{"$eq":"Ready"}},"modelTypes":["Prg0AbsCriteria"]}
{"id":"Prg0AbsCriteria_Indicator_InProcess","iconName":"ReleasedPending","tooltip":{"showPropDisplayName":true,"propNames":["fnd0State"]},"conditions":{"fnd0State":{"$eq":"In Process"}},"modelTypes":["Prg0AbsCriteria"]}
{"id":"Prg0AbsCriteria_Indicator_Pass","iconName":"ApprovedPass","tooltip":{"showPropDisplayName":true,"propNames":["fnd0State"]},"conditions":{"fnd0State":{"$eq":"Pass"}},"modelTypes":["Prg0AbsCriteria"]}
{"id":"Prg0AbsCriteria_Indicator_Fail","iconName":"ReleasedRejected","tooltip":{"showPropDisplayName":true,"propNames":["fnd0State"]},"conditions":{"fnd0State":{"$eq":"Fail"}},"modelTypes":["Prg0AbsCriteria"]}
{"id":"Prg0AbsEvent_Indicator_NotStarted","iconName":"NotStarted","tooltip":{"showPropDisplayName":true,"propNames":["prg0State"]},"conditions":{"prg0State":{"$eq":"Not Started"}},"modelTypes":["Prg0AbsEvent"]}
{"id":"Prg0AbsEvent_Indicator_InProgress","iconName":"InProgress","tooltip":{"showPropDisplayName":true,"propNames":["prg0State"]},"conditions":{"prg0State":{"$eq":"In Progress"}},"modelTypes":["Prg0AbsEvent"]}
{"id":"Prg0AbsEvent_Indicator_Complete","iconName":"StatusComplete","tooltip":{"showPropDisplayName":true,"propNames":["prg0State"]},"conditions":{"prg0State":{"$eq":"Complete"}},"modelTypes":["Prg0AbsEvent"]}
{"id":"Prg0AbsEvent_Indicator_Closed","iconName":"Closed","tooltip":{"showPropDisplayName":true,"propNames":["prg0State"]},"conditions":{"prg0State":{"$eq":"Closed"}},"modelTypes":["Prg0AbsEvent"]}
{"id":"Prg0AbsPlan_Indicator_NotStarted","iconName":"NotStarted","tooltip":{"showPropDisplayName":true,"propNames":["prg0State"]},"conditions":{"prg0State":{"$eq":"Not Started"}},"modelTypes":["Prg0AbsPlan"]}
{"id":"Prg0AbsPlan_Indicator_InProgress","iconName":"InProgress","tooltip":{"showPropDisplayName":true,"propNames":["prg0State"]},"conditions":{"prg0State":{"$eq":"In Progress"}},"modelTypes":["Prg0AbsPlan"]}
{"id":"Prg0AbsPlan_Indicator_Complete","iconName":"StatusComplete","tooltip":{"showPropDisplayName":true,"propNames":["prg0State"]},"conditions":{"prg0State":{"$eq":"Complete"}},"modelTypes":["Prg0AbsPlan"]}
{"id":"Prg0AbsPlan_Indicator_Closed","iconName":"Closed","tooltip":{"showPropDisplayName":true,"propNames":["prg0State"]},"conditions":{"prg0State":{"$eq":"Closed"}},"modelTypes":["Prg0AbsPlan"]}
{"id":"dangled_connection","iconName":"DangledConnection","tooltip":{"showPropDisplayName":false,"propNames":["ase0ConnectedState"]},"modelTypes":["Awb0Connection"],"conditions":{"ase0ConnectedState":{"$eq":"ase0Disconnected"}}}
{"id":"orphan_connection","iconName":"DangledConnection","tooltip":{"showPropDisplayName":false,"propNames":["ase0ConnectedState"]},"modelTypes":["Awb0Connection"],"conditions":{"ase0ConnectedState":{"$eq":"ase0Dangling"}}}
{"id":"occmgmt_checked_out","iconName":"CheckedOut","tooltip":{"showPropDisplayName":false,"propNames":["checked_out_user","checked_out_date"]},"modelTypes":["Mdl0ApplicationModel"]}
{"id":"cm0AuthoringChangeRevision","iconName":"CreateChangeContextActive","tooltip":{"showPropDisplayName":true,"propNames":["cm0AuthoringChangeRevision"]},"modelTypes":["WorkspaceObject"]}
{"id":"SubscriptionDeActivated","iconName":"Deactivated","tooltip":{"showPropDisplayName":false,"propNames":["expiration_date"]},"modelTypes":["ImanSubscription"],"conditions":{"expiration_date":{"$notNull":true}}}
{"id":"fx_classification_required","iconName":"PartNotClassified","tooltip":{"showPropDisplayName":true,"propNames":["cls0IsEnforcementSatisfied"]},"modelTypes":["WorkspaceObject"],"conditions":{"cls0IsEnforcementSatisfied":{"$eq":"0"}}}
{"id":"has_trace_link","iconName":"TraceLink","tooltip":{"showPropDisplayName":true,"propNames":["has_trace_link"]},"modelTypes":["WorkspaceObject"],"conditions":{"has_trace_link":{"$eq":true}}}
{"id":"awb0TraceLinkFlag","iconName":"TraceLink","tooltip":{"showPropDisplayName":true,"propNames":["awb0TraceLinkFlag"]},"modelTypes":["RuntimeBusinessObject"],"conditions":{"awb0TraceLinkFlag":{"$eq":"1"}}}
{"id":"awb0TraceLinkFlag2","iconName":"TraceLink","tooltip":{"showPropDisplayName":true,"propNames":["awb0TraceLinkFlag"]},"modelTypes":["RuntimeBusinessObject"],"conditions":{"awb0TraceLinkFlag":{"$eq":"2"}}}
{"id":"showReplicaVisualIndicator","iconName":"Remote","tooltip":{"showPropDisplayName":true,"propNames":["owning_site"]},"modelTypes":["WorkspaceObject"],"conditions":{"owning_site":{"$ne":0}}}
{"id":"showExportedToAndPublishedToVisualIndicator","iconName":"RemoteSiteShared","tooltip":{"showPropDisplayName":true,"propNames":["publication_sites","export_sites"]},"modelTypes":["WorkspaceObject"]}
{"id":"fx_bcz_checkout_test","iconName":"BriefcaseCheckOut","tooltip":{"showPropDisplayName":true,"propNames":["checked_out_user","checked_out_date"]},"prop":{"names":["checked_out_user"],"type":{"names":["POM_imc"],"prop":{"names":["site_id"],"conditions":{"site_id":{"$notNull":true}}}}},"modelTypes":["ItemRevision","Dataset","Item","Form"]}
{"id":"qfm0FmeaNodeLinkageIndiactor","iconName":"TraceLink","tooltip":{"showPropDisplayName":true,"propNames":["qfm0HasLinkage"]},"modelTypes":["Qfm0FMEANode"],"conditions":{"qfm0HasLinkage":{"$eq":true}}}
{"id":"awp0IsSuspect","iconName":"SuspectLink","tooltip":{"showPropDisplayName":false,"propNames":["awp0IsSuspect"]},"modelTypes":["WorkspaceObject"],"conditions":{"awp0IsSuspect":{"$eq":true}}}
{"id":"awb0IsSuspect","iconName":"SuspectLink","tooltip":{"showPropDisplayName":false,"propNames":["awb0IsSuspect"]},"modelTypes":["Awb0Element"],"conditions":{"awb0IsSuspect":{"$eq":true}}}
{"id":"CaeDeriveMaster","iconName":"StructureMain","tooltip":{},"prop":{"names":["CAE0TCCAEMaster"],"type":{"names":["ImanNextId"],"prop":{"names":["name"],"conditions":{"name":{"$ne":""}}}}},"modelTypes":["CAEModelRevision"]}
{"id":"CaeDeriveDeck","iconName":"StructureDeck","tooltip":{},"prop":{"names":["CAE0TCCAEDeck"],"type":{"names":["ImanNextId"],"prop":{"names":["name"],"conditions":{"name":{"$ne":""}}}}},"modelTypes":["CAEModelRevision"]}
{"id":"legacyExchangeMigrated","iconName":"History","tooltip":{"showPropDisplayName":true,"propNames":["vm0Status"]},"conditions":{"vm0Status":{"$eq":"Migrated"}},"modelTypes":["Usp0SRMXChangeRevision"]}
  `
        .trim()
        .split("\n")) {
        await _ctx.vStore.addText(text, {
          category: "example",
        });
      }
    }

    // Perform a similarity search for sanity check
    /*
    const results = await _ctx.vStore.similaritySearch({
      query: "favoriteRank",
    });

    // Display the search results
    console.log(results);
    */
  }
};