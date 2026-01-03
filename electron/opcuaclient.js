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
        SecurityPolicy
    } = await import("node-opcua");

    opcuaModules = {
        OPCUAClient,
        AttributeIds,
        TimestampsToReturn,
        DataType,
        resolveNodeId,
        MessageSecurityMode,
        SecurityPolicy
    };

    console.log(`node-opcua loaded in ${Date.now() - startTime}ms`);
    return opcuaModules;
}

export class OpcUaClientService {
    constructor() {
        this.client = null;
        this.session = null;
        this.subscription = null;
        this.monitoredItems = new Map();
    }

    async connect(endpointUrl) {
        if (this.session) {
            console.warn("Session already exists, disconnecting first...");
            await this.disconnect();
        }

        try {
            // Lazy load node-opcua modules on first connect
            const { OPCUAClient, MessageSecurityMode, SecurityPolicy } = await loadOpcUaModules();

            this.client = OPCUAClient.create({
                endpointMustExist: false,
                securityMode: MessageSecurityMode.None,
                securityPolicy: SecurityPolicy.None,
                connectionStrategy: {
                    maxRetry: 1,
                    initialDelay: 1000
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
}
