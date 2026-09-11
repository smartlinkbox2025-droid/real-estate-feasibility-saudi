export type ProjectStepId = 1 | 2 | 3 | 4 | 5 | 6;

export type ProjectType =
  | 'فيلا سكنية'
  | 'عمارة سكنية'
  | 'عمارة سكنية تجارية'
  | 'مخصص';

export type AssumptionKey =
  | 'groundFloorPercentage'
  | 'repeatedFloorPercentage'
  | 'annexPercentage'
  | 'basementMaxPercentage'
  | 'parkingPerUnit';

export type PricingBasis = 'low' | 'weighted' | 'high';
export type SoilCondition = 'عادي' | 'لبشة' | 'نزح مياه' | 'تحسين تربة' | 'خوازيق' | 'مخصص';
export type CostBasis = 'before-contingency' | 'after-contingency' | 'land-value' | 'fixed';
export type FeeKind = 'percentage' | 'fixed';
export type OptionalFeeScope = 'development' | 'land-transaction';
export type FeasibilityState = 'positive' | 'review' | 'negative';
export type LandShape = 'regular' | 'irregular';

export interface ServiceArea {
  id: string;
  label: string;
  area: number;
}

export interface OtherExpense {
  id: string;
  description: string;
  amount: number;
}

export interface OptionalFee {
  id: string;
  name: string;
  enabled: boolean;
  kind: FeeKind;
  percentage: number;
  fixedAmount: number;
  basis: CostBasis;
  scope: OptionalFeeScope;
}

export interface SavedSalePrice {
  id: string;
  region: string;
  city: string;
  district: string;
  propertyType: ProjectType;
  pricePerSqm: number;
  date: string;
}

export interface CompanySettings {
  companyName: string;
  reportTitle: string;
  logoDataUrl: string;
  phone: string;
  email: string;
  address: string;
  commercialRegistration: string;
  taxNumber: string;
  footerNote: string;
}

export interface ConstructionRates {
  low: number;
  weighted: number;
  high: number;
}

export const CONSTRUCTION_RATES: Record<FeasibilityProject['build']['level'], ConstructionRates> = {
  اقتصادي: { low: 1500, weighted: 1700, high: 1900 },
  متوسط: { low: 1850, weighted: 2100, high: 2400 },
  فاخر: { low: 2500, weighted: 2900, high: 3500 },
};

