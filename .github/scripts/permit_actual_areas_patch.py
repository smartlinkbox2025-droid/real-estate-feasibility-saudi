from pathlib import Path

ROOT = Path('artifacts/real-estate-feasibility/src')
MODEL = ROOT / 'lib/project-model.ts'
APP = ROOT / 'App.tsx'
REPORT = ROOT / 'lib/report-generator.ts'


def once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {count}')
    return text.replace(old, new, 1)

m = MODEL.read_text()
m = once(m, "export type LandShape = 'regular' | 'irregular';\n", "export type LandShape = 'regular' | 'irregular';\nexport type AreaInputMode = 'percentage' | 'permit';\n", 'area input type')
m = once(m, "    zoning: string;\n    groundFloorPercentage: number;\n", "    zoning: string;\n    areaInputMode: AreaInputMode;\n    actualGroundFloorArea: number;\n    actualRepeatedFloorsTotalArea: number;\n    actualAnnexArea: number;\n    groundFloorPercentage: number;\n", 'compliance fields')
m = once(m, "    zoning: '',\n    groundFloorPercentage: profile.groundFloorPercentage,\n", "    zoning: '',\n    areaInputMode: 'percentage' as AreaInputMode,\n    actualGroundFloorArea: 0,\n    actualRepeatedFloorsTotalArea: 0,\n    actualAnnexArea: 0,\n    groundFloorPercentage: profile.groundFloorPercentage,\n", 'compliance defaults')
old_calc = """export const calculateRegulatoryAreas = (project: FeasibilityProject): AreaCalculation => {
  const landArea = safeNumber(project.landArea);
  const groundFloorArea = landArea * safeNumber(project.compliance.groundFloorPercentage) / 100;
  const repeatedFloorArea = landArea * safeNumber(project.compliance.repeatedFloorPercentage) / 100;
  const totalRepeatedFloorsArea = repeatedFloorArea * safeNumber(project.compliance.repeatedFloors);
  const floorBelowAnnex = safeNumber(project.compliance.repeatedFloors) > 0 ? repeatedFloorArea : groundFloorArea;
  const annexArea = project.compliance.annexEnabled
    ? floorBelowAnnex * safeNumber(project.compliance.annexPercentage) / 100
    : 0;
"""
new_calc = """export const calculateRegulatoryAreas = (project: FeasibilityProject): AreaCalculation => {
  const landArea = safeNumber(project.landArea);
  const permitMode = project.compliance.areaInputMode === 'permit';
  const repeatedFloors = safeNumber(project.compliance.repeatedFloors);
  const groundFloorArea = permitMode
    ? safeNumber(project.compliance.actualGroundFloorArea)
    : landArea * safeNumber(project.compliance.groundFloorPercentage) / 100;
  const totalRepeatedFloorsArea = permitMode
    ? safeNumber(project.compliance.actualRepeatedFloorsTotalArea)
    : landArea * safeNumber(project.compliance.repeatedFloorPercentage) / 100 * repeatedFloors;
  const repeatedFloorArea = permitMode
    ? (repeatedFloors > 0 ? totalRepeatedFloorsArea / repeatedFloors : 0)
    : landArea * safeNumber(project.compliance.repeatedFloorPercentage) / 100;
  const floorBelowAnnex = repeatedFloors > 0 ? repeatedFloorArea : groundFloorArea;
  const annexArea = project.compliance.annexEnabled
    ? (permitMode ? safeNumber(project.compliance.actualAnnexArea) : floorBelowAnnex * safeNumber(project.compliance.annexPercentage) / 100)
    : 0;
"""
m = once(m, old_calc, new_calc, 'regulatory area calculation')
m = once(m, "      groundFloorPercentage: rawCompliance?.groundFloorPercentage ?? rawCompliance?.buildingRatio ?? fresh.compliance.groundFloorPercentage,\n", "      areaInputMode: rawCompliance?.areaInputMode ?? fresh.compliance.areaInputMode,\n      actualGroundFloorArea: rawCompliance?.actualGroundFloorArea ?? 0,\n      actualRepeatedFloorsTotalArea: rawCompliance?.actualRepeatedFloorsTotalArea ?? 0,\n      actualAnnexArea: rawCompliance?.actualAnnexArea ?? 0,\n      groundFloorPercentage: rawCompliance?.groundFloorPercentage ?? rawCompliance?.buildingRatio ?? fresh.compliance.groundFloorPercentage,\n", 'migration')
MODEL.write_text(m)

