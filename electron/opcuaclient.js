// Lazy-loaded node-opcua modules (loaded on first connect)
let opcuaModules = null;

async function loadOpcUaModules() {
    if (opcuaModules) return opcuaModules;

    console.log("Loading node-opcua modules...");
    const startTime = Date.now();

    const {
        OPCUAClient,
        AttributeIds,
        TimestampsToReturn,
        DataType,
        resolveNodeId,
        MessageSecurityMode,
        SecurityPolicy,
        crypto_utils
    } = await import("node-opcua");

    opcuaModules = {
        OPCUAClient,
        AttributeIds,
        TimestampsToReturn,
        DataType,
        resolveNodeId,
        MessageSecurityMode,
        SecurityPolicy,
        crypto_utils
    };

    console.log(`node-opcua loaded in ${Date.now() - startTime}ms`);
    return opcuaModules;
}

export class OpcUaClientService {
    constructor(userDataPath) {
        this.client = null;
        this.session = null;
        this.subscription = null;
        this.monitoredItems = new Map();
        this.userDataPath = userDataPath;
    }

    async connect(endpointUrl) {
        if (this.session) {
            console.warn("Session already exists, disconnecting first...");
            await this.disconnect();
        }

        try {
            // Lazy load node-opcua modules on first connect
            const { OPCUAClient, MessageSecurityMode, SecurityPolicy } = await loadOpcUaModules();
            const path = await import("path");

            const pkiDir = path.default.join(this.userDataPath, "pki");
            console.log("Using PKI directory:", pkiDir);

            this.client = OPCUAClient.create({
                applicationName: "ElectronOPCUAClient",
                connectionStrategy: {
                    maxRetry: 1,
                    initialDelay: 1000
                },
                securityMode: MessageSecurityMode.None,
                securityPolicy: SecurityPolicy.None,
                endpointMustExist: false,
                // Configure Persistent PKI
                pki: {
                    location: pkiDir,
                }
            });

            console.log(`Connecting to ${endpointUrl}...`);
            await this.client.connect(endpointUrl);
            console.log("Client connected!");

            this.session = await this.client.createSession();
            console.log("Session created!");

            return true;
        } catch (err) {
            console.error("Connection failed:", err);
            throw err;
        }
    }

    async disconnect() {
        if (this.subscription) {
            await this.subscription.terminate();
            this.subscription = null;
        }

        if (this.session) {
            await this.session.close();
            this.session = null;
        }

        if (this.client) {
            await this.client.disconnect();
            this.client = null;
        }

        this.monitoredItems.clear();
        console.log("Disconnected.");
    }

    async subscribe(nodeId, callback) {
        if (!this.session) throw new Error("No active session");

        const { AttributeIds, resolveNodeId, TimestampsToReturn } = await loadOpcUaModules();

        if (!this.subscription) {
            this.subscription = await this.session.createSubscription2({
                requestedPublishingInterval: 1000,
                requestedLifetimeCount: 100,
                requestedMaxKeepAliveCount: 10,
                maxNotificationsPerPublish: 100,
                publishingEnabled: true,
                priority: 10
            });
            console.log("Subscription started");
        }

        const itemToMonitor = {
            nodeId: resolveNodeId(nodeId),
            attributeId: AttributeIds.Value
        };

        const parameters = {
            samplingInterval: 100,
            discardOldest: true,
            queueSize: 10
        };

        const monitoredItem = await this.subscription.monitor(itemToMonitor, parameters, TimestampsToReturn.Both);

        monitoredItem.on("changed", (dataValue) => {
            let value = dataValue.value.value;
            if (value && value.value !== undefined) {
                value = value.value;
            }
            callback(value, dataValue.value.dataType);
        });

        this.monitoredItems.set(nodeId.toString(), monitoredItem);
        console.log(`Now monitoring ${nodeId}`);
        return true;
    }

    async write(nodeId, value, dataTypeStr) {
        if (!this.session) throw new Error("No active session");

        const { DataType, AttributeIds, resolveNodeId } = await loadOpcUaModules();

        let type = DataType.Double;
        let variantValue = value;

        switch (dataTypeStr) {
            case 'Double':
                type = DataType.Double;
                variantValue = parseFloat(value);
                break;
            case 'Float':
                type = DataType.Float;
                variantValue = parseFloat(value);
                break;
            case 'Int32':
                type = DataType.Int32;
                variantValue = parseInt(value, 10);
                break;
            case 'Int16':
                type = DataType.Int16;
                variantValue = parseInt(value, 10);
                break;
            case 'Boolean':
                type = DataType.Boolean;
                variantValue = (value === 'true' || value === true || value === 1);
                break;
            case 'String':
                type = DataType.String;
                variantValue = String(value);
                break;
            default:
                console.warn(`Unknown dataType ${dataTypeStr}, defaulting to Double`);
        }

        const nodesToWrite = [{
            nodeId: resolveNodeId(nodeId),
            attributeId: AttributeIds.Value,
            value: {
                value: {
                    dataType: type,
                    value: variantValue
                }
            }
        }];

        const statusCodes = await this.session.write(nodesToWrite);
        if (statusCodes[0].isGood()) {
            console.log(`Write success: ${nodeId} = ${variantValue} (${dataTypeStr})`);
            return true;
        } else {
            console.error("Write failed:", statusCodes[0].toString());
            throw new Error(`Write failed: ${statusCodes[0].toString()}`);
        }
    }