export interface FeasibilityProject {
  id: string;
  name: string;
  region: string;
  city: string;
  customCity: string;
  district: string;
  landArea: number;
  landShape: LandShape;
  frontage: number;
  depth: number;
  boundaryNorth: number;
  boundaryEast: number;
  boundarySouth: number;
  boundaryWest: number;
  streetsCount: number;
  streetWidth: number;
  landPricePerSqm: number;
  actualPurchasePrice: number;
  planNumber: string;
  plotNumber: string;
  notes: string;
  type: ProjectType;
  compliance: {
    zoning: string;
    groundFloorPercentage: number;
    repeatedFloorPercentage: number;
    repeatedFloors: number;
    annexEnabled: boolean;
    annexPercentage: number;
    basementEnabled: boolean;
    basementArea: number;
    basementMaxPercentage: number;
    residentialUnits: number;
    parkingPerUnit: number;
    approvedFeasibilityArea: number;
    serviceAreas: ServiceArea[];
    overrides: Partial<Record<AssumptionKey, boolean>>;
  };
  build: {
    level: 'اقتصادي' | 'متوسط' | 'فاخر';
    costPerSqm: number;
    pricingBasis: PricingBasis;
    manualRate: number;
    basement: boolean;
    basementArea: number;
    basementRate: number;
  };
  extras: {
    // Legacy aliases are retained so Phase 1/2 drafts continue opening safely.
    consultant: number;
    permits: number;
    utilities: number;
    contingency: number;
    elevatorCount: number;
    elevatorCost: number;
    externalWorks: number;
    tanksServices: number;
    designSupervision: number;
    licensesFees: number;
    insurance: number;
    utilityConnections: number;
    soilCondition: SoilCondition;
    soilCost: number;
    otherExpenses: OtherExpense[];
    contingencyRate: number;
    optionalFees: OptionalFee[];
  };
  sales: {
    salePricePerSqm: number;
    salesArea: number;
    sellMethod: string;
    targetProfitRate: number;
    scenarioAdjustments: number[];
    savedSalePrices: SavedSalePrice[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectValidationErrors {
  name?: string;
  region?: string;
  city?: string;
  landArea?: string;
  frontage?: string;
  depth?: string;
  streetsCount?: string;
  streetWidth?: string;
  landPricePerSqm?: string;
  actualPurchasePrice?: string;
}

export interface LandCalculation {
  calculatedLandValue: number;
  approvedLandValue: number;
  usesActualPurchasePrice: boolean;
}

export interface SetbackCalculation {
  front: number | null;
  rearOrSideStreet: number | null;
  neighbor: number;
  needsVerification: boolean;
}

export interface AreaCalculation {
  groundFloorArea: number;
  repeatedFloorArea: number;
  totalRepeatedFloorsArea: number;
  annexArea: number;
  aboveGroundBuiltArea: number;
  basementArea: number;
  totalBuiltUpArea: number;
  serviceAreasTotal: number;
  licensedAreaWithServices: number;
  calculatedFeasibilityArea: number;
  approvedFeasibilityArea: number;
  feasibilityIsManual: boolean;
  requiredParking: number;
  saleableArea: number;
  saleableEfficiency: number | null;
}

export interface CalculationSnapshot {
  status: 'phase-4-ready';
  source: 'client-project-model';
  ready: boolean;
  land: LandCalculation;
  setbacks: SetbackCalculation;
  areas: AreaCalculation;
  costs: CostCalculation;
  finance: FinancialCalculation;
  notes: string[];
}

export interface CostLineItem {
  id: string;
  label: string;
  amount: number;
}

export interface OptionalFeeCalculation extends OptionalFee {
  baseAmount: number;
  calculatedAmount: number;
}

export interface CostCalculation {
  selectedConstructionRate: number;
  recommendedConstructionRate: number;
  aboveGroundConstructionCost: number;
  basementRate: number;
  basementCost: number;
  elevatorCost: number;
  externalWorks: number;
  tanksServices: number;
  designSupervision: number;
  licensesFees: number;
  insurance: number;
  utilityConnections: number;
  soilCost: number;
  otherExpenses: CostLineItem[];
  eligibleCostBeforeContingency: number;
  contingencyRate: number;
  contingencyAmount: number;
  eligibleCostAfterContingency: number;
  optionalFees: OptionalFeeCalculation[];
  optionalFeesTotal: number;
  developmentOptionalFeesTotal: number;
  landTransactionFeesTotal: number;
  developmentCostSubtotal: number;
  costsValid: boolean;
  validationMessages: string[];
}

export interface TargetProfitScenario {
  label: string;
  targetProfitOnCost: number;
  requiredRevenue: number | null;
  requiredSalePricePerSqm: number | null;
}

export interface SalesScenario {
  label: string;
  adjustment: number;
  salePricePerSqm: number;
  revenue: number;
  profit: number;
  profitOnCost: number | null;
  profitMargin: number | null;
}

export interface FeasibilityIndicator {
  state: FeasibilityState;
  label: string;
  reason: string;
  positiveThreshold: number;
  reviewThreshold: number;
}

export interface FinancialCalculation {
  whatIfAdjustment: number;
  landValue: number;
  developmentCostWithoutLand: number;
  landTransactionFees: number;
  totalInvestment: number;
  approvedAboveGroundArea: number;
  sellableArea: number;
  developmentCostPerSqm: number | null;
  investmentCostPerSqm: number | null;
  expectedSalePricePerSqm: number | null;
  revenue: number | null;
  profit: number | null;
  profitOnCost: number | null;
  profitMargin: number | null;
  breakEvenSalePricePerSqm: number | null;
  targetProfitRate: number;
  targetProfitRevenue: number | null;
  targetProfitSalePricePerSqm: number | null;
  targetProfitScenarios: TargetProfitScenario[];
  salesScenarios: SalesScenario[];
  feasibility: FeasibilityIndicator;
  financeValid: boolean;
  validationMessages: string[];
}

export interface RegulatoryProfile {
  groundFloorPercentage: number;
  repeatedFloorPercentage: number;
  annexPercentage: number;
  basementMaxPercentage: number;
  parkingPerUnit: number;
}

export const STORAGE_KEY = 'taklifa-binaa-project-draft-v1';
export const PROJECTS_STORAGE_KEY = 'taklifa-binaa-projects-v1';
export const COMPANY_SETTINGS_STORAGE_KEY = 'taklifa-binaa-company-settings-v1';
export const DEFAULT_REPORT_TITLE = 'دراسة أولية لتكلفة البناء وجدوى الاستثمار العقاري';

export const STEP_NAMES: Record<ProjectStepId, string> = {
  1: 'الأرض',
  2: 'المساحات والاشتراطات',
  3: 'تكلفة البناء',
  4: 'المصاريف الإضافية',
  5: 'البيع والجدوى',
  6: 'النتائج والتقرير',
};

export const REGIONS = [
  'منطقة الرياض',
  'منطقة مكة المكرمة',
  'منطقة المدينة المنورة',
  'المنطقة الشرقية',
  'منطقة القصيم',
  'منطقة عسير',
  'منطقة تبوك',
  'منطقة حائل',
  'منطقة الحدود الشمالية',
  'منطقة جازان',
  'منطقة نجران',
  'منطقة الباحة',
  'منطقة الجوف',
] as const;

export const CITIES_BY_REGION: Record<string, string[]> = {
  'منطقة الرياض': ['الرياض', 'الخرج', 'الدرعية', 'المجمعة', 'الدوادمي', 'شقراء'],
  'منطقة مكة المكرمة': ['مكة المكرمة', 'جدة', 'الطائف', 'رابغ', 'القنفذة', 'الليث'],
  'منطقة المدينة المنورة': ['المدينة المنورة', 'ينبع', 'العلا', 'المهد', 'بدر'],
  'المنطقة الشرقية': ['الدمام', 'الخبر', 'الظهران', 'الأحساء', 'الجبيل', 'القطيف', 'حفر الباطن'],
  'منطقة القصيم': ['بريدة', 'عنيزة', 'الرس', 'المذنب', 'البكيرية'],
  'منطقة عسير': ['أبها', 'خميس مشيط', 'بيشة', 'محايل عسير', 'النماص'],
  'منطقة تبوك': ['تبوك', 'ضباء', 'أملج', 'الوجه', 'حقل'],
  'منطقة حائل': ['حائل', 'بقعاء', 'الشنان', 'الغزالة'],
  'منطقة الحدود الشمالية': ['عرعر', 'رفحاء', 'طريف', 'العويقيلة'],
  'منطقة جازان': ['جازان', 'صبيا', 'أبو عريش', 'صامطة', 'بيش'],
  'منطقة نجران': ['نجران', 'شرورة', 'حبونا', 'يدمة'],
  'منطقة الباحة': ['الباحة', 'بلجرشي', 'المخواة', 'المندق'],
  'منطقة الجوف': ['سكاكا', 'القريات', 'دومة الجندل', 'طبرجل'],
};

export const OTHER_CITY = 'مدينة أخرى';

export const regulatoryProfiles: Record<string, RegulatoryProfile> = {
  nationalResidentialDefault: {
    groundFloorPercentage: 65,
    repeatedFloorPercentage: 75,
    annexPercentage: 70,
    basementMaxPercentage: 100,
    parkingPerUnit: 1.5,
  },
  villaResidentialDefault: {
    groundFloorPercentage: 75,
    repeatedFloorPercentage: 75,
    annexPercentage: 70,
    basementMaxPercentage: 100,
    parkingPerUnit: 1.5,
  },
  needsVerification: {
    groundFloorPercentage: 0,
    repeatedFloorPercentage: 0,
    annexPercentage: 0,
    basementMaxPercentage: 100,
    parkingPerUnit: 0,
  },
};

export const getCitiesForRegion = (region: string) => [
  ...(CITIES_BY_REGION[region] ?? []),
  OTHER_CITY,
];

export const getRegulatoryProfile = (type: ProjectType): RegulatoryProfile => {
  if (type === 'عمارة سكنية') return regulatoryProfiles.nationalResidentialDefault;
  if (type === 'فيلا سكنية') return regulatoryProfiles.villaResidentialDefault;
  return regulatoryProfiles.needsVerification;
};

const safeNumber = (value: number | null | undefined) =>
  Number.isFinite(value) && (value ?? 0) > 0 ? value ?? 0 : 0;

const createDefaultCompliance = (type: ProjectType) => {
  const profile = getRegulatoryProfile(type);
  return {
    zoning: '',
    groundFloorPercentage: profile.groundFloorPercentage,
    repeatedFloorPercentage: profile.repeatedFloorPercentage,
    repeatedFloors: 0,
    annexEnabled: false,
    annexPercentage: profile.annexPercentage,
    basementEnabled: false,
    basementArea: 0,
    basementMaxPercentage: profile.basementMaxPercentage,
    residentialUnits: 0,
    parkingPerUnit: profile.parkingPerUnit,
    approvedFeasibilityArea: 0,
    serviceAreas: [],
    overrides: {},
  };
};

export const createProjectId = () => {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `project-${crypto.randomUUID()}`;
  } catch {
    // Use the fallback when UUID generation is unavailable.
  }
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const createDefaultCompanySettings = (): CompanySettings => ({
  companyName: '',
  reportTitle: DEFAULT_REPORT_TITLE,
  logoDataUrl: '',
  phone: '',
  email: '',
  address: '',
  commercialRegistration: '',
  taxNumber: '',
  footerNote: '',
});

export const createEmptyProject = (): FeasibilityProject => {
  const now = new Date().toISOString();
  return {
    id: createProjectId(),
    name: 'مشروع جديد',
    region: 'منطقة الرياض',
    city: 'الرياض',
    customCity: '',
    district: '',
    landArea: 0,
    landShape: 'regular',
    frontage: 0,
    depth: 0,
    boundaryNorth: 0,
    boundaryEast: 0,
    boundarySouth: 0,
    boundaryWest: 0,
    streetsCount: 1,
    streetWidth: 0,
    landPricePerSqm: 0,
    actualPurchasePrice: 0,
    planNumber: '',
    plotNumber: '',
    notes: '',
    type: 'فيلا سكنية',
    compliance: createDefaultCompliance('فيلا سكنية'),
    build: {
      level: 'متوسط',
      costPerSqm: 0,
      pricingBasis: 'weighted',
      manualRate: 0,
      basement: false,
      basementArea: 0,
      basementRate: 1500,
    },
    extras: {
      consultant: 0,
      permits: 0,
      utilities: 0,
      contingency: 5,
      elevatorCount: 0,
      elevatorCost: 100000,
      externalWorks: 0,
      tanksServices: 0,
      designSupervision: 0,
      licensesFees: 0,
      insurance: 0,
      utilityConnections: 0,
      soilCondition: 'عادي',
      soilCost: 0,
      otherExpenses: [],
      contingencyRate: 5,
      optionalFees: [],
    },
    sales: {
      salePricePerSqm: 0,
      salesArea: 0,
      sellMethod: 'بيع الوحدات',
      targetProfitRate: 20,
      scenarioAdjustments: [-10, 0, 10],
      savedSalePrices: [],
    },
    createdAt: now,
    updatedAt: now,
  };
};

export const formatSAR = (value: number | null | undefined) =>
  new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value ?? 0 : 0);

export const formatNumber = (value: number | null | undefined) =>
  new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 }).format(
    Number.isFinite(value) ? value ?? 0 : 0,
  );