a = APP.read_text()
old_intro = """          <Field label=\"رمز التنظيم\" hint=\"اختياري\">
            <input value={project.compliance.zoning} onChange={(event) => patchNested('compliance', { zoning: event.target.value })} placeholder=\"مثال: سكني أ\" data-testid=\"input-zoning\" />
          </Field>
          <Field label={<span>نسبة الأرضي <span style={{ marginInlineStart: 7 }}>{assumption('groundFloorPercentage', project.type === 'مخصص' || project.type === 'عمارة سكنية تجارية')}</span></span>} hint=\"من مساحة الأرض\">
"""
new_intro = """          <Field label=\"رمز التنظيم\" hint=\"اختياري\">
            <input value={project.compliance.zoning} onChange={(event) => patchNested('compliance', { zoning: event.target.value })} placeholder=\"مثال: سكني أ\" data-testid=\"input-zoning\" />
          </Field>
          <Field label=\"طريقة إدخال المساحات\" hint=\"استخدم المساحات الفعلية عند توفر رخصة أو مخطط معتمد\" full>
            <div className=\"choice-grid choice-grid--compact\">
              <button type=\"button\" className={`choice ${project.compliance.areaInputMode === 'percentage' ? 'is-selected' : ''}`} onClick={() => patchNested('compliance', { areaInputMode: 'percentage' })} data-testid=\"button-area-mode-percentage\">حساب بالنسب</button>
              <button type=\"button\" className={`choice ${project.compliance.areaInputMode === 'permit' ? 'is-selected' : ''}`} onClick={() => patchNested('compliance', { areaInputMode: 'permit' })} data-testid=\"button-area-mode-permit\">مساحات فعلية من الرخصة</button>
            </div>
          </Field>
          {project.compliance.areaInputMode === 'permit' ? <>
            <Field label=\"مساحة الدور الأرضي الفعلية\" hint=\"من الرخصة / المخطط\"><div className=\"input-with-unit\"><input className=\"number-input\" type=\"number\" min=\"0\" step=\"0.01\" value={project.compliance.actualGroundFloorArea || ''} onChange={(event) => patchNested('compliance', { actualGroundFloorArea: Number(event.target.value) || 0 })} placeholder=\"٠\" data-testid=\"input-actual-ground-area\" /><span className=\"input-unit\">م²</span></div></Field>
            <Field label=\"إجمالي مساحة الأدوار المتكررة الفعلية\" hint=\"إجمالي جميع الأدوار المتكررة من الرخصة\"><div className=\"input-with-unit\"><input className=\"number-input\" type=\"number\" min=\"0\" step=\"0.01\" value={project.compliance.actualRepeatedFloorsTotalArea || ''} onChange={(event) => patchNested('compliance', { actualRepeatedFloorsTotalArea: Number(event.target.value) || 0 })} placeholder=\"٠\" data-testid=\"input-actual-repeated-total-area\" /><span className=\"input-unit\">م²</span></div></Field>
            <Field label=\"مساحة الملحق الفعلية\" hint=\"تستخدم عند تفعيل الملحق\"><div className=\"input-with-unit\"><input className=\"number-input\" type=\"number\" min=\"0\" step=\"0.01\" value={project.compliance.actualAnnexArea || ''} onChange={(event) => patchNested('compliance', { actualAnnexArea: Number(event.target.value) || 0 })} placeholder=\"٠\" data-testid=\"input-actual-annex-area\" /><span className=\"input-unit\">م²</span></div></Field>
            <div className=\"notice full\"><Info size={16} /><span>في هذا الوضع تُستخدم المساحات الفعلية مباشرة في حساب المسطحات والجدوى، ولا تُشتق من النسب المئوية. النسب تبقى محفوظة عند العودة إلى وضع حساب بالنسب.</span></div>
          </> : <>
          <Field label={<span>نسبة الأرضي <span style={{ marginInlineStart: 7 }}>{assumption('groundFloorPercentage', project.type === 'مخصص' || project.type === 'عمارة سكنية تجارية')}</span></span>} hint=\"من مساحة الأرض\">
"""
a = once(a, old_intro, new_intro, 'area mode UI intro')
old_after = """          <Field label=\"نسبة الملحق\" hint={assumption('annexPercentage', project.type === 'مخصص' || project.type === 'عمارة سكنية تجارية')}>
            <div className=\"input-with-unit\">
              <input className=\"number-input\" type=\"number\" min=\"0\" max=\"100\" value={project.compliance.annexPercentage || ''} onChange={(event) => patchNested('compliance', { annexPercentage: Number(event.target.value) || 0 })} placeholder=\"٠\" data-testid=\"input-annex-percentage\" />
              <span className=\"input-unit\">٪</span>
            </div>
          </Field>
          <Field label=\"عدد الوحدات السكنية\" hint=\"يستخدم لحساب المواقف\">
"""
new_after = """          <Field label=\"نسبة الملحق\" hint={assumption('annexPercentage', project.type === 'مخصص' || project.type === 'عمارة سكنية تجارية')}>
            <div className=\"input-with-unit\"><input className=\"number-input\" type=\"number\" min=\"0\" max=\"100\" value={project.compliance.annexPercentage || ''} onChange={(event) => patchNested('compliance', { annexPercentage: Number(event.target.value) || 0 })} placeholder=\"٠\" data-testid=\"input-annex-percentage\" /><span className=\"input-unit\">٪</span></div>
          </Field>
          </>}
          <Field label=\"عدد الوحدات السكنية\" hint=\"يستخدم لحساب المواقف\">
"""
a = once(a, old_after, new_after, 'area mode UI close')
a = once(a, "        <p>تتحدث النتائج فوراً من المدخلات، مع إبقاء البدروم منفصلاً عن المساحة فوق الأرض.</p>\n", "        <p>تتحدث النتائج فوراً من المدخلات، مع إبقاء البدروم منفصلاً عن المساحة فوق الأرض.</p>\n        <div className=\"notice\" style={{ marginBottom: 12 }}><Info size={16} /><span>مصدر المساحات: {project.compliance.areaInputMode === 'permit' ? 'مساحات فعلية من الرخصة' : 'حساب بالنسب'}</span></div>\n", 'summary source')
APP.write_text(a)

