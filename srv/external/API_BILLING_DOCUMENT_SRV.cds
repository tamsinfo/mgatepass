/* checksum : eb67e7dc1459f9ad90a4854d3171ab73 */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx'
service API_BILLING_DOCUMENT_SRV {
  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Billing Document Header'
  entity A_BillingDocument {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Billing Document'
    key BillingDocument : String(10) not null;
    @sap.label : 'SD Document Category'
    SDDocumentCategory : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Billing Category'
    BillingDocumentCategory : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Billing Type'
    BillingDocumentType : String(4);
    @sap.display.format : 'Date'
    @sap.label : 'Created On'
    @sap.quickinfo : 'Record Creation Date'
    CreationDate : Date;
    @sap.label : 'Time'
    @sap.quickinfo : 'Entry time'
    CreationTime : Time;
    @sap.display.format : 'Date'
    @sap.label : 'Changed On'
    @sap.quickinfo : 'Last Changed On'
    LastChangeDate : Date;
    @odata.Type : 'Edm.DateTimeOffset'
    @odata.Precision : 7
    @sap.label : 'Time Stamp'
    @sap.quickinfo : 'UTC Time Stamp in Long Form (YYYYMMDDhhmmssmmmuuun)'
    LastChangeDateTime : Timestamp;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Logical System'
    LogicalSystem : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Organization'
    SalesOrganization : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Distribution Channel'
    DistributionChannel : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Division'
    Division : String(2);
    @sap.display.format : 'Date'
    @sap.label : 'Billing Date'
    BillingDocumentDate : Date;
    @sap.label : 'Canceled'
    @sap.quickinfo : 'Billing document is canceled'
    BillingDocumentIsCancelled : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Canceled Bill. Doc.'
    @sap.quickinfo : 'Number of canceled billing document'
    CancelledBillingDocument : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Foreign Trade DataNr'
    @sap.quickinfo : 'Number of foreign trade data in MM and SD documents'
    ForeignTrade : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Export'
    @sap.quickinfo : 'Export indicator'
    IsExportDelivery : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Combination Criteria'
    @sap.quickinfo : 'Combination criteria in the billing document'
    BillingDocCombinationCriteria : String(40);
    @sap.label : 'Man. Invoice Maint.'
    @sap.quickinfo : 'Manual Invoice Maintenance'
    ManualInvoiceMaintIsRelevant : Boolean;
    @sap.label : 'Intrastat Relevance'
    @sap.quickinfo : 'Relevant for Intrastat Reporting'
    IsIntrastatReportingRelevant : Boolean;
    @sap.label : 'Intrastat Exclusion'
    @sap.quickinfo : 'Exclude from Intrastat Reporting'
    IsIntrastatReportingExcluded : Boolean;
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Net Value'
    @sap.quickinfo : 'Net Value in Document Currency'
    TotalNetAmount : Decimal(16, 3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Currency'
    @sap.quickinfo : 'SD Document Currency'
    @sap.semantics : 'currency-code'
    TransactionCurrency : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Statistics Currency'
    @sap.semantics : 'currency-code'
    StatisticsCurrency : String(5);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Tax Amount'
    @sap.quickinfo : 'Tax Amount in Document Currency'
    TaxAmount : Decimal(14, 3);
    @sap.unit : 'TransactionCurrency'
    TotalGrossAmount : Decimal(17, 3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Customer Price Group'
    CustomerPriceGroup : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Price List Type'
    PriceListType : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Depart. Cntry/R.'
    @sap.quickinfo : 'Tax Departure Country/Region'
    TaxDepartureCountry : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'VAT Registration No.'
    @sap.quickinfo : 'VAT Registration Number'
    VATRegistration : String(20);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Origin of VAT ID'
    @sap.quickinfo : 'Origin of VAT Registration Number (VAT ID)'
    VATRegistrationOrigin : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Country/R. of VAT ID'
    @sap.quickinfo : 'Country/Region of VAT Registration Number (VAT ID)'
    VATRegistrationCountry : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'HierarchyTypePricing'
    @sap.quickinfo : 'Hierarchy type for pricing'
    HierarchyTypePricing : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Class.1 Customer'
    @sap.quickinfo : 'Tax Classification 1 for Customer'
    CustomerTaxClassification1 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Class.2 Customer'
    @sap.quickinfo : 'Tax Classification 2 for Customer'
    CustomerTaxClassification2 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Class.3 Customer'
    @sap.quickinfo : 'Tax Classification 3 for Customer'
    CustomerTaxClassification3 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Class.4 Customer'
    @sap.quickinfo : 'Tax Classification 4 for Customer'
    CustomerTaxClassification4 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Class.5 Customer'
    @sap.quickinfo : 'Tax Classification 5 for Customer'
    CustomerTaxClassification5 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Class.6 Customer'
    @sap.quickinfo : 'Tax Classification 6 for Customer'
    CustomerTaxClassification6 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Class.7 Customer'
    @sap.quickinfo : 'Tax Classification 7 for Customer'
    CustomerTaxClassification7 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Class.8 Customer'
    @sap.quickinfo : 'Tax Classification 8 for Customer'
    CustomerTaxClassification8 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Class.9 Customer'
    @sap.quickinfo : 'Tax Classification 9 for Customer'
    CustomerTaxClassification9 : String(1);
    @sap.label : 'EU Triangular Deal'
    @sap.quickinfo : 'Indicator: Triangular Deal Within the EU'
    IsEUTriangularDeal : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Pricing Procedure'
    @sap.quickinfo : 'Pricing Procedure in Pricing'
    SDPricingProcedure : String(6);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Shipping Conditions'
    ShippingCondition : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Incoterms Version'
    IncotermsVersion : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Incoterms'
    @sap.quickinfo : 'Incoterms (Part 1)'
    IncotermsClassification : String(3);
    @sap.label : 'Incoterms (Part 2)'
    IncotermsTransferLocation : String(28);
    @sap.label : 'Incoterms Location 1'
    IncotermsLocation1 : String(70);
    @sap.label : 'Incoterms Location 2'
    IncotermsLocation2 : String(70);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Payer'
    PayerParty : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Contract Account'
    @sap.quickinfo : 'Contract Account Number'
    ContractAccount : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Terms of Payment'
    @sap.quickinfo : 'Key for Terms of Payment'
    CustomerPaymentTerms : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Payment Method'
    PaymentMethod : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Payment Reference'
    PaymentReference : String(30);
    @sap.display.format : 'Date'
    @sap.label : 'Fixed Value Date'
    FixedValueDate : Date;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Addit. Value Days'
    @sap.quickinfo : 'Additional Value Days'
    AdditionalValueDays : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Mandate Reference'
    @sap.quickinfo : 'Unique Reference to Mandate for each Payee'
    SEPAMandate : String(35);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Company Code'
    CompanyCode : String(4);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Fiscal Year'
    FiscalYear : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Number'
    @sap.quickinfo : 'Document Number of an Accounting Document'
    AccountingDocument : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Acct Assmt Grp Cust.'
    @sap.quickinfo : 'Account Assignment Group for Customer'
    CustomerAccountAssignmentGroup : String(2);
    @sap.label : 'Fixed Exchange Rate'
    @sap.quickinfo : 'Indicator for Fixed Exchange Rate'
    AccountingExchangeRateIsSet : Boolean;
    @sap.label : 'Abs.Exch.Rate Acct.'
    @sap.quickinfo : 'Absolute exchange rate for FI postings'
    AbsltAccountingExchangeRate : Decimal(9, 5);
    @sap.label : 'Indirect Quotation'
    @sap.quickinfo : 'Accounting exchange rate quotation is indirect'
    AcctgExchangeRateIsIndrctQtan : Boolean;
    @sap.display.format : 'Date'
    @sap.label : 'Translation Date'
    ExchangeRateDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Exchange Rate Type'
    ExchangeRateType : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Reference'
    @sap.quickinfo : 'Reference Document Number'
    DocumentReferenceID : String(16);
    @sap.label : 'Assignment'
    @sap.quickinfo : 'Assignment Number'
    AssignmentReference : String(18);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Dunning Area'
    DunningArea : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Dunning Block'
    DunningBlockingReason : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Dunning Key'
    DunningKey : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Financial Doc. No.'
    @sap.quickinfo : 'Financial doc. processing: Internal financial doc. number'
    InternalFinancialDocument : String(10);
    @sap.label : 'Relevant for Accrual'
    @sap.quickinfo : 'Is relevant for accrual'
    IsRelevantForAccrual : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sold-to Party'
    SoldToParty : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Trading Partner No.'
    @sap.quickinfo : 'Company ID of Trading Partner'
    PartnerCompany : String(6);
    @sap.label : 'Customer Reference'
    PurchaseOrderByCustomer : String(35);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Customer Group'
    CustomerGroup : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Destination Cntry/R.'
    @sap.quickinfo : 'Destination Country/Region'
    Country : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'City Code'
    CityCode : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales District'
    SalesDistrict : String(6);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Region'
    @sap.quickinfo : 'Region (State, Province, County)'
    Region : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'County Code'
    County : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Credit Control Area'
    CreditControlArea : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Agreement'
    @sap.quickinfo : 'Agreement (various conditions grouped together)'
    CustomerRebateAgreement : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Doc. Condition No.'
    @sap.quickinfo : 'Number of the Document Condition'
    SalesDocumentCondition : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Overall Status'
    @sap.quickinfo : 'Overall Processing Status (Header/All Items)'
    OverallSDProcessStatus : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Status'
    @sap.quickinfo : 'SD Billing Status'
    OverallBillingStatus : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Posting Status'
    @sap.quickinfo : 'Posting Status of Billing Document'
    AccountingPostingStatus : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Posting Status'
    @sap.quickinfo : 'Status for Transfer to Accounting'
    AccountingTransferStatus : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Issue Type'
    @sap.quickinfo : 'Billing Issue Type'
    BillingIssueType : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Invoice List Status'
    @sap.quickinfo : 'Invoice list status of billing document'
    InvoiceListStatus : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'All Items'
    @sap.quickinfo : 'Incompletion Status (All Items)'
    OvrlItmGeneralIncompletionSts : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Pricing – All Items'
    @sap.quickinfo : 'Pricing Incompletion Status (All Items)'
    OverallPricingIncompletionSts : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Clearing Status'
    @sap.quickinfo : 'Clearing Status of Billing Document'
    InvoiceClearingStatus : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Invoice List Type'
    BillingDocumentListType : String(4);
    @sap.display.format : 'Date'
    @sap.label : 'Inv. List Bill. Date'
    @sap.quickinfo : 'Billing date for the invoice list'
    BillingDocumentListDate : Date;
    to_Item : Association to many A_BillingDocumentItem {  };
    to_Partner : Association to many A_BillingDocumentPartner {  };
    to_PricingElement : Association to many A_BillingDocumentPrcgElmnt {  };
    to_Text : Association to many A_BillingDocumentText {  };
  } actions {
    action Cancel() returns many CancelResult;
    function GetPDF() returns GetPDFResult;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Billing Document Item'
  entity A_BillingDocumentItem {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Billing Document'
    key BillingDocument : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Item'
    @sap.quickinfo : 'Billing Item'
    key BillingDocumentItem : String(6) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Doc. Item Cat.'
    @sap.quickinfo : 'Sales Document Item Category'
    SalesDocumentItemCategory : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Item Type'
    SalesDocumentItemType : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Returns'
    @sap.quickinfo : 'Returns item'
    ReturnItemProcessingType : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Created By'
    @sap.quickinfo : 'Name of Person Responsible for Creating the Object'
    CreatedByUser : String(12);
    @sap.display.format : 'Date'
    @sap.label : 'Created On'
    @sap.quickinfo : 'Record Creation Date'
    CreationDate : Date;
    @sap.label : 'Time'
    @sap.quickinfo : 'Entry time'
    CreationTime : Time;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Logical System'
    ReferenceLogicalSystem : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Org. Division'
    @sap.quickinfo : 'Organization Division'
    OrganizationDivision : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Division'
    Division : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Office'
    SalesOffice : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material'
    @sap.quickinfo : 'Material Number'
    Material : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material Entered'
    OriginallyRequestedMaterial : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'EAN/UPC'
    @sap.quickinfo : 'International Article Number (EAN/UPC)'
    InternationalArticleNumber : String(18);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Pricing Ref. Matl'
    @sap.quickinfo : 'Pricing Reference Material'
    PricingReferenceMaterial : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Batch'
    @sap.quickinfo : 'Batch Number'
    Batch : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Product Hierarchy'
    ProductHierarchyNode : String(18);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material Group'
    MaterialGroup : String(9);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material Group 1'
    AdditionalMaterialGroup1 : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material Group 2'
    AdditionalMaterialGroup2 : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material Group 3'
    AdditionalMaterialGroup3 : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material Group 4'
    AdditionalMaterialGroup4 : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material Group 5'
    AdditionalMaterialGroup5 : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Commission Group'
    MaterialCommissionGroup : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Plant'
    Plant : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Storage Location'
    StorageLocation : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Replacement Part'
    @sap.quickinfo : 'Replacement part'
    ReplacementPartType : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material Group 1'
    @sap.quickinfo : 'Material Group Hierarchy 1'
    MaterialGroupHierarchy1 : String(18);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material Group 2'
    @sap.quickinfo : 'Material Group Hierarchy 2'
    MaterialGroupHierarchy2 : String(18);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Region of Dlv. Plant'
    @sap.quickinfo : 'Region in which plant is located'
    PlantRegion : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'County of Dlv. Plant'
    @sap.quickinfo : 'County in which plant is located'
    PlantCounty : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'City of Deliv. Plant'
    @sap.quickinfo : 'City in which plant is located'
    PlantCity : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'BOM Explosion Number'
    BOMExplosion : String(8);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Mat.Determ.Active'
    @sap.quickinfo : 'ID for material determination'
    MaterialDeterminationType : String(1);
    @sap.label : 'Item Description'
    @sap.quickinfo : 'Short Text for Sales Order Item'
    BillingDocumentItemText : String(40);
    @sap.display.format : 'Date'
    @sap.label : 'Date of Services Rendered'
    @sap.quickinfo : 'Date on which services are rendered'
    ServicesRenderedDate : Date;
    @sap.unit : 'BillingQuantityUnit'
    @sap.label : 'Invoiced Quantity'
    @sap.quickinfo : 'Actual Invoiced Quantity'
    BillingQuantity : Decimal(13, 3);
    @sap.label : 'Sales Unit'
    @sap.semantics : 'unit-of-measure'
    BillingQuantityUnit : String(3);
    @sap.unit : 'BaseUnit'
    @sap.label : 'Billing Qty in SKU'
    @sap.quickinfo : 'Billing quantity in stock keeping unit'
    BillingQuantityInBaseUnit : Decimal(13, 3);
    @sap.label : 'Base Unit of Measure'
    @sap.semantics : 'unit-of-measure'
    BaseUnit : String(3);
    @sap.unit : 'BaseUnit'
    @sap.label : 'Required Quantity'
    @sap.quickinfo : 'Required quantity for mat.management in stockkeeping units'
    MRPRequiredQuantityInBaseUnit : Decimal(13, 3);
    @sap.label : 'Denominator'
    @sap.quickinfo : 'Denominator (divisor) for conversion of sales Qty into SKU'
    BillingToBaseQuantityDnmntr : Decimal(5, 0);
    @sap.label : 'Numerator'
    @sap.quickinfo : 'Numerator (factor) for conversion of sales quantity into SKU'
    BillingToBaseQuantityNmrtr : Decimal(5, 0);
    @sap.unit : 'ItemWeightUnit'
    @sap.label : 'Gross Weight'
    ItemGrossWeight : Decimal(15, 3);
    @sap.unit : 'ItemWeightUnit'
    @sap.label : 'Net Weight'
    ItemNetWeight : Decimal(15, 3);
    @sap.label : 'Unit of Weight'
    @sap.semantics : 'unit-of-measure'
    ItemWeightUnit : String(3);
    @sap.unit : 'ItemVolumeUnit'
    @sap.label : 'Volume'
    ItemVolume : Decimal(15, 3);
    @sap.label : 'Volume Unit'
    @sap.semantics : 'unit-of-measure'
    ItemVolumeUnit : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Dest. Ctry/Reg. Ord.'
    @sap.quickinfo : 'Destination Country/Region of Sales Order'
    BillToPartyCountry : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Region Order'
    @sap.quickinfo : 'Region of Sales Order'
    BillToPartyRegion : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Billing Rule'
    @sap.quickinfo : 'Rule in billing plan/invoice plan'
    BillingPlanRule : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Bill. Plan No.'
    @sap.quickinfo : 'Billing Plan Number / Invoicing Plan Number'
    BillingPlan : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Item'
    @sap.quickinfo : 'Item for billing plan/invoice plan/payment cards'
    BillingPlanItem : String(6);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Net Value'
    @sap.quickinfo : 'Net Value of Billing item in Document Currency'
    NetAmount : Decimal(16, 3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Currency'
    @sap.quickinfo : 'SD Document Currency'
    @sap.semantics : 'currency-code'
    TransactionCurrency : String(5);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Gross Value'
    @sap.quickinfo : 'Gross Value of the Billing Item in Document Currency'
    GrossAmount : Decimal(16, 3);
    @sap.display.format : 'Date'
    @sap.label : 'Pricing Date'
    @sap.quickinfo : 'Date for Pricing and Exchange Rate'
    PricingDate : Date;
    @sap.label : 'Abs. Exch. Rate Prc.'
    @sap.quickinfo : 'Absolute exchange rate for price determination'
    AbsltPriceDetnExchangeRate : Decimal(9, 5);
    @sap.label : 'PrcExchRateIsIndirct'
    @sap.quickinfo : 'Pricing exchange rate quotation is indirect'
    PriceDetnExchRateIsIndrctQtan : Boolean;
    @sap.display.format : 'Date'
    @sap.label : 'Translation Date'
    PriceDetnExchangeRateDate : Date;
    @sap.unit : 'BaseUnit'
    @sap.label : 'Scale Quantity'
    @sap.quickinfo : 'Scale Quantity in base unit of measure'
    PricingScaleQuantityInBaseUnit : Decimal(13, 3);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Tax Amount'
    @sap.quickinfo : 'Tax Amount in Document Currency'
    TaxAmount : Decimal(14, 3);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Cost'
    @sap.quickinfo : 'Cost in Document Currency'
    CostAmount : Decimal(14, 3);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Subtotal 1'
    @sap.quickinfo : 'Subtotal 1 from Pricing Procedure for Price Element'
    Subtotal1Amount : Decimal(14, 3);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Subtotal 2'
    @sap.quickinfo : 'Subtotal 2 from Pricing Procedure for Price Element'
    Subtotal2Amount : Decimal(14, 3);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Subtotal 3'
    @sap.quickinfo : 'Subtotal 3 from Pricing Procedure for Price Element'
    Subtotal3Amount : Decimal(14, 3);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Subtotal 4'
    @sap.quickinfo : 'Subtotal 4 from Pricing Procedure for Price Element'
    Subtotal4Amount : Decimal(14, 3);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Subtotal 5'
    @sap.quickinfo : 'Subtotal 5 from Pricing Procedure for Price Element'
    Subtotal5Amount : Decimal(14, 3);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Subtotal 6'
    @sap.quickinfo : 'Subtotal 6 from Pricing Procedure for Price Element'
    Subtotal6Amount : Decimal(14, 3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Statistical Value'
    @sap.quickinfo : 'Statistical Values'
    StatisticalValueControl : String(1);
    @sap.label : 'Cash Discount'
    @sap.quickinfo : 'Cash Discount Indicator'
    CashDiscountIsDeductible : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Group 1'
    @sap.quickinfo : 'Customer Condition Group 1'
    CustomerConditionGroup1 : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Group 2'
    @sap.quickinfo : 'Customer Condition Group 2'
    CustomerConditionGroup2 : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Group 3'
    @sap.quickinfo : 'Customer Condition Group 3'
    CustomerConditionGroup3 : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Group 4'
    @sap.quickinfo : 'Customer Condition Group 4'
    CustomerConditionGroup4 : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Group 5'
    @sap.quickinfo : 'Customer Condition Group 5'
    CustomerConditionGroup5 : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Manual Price'
    @sap.quickinfo : 'Status manual price change'
    ManualPriceChangeType : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Material Price Grp'
    @sap.quickinfo : 'Material Price Group'
    MaterialPricingGroup : String(2);
    @sap.label : 'Abs.Exch.rate stats'
    @sap.quickinfo : 'Absolute exchange rate for statistics'
    AbsltStatisticsExchangeRate : Decimal(9, 5);
    @sap.label : 'StatExcRateIsIndirct'
    @sap.quickinfo : 'Statistics exchange rate quotation is indirect'
    StatisticsExchRateIsIndrctQtan : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Pricing Ref.Material'
    @sap.quickinfo : 'Pricing reference material of main item'
    MainItemPricingRefMaterial : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'MnItem MatPricingGrp'
    @sap.quickinfo : 'Material pricing group of main item'
    MainItemMaterialPricingGroup : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Departure Ctry/Reg.'
    @sap.quickinfo : 'Departure Country/Region (from which the goods are sent)'
    DepartureCountry : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Jurisdiction'
    TaxJurisdiction : String(15);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Product Tax Classification 1'
    ProductTaxClassification1 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Product Tax Classification 2'
    ProductTaxClassification2 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Product Tax Classification 3'
    ProductTaxClassification3 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Product Tax Classification 4'
    ProductTaxClassification4 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Product Tax Classification 5'
    ProductTaxClassification5 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Product Tax Classification 6'
    ProductTaxClassification6 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Product Tax Classification 7'
    ProductTaxClassification7 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Product Tax Classification 8'
    ProductTaxClassification8 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Product Tax Classification 9'
    ProductTaxClassification9 : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Reason 0 VAT'
    @sap.quickinfo : 'Reason for Zero VAT'
    ZeroVATRsn : String(1);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Cash Discount Basis'
    @sap.quickinfo : 'Amount eligible for cash discount in document currency'
    EligibleAmountForCashDiscount : Decimal(14, 3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Business Area'
    BusinessArea : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Profit Center'
    ProfitCenter : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'WBS Element'
    @sap.quickinfo : 'Work Breakdown Structure Element (WBS Element)'
    WBSElement : String(24);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Controlling Area'
    ControllingArea : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Profitability Segment'
    ProfitabilitySegment : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Order'
    @sap.quickinfo : 'Order Number'
    OrderID : String(12);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Cost Center'
    CostCenter : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Originating Document'
    OriginSDDocument : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Originating Item'
    OriginSDDocumentItem : String(6);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Acct Assmt Grp Mat.'
    @sap.quickinfo : 'Account Assignment Group for Material'
    MatlAccountAssignmentGroup : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Reference Document'
    @sap.quickinfo : 'Document Number of Reference Document'
    ReferenceSDDocument : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Reference Item'
    @sap.quickinfo : 'Item Number of the Reference Item'
    ReferenceSDDocumentItem : String(6);
    @sap.label : 'Ref. SD Document Category'
    @sap.quickinfo : 'SD Document Category of Reference SD Document'
    ReferenceSDDocumentCategory : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Document'
    SalesDocument : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Sales Document Item'
    SalesDocumentItem : String(6);
    @sap.label : 'Sales Document Category'
    SalesSDDocumentCategory : String(4);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Higher-Level Item'
    @sap.quickinfo : 'Higher-Level Item in Bill of Material Structures'
    HigherLevelItem : String(6);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Partner Item'
    @sap.quickinfo : 'Item Number in the Partner Segment'
    BillingDocumentItemInPartSgmt : String(6);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Ext. Reference Document'
    @sap.quickinfo : 'External Reference Document'
    ExternalReferenceDocument : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Ext. Ref. Document Item'
    @sap.quickinfo : 'External Reference Document Item'
    ExternalReferenceDocumentItem : String(6);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Group'
    SalesGroup : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Customer Group 1'
    AdditionalCustomerGroup1 : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Customer Group 2'
    AdditionalCustomerGroup2 : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Customer Group 3'
    AdditionalCustomerGroup3 : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Customer Group 4'
    AdditionalCustomerGroup4 : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Customer Group 5'
    AdditionalCustomerGroup5 : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Order Reason'
    @sap.quickinfo : 'Order Reason (Reason for the Business Transaction)'
    SDDocumentReason : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Retail Promotion'
    RetailPromotion : String(10);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Rebate Basis'
    @sap.quickinfo : 'Rebate Basis 1'
    RebateBasisAmount : Decimal(14, 3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Volume Rebate Group'
    @sap.quickinfo : 'Volume rebate group'
    VolumeRebateGroup : String(2);
    @sap.label : 'Credit Funct. Active'
    @sap.quickinfo : 'ID: Item with active credit function / relevant for credit'
    ItemIsRelevantForCredit : Boolean;
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Credit Price'
    @sap.quickinfo : 'Item credit price'
    CreditRelatedPrice : Decimal(12, 3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Deal'
    SalesDeal : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Promotion'
    SalesPromotion : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Distr. Order'
    @sap.quickinfo : 'Sales district of sales order'
    SalesOrderSalesDistrict : String(6);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Customer Grp Order'
    @sap.quickinfo : 'Customer group of sales order'
    SalesOrderCustomerGroup : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Price Group of Order'
    @sap.quickinfo : 'Price group of sales order'
    SalesOrderCustomerPriceGroup : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Price List Order'
    @sap.quickinfo : 'Price list type of sales order'
    SalesOrderPriceListType : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Sales Org. of Order'
    @sap.quickinfo : 'Sales organization of sales order'
    SalesOrderSalesOrganization : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Distr. Channel Order'
    @sap.quickinfo : 'Distribution channel of sales order'
    SalesOrderDistributionChannel : String(2);
    @sap.label : 'SalesDocumentRefer'
    @sap.quickinfo : 'Sales document was created from reference'
    SalesDocIsCreatedFromReference : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Shipping Point'
    @sap.quickinfo : 'Shipping Point / Receiving Point'
    ShippingPoint : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Usage of HL Item'
    @sap.quickinfo : 'ID for higher-level item usage'
    HigherLevelItemUsage : String(1);
    to_BillingDocument : Association to A_BillingDocument {  };
    to_ItemText : Association to many A_BillingDocumentItemText {  };
    to_Partner : Association to many A_BillingDocumentItemPartner {  };
    to_PricingElement : Association to many A_BillingDocumentItemPrcgElmnt {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Item Partner'
  entity A_BillingDocumentItemPartner {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Billing Document'
    key BillingDocument : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Item'
    @sap.quickinfo : 'Billing Item'
    key BillingDocumentItem : String(6) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Partner Function'
    key PartnerFunction : String(2) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Customer'
    @sap.quickinfo : 'Customer Number'
    Customer : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Supplier'
    @sap.quickinfo : 'Account Number of Supplier'
    Supplier : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Personnel Number'
    Personnel : String(8);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Contact Person'
    @sap.quickinfo : 'Number of Contact Person'
    ContactPerson : String(10);
    to_BillingDocument : Association to A_BillingDocument {  };
    to_BillingDocumentItem : Association to A_BillingDocumentItem {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Item Pricing Element'
  entity A_BillingDocumentItemPrcgElmnt {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Billing Document'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    key BillingDocument : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Item'
    @sap.quickinfo : 'Billing Item'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    key BillingDocumentItem : String(6) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Step Number'
    key PricingProcedureStep : String(3) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Counter'
    @sap.quickinfo : 'Condition Counter'
    key PricingProcedureCounter : String(3) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Type'
    ConditionType : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Valid From'
    @sap.quickinfo : 'Timestamp for Pricing'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PricingDateTime : String(14);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Calculation Type'
    @sap.quickinfo : 'Calculation Type for Condition'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionCalculationType : String(3);
    @sap.label : 'Condition Basis'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionBaseValue : Decimal(24, 9);
    @sap.label : 'Amount'
    @sap.quickinfo : 'Condition Amount or Percentage'
    ConditionRateValue : Decimal(24, 9);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Currency'
    @sap.quickinfo : 'Currency Key'
    @sap.semantics : 'currency-code'
    ConditionCurrency : String(5);
    @sap.unit : 'ConditionQuantityUnit'
    @sap.label : 'Pricing Unit'
    @sap.quickinfo : 'Condition Pricing Unit'
    ConditionQuantity : Decimal(5, 0);
    @sap.label : 'Condition Unit'
    @sap.quickinfo : 'Condition Unit in the Document'
    @sap.semantics : 'unit-of-measure'
    ConditionQuantityUnit : String(3);
    @sap.label : 'Condition Category'
    @sap.quickinfo : 'Condition Category (Examples: Tax, Freight, Price, Cost)'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionCategory : String(1);
    @sap.label : 'Statistical'
    @sap.quickinfo : 'Condition is used for statistics'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionIsForStatistics : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Scale Type'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PricingScaleType : String(1);
    @sap.label : 'Accruals'
    @sap.quickinfo : 'Condition is Relevant for Accrual (e.g. Freight)'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    IsRelevantForAccrual : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Invoice List Cond.'
    @sap.quickinfo : 'Condition for Invoice List'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    CndnIsRelevantForInvoiceList : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Origin'
    @sap.quickinfo : 'Origin of the Condition'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionOrigin : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Group Condition'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    IsGroupCondition : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Record No.'
    @sap.quickinfo : 'Number of Condition Record'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionRecord : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Sequent.No. of Cond.'
    @sap.quickinfo : 'Sequential Number of the Condition'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionSequentialNumber : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Code'
    @sap.quickinfo : 'Tax on Sales/Purchases Code'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    TaxCode : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'W/Tax Code'
    @sap.quickinfo : 'Withholding Tax Code'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    WithholdingTaxCode : String(2);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Condition Rounding Difference'
    @sap.quickinfo : 'Rounding-Off Difference of a Condition'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    CndnRoundingOffDiffAmount : Decimal(6, 3);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Condition Value'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionAmount : Decimal(16, 3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Currency'
    @sap.quickinfo : 'SD Document Currency'
    @sap.semantics : 'currency-code'
    TransactionCurrency : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionControl : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Inactive Condition'
    @sap.quickinfo : 'Condition is Inactive'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionInactiveReason : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Class'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionClass : String(1);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Counter'
    @sap.quickinfo : 'Condition Counter (Header)'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PrcgProcedureCounterForHeader : String(3);
    @sap.label : 'Condition Factor'
    @sap.quickinfo : 'Factor for Condition Base Value'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    FactorForConditionBasisValue : Double;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Structure Condition'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    StructureCondition : String(1);
    @sap.label : 'Condition Factor'
    @sap.quickinfo : 'Factor for Condition Basis (Period)'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PeriodFactorForCndnBasisValue : Double;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Scale Basis'
    @sap.quickinfo : 'Scale Basis Indicator'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PricingScaleBasis : String(3);
    @sap.label : 'Scale Base Val.'
    @sap.quickinfo : 'Scale Base Value'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionScaleBasisValue : Decimal(24, 9);
    @sap.label : 'Scale Unit of Meas.'
    @sap.quickinfo : 'Condition Scale Unit of Measure'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.semantics : 'unit-of-measure'
    ConditionScaleBasisUnit : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Scale Currency'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.semantics : 'currency-code'
    ConditionScaleBasisCurrency : String(5);
    @sap.label : 'Intercomp.Billing'
    @sap.quickinfo : 'Condition for Intercompany Billing'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    CndnIsRelevantForIntcoBilling : Boolean;
    @sap.label : 'Changed Manually'
    @sap.quickinfo : 'Condition Changed Manually'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionIsManuallyChanged : Boolean;
    @sap.label : 'UsedforVariantConfig'
    @sap.quickinfo : 'Condition Used for Variant Configuration'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionIsForConfiguration : Boolean;
    @sap.label : 'Variant Key'
    @sap.quickinfo : 'Variant Condition Key'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    VariantCondition : String(26);
    to_BillingDocument : Association to A_BillingDocument {  };
    to_BillingDocumentItem : Association to A_BillingDocumentItem {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Item Text'
  entity A_BillingDocumentItemText {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Billing Document'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    key BillingDocument : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Item'
    @sap.quickinfo : 'Billing Item'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    key BillingDocumentItem : String(6) not null;
    @sap.label : 'Language Key'
    key Language : String(2) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Text ID'
    key LongTextID : String(4) not null;
    @sap.label : 'String'
    @sap.heading : ''
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    LongText : LargeString;
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Header Partner'
  entity A_BillingDocumentPartner {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Billing Document'
    key BillingDocument : String(10) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Partner Function'
    key PartnerFunction : String(2) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Customer'
    @sap.quickinfo : 'Customer Number'
    Customer : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Supplier'
    @sap.quickinfo : 'Account Number of Supplier'
    Supplier : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Personnel Number'
    Personnel : String(8);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Contact Person'
    @sap.quickinfo : 'Number of Contact Person'
    ContactPerson : String(10);
    to_BillingDocument : Association to A_BillingDocument {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Header Pricing Element'
  entity A_BillingDocumentPrcgElmnt {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Billing Document'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    key BillingDocument : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Step Number'
    key PricingProcedureStep : String(3) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Counter'
    @sap.quickinfo : 'Condition Counter'
    key PricingProcedureCounter : String(3) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Type'
    ConditionType : String(4);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Valid From'
    @sap.quickinfo : 'Timestamp for Pricing'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PricingDateTime : String(14);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Calculation Type'
    @sap.quickinfo : 'Calculation Type for Condition'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionCalculationType : String(3);
    @sap.label : 'Condition Basis'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionBaseValue : Decimal(24, 9);
    @sap.label : 'Amount'
    @sap.quickinfo : 'Condition Amount or Percentage'
    ConditionRateValue : Decimal(24, 9);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Currency'
    @sap.quickinfo : 'Currency Key'
    @sap.semantics : 'currency-code'
    ConditionCurrency : String(5);
    @sap.unit : 'ConditionQuantityUnit'
    @sap.label : 'Pricing Unit'
    @sap.quickinfo : 'Condition Pricing Unit'
    ConditionQuantity : Decimal(5, 0);
    @sap.label : 'Condition Unit'
    @sap.quickinfo : 'Condition Unit in the Document'
    @sap.semantics : 'unit-of-measure'
    ConditionQuantityUnit : String(3);
    @sap.label : 'Condition Category'
    @sap.quickinfo : 'Condition Category (Examples: Tax, Freight, Price, Cost)'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionCategory : String(1);
    @sap.label : 'Statistical'
    @sap.quickinfo : 'Condition is used for statistics'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionIsForStatistics : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Scale Type'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PricingScaleType : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Origin'
    @sap.quickinfo : 'Origin of the Condition'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionOrigin : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Group Condition'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    IsGroupCondition : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Record No.'
    @sap.quickinfo : 'Number of Condition Record'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionRecord : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Sequent.No. of Cond.'
    @sap.quickinfo : 'Sequential Number of the Condition'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionSequentialNumber : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Tax Code'
    @sap.quickinfo : 'Tax on Sales/Purchases Code'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    TaxCode : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'W/Tax Code'
    @sap.quickinfo : 'Withholding Tax Code'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    WithholdingTaxCode : String(2);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Condition Rounding Difference'
    @sap.quickinfo : 'Rounding-Off Difference of a Condition'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    CndnRoundingOffDiffAmount : Decimal(6, 3);
    @sap.unit : 'TransactionCurrency'
    @sap.label : 'Condition Value'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionAmount : Decimal(16, 3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Currency'
    @sap.quickinfo : 'SD Document Currency'
    @sap.semantics : 'currency-code'
    TransactionCurrency : String(5);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionControl : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Inactive Condition'
    @sap.quickinfo : 'Condition is Inactive'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionInactiveReason : String(1);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Condition Class'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionClass : String(1);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Counter'
    @sap.quickinfo : 'Condition Counter (Header)'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PrcgProcedureCounterForHeader : String(3);
    @sap.label : 'Condition Factor'
    @sap.quickinfo : 'Factor for Condition Base Value'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    FactorForConditionBasisValue : Double;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Structure Condition'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    StructureCondition : String(1);
    @sap.label : 'Condition Factor'
    @sap.quickinfo : 'Factor for Condition Basis (Period)'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PeriodFactorForCndnBasisValue : Double;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Scale Basis'
    @sap.quickinfo : 'Scale Basis Indicator'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    PricingScaleBasis : String(3);
    @sap.label : 'Scale Base Val.'
    @sap.quickinfo : 'Scale Base Value'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionScaleBasisValue : Decimal(24, 9);
    @sap.label : 'Scale Unit of Meas.'
    @sap.quickinfo : 'Condition Scale Unit of Measure'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.semantics : 'unit-of-measure'
    ConditionScaleBasisUnit : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Scale Currency'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.semantics : 'currency-code'
    ConditionScaleBasisCurrency : String(5);
    @sap.label : 'Intercomp.Billing'
    @sap.quickinfo : 'Condition for Intercompany Billing'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    CndnIsRelevantForIntcoBilling : Boolean;
    @sap.label : 'Changed Manually'
    @sap.quickinfo : 'Condition Changed Manually'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionIsManuallyChanged : Boolean;
    @sap.label : 'UsedforVariantConfig'
    @sap.quickinfo : 'Condition Used for Variant Configuration'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ConditionIsForConfiguration : Boolean;
    @sap.label : 'Variant Key'
    @sap.quickinfo : 'Variant Condition Key'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    VariantCondition : String(26);
    to_BillingDocument : Association to A_BillingDocument {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.label : 'Header Text'
  entity A_BillingDocumentText {
    @sap.display.format : 'UpperCase'
    @sap.label : 'Billing Document'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    key BillingDocument : String(10) not null;
    @sap.label : 'Language Key'
    key Language : String(2) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Text ID'
    key LongTextID : String(4) not null;
    @sap.label : 'String'
    @sap.heading : ''
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    LongText : LargeString;
  };

  @cds.external : true
  type FunctionImportResult {
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    BillingDocument : String(10) not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    BillingDocumentItem : String(10) not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    MessageId : String(3) not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    MessageType : String(1) not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Message : String(256) not null;
  };

  @cds.external : true
  type CancelResult {
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    BillingDocument : String(10) not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    CancellationBillingDocument : String(10) not null;
    @sap.label : 'Message Type'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    SystemMessageType : String(1) not null;
    @sap.label : 'Message Class'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    SystemMessageIdentification : String(20) not null;
    @sap.label : 'Message Number'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    SystemMessageNumber : String(3) not null;
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    SystemMessageText : String(256) not null;
    @sap.label : 'Message variable'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    SystemMessageVariable1 : String(50) not null;
    @sap.label : 'Message variable'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    SystemMessageVariable2 : String(50) not null;
    @sap.label : 'Message variable'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    SystemMessageVariable3 : String(50) not null;
    @sap.label : 'Message variable'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    SystemMessageVariable4 : String(50) not null;
  };

  @cds.external : true
  type GetPDFResult {
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    BillingDocumentBinary : LargeString not null;
  };
};