export const formatPercent = (value: number | null | undefined) =>
  `${formatNumber(value)}٪`;

export const FEASIBILITY_THRESHOLDS = {
  positiveProfitOnCost: 20,
  reviewProfitOnCost: 0,
} as const;

export const validateProjectBasics = (project: FeasibilityProject): ProjectValidationErrors => {
  const errors: ProjectValidationErrors = {};
  if (!project.name.trim() || project.name.trim() === 'مشروع جديد') errors.name = 'اكتب اسماً واضحاً للمشروع';
  if (!project.region.trim()) errors.region = 'اختر المنطقة';
  if (!project.city.trim()) errors.city = 'اختر المدينة';
  if (project.landArea <= 0) errors.landArea = 'أدخل مساحة الأرض';
  if (project.frontage < 0) errors.frontage = 'لا يمكن أن تكون القيمة سالبة';
  if (project.depth < 0) errors.depth = 'لا يمكن أن تكون القيمة سالبة';
  if (project.streetsCount < 0) errors.streetsCount = 'لا يمكن أن يكون العدد سالباً';
  if (project.streetWidth < 0) errors.streetWidth = 'لا يمكن أن يكون العرض سالباً';
  if (project.landPricePerSqm < 0) errors.landPricePerSqm = 'لا يمكن أن يكون السعر سالباً';
  if (project.actualPurchasePrice < 0) errors.actualPurchasePrice = 'لا يمكن أن تكون القيمة سالبة';
  return errors;
};