r = REPORT.read_text()
old_reg = """  const regulationInfo = table(['الافتراض التنظيمي الأولي', 'القيمة'], [
    ['نسبة الدور الأرضي', number(project.compliance.groundFloorPercentage, '٪')],
    ['نسبة الدور المتكرر', number(project.compliance.repeatedFloorPercentage, '٪')],
    ['عدد الأدوار المتكررة', number(project.compliance.repeatedFloors)],
    ['الملحق', project.compliance.annexEnabled ? `مفعل — ${number(project.compliance.annexPercentage, '٪')}` : 'غير مفعل'],
"""
new_reg = """  const regulationInfo = table(['الافتراض التنظيمي الأولي', 'القيمة'], [
    ['مصدر المساحات', project.compliance.areaInputMode === 'permit' ? 'مساحات فعلية من الرخصة / المخطط' : 'حساب بالنسب'],
    ...(project.compliance.areaInputMode === 'permit' ? [
      ['مساحة الدور الأرضي الفعلية', number(project.compliance.actualGroundFloorArea, ' م²')],
      ['إجمالي الأدوار المتكررة الفعلي', number(project.compliance.actualRepeatedFloorsTotalArea, ' م²')],
      ['مساحة الملحق الفعلية', project.compliance.annexEnabled ? number(project.compliance.actualAnnexArea, ' م²') : 'غير مفعل'],
    ] : [
      ['نسبة الدور الأرضي', number(project.compliance.groundFloorPercentage, '٪')],
      ['نسبة الدور المتكرر', number(project.compliance.repeatedFloorPercentage, '٪')],
      ['نسبة الملحق', project.compliance.annexEnabled ? number(project.compliance.annexPercentage, '٪') : 'غير مفعل'],
    ]),
    ['عدد الأدوار المتكررة', number(project.compliance.repeatedFloors)],
    ['الملحق', project.compliance.annexEnabled ? 'مفعل' : 'غير مفعل'],
"""
r = once(r, old_reg, new_reg, 'report regulation source')
REPORT.write_text(r)
print('Permit actual-areas patch applied successfully')
