from pathlib import Path

ROOT = Path('artifacts/real-estate-feasibility/src')
MODEL = ROOT / 'lib/project-model.ts'
APP = ROOT / 'App.tsx'
REPORT = ROOT / 'lib/report-generator.ts'

def once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    return text.replace(old, new, 1)

# project-model.ts
m = MODEL.read_text()
m = once(m, "export type FeasibilityState = 'positive' | 'review' | 'negative';\n", "export type FeasibilityState = 'positive' | 'review' | 'negative';\nexport type LandShape = 'regular' | 'irregular';\n\nexport interface ServiceArea {\n  id: string;\n  label: string;\n  area: number;\n}\n", 'types')
m = once(m, "  landArea: number;\n  frontage: number;\n  depth: number;\n", "  landArea: number;\n  landShape: LandShape;\n  frontage: number;\n  depth: number;\n  boundaryNorth: number;\n  boundaryEast: number;\n  boundarySouth: number;\n  boundaryWest: number;\n", 'land fields')
m = once(m, "    approvedFeasibilityArea: number;\n    overrides: Partial<Record<AssumptionKey, boolean>>;\n", "    approvedFeasibilityArea: number;\n    serviceAreas: ServiceArea[];\n    overrides: Partial<Record<AssumptionKey, boolean>>;\n", 'service field')
m = once(m, "  totalBuiltUpArea: number;\n  calculatedFeasibilityArea: number;\n", "  totalBuiltUpArea: number;\n  serviceAreasTotal: number;\n  licensedAreaWithServices: number;\n  calculatedFeasibilityArea: number;\n", 'area fields')
m = once(m, "    approvedFeasibilityArea: 0,\n    overrides: {},\n", "    approvedFeasibilityArea: 0,\n    serviceAreas: [],\n    overrides: {},\n", 'default services')
m = once(m, "    landArea: 0,\n    frontage: 0,\n    depth: 0,\n", "    landArea: 0,\n    landShape: 'regular',\n    frontage: 0,\n    depth: 0,\n    boundaryNorth: 0,\n    boundaryEast: 0,\n    boundarySouth: 0,\n    boundaryWest: 0,\n", 'default land')
m = once(m, "  new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 1 }).format(\n", "  new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 }).format(\n", 'number format')
m = once(m, "  const totalBuiltUpArea = aboveGroundBuiltArea + basementArea;\n  const calculatedFeasibilityArea = aboveGroundBuiltArea;\n", "  const totalBuiltUpArea = aboveGroundBuiltArea + basementArea;\n  const serviceAreasTotal = (project.compliance.serviceAreas ?? []).reduce((sum, item) => sum + safeNumber(item.area), 0);\n  const licensedAreaWithServices = totalBuiltUpArea + serviceAreasTotal;\n  const calculatedFeasibilityArea = aboveGroundBuiltArea;\n", 'area calc')
m = once(m, "    totalBuiltUpArea,\n    calculatedFeasibilityArea,\n", "    totalBuiltUpArea,\n    serviceAreasTotal,\n    licensedAreaWithServices,\n    calculatedFeasibilityArea,\n", 'area return')
m = once(m, "    region: raw.region ?? fresh.region,\n    customCity: raw.customCity ?? '',\n    streetsCount: raw.streetsCount ?? fresh.streetsCount,\n", "    region: raw.region ?? fresh.region,\n    customCity: raw.customCity ?? '',\n    landShape: raw.landShape ?? fresh.landShape,\n    boundaryNorth: raw.boundaryNorth ?? 0,\n    boundaryEast: raw.boundaryEast ?? 0,\n    boundarySouth: raw.boundarySouth ?? 0,\n    boundaryWest: raw.boundaryWest ?? 0,\n    streetsCount: raw.streetsCount ?? fresh.streetsCount,\n", 'land migration')
m = once(m, "      parkingPerUnit: rawCompliance?.parkingPerUnit ?? fresh.compliance.parkingPerUnit,\n      overrides: rawCompliance?.overrides ?? {},\n", "      parkingPerUnit: rawCompliance?.parkingPerUnit ?? fresh.compliance.parkingPerUnit,\n      serviceAreas: Array.isArray(rawCompliance?.serviceAreas) ? rawCompliance.serviceAreas.map((item, index) => ({\n        id: item.id || `service-${index}`,\n        label: item.label ?? '',\n        area: Number.isFinite(item.area) ? item.area : 0,\n      })) : [],\n      overrides: rawCompliance?.overrides ?? {},\n", 'service migration')
MODEL.write_text(m)