export const isProjectBasicsReady = (project: FeasibilityProject) =>
  Object.keys(validateProjectBasics(project)).length === 0;

export const calculateLandValue = (project: FeasibilityProject): LandCalculation => {
  const calculatedLandValue = safeNumber(project.landArea) * safeNumber(project.landPricePerSqm);
  const usesActualPurchasePrice = safeNumber(project.actualPurchasePrice) > 0;
  return {
    calculatedLandValue,
    approvedLandValue: usesActualPurchasePrice ? safeNumber(project.actualPurchasePrice) : calculatedLandValue,
    usesActualPurchasePrice,
  };
};

export const calculateSetbacks = (project: FeasibilityProject): SetbackCalculation => {
  const hasStreetInformation = safeNumber(project.streetWidth) > 0 && safeNumber(project.streetsCount) > 0;
  const totalFloors = 1 + safeNumber(project.compliance.repeatedFloors) + (project.compliance.annexEnabled ? 1 : 0);
  return {
    front: hasStreetInformation ? Math.max(project.streetWidth / 5, 3) : null,
    rearOrSideStreet: hasStreetInformation ? Math.max(project.streetWidth / 5, 2) : null,
    neighbor: totalFloors > 5 ? 3 : 2,
    needsVerification: !hasStreetInformation,
  };
};

export const calculateParkingRequirement = (project: FeasibilityProject) =>
  Math.ceil(safeNumber(project.compliance.residentialUnits) * safeNumber(project.compliance.parkingPerUnit));

export const calculateRegulatoryAreas = (project: FeasibilityProject): AreaCalculation => {
  const landArea = safeNumber(project.landArea);
  const groundFloorArea = landArea * safeNumber(project.compliance.groundFloorPercentage) / 100;
  const repeatedFloorArea = landArea * safeNumber(project.compliance.repeatedFloorPercentage) / 100;
  const totalRepeatedFloorsArea = repeatedFloorArea * safeNumber(project.compliance.repeatedFloors);
  const floorBelowAnnex = safeNumber(project.compliance.repeatedFloors) > 0 ? repeatedFloorArea : groundFloorArea;
  const annexArea = project.compliance.annexEnabled
    ? floorBelowAnnex * safeNumber(project.compliance.annexPercentage) / 100
    : 0;
  const aboveGroundBuiltArea = groundFloorArea + totalRepeatedFloorsArea + annexArea;
  const basementArea = project.compliance.basementEnabled ? safeNumber(project.compliance.basementArea) : 0;
  const totalBuiltUpArea = aboveGroundBuiltArea + basementArea;
  const serviceAreasTotal = (project.compliance.serviceAreas ?? []).reduce((sum, item) => sum + safeNumber(item.area), 0);
  const licensedAreaWithServices = totalBuiltUpArea + serviceAreasTotal;
  const calculatedFeasibilityArea = aboveGroundBuiltArea;
  const feasibilityIsManual = safeNumber(project.compliance.approvedFeasibilityArea) > 0;
  const approvedFeasibilityArea = feasibilityIsManual
    ? safeNumber(project.compliance.approvedFeasibilityArea)
    : calculatedFeasibilityArea;
  const saleableArea = safeNumber(project.sales.salesArea);
  return {
    groundFloorArea,
    repeatedFloorArea,
    totalRepeatedFloorsArea,
    annexArea,
    aboveGroundBuiltArea,
    basementArea,
    totalBuiltUpArea,
    serviceAreasTotal,
    licensedAreaWithServices,
    calculatedFeasibilityArea,
    approvedFeasibilityArea,
    feasibilityIsManual,
    requiredParking: calculateParkingRequirement(project),
    saleableArea,
    saleableEfficiency: saleableArea > 0 && aboveGroundBuiltArea > 0
      ? saleableArea / aboveGroundBuiltArea * 100
      : null,
  };
};

export const getConstructionRate = (
  level: FeasibilityProject['build']['level'],
  basis: PricingBasis,
) => CONSTRUCTION_RATES[level][basis];