    async browseNode(nodeId) {
        if (!this.session) throw new Error("No active session");

        // Defaults to RootFolder if not provided
        const nodeToBrowse = nodeId || "RootFolder";

        const browseResult = await this.session.browse(nodeToBrowse);

        // Map results to a simplified format for frontend
        const references = browseResult.references.map(ref => {
            return {
                nodeId: ref.nodeId.toString(),
                displayName: ref.displayName.text,
                nodeClass: ref.nodeClass.toString(), // Object, Variable, Method
                typeDefinition: ref.typeDefinition.toString(),
                browseName: ref.browseName.toString()
            };
        });

        return references;
    }

    async subscribeToEvents(callback) {
        if (!this.session) throw new Error("No active session");

        const { AttributeIds, resolveNodeId, constructEventFilter, TimestampsToReturn } = await loadOpcUaModules();

        if (!this.subscription) {
            this.subscription = await this.session.createSubscription2({
                requestedPublishingInterval: 1000,
                requestedLifetimeCount: 100,
                requestedMaxKeepAliveCount: 10,
                maxNotificationsPerPublish: 100,
                publishingEnabled: true,
                priority: 10
            });
        }

        const itemToMonitor = {
            nodeId: resolveNodeId("ns=0;i=2253"), // Server Object
            attributeId: AttributeIds.EventNotifier
        };

        const eventFilter = constructEventFilter(["EventType", "Message", "SourceName", "Time", "Severity", "ReceiveTime"]);

        const eventMonitoringItem = await this.subscription.monitor(
            itemToMonitor,
            {
                discardOldest: true,
                queueSize: 100,
                filter: eventFilter
            },
            TimestampsToReturn.Both
        );

        eventMonitoringItem.on("changed", (eventFields) => {
            // Helper to extract value safely
            const getField = (name) => {
                const index = eventFields.findIndex(x => x.schema.name === name);
                return index >= 0 ? eventFields[index].value.value : null;
            }

            const eventData = {
                eventType: getField("EventType")?.toString(),
                message: getField("Message")?.text || "No message",
                sourceName: getField("SourceName"),
                time: getField("Time"),
                severity: getField("Severity"),
                receiveTime: getField("ReceiveTime")
            };

            callback(eventData);
        });

        console.log("Subscribed to global events on Server node");
        return true;
    }

    // Certificate Management
    async getCertificates() {
        const fs = await import("fs/promises");
        const path = await import("path");
        const { crypto_utils } = await loadOpcUaModules();

        const pkiDir = path.default.join(this.userDataPath, "pki");
        const dirs = {
            "trusted": path.default.join(pkiDir, "trusted", "certs"),
            "rejected": path.default.join(pkiDir, "rejected", "certs"),
            "own": path.default.join(pkiDir, "own", "certs"),
        };

        const result = { trusted: [], rejected: [], own: [] };

        for (const [status, dir] of Object.entries(dirs)) {
            try {
                await fs.mkdir(dir, { recursive: true });
                const files = await fs.readdir(dir);

                for (const file of files) {
                    if (!file.endsWith('.pem') && !file.endsWith('.der')) continue;

                    const filePath = path.default.join(dir, file);
                    const content = await fs.readFile(filePath);

                    try {
                        const info = crypto_utils.exploreCertificate(content);
                        result[status].push({
                            filename: file,
                            path: filePath,
                            subject: info.tbsCertificate.subject.commonName || "Unknown",
                            thumbprint: crypto_utils.makeSHA1Thumbprint(content).toString("hex"),
                            validFrom: info.tbsCertificate.validity.notBefore,
                            validTo: info.tbsCertificate.validity.notAfter,
                        });
                    } catch (parseErr) {
                        console.error(`Error parsing cert ${file}:`, parseErr);
                        result[status].push({
                            filename: file,
                            path: filePath,
                            subject: file,
                            error: "Parse Error"
                        });
                    }
                }
            } catch (err) {
                // Ignore missing dirs
            }
        }
        return result;
    }

    async trustCertificate(filename) {
        return this._moveCertificate(filename, "rejected", "trusted");
    }

    async rejectCertificate(filename) {
        return this._moveCertificate(filename, "trusted", "rejected");
    }

    async deleteCertificate(filename, status) {
        const fs = await import("fs/promises");
        const path = await import("path");
        const pkiDir = path.default.join(this.userDataPath, "pki");

        if (!['trusted', 'rejected', 'own'].includes(status)) throw new Error("Invalid status");

        const filePath = path.default.join(pkiDir, status, "certs", filename);
        await fs.unlink(filePath);
        return true;
    }

    async _moveCertificate(filename, fromStatus, toStatus) {
        const fs = await import("fs/promises");
        const path = await import("path");
        const pkiDir = path.default.join(this.userDataPath, "pki");

        const source = path.default.join(pkiDir, fromStatus, "certs", filename);
        const dest = path.default.join(pkiDir, toStatus, "certs", filename);

        // Ensure dest dir exists
        await fs.mkdir(path.default.dirname(dest), { recursive: true });

        await fs.rename(source, dest);
        return true;
    }
}