# App.tsx
app = APP.read_text()
old_land = '''        <div className="section-divider"><span>أبعاد القطعة</span></div>
        <Field label="مساحة الأرض" hint="المساحة المسجلة أو الأقرب للواقع" error={errors.landArea}>
          <div className="input-with-unit">
            <input className="number-input" type="number" min="0" value={project.landArea || ''} onChange={(event) => patchProject({ landArea: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-land-area" />
            <span className="input-unit">م²</span>
          </div>
        </Field>
        <Field label="عرض الشارع" hint="اختياري">
          <div className="input-with-unit">
            <input className="number-input" type="number" min="0" value={project.frontage || ''} onChange={(event) => patchProject({ frontage: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-land-frontage" />
            <span className="input-unit">م</span>
          </div>
        </Field>
        <Field label="عمق الأرض" hint="اختياري">
          <div className="input-with-unit">
            <input className="number-input" type="number" min="0" value={project.depth || ''} onChange={(event) => patchProject({ depth: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-land-depth" />
            <span className="input-unit">م</span>
          </div>
        </Field>'''
new_land = '''        <div className="section-divider"><span>أبعاد القطعة</span></div>
        <Field label="شكل الأرض" hint="اختر غير منتظمة عندما لا يمكن تمثيل القطعة بعرض × عمق" full>
          <div className="choice-grid choice-grid--compact">
            <button type="button" className={`choice ${project.landShape === 'regular' ? 'is-selected' : ''}`} onClick={() => patchProject({ landShape: 'regular' })}>منتظمة</button>
            <button type="button" className={`choice ${project.landShape === 'irregular' ? 'is-selected' : ''}`} onClick={() => patchProject({ landShape: 'irregular' })}>غير منتظمة</button>
          </div>
        </Field>
        <Field label="مساحة الأرض" hint="المساحة الرسمية أو المسجلة هي المرجع الأساسي" error={errors.landArea}>
          <div className="input-with-unit"><input className="number-input" type="number" min="0" step="0.01" value={project.landArea || ''} onChange={(event) => patchProject({ landArea: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-land-area" /><span className="input-unit">م²</span></div>
        </Field>
        {project.landShape === 'regular' ? <>
          <Field label="عرض الأرض" hint="اختياري"><div className="input-with-unit"><input className="number-input" type="number" min="0" step="0.01" value={project.frontage || ''} onChange={(event) => patchProject({ frontage: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-land-frontage" /><span className="input-unit">م</span></div></Field>
          <Field label="عمق الأرض" hint="اختياري"><div className="input-with-unit"><input className="number-input" type="number" min="0" step="0.01" value={project.depth || ''} onChange={(event) => patchProject({ depth: Number(event.target.value) || 0 })} placeholder="٠" data-testid="input-land-depth" /><span className="input-unit">م</span></div></Field>
        </> : <>
          {([['boundaryNorth', 'الحد الشمالي'], ['boundaryEast', 'الحد الشرقي'], ['boundarySouth', 'الحد الجنوبي'], ['boundaryWest', 'الحد الغربي']] as const).map(([key, label]) => (
            <Field key={key} label={label} hint={key === 'boundarySouth' ? 'إذا كان الحد مكسراً أدخل مجموع أطوال أجزائه واذكر التفصيل في الملاحظات' : 'من الصك أو الرخصة'}><div className="input-with-unit"><input className="number-input" type="number" min="0" step="0.01" value={project[key] || ''} onChange={(event) => patchProject({ [key]: Number(event.target.value) || 0 })} placeholder="٠" /><span className="input-unit">م</span></div></Field>
          ))}
          <div className="notice full"><Info size={16} /><span>للأرض غير المنتظمة تعتمد الدراسة على مساحة الأرض الرسمية، وأطوال الحدود معلومات مرجعية فقط.</span></div>
        </>}'''
app = once(app, old_land, new_land, 'land UI')
old_handler = '''  const assumption = (key: string, needsVerification = false) => {
    const item = status(key, needsVerification);
    return <span style={{ color: item.color, fontSize: 10, fontWeight: 800 }}>{item.label}</span>;
  };
  return ('''
new_handler = '''  const assumption = (key: string, needsVerification = false) => {
    const item = status(key, needsVerification);
    return <span style={{ color: item.color, fontSize: 10, fontWeight: 800 }}>{item.label}</span>;
  };
  const addServiceArea = () => patchNested('compliance', { serviceAreas: [...project.compliance.serviceAreas, { id: `service-${Date.now()}`, label: '', area: 0 }] });
  const updateServiceArea = (id: string, patch: Partial<{ label: string; area: number }>) => patchNested('compliance', { serviceAreas: project.compliance.serviceAreas.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const deleteServiceArea = (id: string) => patchNested('compliance', { serviceAreas: project.compliance.serviceAreas.filter((item) => item.id !== id) });
  return ('''
app = once(app, old_handler, new_handler, 'handlers')
marker = '''          </Field>
        </div>
        <div className="notice" style={{ marginTop: 22 }}>
          <Info size={16} />
          <span>الارتدادات لا تنتج بصمة بناء تلقائية.'''