export const validateConstructionCosts = (project: FeasibilityProject): string[] => {
  const messages: string[] = [];
  const costs = project.extras;
  const build = project.build;
  const values: Array<[string, number]> = [
    ['معدل البناء اليدوي', build.manualRate],
    ['معدل البدروم', build.basementRate],
    ['عدد المصاعد', costs.elevatorCount],
    ['تكلفة المصعد', costs.elevatorCost],
    ['الأعمال الخارجية', costs.externalWorks],
    ['الخزانات والخدمات', costs.tanksServices],
    ['التصميم والإشراف', costs.designSupervision],
    ['الرخص والتصاريح', costs.licensesFees],
    ['التأمين', costs.insurance],
    ['التوصيلات', costs.utilityConnections],
    ['تكلفة التربة والتأسيس', costs.soilCost],
    ['نسبة الاحتياطي', costs.contingencyRate],
  ];
  values.forEach(([label, value]) => {
    if (!Number.isFinite(value) || value < 0) messages.push(`${label} يجب أن يكون رقماً غير سالب`);
  });
  if (!Number.isFinite(costs.contingencyRate) || costs.contingencyRate > 100) {
    messages.push('نسبة الاحتياطي يجب أن تكون بين 0٪ و100٪');
  }
  costs.otherExpenses.forEach((expense, index) => {
    if (!Number.isFinite(expense.amount) || expense.amount < 0) {
      messages.push(`المصروف الإضافي رقم ${index + 1} غير صالح`);
    }
  });
  costs.optionalFees.forEach((fee, index) => {
    if (!fee.name.trim()) messages.push(`الرسم الاختياري رقم ${index + 1} يحتاج اسماً`);
    if (!Number.isFinite(fee.percentage) || fee.percentage < 0 || fee.percentage > 100) {
      messages.push(`نسبة الرسم الاختياري رقم ${index + 1} يجب أن تكون بين 0٪ و100٪`);
    }
    if (!Number.isFinite(fee.fixedAmount) || fee.fixedAmount < 0) {
      messages.push(`قيمة الرسم الاختياري رقم ${index + 1} غير صالحة`);
    }
  });
  return messages;
};

const clampPercentage = (value: number, min = 0, max = 100) =>
  Math.min(Math.max(Number.isFinite(value) ? value : 0, min), max);

export const calculateConstructionCosts = (
  project: FeasibilityProject,
  constructionAdjustment = 0,
): CostCalculation => {
  const areas = calculateRegulatoryAreas(project);
  const land = calculateLandValue(project);
  const build = project.build;
  const extras = project.extras;
  const validationMessages = validateConstructionCosts(project);
  const recommendedConstructionRate = getConstructionRate(build.level, build.pricingBasis);
  const selectedConstructionRate = safeNumber(build.manualRate) > 0
    ? safeNumber(build.manualRate)
    : recommendedConstructionRate;
  const adjustmentFactor = 1 + clampPercentage(constructionAdjustment, 0, 25) / 100;
  const aboveGroundConstructionCost = areas.approvedFeasibilityArea * selectedConstructionRate * adjustmentFactor;
  const basementRate = safeNumber(build.basementRate);
  const basementCost = areas.basementArea > 0 ? areas.basementArea * basementRate * adjustmentFactor : 0;
  const elevatorCost = safeNumber(extras.elevatorCount) * safeNumber(extras.elevatorCost);
  const externalWorks = safeNumber(extras.externalWorks);
  const tanksServices = safeNumber(extras.tanksServices);
  const designSupervision = safeNumber(extras.designSupervision);
  const otherExpenses: CostLineItem[] = extras.otherExpenses.map((expense, index) => ({
    id: expense.id || `other-${index}`,
    label: expense.description.trim() || `مصروف إضافي ${index + 1}`,
    amount: safeNumber(expense.amount),
  }));
  const eligibleCostBeforeContingency =
    aboveGroundConstructionCost +
    basementCost +
    elevatorCost +
    externalWorks +
    tanksServices +
    designSupervision +
    safeNumber(extras.licensesFees) +
    safeNumber(extras.insurance) +
    safeNumber(extras.utilityConnections) +
    safeNumber(extras.soilCost) +
    otherExpenses.reduce((sum, item) => sum + item.amount, 0);
  const contingencyRate = Math.min(Math.max(safeNumber(extras.contingencyRate), 0), 100);
  const contingencyAmount = eligibleCostBeforeContingency * contingencyRate / 100;
  const eligibleCostAfterContingency = eligibleCostBeforeContingency + contingencyAmount;
  const optionalFees: OptionalFeeCalculation[] = extras.optionalFees.map((fee, index) => {
    const baseAmount =
      fee.basis === 'before-contingency' ? eligibleCostBeforeContingency :
      fee.basis === 'after-contingency' ? eligibleCostAfterContingency :
      fee.basis === 'land-value' ? land.approvedLandValue : 0;
    const calculatedAmount = !fee.enabled ? 0 :
      fee.kind === 'percentage' ? baseAmount * safeNumber(fee.percentage) / 100 : safeNumber(fee.fixedAmount);
    return {
      ...fee,
      id: fee.id || `fee-${index}`,
      baseAmount,
      calculatedAmount,
    };
  });
  const optionalFeesTotal = optionalFees.reduce((sum, fee) => sum + fee.calculatedAmount, 0);
  const developmentOptionalFeesTotal = optionalFees
    .filter((fee) => fee.scope !== 'land-transaction')
    .reduce((sum, fee) => sum + fee.calculatedAmount, 0);
  const landTransactionFeesTotal = optionalFees
    .filter((fee) => fee.scope === 'land-transaction')
    .reduce((sum, fee) => sum + fee.calculatedAmount, 0);
  return {
    selectedConstructionRate,
    recommendedConstructionRate,
    aboveGroundConstructionCost,
    basementRate,
    basementCost,
    elevatorCost,
    externalWorks,
    tanksServices,
    designSupervision,
    licensesFees: safeNumber(extras.licensesFees),
    insurance: safeNumber(extras.insurance),
    utilityConnections: safeNumber(extras.utilityConnections),
    soilCost: safeNumber(extras.soilCost),
    otherExpenses,
    eligibleCostBeforeContingency,
    contingencyRate,
    contingencyAmount,
    eligibleCostAfterContingency,
    optionalFees,
    optionalFeesTotal,
    developmentOptionalFeesTotal,
    landTransactionFeesTotal,
    developmentCostSubtotal: eligibleCostAfterContingency + developmentOptionalFeesTotal,
    costsValid: validationMessages.length === 0,
    validationMessages,
  };
};

