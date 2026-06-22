using { mgatepass } from '../db/schema';

service GatepassService @(requires: ['Administrator', 'WeighbridgeOperator', 'GateOperator', 'Approver']) {

    @readonly entity AppConfig as projection on mgatepass.AppConfig;
    @readonly entity ApprovalRules as projection on mgatepass.ApprovalRules;
    @readonly entity VehicleTypes as projection on mgatepass.VehicleTypes;
    @readonly entity Gates as projection on mgatepass.Gates;
    @readonly entity Vehicles as projection on mgatepass.Vehicles;
    @readonly entity Drivers as projection on mgatepass.Drivers;
    @readonly entity PassAuditLogs as projection on mgatepass.PassAuditLogs;
    @readonly entity GatepassItems as projection on mgatepass.GatepassItems;

    @(restrict: [
        { grant: 'READ',              to: ['Administrator', 'WeighbridgeOperator', 'GateOperator', 'Approver'] },
        { grant: 'sendForApproval',   to: ['Administrator', 'GateOperator'] },
        { grant: 'approvePass',       to: ['Administrator', 'Approver'] },
        { grant: 'rejectPass',        to: ['Administrator', 'Approver'] },
        { grant: 'cancelPass',        to: ['Administrator', 'GateOperator', 'Approver'] },
        { grant: 'updateGatepass',         to: ['Administrator', 'GateOperator'] },
        { grant: 'finaliseGatepass',      to: ['Administrator', 'GateOperator'] },
        { grant: 'finaliseEntryWeight',   to: ['Administrator', 'WeighbridgeOperator'] },
        { grant: 'finaliseExitWeight',    to: ['Administrator', 'WeighbridgeOperator'] },
        { grant: 'saveWeights',           to: ['Administrator', 'WeighbridgeOperator'] },
        { grant: 'performExit',           to: ['Administrator', 'GateOperator'] },
        { grant: 'printPass',             to: ['Administrator', 'WeighbridgeOperator', 'GateOperator', 'Approver'] }
    ])
    entity Passes as projection on mgatepass.Passes
        actions {
            action sendForApproval() returns Passes;
            action approvePass(remarks : String(500)) returns Passes;
            action rejectPass(remarks : String(500)) returns Passes;
            action cancelPass(remarks : String(500)) returns Passes;
            action finaliseGatepass() returns Passes;
            action finaliseEntryWeight(entryWeight : Decimal(10, 3)) returns Passes;
            action finaliseExitWeight(exitWeight : Decimal(10, 3)) returns Passes;
            action saveWeights(entryWeight : Decimal(10, 3), exitWeight : Decimal(10, 3)) returns Passes;
            action performExit(exitGate : UUID) returns Passes;
            action printPass() returns LargeString;
            action updateGatepass(
                weighbridgeRequired : Boolean,
                entryGate           : UUID,
                expectedReturnDate  : Date,
                vehicle             : VehicleInput,
                driver              : DriverInput,
                items               : many GatepassItemInput
            ) returns Passes;
        };

    @(restrict: [
        { grant: 'READ',   to: ['Administrator', 'WeighbridgeOperator', 'GateOperator', 'Approver'] },
        { grant: 'UPDATE', to: ['Administrator', 'WeighbridgeOperator'] }
    ])
    entity Weights as projection on mgatepass.Weights;

    type VehicleInput {
        vehicleNumber : String(20);
        type          : UUID;
        transporter   : String(100);
    }

    type DriverInput {
        name          : String(100);
        licenseNumber : String(50);
        contactNumber : String(20);
    }

    type GatepassItemInput {
        lineItem            : String(6);
        documentNumber      : String(20);
        materialCode        : String(40);
        materialDescription : String(100);
        partyName           : String(200);
        orderQuantity       : Decimal(13, 3);
        openQuantity        : Decimal(13, 3);
        receivedQuantity    : Decimal(13, 3);
        issueQuantity       : Decimal(13, 3);
        purchaseOrder       : String(10);
        unitOfMeasurement   : String(3);
    }

    @(requires: ['Administrator', 'GateOperator'])
    action fetchDocumentItems(
        processType  : mgatepass.ProcessType,
        gatepassType : mgatepass.GatepassType,
        documents    : many String(50)
    ) returns many GatepassItemInput;

    @(requires: ['Administrator', 'GateOperator'])
    action createGatepass(
        processType         : mgatepass.ProcessType,
        gatepassType        : mgatepass.GatepassType,
        documents           : many String(50),
        weighbridgeRequired : Boolean,
        entryGate           : UUID,
        expectedReturnDate  : Date,
        vehicle             : VehicleInput,
        driver              : DriverInput,
        items               : many GatepassItemInput
    ) returns Passes;
}
