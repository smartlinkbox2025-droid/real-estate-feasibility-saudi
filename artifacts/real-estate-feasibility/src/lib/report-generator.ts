import {
  calculateConstructionCosts,
  calculateFinancialAnalysis,
  formatNumber,
  formatPercent,
  formatSAR,
  type CompanySettings,
  type CostCalculation,
  type FeasibilityProject,
  type FinancialCalculation,
  type CalculationSnapshot,
} from '@/lib/project-model';

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const money = (value: number | null | undefined) => value === null || value === undefined ? 'غير متاح' : formatSAR(value);
const number = (value: number | null | undefined, suffix = '') => value === null || value === undefined ? 'غير متاح' : `${formatNumber(value)}${suffix}`;
const percent = (value: number | null | undefined) => value === null || value === undefined ? 'غير متاح' : formatPercent(value * 100);
const city = (project: FeasibilityProject) => project.city === 'مدينة أخرى' ? project.customCity || project.city : project.city;

const row = (label: string, value: unknown) => `
  <div class="data-row">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
  </div>`;

const table = (headers: string[], rows: string[][]) => `
  <div class="table-wrap">
    <table>
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((cells) => `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>`;

const financeTarget = (finance: FinancialCalculation, rate: number) =>
  finance.targetProfitScenarios.find((scenario) => scenario.targetProfitOnCost === rate);

const costsSection = (project: FeasibilityProject, costs: CostCalculation) => {
  const optionalFees = costs.optionalFees.filter((fee) => fee.enabled && fee.calculatedAmount > 0);
  const otherExpenses = costs.otherExpenses.filter((expense) => expense.amount > 0);
  return `
    <section class="report-section">
      <h2>تكلفة البناء</h2>
      <p class="section-caption">معدلات البناء افتراضات تقديرية قابلة للتعديل وليست أسعاراً رسمية أو أسعار سوق ملزمة.</p>
      ${row('مستوى الجودة', project.build.level)}
      ${row('أساس التسعير', project.build.pricingBasis === 'low' ? 'منخفض' : project.build.pricingBasis === 'high' ? 'مرتفع' : 'مرجح')}
      ${row('معدل البناء المعتمد', `${money(costs.selectedConstructionRate)} / م²`)}
      ${row('المساحة المعتمدة فوق الأرض', number(project.compliance.approvedFeasibilityArea, ' م²'))}
      ${row('تكلفة البناء فوق الأرض', money(costs.aboveGroundConstructionCost))}
      ${row('مساحة البدروم', number(costs.basementCost > 0 ? project.compliance.basementArea : 0, ' م²'))}
      ${row('معدل البدروم', `${money(costs.basementRate)} / م²`)}
      ${row('تكلفة البدروم', money(costs.basementCost))}
    </section>
    <section class="report-section">
      <h2>المصاريف الإضافية والاحتياطي</h2>
      ${row('المصاعد', money(costs.elevatorCost))}
      ${row('الأعمال الخارجية', money(costs.externalWorks))}
      ${row('الخزانات والخدمات', money(costs.tanksServices))}
      ${row('التصميم والإشراف', money(costs.designSupervision))}
      ${row('الرخص والرسوم', money(costs.licensesFees))}
      ${row('التأمين', money(costs.insurance))}
      ${row('توصيلات الخدمات', money(costs.utilityConnections))}
      ${row('حالة التربة / الأساسات', project.extras.soilCondition)}
      ${row('تكلفة التربة / الأساسات المدخلة', money(costs.soilCost))}
      ${otherExpenses.length ? table(['المصروف الإضافي', 'القيمة'], otherExpenses.map((expense) => [expense.label, money(expense.amount)])) : ''}
      ${row('الإجمالي المؤهل قبل الاحتياطي', money(costs.eligibleCostBeforeContingency))}
      ${row('نسبة الاحتياطي', number(costs.contingencyRate, '٪'))}
      ${row('قيمة الاحتياطي', money(costs.contingencyAmount))}
      ${optionalFees.length ? table(['الرسم الاختياري', 'النطاق', 'القيمة'], optionalFees.map((fee) => [fee.name, fee.scope === 'land-transaction' ? 'الأرض / المعاملة' : 'التطوير', money(fee.calculatedAmount)])) : ''}
      ${row('تكلفة التطوير دون الأرض', money(costs.developmentCostSubtotal))}
    </section>`;
};

const financialSection = (project: FeasibilityProject, finance: FinancialCalculation) => {
  const target10 = financeTarget(finance, 10);
  const target20 = financeTarget(finance, 20);
  const target30 = financeTarget(finance, 30);
  const targetCustom = finance.targetProfitScenarios.find((scenario) => scenario.label === 'هدف مخصص');
  const sensitivity = finance.salesScenarios.length ? table(
    ['السيناريو', 'التعديل', 'سعر المتر', 'الإيراد', 'الربح', 'على التكلفة', 'الهامش'],
    finance.salesScenarios.map((scenario) => [
      scenario.label,
      number(scenario.adjustment, '٪'),
      `${money(scenario.salePricePerSqm)} / م²`,
      money(scenario.revenue),
      money(scenario.profit),
      percent(scenario.profitOnCost),
      percent(scenario.profitMargin),
    ]),
  ) : '';
  return `
    <section class="report-section">
      <h2>الاستثمار والجدوى</h2>
      ${row('قيمة الأرض المعتمدة', money(finance.landValue))}
      ${row('تكلفة التطوير دون الأرض', money(finance.developmentCostWithoutLand))}
      ${row('إجمالي الاستثمار', money(finance.totalInvestment))}
      ${row('تكلفة التطوير / م² معتمد', `${money(finance.developmentCostPerSqm)} / م²`)}
      ${row('تكلفة الاستثمار / م² معتمد', `${money(finance.investmentCostPerSqm)} / م²`)}
      ${row('المساحة القابلة للبيع', number(finance.sellableArea, ' م²'))}
      ${row('كفاءة المساحة القابلة للبيع', number(project.sales.salesArea > 0 ? calculateFinancialAnalysis(project).sellableArea > 0 ? (project.sales.salesArea / finance.approvedAboveGroundArea) * 100 : null : null, '٪'))}
      ${finance.expectedSalePricePerSqm !== null ? `
        ${row('متوسط سعر البيع المتوقع', `${money(finance.expectedSalePricePerSqm)} / م²`)}
        ${row('الإيرادات', money(finance.revenue))}
        ${row('الربح', money(finance.profit))}
        ${row('الربح على التكلفة', percent(finance.profitOnCost))}
        ${row('هامش الربح', percent(finance.profitMargin))}
      ` : `<div class="callout warning">لم يتم حساب الإيرادات والربح لأن سعر البيع المتوقع لم يُدخل.</div>`}
      ${row('سعر التعادل', `${money(finance.breakEvenSalePricePerSqm)} / م²`)}
      ${row('سعر هدف 10٪', `${money(target10?.requiredSalePricePerSqm)} / م²`)}
      ${row('سعر هدف 20٪', `${money(target20?.requiredSalePricePerSqm)} / م²`)}
      ${row('سعر هدف 30٪', `${money(target30?.requiredSalePricePerSqm)} / م²`)}
      ${row(`سعر الهدف المخصص ${formatNumber(finance.targetProfitRate)}٪`, `${money(targetCustom?.requiredSalePricePerSqm)} / م²`)}
      ${sensitivity ? `<h3>حساسية سعر البيع</h3><p class="section-caption">هذه سيناريوهات رياضية حول السعر المدخل وليست توقعات سوقية.</p>${sensitivity}` : ''}
    </section>`;
};

const whatIfSection = (project: FeasibilityProject, snapshot: CalculationSnapshot, adjustment: number) => {
  if (adjustment <= 0) return '';
  const baseCosts = snapshot.costs;
  const baseFinance = snapshot.finance;
  const whatIfCosts = calculateConstructionCosts(project, adjustment);
  const whatIfFinance = calculateFinancialAnalysis(project, adjustment);
  return `
    <section class="report-section what-if">
      <h2>اختبار الحساسية What‑If</h2>
      <div class="callout">هذا اختبار حساسية مشتق بنسبة ${number(adjustment, '٪')}، ولا يستبدل الحالة الأساسية ولا يغير المدخلات المحفوظة.</div>
      <h3>BASE CASE — الحالة الأساسية</h3>
      ${row('البناء فوق الأرض', money(baseCosts.aboveGroundConstructionCost))}
      ${row('البدروم', money(baseCosts.basementCost))}
      ${row('تكلفة التطوير', money(baseFinance.developmentCostWithoutLand))}
      ${row('إجمالي الاستثمار', money(baseFinance.totalInvestment))}
      ${row('الربح', money(baseFinance.profit))}
      ${row('الربح على التكلفة', percent(baseFinance.profitOnCost))}
      ${row('سعر التعادل', `${money(baseFinance.breakEvenSalePricePerSqm)} / م²`)}
      <h3>WHAT‑IF CASE — حالة الحساسية</h3>
      ${row('البناء فوق الأرض', money(whatIfCosts.aboveGroundConstructionCost))}
      ${row('البدروم', money(whatIfCosts.basementCost))}
      ${row('تكلفة التطوير', money(whatIfFinance.developmentCostWithoutLand))}
      ${row('إجمالي الاستثمار', money(whatIfFinance.totalInvestment))}
      ${row('الربح', money(whatIfFinance.profit))}
      ${row('الربح على التكلفة', percent(whatIfFinance.profitOnCost))}
      ${row('سعر التعادل', `${money(whatIfFinance.breakEvenSalePricePerSqm)} / م²`)}
      ${row('سعر هدف الربح المخصص', `${money(whatIfFinance.targetProfitSalePricePerSqm)} / م²`)}
    </section>`;
};

export const buildReportHtml = (
  project: FeasibilityProject,
  snapshot: CalculationSnapshot,
  settings: CompanySettings,
  whatIfAdjustment = 0,
) => {
  const { land, areas, costs, finance, setbacks } = snapshot;
  const generatedAt = new Intl.DateTimeFormat('ar-SA', { dateStyle: 'long' }).format(new Date());
  const logo = settings.logoDataUrl ? `<img class="logo" src="${escapeHtml(settings.logoDataUrl)}" alt="شعار المنشأة" />` : '';
  const reportTitle = settings.reportTitle || 'دراسة أولية لتكلفة البناء وجدوى الاستثمار العقاري';
  const feasibilityText = finance.feasibility.label;
  const efficiency = areas.saleableEfficiency === null ? 'غير متاحة' : `${formatNumber(areas.saleableEfficiency)}٪`;
  const reportNote = settings.footerNote ? `<p>${escapeHtml(settings.footerNote)}</p>` : '';
  const contact = [settings.phone, settings.email, settings.address].filter(Boolean).join(' · ');
  const meta = [settings.companyName, contact, settings.commercialRegistration ? `سجل تجاري: ${settings.commercialRegistration}` : '', settings.taxNumber ? `رقم ضريبي: ${settings.taxNumber}` : ''].filter(Boolean).join(' · ');
  const projectInfo = table(['البيان', 'القيمة'], [
    ['اسم المشروع', project.name],
    ['المنطقة', project.region],
    ['المدينة', city(project)],
    ['الحي', project.district || 'غير محدد'],
    ['نوع المشروع', project.type],
    ['رقم المخطط', project.planNumber || 'غير محدد'],
    ['رقم القطعة', project.plotNumber || 'غير محدد'],
  ]);
  const landInfo = table(['البيان', 'القيمة'], [
    ['مساحة الأرض', number(project.landArea, ' م²')],
    ['عرض الأرض', number(project.frontage, ' م')],
    ['عمق الأرض', number(project.depth, ' م')],
    ['عدد الشوارع', number(project.streetsCount)],
    ['عرض الشارع', number(project.streetWidth, ' م')],
    ['سعر الأرض / م²', `${money(project.landPricePerSqm)} / م²`],
    ['القيمة المحسوبة للأرض', money(land.calculatedLandValue)],
    ['سعر الشراء الفعلي', project.actualPurchasePrice > 0 ? money(project.actualPurchasePrice) : 'غير مدخل'],
    ['القيمة المعتمدة', `${money(land.approvedLandValue)} — ${land.usesActualPurchasePrice ? 'سعر الشراء الفعلي' : 'القيمة المحسوبة'}`],
  ]);
  const regulationInfo = table(['الافتراض التنظيمي الأولي', 'القيمة'], [
    ['نسبة الدور الأرضي', number(project.compliance.groundFloorPercentage, '٪')],
    ['نسبة الدور المتكرر', number(project.compliance.repeatedFloorPercentage, '٪')],
    ['عدد الأدوار المتكررة', number(project.compliance.repeatedFloors)],
    ['الملحق', project.compliance.annexEnabled ? `مفعل — ${number(project.compliance.annexPercentage, '٪')}` : 'غير مفعل'],
    ['البدروم', project.compliance.basementEnabled ? `مفعل — ${number(project.compliance.basementArea, ' م²')}` : 'غير مفعل'],
    ['عدد الوحدات السكنية', number(project.compliance.residentialUnits)],
    ['المواقف المطلوبة', number(areas.requiredParking)],
    ['الارتداد الأمامي', setbacks.front === null ? 'يحتاج تحققاً' : number(setbacks.front, ' م')],
    ['ارتداد شارع خلفي / جانبي', setbacks.rearOrSideStreet === null ? 'يحتاج تحققاً' : number(setbacks.rearOrSideStreet, ' م')],
    ['ارتداد الجار', number(setbacks.neighbor, ' م')],
  ]);
  const areasInfo = table(['المساحة', 'القيمة'], [
    ['الدور الأرضي', number(areas.groundFloorArea, ' م²')],
    ['الدور المتكرر', number(areas.repeatedFloorArea, ' م²')],
    ['إجمالي الأدوار المتكررة', number(areas.totalRepeatedFloorsArea, ' م²')],
    ['الملحق', number(areas.annexArea, ' م²')],
    ['المساحة المبنية فوق الأرض', number(areas.aboveGroundBuiltArea, ' م²')],
    ['البدروم', number(areas.basementArea, ' م²')],
    ['إجمالي المسطحات المبنية', number(areas.totalBuiltUpArea, ' م²')],
    ['المساحة المعتمدة للجدوى', number(areas.approvedFeasibilityArea, ' م²')],
    ['المساحة القابلة للبيع', number(areas.saleableArea, ' م²')],
    ['كفاءة البيع', efficiency],
  ]);
  const disclaimer = `
    <footer class="report-footer">
      <strong>تنبيهات مهمة</strong>
      <p>هذه دراسة جدوى أولية تقديرية مبنية على الافتراضات المدخلة. يجب التحقق رسمياً من الاشتراطات التنظيمية والارتدادات والرسوم ومعدلات البناء. أسعار البيع مدخلة أو محفوظة من المستخدم وليست بيانات سوق حية. الضرائب والرسوم تعتمد على الصفقة والمشروع الفعلي. النتائج ليست توصية استثمارية.</p>
      ${reportNote}
    </footer>`;

  return `<!doctype html>
  <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(`${project.name || 'دراسة عقارية'} - ${generatedAt}`)}</title>
      <style>
        @page { size: A4; margin: 14mm 13mm 16mm; }
        :root { color-scheme: light; font-family: "Noto Sans Arabic", "Segoe UI", Tahoma, sans-serif; color: #173a45; background: #fff; }
        * { box-sizing: border-box; }
        body { margin: 0; background: #fff; direction: rtl; font-size: 10.5pt; line-height: 1.65; }
        .report { max-width: 190mm; margin: 0 auto; }
        .report-header { border-bottom: 2px solid #168c8a; padding-bottom: 13px; display: flex; align-items: flex-start; gap: 16px; }
        .logo { width: 62px; height: 62px; object-fit: contain; border-radius: 10px; border: 1px solid #d6e6e7; padding: 5px; }
        .header-copy { flex: 1; }
        .eyebrow { color: #168c8a; font-size: 9pt; font-weight: 700; }
        h1 { font-size: 19pt; line-height: 1.35; margin: 3px 0; color: #123f4d; }
        .header-copy p, .muted { color: #657b80; margin: 2px 0; font-size: 9pt; }
        .section { margin-top: 18px; break-inside: avoid; }
        .section h2, .report-section h2 { font-size: 14pt; color: #124e5c; border-right: 4px solid #168c8a; padding-right: 8px; margin: 0 0 8px; }
        .section h3, .report-section h3 { color: #176c73; font-size: 11pt; margin: 14px 0 5px; }
        .report-section { margin-top: 16px; border-top: 1px solid #d9e8e9; padding-top: 10px; break-inside: avoid; }
        .data-row { display: flex; justify-content: space-between; gap: 18px; border-bottom: 1px solid #edf2f2; padding: 4px 0; }
        .data-row span { color: #617478; }
        .data-row strong { color: #173a45; text-align: left; }
        .grid-two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .table-wrap { overflow: hidden; margin: 7px 0 10px; break-inside: avoid; }
        table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
        th { background: #e8f4f3; color: #164c57; font-weight: 700; }
        th, td { border: 1px solid #d5e4e5; padding: 5px 6px; text-align: right; vertical-align: top; }
        .section-caption { color: #657b80; font-size: 8.5pt; margin: -2px 0 8px; }
        .callout { border: 1px solid #99d5ce; background: #effaf8; border-radius: 6px; padding: 8px 10px; margin: 8px 0; }
        .callout.warning { border-color: #e8c982; background: #fff9e8; }
        .what-if { border: 1px solid #9ad7d1; padding: 10px; border-radius: 8px; }
        .report-footer { border-top: 2px solid #168c8a; margin-top: 10px; padding-top: 6px; color: #657b80; font-size: 7.5pt; line-height: 1.4; break-inside: avoid; }
        .report-footer strong { color: #164c57; }
        .report-footer p { margin: 2px 0; }
        .page-break { break-before: page; }
        @media print { .report { max-width: none; } }
      </style>
    </head>
    <body>
      <main class="report">
        <header class="report-header">
          ${logo}
          <div class="header-copy">
            <div class="eyebrow">${escapeHtml(settings.companyName || 'تقرير دراسة عقارية')}</div>
            <h1>${escapeHtml(reportTitle)}</h1>
            <p>${escapeHtml(project.name)} · ${escapeHtml(city(project))}</p>
            <p>تاريخ إنشاء التقرير: ${escapeHtml(generatedAt)}</p>
            ${meta ? `<p class="muted">${escapeHtml(meta)}</p>` : ''}
          </div>
        </header>
        <section class="section">
          <h2>معلومات المشروع</h2>
          ${projectInfo}
        </section>
        <section class="section">
          <h2>بيانات الأرض</h2>
          ${landInfo}
        </section>
        <section class="section">
          <h2>افتراضات تنظيمية أولية لدراسة الجدوى</h2>
          <div class="callout warning">البيانات التنظيمية التالية افتراضات أولية للدراسة ولا تمثل موافقة نهائية من البلدية أو الجهات المختصة.</div>
          ${regulationInfo}
        </section>
        <section class="section">
          <h2>المساحات</h2>
          ${areasInfo}
        </section>
        ${costsSection(project, costs)}
        ${financialSection(project, finance)}
        ${whatIfSection(project, snapshot, whatIfAdjustment)}
        <section class="report-section">
          <h2>مؤشر الجدوى</h2>
          <div class="callout">${escapeHtml(feasibilityText)}</div>
          <p>هذا مؤشر أولي مبني على الافتراضات المدخلة وليس توصية استثمارية.</p>
        </section>
        ${disclaimer}
      </main>
    </body>
  </html>`;
};

export const printFeasibilityReport = (
  project: FeasibilityProject,
  snapshot: CalculationSnapshot,
  settings: CompanySettings,
  whatIfAdjustment = 0,
) => {
  const reportWindow = window.open('', '_blank', 'width=1024,height=800');
  if (!reportWindow) return false;
  reportWindow.opener = null;
  reportWindow.document.open();
  reportWindow.document.write(buildReportHtml(project, snapshot, settings, whatIfAdjustment));
  reportWindow.document.close();
  reportWindow.focus();
  window.setTimeout(() => reportWindow.print(), 350);
  return true;
};