const positiveOrNull = (value: number) =>
  Number.isFinite(value) && value > 0 ? value : null;

const ratioOrNull = (numerator: number | null, denominator: number) =>
  numerator !== null && Number.isFinite(denominator) && denominator > 0
    ? numerator / denominator
    : null;

const buildTargetProfitScenario = (
  label: string,
  targetProfitOnCost: number,
  totalInvestment: number,
  sellableArea: number,
): TargetProfitScenario => {
  const requiredRevenue = totalInvestment > 0 ? totalInvestment * (1 + targetProfitOnCost / 100) : null;
  return {
    label,
    targetProfitOnCost,
    requiredRevenue,
    requiredSalePricePerSqm: requiredRevenue !== null && sellableArea > 0
      ? requiredRevenue / sellableArea
      : null,
  };
};

export const calculateFinancialAnalysis = (
  project: FeasibilityProject,
  whatIfAdjustment = 0,
): FinancialCalculation => {
  const areas = calculateRegulatoryAreas(project);
  const land = calculateLandValue(project);
  const costs = calculateConstructionCosts(project, whatIfAdjustment);
  const sellableArea = safeNumber(project.sales.salesArea);
  const expectedSalePricePerSqm = positiveOrNull(project.sales.salePricePerSqm);
  const targetProfitRate = Number.isFinite(project.sales.targetProfitRate) && project.sales.targetProfitRate >= 0
    ? Math.min(project.sales.targetProfitRate, 1000)
    : 20;
  const totalInvestment = land.approvedLandValue + costs.developmentCostSubtotal + costs.landTransactionFeesTotal;
  const developmentCostWithoutLand = costs.developmentCostSubtotal;
  const developmentCostPerSqm = ratioOrNull(developmentCostWithoutLand, areas.approvedFeasibilityArea);
  const investmentCostPerSqm = ratioOrNull(totalInvestment, areas.approvedFeasibilityArea);
  const revenue = expectedSalePricePerSqm !== null && sellableArea > 0
    ? sellableArea * expectedSalePricePerSqm
    : null;
  const profit = revenue !== null ? revenue - totalInvestment : null;
  const profitOnCost = ratioOrNull(profit, totalInvestment);
  const profitMargin = ratioOrNull(profit, revenue ?? 0);
  const breakEvenSalePricePerSqm = totalInvestment > 0 && sellableArea > 0
    ? totalInvestment / sellableArea
    : null;
  const targetProfitScenarios = [
    buildTargetProfitScenario('نقطة التعادل / ٠٪', 0, totalInvestment, sellableArea),
    buildTargetProfitScenario('هدف ١٠٪', 10, totalInvestment, sellableArea),
    buildTargetProfitScenario('هدف ٢٠٪', 20, totalInvestment, sellableArea),
    buildTargetProfitScenario('هدف ٣٠٪', 30, totalInvestment, sellableArea),
    buildTargetProfitScenario('هدف مخصص', targetProfitRate, totalInvestment, sellableArea),
  ];
  const targetScenario = targetProfitScenarios[4];
  const rawAdjustments = Array.isArray(project.sales.scenarioAdjustments)
    ? project.sales.scenarioAdjustments
    : [-10, 0, 10];
  const scenarioLabels = ['محافظ', 'متوقع', 'متفائل'];
  const salesScenarios: SalesScenario[] = expectedSalePricePerSqm !== null && sellableArea > 0
    ? scenarioLabels.map((label, index) => {
      const defaults = [-10, 0, 10];
      const adjustment = Number.isFinite(rawAdjustments[index]) ? rawAdjustments[index] : defaults[index];
      const salePricePerSqm = Math.max(0, expectedSalePricePerSqm * (1 + adjustment / 100));
      const scenarioRevenue = salePricePerSqm * sellableArea;
      const scenarioProfit = scenarioRevenue - totalInvestment;
      return {
        label,
        adjustment,
        salePricePerSqm,
        revenue: scenarioRevenue,
        profit: scenarioProfit,
        profitOnCost: ratioOrNull(scenarioProfit, totalInvestment),
        profitMargin: ratioOrNull(scenarioProfit, scenarioRevenue),
      };
    })
    : [];
  const validationMessages: string[] = [];
  if (Number.isFinite(project.sales.salePricePerSqm) && project.sales.salePricePerSqm < 0) {
    validationMessages.push('سعر البيع المتوقع لا يمكن أن يكون سالباً');
  }
  if (Number.isFinite(project.sales.salesArea) && project.sales.salesArea < 0) {
    validationMessages.push('المساحة القابلة للبيع لا يمكن أن تكون سالبة');
  }
  if (!Number.isFinite(project.sales.targetProfitRate) || project.sales.targetProfitRate < 0) {
    validationMessages.push('هدف الربح يجب أن يكون رقماً غير سالب');
  }
  if (!Number.isFinite(whatIfAdjustment) || whatIfAdjustment < 0 || whatIfAdjustment > 25) {
    validationMessages.push('تعديل What-If يجب أن يكون بين 0٪ و25٪');
  }
  rawAdjustments.slice(0, 3).forEach((adjustment) => {
    if (!Number.isFinite(adjustment) || adjustment < -100 || adjustment > 100) {
      validationMessages.push('تعديلات سيناريوهات البيع يجب أن تكون بين -100٪ و100٪');
    }
  });
  if (sellableArea <= 0) {
    validationMessages.push('أدخل مساحة قابلة للبيع لحساب نقطة التعادل وأسعار الأهداف');
  }
  const indicatorBase = {
    positiveThreshold: FEASIBILITY_THRESHOLDS.positiveProfitOnCost,
    reviewThreshold: FEASIBILITY_THRESHOLDS.reviewProfitOnCost,
  };
  let feasibility: FeasibilityIndicator;
  if (profitOnCost === null) {
    feasibility = {
      ...indicatorBase,
      state: 'review',
      label: 'المشروع يحتاج مراجعة',
      reason: 'أدخل سعر البيع المتوقع ومساحة قابلة للبيع لقراءة مؤشرات الربحية.',
    };
  } else if (profitOnCost >= FEASIBILITY_THRESHOLDS.positiveProfitOnCost / 100) {
    feasibility = {
      ...indicatorBase,
      state: 'positive',
      label: 'مؤشرات الدراسة الأولية إيجابية',
      reason: `الربح على التكلفة يبلغ ${formatPercent(profitOnCost * 100)} وهو عند أو أعلى من حد ${FEASIBILITY_THRESHOLDS.positiveProfitOnCost}٪.`,
    };
  } else if (profitOnCost >= FEASIBILITY_THRESHOLDS.reviewProfitOnCost / 100) {
    feasibility = {
      ...indicatorBase,
      state: 'review',
      label: 'المشروع يحتاج مراجعة',
      reason: `الربح على التكلفة أقل من حد الإيجابية ${FEASIBILITY_THRESHOLDS.positiveProfitOnCost}٪.`,
    };
  } else {
    feasibility = {
      ...indicatorBase,
      state: 'negative',
      label: 'المؤشرات الحالية غير مجدية',
      reason: 'الربح على التكلفة الحالي سلبي وفق الافتراضات المدخلة.',
    };
  }
  return {
    whatIfAdjustment: clampPercentage(whatIfAdjustment, 0, 25),
    landValue: land.approvedLandValue,
    developmentCostWithoutLand,
    landTransactionFees: costs.landTransactionFeesTotal,
    totalInvestment,
    approvedAboveGroundArea: areas.approvedFeasibilityArea,
    sellableArea,
    developmentCostPerSqm,
    investmentCostPerSqm,
    expectedSalePricePerSqm,
    revenue,
    profit,
    profitOnCost,
    profitMargin,
    breakEvenSalePricePerSqm,
    targetProfitRate,
    targetProfitRevenue: targetScenario.requiredRevenue,
    targetProfitSalePricePerSqm: targetScenario.requiredSalePricePerSqm,
    targetProfitScenarios,
    salesScenarios,
    feasibility,
    financeValid: validationMessages.length === 0,
    validationMessages,
  };
};

