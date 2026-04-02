namespace mgatepass;

using { cuid, managed } from '@sap/cds/common';

type ProcessType  : String enum { Inward; Outward };
type GatepassType : String enum { Returnable; NonReturnable; AgainstOutwardRGP; AgainstInwardRGP };

type PassStatus : String enum {
    Draft;
    PendingApproval;
    Approved;
    Rejected;
    Cancelled;
    EntryWeightPending;
    GateEntryPending;
    ExitWeightPending;
    GateExitPending;
    Completed;
    PartiallyReturned;
    Returned;
};

entity AppConfig : cuid, managed {
    weighbridgeEnabled : Boolean default false;
    weightUnit         : String(10);
    companyLogo        : LargeString;
    approvalRules      : Composition of many ApprovalRules
                           on approvalRules.config = $self;
    vehicleTypes       : Composition of many VehicleTypes
                           on vehicleTypes.config = $self;
    gates              : Composition of many Gates
                           on gates.config = $self;
}

entity ApprovalRules : cuid, managed {
    config           : Association to AppConfig;
    processType      : ProcessType not null;
    gatepassType     : GatepassType not null;
    approvalRequired : Boolean default false;
}

entity VehicleTypes : cuid, managed {
    config                 : Association to AppConfig;
    name                   : String(100) not null;
    requireTransporterName : Boolean default true;
    requireDriverName      : Boolean default true;
    requireDriverContact   : Boolean default true;
    requireVehicleNumber   : Boolean default true;
    requireDriverLicense   : Boolean default true;
}

entity Gates : cuid, managed {
    config     : Association to AppConfig;
    name       : String(100) not null;
    allowEntry : Boolean default true;
    allowExit  : Boolean default true;
}

entity Vehicles : cuid, managed {
    vehicleNumber : String(20) not null;
    type          : Association to VehicleTypes;
    transporter   : String(100);
}

entity Drivers : cuid, managed {
    name          : String(100) not null;
    licenseNumber : String(50);
    contactNumber : String(20);
}

entity Weights : cuid {
    entryWeight : Decimal(10, 3);
    exitWeight  : Decimal(10, 3);
}

entity Passes : cuid, managed {
    passNumber   : String(20) not null;
    status       : PassStatus not null default 'Draft';
    processType  : ProcessType not null;
    gatepassType : GatepassType not null;
    documentType : String(50);
    vehicle      : Association to Vehicles;
    driver       : Association to Drivers;
    entryGate    : Association to Gates;
    exitGate     : Association to Gates;
    weight       : Association to Weights;
    documents    : many String(50);
    auditLog     : Composition of many PassAuditLogs
                     on auditLog.pass = $self;
}

type AuditAction : String enum {
    Created;
    SentForApproval;
    Approved;
    Rejected;
    Cancelled;
    WeightRecorded;
    EntryPerformed;
    ExitPerformed;
    Updated;
    Printed;
};

entity PassAuditLogs : cuid {
    pass        : Association to Passes;
    action      : AuditAction not null;
    performedAt : Timestamp not null;
    performedBy : String(255) not null;
    oldValue    : LargeString;
    newValue    : LargeString;
    remarks     : String(500);
}