service_ui = '''          </Field>
          <div className="section-divider"><span>مساحات خدمية / ترخيصية إضافية</span></div>
          <div className="stack-list full">
            <div className="notice"><Info size={16} /><span>تُستخدم هذه المساحات لمطابقة الرخصة أو المخطط، ولا تدخل تلقائياً في تكلفة البناء أو المساحة المعتمدة للجدوى.</span></div>
            {project.compliance.serviceAreas.map((item, index) => (
              <div className="repeat-row" key={item.id}>
                <input value={item.label} onChange={(event) => updateServiceArea(item.id, { label: event.target.value })} placeholder="مثال: بيت درج ومصاعد" />
                <div className="input-with-unit"><input className="number-input" type="number" min="0" step="0.01" value={item.area || ''} onChange={(event) => updateServiceArea(item.id, { area: Number(event.target.value) || 0 })} placeholder="٠" /><span className="input-unit">م²</span></div>
                <button type="button" className="danger-button button-small" onClick={() => deleteServiceArea(item.id)}>حذف</button>
              </div>
            ))}
            <button type="button" className="secondary-button button-small" onClick={addServiceArea}>+ إضافة مساحة خدمية</button>
          </div>
        </div>
        <div className="notice" style={{ marginTop: 22 }}>
          <Info size={16} />
          <span>الارتدادات لا تنتج بصمة بناء تلقائية.'''
app = once(app, marker, service_ui, 'service UI')
app = once(app, '''          <div className="summary-row"><span>الإجمالي</span><strong>{formatNumber(areas.totalBuiltUpArea)} م²</strong></div>
          <div className="summary-row"><span>المواقف المطلوبة</span><strong>{formatNumber(areas.requiredParking)}</strong></div>''', '''          <div className="summary-row"><span>الإجمالي الأساسي</span><strong>{formatNumber(areas.totalBuiltUpArea)} م²</strong></div>
          <div className="summary-row"><span>المساحات الخدمية / الترخيصية</span><strong>{formatNumber(areas.serviceAreasTotal)} م²</strong></div>
          <div className="summary-row"><span>الإجمالي للمطابقة مع الرخصة</span><strong>{formatNumber(areas.licensedAreaWithServices)} م²</strong></div>
          <div className="summary-row"><span>المواقف المطلوبة</span><strong>{formatNumber(areas.requiredParking)}</strong></div>''', 'summary')
app = once(app, "value={areas.approvedFeasibilityArea || ''} readOnly data-testid=\"input-approved-area-readonly\"", "value={areas.approvedFeasibilityArea ? Number(areas.approvedFeasibilityArea.toFixed(2)) : ''} readOnly data-testid=\"input-approved-area-readonly\"", 'rounded approved area')
app = once(app, "value={areas.basementArea || ''} readOnly data-testid=\"input-basement-area-readonly\"", "value={areas.basementArea ? Number(areas.basementArea.toFixed(2)) : ''} readOnly data-testid=\"input-basement-area-readonly\"", 'rounded basement')
APP.write_text(app)

# report-generator.ts
r = REPORT.read_text()
r = once(r, '''  const landInfo = table(['البيان', 'القيمة'], [
    ['مساحة الأرض', number(project.landArea, ' م²')],
    ['عرض الأرض', number(project.frontage, ' م')],
    ['عمق الأرض', number(project.depth, ' م')],
    ['عدد الشوارع', number(project.streetsCount)],''', '''  const landInfo = table(['البيان', 'القيمة'], [
    ['مساحة الأرض', number(project.landArea, ' م²')],
    ['شكل الأرض', project.landShape === 'irregular' ? 'غير منتظمة' : 'منتظمة'],
    ...(project.landShape === 'irregular' ? [
      ['الحد الشمالي', number(project.boundaryNorth, ' م')], ['الحد الشرقي', number(project.boundaryEast, ' م')], ['الحد الجنوبي', number(project.boundarySouth, ' م')], ['الحد الغربي', number(project.boundaryWest, ' م')],
    ] : [['عرض الأرض', number(project.frontage, ' م')], ['عمق الأرض', number(project.depth, ' م')]]),
    ['عدد الشوارع', number(project.streetsCount)],''', 'report land')
r = once(r, '''    ['إجمالي المسطحات المبنية', number(areas.totalBuiltUpArea, ' م²')],
    ['المساحة المعتمدة للجدوى', number(areas.approvedFeasibilityArea, ' م²')],''', '''    ['إجمالي المسطحات الأساسية', number(areas.totalBuiltUpArea, ' م²')],
    ...project.compliance.serviceAreas.filter((item) => item.area > 0).map((item) => [`مساحة خدمية: ${item.label || 'غير مسماة'}`, number(item.area, ' م²')]),
    ['إجمالي المساحات الخدمية / الترخيصية', number(areas.serviceAreasTotal, ' م²')],
    ['إجمالي المسطحات للمطابقة مع الرخصة', number(areas.licensedAreaWithServices, ' م²')],
    ['المساحة المعتمدة للجدوى', number(areas.approvedFeasibilityArea, ' م²')],''', 'report areas')
REPORT.write_text(r)
print('Patch applied successfully')