const migrateProject = (raw: Partial<FeasibilityProject>): FeasibilityProject => {
  const fresh = createEmptyProject();
  const rawCompliance = raw.compliance as (Partial<FeasibilityProject['compliance']> & {
    buildingRatio?: number;
    floors?: number;
  }) | undefined;
  const rawBuild = raw.build as Partial<FeasibilityProject['build']> | undefined;
  const rawExtras = raw.extras as Partial<FeasibilityProject['extras']> | undefined;
  const rawSales = raw.sales as Partial<FeasibilityProject['sales']> | undefined;
  const migrated: FeasibilityProject = {
    ...fresh,
    ...raw,
    id: raw.id || fresh.id,
    region: raw.region ?? fresh.region,
    customCity: raw.customCity ?? '',
    landShape: raw.landShape ?? fresh.landShape,
    boundaryNorth: raw.boundaryNorth ?? 0,
    boundaryEast: raw.boundaryEast ?? 0,
    boundarySouth: raw.boundarySouth ?? 0,
    boundaryWest: raw.boundaryWest ?? 0,
    streetsCount: raw.streetsCount ?? fresh.streetsCount,
    streetWidth: raw.streetWidth ?? raw.frontage ?? 0,
    landPricePerSqm: raw.landPricePerSqm ?? 0,
    actualPurchasePrice: raw.actualPurchasePrice ?? 0,
    planNumber: raw.planNumber ?? '',
    plotNumber: raw.plotNumber ?? '',
    notes: raw.notes ?? '',
    compliance: {
      ...fresh.compliance,
      ...rawCompliance,
      groundFloorPercentage: rawCompliance?.groundFloorPercentage ?? rawCompliance?.buildingRatio ?? fresh.compliance.groundFloorPercentage,
      repeatedFloorPercentage: rawCompliance?.repeatedFloorPercentage ?? fresh.compliance.repeatedFloorPercentage,
      repeatedFloors: rawCompliance?.repeatedFloors ?? rawCompliance?.floors ?? fresh.compliance.repeatedFloors,
      basementArea: rawCompliance?.basementArea ?? rawBuild?.basementArea ?? 0,
      basementEnabled: rawCompliance?.basementEnabled ?? rawBuild?.basement ?? false,
      residentialUnits: rawCompliance?.residentialUnits ?? 0,
      parkingPerUnit: rawCompliance?.parkingPerUnit ?? fresh.compliance.parkingPerUnit,
      serviceAreas: Array.isArray(rawCompliance?.serviceAreas) ? rawCompliance.serviceAreas.map((item, index) => ({
        id: item.id || `service-${index}`,
        label: item.label ?? '',
        area: Number.isFinite(item.area) ? item.area : 0,
      })) : [],
      overrides: rawCompliance?.overrides ?? {},
    },
    build: {
      ...fresh.build,
      ...rawBuild,
      manualRate: rawBuild?.manualRate ?? rawBuild?.costPerSqm ?? fresh.build.manualRate,
      basementRate: rawBuild?.basementRate ?? fresh.build.basementRate,
    },
    extras: {
      ...fresh.extras,
      ...rawExtras,
      designSupervision: rawExtras?.designSupervision ?? rawExtras?.consultant ?? fresh.extras.designSupervision,
      licensesFees: rawExtras?.licensesFees ?? rawExtras?.permits ?? fresh.extras.licensesFees,
      utilityConnections: rawExtras?.utilityConnections ?? rawExtras?.utilities ?? fresh.extras.utilityConnections,
      contingencyRate: rawExtras?.contingencyRate ?? rawExtras?.contingency ?? fresh.extras.contingencyRate,
      otherExpenses: rawExtras?.otherExpenses ?? fresh.extras.otherExpenses,
      optionalFees: rawExtras?.optionalFees ?? fresh.extras.optionalFees,
    },
    sales: {
      ...fresh.sales,
      ...rawSales,
      targetProfitRate: rawSales?.targetProfitRate ?? fresh.sales.targetProfitRate,
      scenarioAdjustments: rawSales?.scenarioAdjustments ?? fresh.sales.scenarioAdjustments,
      savedSalePrices: rawSales?.savedSalePrices ?? fresh.sales.savedSalePrices,
    },
  };
  migrated.extras.optionalFees = migrated.extras.optionalFees.map((fee) => ({
    ...fee,
    scope: fee.scope ?? 'development',
  }));
  return migrated;
};

export const loadSavedProject = (): FeasibilityProject | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrateProject(JSON.parse(raw) as Partial<FeasibilityProject>);
  } catch {
    return null;
  }
};

export const saveProjectLocally = (project: FeasibilityProject) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...project, updatedAt: new Date().toISOString() }));
  } catch {
    // Local storage can be unavailable in private browsing; the in-memory model still works.
  }
};

export const loadSavedProjects = (): FeasibilityProject[] => {
  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { projects?: Partial<FeasibilityProject>[] } | Partial<FeasibilityProject>[];
      const entries = Array.isArray(parsed) ? parsed : parsed.projects ?? [];
      return entries.map(migrateProject);
    }
  } catch {
    // Fall through to the legacy single-draft migration.
  }
  const legacy = loadSavedProject();
  return legacy ? [legacy] : [];
};

export const saveProjectsLocally = (projects: FeasibilityProject[]) => {
  try {
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify({
      version: 1,
      projects,
    }));
  } catch {
    // Keep the in-memory collection when storage is unavailable.
  }
};

export const upsertProjectLocally = (project: FeasibilityProject) => {
  const projects = loadSavedProjects();
  const next = projects.some((item) => item.id === project.id)
    ? projects.map((item) => item.id === project.id ? project : item)
    : [project, ...projects];
  saveProjectsLocally(next);
  saveProjectLocally(project);
  return next;
};

export const deleteProjectLocally = (projectId: string) => {
  const next = loadSavedProjects().filter((project) => project.id !== projectId);
  saveProjectsLocally(next);
  return next;
};

export const loadCompanySettings = (): CompanySettings => {
  try {
    const raw = window.localStorage.getItem(COMPANY_SETTINGS_STORAGE_KEY);
    if (!raw) return createDefaultCompanySettings();
    return { ...createDefaultCompanySettings(), ...(JSON.parse(raw) as Partial<CompanySettings>) };
  } catch {
    return createDefaultCompanySettings();
  }
};

export const saveCompanySettings = (settings: CompanySettings) => {
  try {
    window.localStorage.setItem(COMPANY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Keep the in-memory settings when storage is unavailable.
  }
};

export const clearSavedProject = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors; clearing the in-memory draft remains possible.
  }
};

export const calculateProjectSnapshot = (project: FeasibilityProject): CalculationSnapshot => ({
  status: 'phase-4-ready',
  source: 'client-project-model',
  ready: isProjectBasicsReady(project),
  land: calculateLandValue(project),
  setbacks: calculateSetbacks(project),
  areas: calculateRegulatoryAreas(project),
  costs: calculateConstructionCosts(project),
  finance: calculateFinancialAnalysis(project),
  notes: [
    'تكاليف البناء والمصاريف الإضافية المعروضة قيم تقديرية أولية قابلة للتعديل.',
    'يحتاج التحقق من مخطط الأرض والارتدادات الفعلية والاشتراطات الخاصة بالقطعة.',
    'أسعار البيع والسيناريوهات المالية افتراضات المستخدم وليست أسعار سوق مباشرة أو توصية استثمارية.',
  ],
});